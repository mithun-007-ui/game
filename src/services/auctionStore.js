import { INITIAL_PLACES, INITIAL_TEAMS, INITIAL_AUCTION_STATE, DEFAULT_STARTING_PURSE } from '../data/initialData.js';
import { isFirebaseConfigured, db, functions } from '../lib/firebase.js';
import { playBidChime, playSoldGong, playUnsoldSound } from '../utils/audio.js';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  writeBatch,
  runTransaction,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

const STORAGE_KEY = 'japan_auction_arena_state_v1';
const CHANNEL_NAME = 'japan_auction_arena_sync';

let broadcastChannel = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel not supported', e);
  }
}

// Initial state creator
function getInitialPersistedState() {
  return {
    places: INITIAL_PLACES,
    teams: INITIAL_TEAMS,
    auctionState: INITIAL_AUCTION_STATE,
    purchases: [],
    auditLogs: [
      {
        id: 'log-init',
        timestamp: new Date().toISOString(),
        action: 'SYSTEM_INITIALIZED',
        actor: 'System',
        details: 'Japan Auction Arena initialized with 10 Japanese destinations and 6 default teams.',
      },
    ],
  };
}

class AuctionStore {
  constructor() {
    this.listeners = new Set();
    this.state = this.loadState();
    this.timerInterval = null;
    this.connectionStatus = isFirebaseConfigured() ? 'connecting' : 'local';
    this.connectionError = null;
    this.unsubscribers = [];

    // Local Multi-Tab / Multi-Window Sync via BroadcastChannel
    if (broadcastChannel) {
      broadcastChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'STATE_UPDATE') {
          this.state = event.data.state;
          this.notify();
        }
      };
    }

    // Local cross-tab storage fallback
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            this.state = JSON.parse(e.newValue);
            this.notify();
          } catch (err) {
            console.error('Storage sync error', err);
          }
        }
      });
    }

    // Initialize Firestore Real-Time listeners if Firebase credentials are present
    if (typeof window !== 'undefined' && isFirebaseConfigured() && db) {
      this.initFirestoreSync();
    }

    // Resume timer if active
    if (this.state.auctionState.isTimerRunning && this.state.auctionState.timerRemaining > 0) {
      this.startTimerTicker();
    }
  }

  initFirestoreSync() {
    try {
      this.connectionStatus = 'connecting';

      // 1. Listen to active live auction state
      const stateDocRef = doc(db, 'auctionState', 'active');
      const unsubState = onSnapshot(
        stateDocRef,
        (snap) => {
          if (snap.exists()) {
            const remoteState = snap.data();
            this.state = {
              ...this.state,
              auctionState: { ...this.state.auctionState, ...remoteState },
            };
            this.connectionStatus = 'connected';
            this.connectionError = null;
            this.notify();
          }
        },
        (err) => {
          console.warn('Firestore auctionState listener error:', err);
          this.connectionStatus = 'error';
          this.connectionError = err.message;
          this.notify();
        }
      );
      this.unsubscribers.push(unsubState);

      // 2. Listen to public places collection
      const placesCol = collection(db, 'places');
      const unsubPlaces = onSnapshot(
        placesCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const remotePlaces = [];
            snapshot.forEach((d) => remotePlaces.push({ id: d.id, ...d.data() }));
            remotePlaces.sort((a, b) => (a.order || 0) - (b.order || 0));

            // Merge with local secret asset values if already revealed or loaded
            const merged = remotePlaces.map((rp) => {
              const existing = this.state.places.find((p) => p.id === rp.id);
              return {
                ...rp,
                assetValue: existing ? existing.assetValue : rp.assetValue,
              };
            });

            this.state = {
              ...this.state,
              places: merged,
            };
            this.connectionStatus = 'connected';
            this.notify();
          }
        },
        (err) => {
          console.warn('Firestore places listener error:', err);
        }
      );
      this.unsubscribers.push(unsubPlaces);

      // 3. Listen to public team directory (Always readable by all participants)
      const pubTeamsCol = collection(db, 'publicTeams');
      const unsubPubTeams = onSnapshot(pubTeamsCol, (snapshot) => {
        if (!snapshot.empty) {
          const publicMap = new Map();
          snapshot.forEach((d) => publicMap.set(d.id, d.data()));
          const merged = this.state.teams.map((t) => {
            const pub = publicMap.get(t.id);
            return pub ? { ...t, name: pub.name || t.name, color: pub.color || t.color, active: pub.active !== undefined ? pub.active : t.active } : t;
          });
          this.state = { ...this.state, teams: merged };
          this.connectionStatus = 'connected';
          this.notify();
        }
      }, (err) => {
        console.warn('Firestore publicTeams listener error:', err.message);
      });
      this.unsubscribers.push(unsubPubTeams);

      // Listen to private teams (Succeeds for Admin with verified custom claims)
      const teamsCol = collection(db, 'teams');
      const unsubTeams = onSnapshot(
        teamsCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteTeams = [];
            snapshot.forEach((d) => remoteTeams.push({ id: d.id, ...d.data() }));
            this.state = {
              ...this.state,
              teams: remoteTeams,
            };
            this.connectionStatus = 'connected';
            this.notify();
          }
        },
        () => {
          // Expected permission denial for unauthenticated participants
        }
      );
      this.unsubscribers.push(unsubTeams);

      // 4. Listen to secretValuations (Allowed for admin or when results are officially revealed)
      const valCol = collection(db, 'secretValuations');
      const unsubVal = onSnapshot(
        valCol,
        (snapshot) => {
          if (!snapshot.empty) {
            const valMap = {};
            snapshot.forEach((d) => {
              valMap[d.id] = d.data().assetValue;
            });
            const merged = this.state.places.map((p) => ({
              ...p,
              assetValue: valMap[p.id] !== undefined ? valMap[p.id] : p.assetValue,
            }));
            this.state = { ...this.state, places: merged };
            this.notify();
          }
        },
        () => {
          // Expected permission denial for participants before final reveal
        }
      );
      this.unsubscribers.push(unsubVal);

      // 5. Listen to confirmed purchases
      const purchasesCol = collection(db, 'purchases');
      const unsubPurchases = onSnapshot(
        purchasesCol,
        (snapshot) => {
          const remotePurchases = [];
          snapshot.forEach((d) => remotePurchases.push({ id: d.id, ...d.data() }));
          remotePurchases.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
          this.state = {
            ...this.state,
            purchases: remotePurchases,
          };
          this.notify();
        },
        (err) => {
          console.warn('Firestore purchases listener error:', err);
        }
      );
      this.unsubscribers.push(unsubPurchases);

      // 6. Listen to auditLogs (Admin only)
      const auditCol = collection(db, 'auditLogs');
      const unsubAudit = onSnapshot(
        auditCol,
        (snapshot) => {
          const remoteLogs = [];
          snapshot.forEach((d) => remoteLogs.push({ id: d.id, ...d.data() }));
          remoteLogs.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
          this.state = {
            ...this.state,
            auditLogs: remoteLogs,
          };
          this.notify();
        },
        () => {
          // Expected permission denial for non-admins
        }
      );
      this.unsubscribers.push(unsubAudit);
    } catch (e) {
      console.warn('Firestore real-time sync initialization error:', e);
      this.connectionStatus = 'error';
      this.connectionError = e.message;
    }
  }

  loadState() {
    if (typeof window === 'undefined') return getInitialPersistedState();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.places && parsed.teams && parsed.auctionState) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to read state from localStorage', e);
    }
    const fresh = getInitialPersistedState();
    this.saveState(fresh, false);
    return fresh;
  }

  saveState(newState, broadcast = true) {
    this.state = newState;

    // 1. Local storage persistence
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      } catch (e) {
        console.error('Storage write error', e);
      }
    }

    // 2. BroadcastChannel multi-tab synchronization
    if (broadcast && broadcastChannel) {
      broadcastChannel.postMessage({ type: 'STATE_UPDATE', state: newState });
    }

    // 3. Firestore production synchronization if configured
    if (isFirebaseConfigured() && db) {
      this.syncStateToFirestore(newState).catch((err) => {
        console.warn('Firestore sync write error:', err);
      });
    }

    this.notify();
  }

  async syncStateToFirestore(state) {
    if (!isFirebaseConfigured() || !db) return;
    try {
      // Sync auctionState document
      const stateRef = doc(db, 'auctionState', 'active');
      await setDoc(stateRef, state.auctionState, { merge: true });
    } catch (err) {
      console.warn('Could not sync auctionState to Firestore:', err);
    }
  }

  /**
   * Safe, repeatable server-side seed operation for initial inventory.
   * Partitions public destination data from secret valuations to satisfy Firestore Security Rules.
   */
  async seedFirestoreDatabase() {
    if (!isFirebaseConfigured() || !db) {
      throw new Error('Firebase credentials are not configured in .env. Cannot seed Firestore.');
    }

    // Try callable Cloud Function first if functions backend is deployed
    if (functions) {
      try {
        const seedFn = httpsCallable(functions, 'seedInitialData');
        const res = await seedFn({
          places: INITIAL_PLACES,
          teams: INITIAL_TEAMS,
          auctionState: INITIAL_AUCTION_STATE,
        });
        if (res?.data?.success) {
          return { success: true, count: INITIAL_PLACES.length, mode: 'cloud_function' };
        }
      } catch (fnErr) {
        // Fall back to client batch write if Cloud Functions are not yet deployed
        console.info('Cloud Function seed not available, using client batch write:', fnErr.message);
      }
    }

    const batch = writeBatch(db);

    // 1. Seed places (public fields) and secretValuations (admin/reveal only)
    for (const place of INITIAL_PLACES) {
      const placeRef = doc(db, 'places', place.id);
      const valRef = doc(db, 'secretValuations', place.id);

      const { assetValue, ...publicPlace } = place;
      batch.set(placeRef, publicPlace, { merge: true });
      batch.set(valRef, { placeId: place.id, assetValue: assetValue || 0 }, { merge: true });
    }

    // 2. Seed teams & public directory
    for (const team of INITIAL_TEAMS) {
      const teamRef = doc(db, 'teams', team.id);
      const publicTeamRef = doc(db, 'publicTeams', team.id);

      batch.set(teamRef, team, { merge: true });
      batch.set(
        publicTeamRef,
        { id: team.id, name: team.name, color: team.color, active: team.active },
        { merge: true }
      );
    }

    // 3. Seed active auction state
    const stateRef = doc(db, 'auctionState', 'active');
    batch.set(stateRef, INITIAL_AUCTION_STATE, { merge: true });

    // 4. Seed initial audit log
    const auditRef = doc(db, 'auditLogs', 'log-init');
    batch.set(
      auditRef,
      {
        id: 'log-init',
        timestamp: new Date().toISOString(),
        action: 'SYSTEM_INITIALIZED',
        actor: 'Admin',
        details: 'Japan Auction Arena initial inventory seeded into Firestore.',
      },
      { merge: true }
    );

    await batch.commit();

    return { success: true, count: INITIAL_PLACES.length, mode: 'batch_write' };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  getState() {
    return this.state;
  }

  getConnectionStatus() {
    return {
      isFirebase: isFirebaseConfigured(),
      status: this.connectionStatus,
      error: this.connectionError,
    };
  }

  /* ----------------- AUCTION LOGIC & BIDDING ----------------- */

  selectPlace(placeId) {
    const place = this.state.places.find((p) => p.id === placeId);
    if (!place) throw new Error('Place not found');

    const updatedAuction = {
      ...this.state.auctionState,
      currentPlaceId: placeId,
      currentBid: place.status === 'sold' ? (place.finalPurchasePrice || place.basePrice) : place.basePrice,
      leadingTeamId: place.winningTeamId || null,
      bidHistory: [],
      timerRemaining: this.state.auctionState.timerDuration || 30,
      isTimerRunning: false,
    };

    this.stopTimerTicker();

    this.saveState({
      ...this.state,
      auctionState: updatedAuction,
    });
  }

  startAuction(placeId) {
    const targetId = placeId || this.state.auctionState.currentPlaceId;
    if (!targetId) throw new Error('No place selected for auction');

    const place = this.state.places.find((p) => p.id === targetId);
    if (!place) throw new Error('Destination place not found');

    const updatedPlaces = this.state.places.map((p) =>
      p.id === targetId ? { ...p, status: 'live' } : p.status === 'live' ? { ...p, status: 'available' } : p
    );

    const updatedAuction = {
      ...this.state.auctionState,
      currentPlaceId: targetId,
      auctionStatus: 'live',
      gameStarted: true,
      currentBid: place.basePrice,
      leadingTeamId: null,
      bidHistory: [
        {
          id: `bid-open-${Date.now()}`,
          teamId: null,
          teamName: 'Opening Base Price',
          bidAmount: place.basePrice,
          timestamp: new Date().toLocaleTimeString(),
        },
      ],
      timerRemaining: this.state.auctionState.timerDuration || 30,
      isTimerRunning: true,
    };

    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'AUCTION_STARTED',
      actor: 'Auctioneer',
      details: `Started live auction for "${place.name}" with base price ¥${place.basePrice.toLocaleString()}.`,
    };

    this.startTimerTicker();

    this.saveState({
      ...this.state,
      places: updatedPlaces,
      auctionState: updatedAuction,
      auditLogs: [newLog, ...this.state.auditLogs],
    });

    // Firestore async sync for place status
    if (isFirebaseConfigured() && db) {
      const placeRef = doc(db, 'places', targetId);
      updateDoc(placeRef, { status: 'live' }).catch((err) => {
        console.warn('Firestore place status update error:', err);
      });
    }
  }

  pauseAuction() {
    this.stopTimerTicker();
    const updatedAuction = {
      ...this.state.auctionState,
      auctionStatus: 'paused',
      isTimerRunning: false,
    };
    this.saveState({
      ...this.state,
      auctionState: updatedAuction,
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'AUCTION_PAUSED',
          actor: 'Auctioneer',
          details: 'Live auction paused.',
        },
        ...this.state.auditLogs,
      ],
    });
  }

  resumeAuction() {
    this.startTimerTicker();
    const updatedAuction = {
      ...this.state.auctionState,
      auctionStatus: 'live',
      isTimerRunning: true,
    };
    this.saveState({
      ...this.state,
      auctionState: updatedAuction,
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'AUCTION_RESUMED',
          actor: 'Auctioneer',
          details: 'Live auction resumed.',
        },
        ...this.state.auditLogs,
      ],
    });
  }

  submitBid({ teamId, bidAmount, amount }) {
    const finalAmount = Number(bidAmount !== undefined ? bidAmount : amount);
    const { auctionState, places, teams } = this.state;

    if (auctionState.auctionStatus !== 'live') {
      throw new Error('Bids can only be placed while auction is LIVE');
    }

    const place = places.find((p) => p.id === auctionState.currentPlaceId);
    if (!place) throw new Error('No destination selected for auction');

    if (place.status === 'sold') {
      throw new Error('This destination is already sold');
    }

    const team = teams.find((t) => t.id === teamId);
    if (!team) throw new Error('Bidding team not found');

    if (!team.active) {
      throw new Error(`Team ${team.name} has been deactivated by the auctioneer.`);
    }

    // Bid validation rules
    if (finalAmount < place.basePrice) {
      throw new Error(
        `Bid ¥${finalAmount.toLocaleString()} is below base price ¥${place.basePrice.toLocaleString()}`
      );
    }

    if (auctionState.leadingTeamId !== null && finalAmount <= auctionState.currentBid) {
      throw new Error(
        `New bid ¥${finalAmount.toLocaleString()} must strictly exceed current confirmed bid ¥${auctionState.currentBid.toLocaleString()}`
      );
    }

    if (finalAmount > team.remainingPurse) {
      throw new Error(
        `Insufficient purse: Team ${team.name} has only ¥${team.remainingPurse.toLocaleString()} remaining.`
      );
    }

    const newBid = {
      id: `bid-${Date.now()}`,
      teamId: team.id,
      teamName: team.name,
      teamColor: team.color,
      bidAmount: finalAmount,
      timestamp: new Date().toLocaleTimeString(),
    };

    // Reset countdown timer on new high bid
    const updatedAuction = {
      ...auctionState,
      currentBid: finalAmount,
      leadingTeamId: team.id,
      bidHistory: [newBid, ...auctionState.bidHistory],
      timerRemaining: auctionState.timerDuration || 30,
      isTimerRunning: true,
    };

    this.startTimerTicker();
    playBidChime();

    this.saveState({
      ...this.state,
      auctionState: updatedAuction,
    });

    // Firestore async recording in bids collection
    if (isFirebaseConfigured() && db) {
      const bidsCol = collection(db, 'bids');
      addDoc(bidsCol, {
        placeId: place.id,
        teamId: team.id,
        teamName: team.name,
        amount: finalAmount,
        timestamp: serverTimestamp(),
      }).catch((err) => {
        console.warn('Firestore bid record write error:', err);
      });
    }
  }

  /**
   * Confirms a destination sale.
   * Executes atomic server-side deduction of remaining purse, marks place as sold,
   * creates purchase record, and registers an audit log.
   */
  confirmSale() {
    const { auctionState, places, teams, purchases } = this.state;
    const place = places.find((p) => p.id === auctionState.currentPlaceId);
    if (!place) throw new Error('No place selected for sale.');

    if (place.status === 'sold') {
      throw new Error('This place is already sold!');
    }

    if (!auctionState.leadingTeamId) {
      throw new Error('Cannot confirm sale: No team has placed a bid yet.');
    }

    const winningTeam = teams.find((t) => t.id === auctionState.leadingTeamId);
    if (!winningTeam) {
      throw new Error('Winning team record not found.');
    }

    const finalPrice = auctionState.currentBid;
    if (finalPrice > winningTeam.remainingPurse) {
      throw new Error(
        `Transaction failed: ${winningTeam.name} cannot afford ¥${finalPrice.toLocaleString()} with remaining purse ¥${winningTeam.remainingPurse.toLocaleString()}.`
      );
    }

    this.stopTimerTicker();
    playSoldGong();

    // 1. Update place
    const updatedPlaces = places.map((p) =>
      p.id === place.id
        ? {
            ...p,
            status: 'sold',
            winningTeamId: winningTeam.id,
            finalPurchasePrice: finalPrice,
          }
        : p
    );

    // 2. Deduct team purse & add purchased place
    const updatedTeams = teams.map((t) => {
      if (t.id === winningTeam.id) {
        const newSpent = t.totalSpent + finalPrice;
        const newRemaining = t.startingPurse - newSpent;
        return {
          ...t,
          totalSpent: newSpent,
          remainingPurse: newRemaining,
          purchasedPlaceIds: [...t.purchasedPlaceIds, place.id],
        };
      }
      return t;
    });

    // 3. Create purchase record
    const purchaseId = `purch-${Date.now()}`;
    const newPurchase = {
      id: purchaseId,
      placeId: place.id,
      placeName: place.name,
      teamId: winningTeam.id,
      teamName: winningTeam.name,
      finalPurchasePrice: finalPrice,
      assetValue: place.assetValue,
      timestamp: new Date().toISOString(),
      status: 'active',
    };

    // 4. Create audit log
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'SALE_CONFIRMED',
      actor: 'Auctioneer',
      details: `SOLD: "${place.name}" awarded to ${winningTeam.name} for ¥${finalPrice.toLocaleString()} (Asset Value: ¥${(place.assetValue || 0).toLocaleString()}).`,
      purchaseId,
      placeId: place.id,
      teamId: winningTeam.id,
      price: finalPrice,
    };

    // 5. Update auction state (move to idle or next available)
    const nextAvailable = updatedPlaces.find((p) => p.status === 'available');

    const updatedAuction = {
      ...auctionState,
      auctionStatus: 'idle',
      isTimerRunning: false,
      currentPlaceId: nextAvailable ? nextAvailable.id : place.id,
      currentBid: nextAvailable ? nextAvailable.basePrice : 0,
      leadingTeamId: null,
      bidHistory: [],
      timerRemaining: auctionState.timerDuration || 30,
    };

    this.saveState({
      ...this.state,
      places: updatedPlaces,
      teams: updatedTeams,
      purchases: [newPurchase, ...purchases],
      auctionState: updatedAuction,
      auditLogs: [newLog, ...this.state.auditLogs],
    });

    // Production Atomic Server-Side Execution in Firestore
    if (isFirebaseConfigured() && db) {
      this.executeServerSideConfirmSale({
        placeId: place.id,
        teamId: winningTeam.id,
        finalPrice,
        purchaseId,
      }).catch((err) => {
        console.warn('Server-side sale confirmation error:', err);
      });
    }
  }

  async executeServerSideConfirmSale({ placeId, teamId, finalPrice, purchaseId }) {
    if (functions) {
      try {
        const confirmFn = httpsCallable(functions, 'confirmSale');
        await confirmFn({ placeId, teamId, finalPrice });
        return;
      } catch (fnErr) {
        console.info('Callable confirmSale function not available, running atomic Firestore transaction:', fnErr.message);
      }
    }

    // Atomic Firestore Transaction fallback
    await runTransaction(db, async (transaction) => {
      const placeRef = doc(db, 'places', placeId);
      const teamRef = doc(db, 'teams', teamId);
      const auctionStateRef = doc(db, 'auctionState', 'active');

      const placeSnap = await transaction.get(placeRef);
      const teamSnap = await transaction.get(teamRef);

      if (!placeSnap.exists()) throw new Error('Place doc does not exist');
      if (!teamSnap.exists()) throw new Error('Team doc does not exist');

      const pData = placeSnap.data();
      const tData = teamSnap.data();

      if (pData.status === 'sold') throw new Error('Place already sold');
      if (tData.remainingPurse < finalPrice) throw new Error('Insufficient team purse');

      const newSpent = (tData.totalSpent || 0) + finalPrice;
      const newRemaining = tData.startingPurse - newSpent;

      transaction.update(teamRef, {
        totalSpent: newSpent,
        remainingPurse: newRemaining,
        purchasedPlaceIds: arrayUnion(placeId),
      });

      transaction.update(placeRef, {
        status: 'sold',
        winningTeamId: teamId,
        finalPurchasePrice: finalPrice,
      });

      const purchRef = doc(db, 'purchases', purchaseId);
      transaction.set(purchRef, {
        id: purchaseId,
        placeId,
        placeName: pData.name,
        teamId,
        teamName: tData.name,
        finalPurchasePrice: finalPrice,
        timestamp: new Date().toISOString(),
        status: 'active',
      });

      const auditRef = doc(collection(db, 'auditLogs'));
      transaction.set(auditRef, {
        action: 'SALE_CONFIRMED',
        actor: 'Auctioneer',
        timestamp: new Date().toISOString(),
        placeId,
        teamId,
        finalPrice,
        details: `SOLD: "${pData.name}" won by ${tData.name} for ¥${finalPrice.toLocaleString()}.`,
      });

      transaction.update(auctionStateRef, {
        auctionStatus: 'idle',
        currentBid: 0,
        leadingTeamId: null,
        bidHistory: [],
      });
    });
  }

  markUnsold() {
    const { auctionState, places } = this.state;
    const place = places.find((p) => p.id === auctionState.currentPlaceId);
    if (!place) throw new Error('No destination currently under auction.');

    this.stopTimerTicker();
    playUnsoldSound();

    const updatedPlaces = places.map((p) =>
      p.id === place.id ? { ...p, status: 'unsold', winningTeamId: null, finalPurchasePrice: null } : p
    );

    const nextAvailable = updatedPlaces.find((p) => p.status === 'available');

    const updatedAuction = {
      ...auctionState,
      auctionStatus: 'idle',
      isTimerRunning: false,
      currentPlaceId: nextAvailable ? nextAvailable.id : place.id,
      currentBid: nextAvailable ? nextAvailable.basePrice : 0,
      leadingTeamId: null,
      bidHistory: [],
      timerRemaining: auctionState.timerDuration || 30,
    };

    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'PLACE_MARKED_UNSOLD',
      actor: 'Auctioneer',
      details: `Place "${place.name}" was marked UNSOLD. No team budget deducted.`,
    };

    this.saveState({
      ...this.state,
      places: updatedPlaces,
      auctionState: updatedAuction,
      auditLogs: [newLog, ...this.state.auditLogs],
    });

    if (isFirebaseConfigured() && db) {
      const placeRef = doc(db, 'places', place.id);
      updateDoc(placeRef, {
        status: 'unsold',
        winningTeamId: null,
        finalPurchasePrice: null,
      }).catch((err) => {
        console.warn('Firestore mark unsold write error:', err);
      });
    }
  }

  reverseSale(purchaseId) {
    const { purchases, places, teams, auditLogs } = this.state;
    const targetPurchase = purchases.find((p) => p.id === purchaseId);
    if (!targetPurchase) throw new Error('Purchase record not found.');
    if (targetPurchase.status === 'reversed') throw new Error('This sale has already been reversed.');

    const place = places.find((p) => p.id === targetPurchase.placeId);
    const team = teams.find((t) => t.id === targetPurchase.teamId);

    if (!place || !team) {
      throw new Error('Associated place or team data missing for reversal.');
    }

    // 1. Mark purchase as reversed (Preserve audit history!)
    const updatedPurchases = purchases.map((p) =>
      p.id === purchaseId ? { ...p, status: 'reversed', reversedAt: new Date().toISOString() } : p
    );

    // 2. Restore place to available
    const updatedPlaces = places.map((p) =>
      p.id === place.id
        ? {
            ...p,
            status: 'available',
            winningTeamId: null,
            finalPurchasePrice: null,
          }
        : p
    );

    // 3. Refund purse and remove from purchasedPlaceIds
    const updatedTeams = teams.map((t) => {
      if (t.id === team.id) {
        const newSpent = Math.max(0, t.totalSpent - targetPurchase.finalPurchasePrice);
        const newRemaining = t.startingPurse - newSpent;
        const newPlaces = t.purchasedPlaceIds.filter((pid) => pid !== place.id);
        return {
          ...t,
          totalSpent: newSpent,
          remainingPurse: newRemaining,
          purchasedPlaceIds: newPlaces,
        };
      }
      return t;
    });

    // 4. Audit Log
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'SALE_REVERSED',
      actor: 'Auctioneer',
      details: `ACCIDENTAL SALE REVERSED: Returned ¥${targetPurchase.finalPurchasePrice.toLocaleString()} to ${team.name} for "${place.name}". Restored place to Available.`,
      purchaseId,
      refundAmount: targetPurchase.finalPurchasePrice,
    };

    this.saveState({
      ...this.state,
      purchases: updatedPurchases,
      places: updatedPlaces,
      teams: updatedTeams,
      auditLogs: [newLog, ...auditLogs],
    });

    // Production Atomic Server-Side Reversal in Firestore
    if (isFirebaseConfigured() && db) {
      this.executeServerSideReverseSale({
        purchaseId,
        placeId: place.id,
        teamId: team.id,
        refundAmount: targetPurchase.finalPurchasePrice,
      }).catch((err) => {
        console.warn('Server-side sale reversal error:', err);
      });
    }
  }

  async executeServerSideReverseSale({ purchaseId, placeId, teamId, refundAmount }) {
    if (functions) {
      try {
        const reverseFn = httpsCallable(functions, 'reverseSale');
        await reverseFn({ purchaseId });
        return;
      } catch (fnErr) {
        console.info('Callable reverseSale function not available, running atomic Firestore transaction:', fnErr.message);
      }
    }

    await runTransaction(db, async (transaction) => {
      const purchRef = doc(db, 'purchases', purchaseId);
      const placeRef = doc(db, 'places', placeId);
      const teamRef = doc(db, 'teams', teamId);

      const purchSnap = await transaction.get(purchRef);
      const teamSnap = await transaction.get(teamRef);

      if (!purchSnap.exists() || !teamSnap.exists()) return;

      const tData = teamSnap.data();
      const newSpent = Math.max(0, (tData.totalSpent || 0) - refundAmount);
      const newRemaining = tData.startingPurse - newSpent;

      transaction.update(teamRef, {
        totalSpent: newSpent,
        remainingPurse: newRemaining,
        purchasedPlaceIds: arrayRemove(placeId),
      });

      transaction.update(placeRef, {
        status: 'available',
        winningTeamId: null,
        finalPurchasePrice: null,
      });

      transaction.update(purchRef, {
        status: 'reversed',
        reversedAt: new Date().toISOString(),
      });

      const auditRef = doc(collection(db, 'auditLogs'));
      transaction.set(auditRef, {
        action: 'SALE_REVERSED',
        actor: 'Auctioneer',
        timestamp: new Date().toISOString(),
        purchaseId,
        refundAmount,
      });
    });
  }

  /* ----------------- TIMER CONTROLS ----------------- */

  startTimerTicker() {
    this.stopTimerTicker();
    this.timerInterval = setInterval(() => {
      const { auctionState } = this.state;
      if (!auctionState.isTimerRunning) {
        this.stopTimerTicker();
        return;
      }
      if (auctionState.timerRemaining <= 1) {
        this.stopTimerTicker();
        this.saveState({
          ...this.state,
          auctionState: {
            ...auctionState,
            timerRemaining: 0,
            isTimerRunning: false,
          },
        });
      } else {
        this.saveState(
          {
            ...this.state,
            auctionState: {
              ...auctionState,
              timerRemaining: auctionState.timerRemaining - 1,
            },
          },
          false
        );
      }
    }, 1000);
  }

  stopTimerTicker() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  setTimerDuration(seconds) {
    const sec = Math.max(5, Math.min(300, Number(seconds) || 30));
    this.saveState({
      ...this.state,
      auctionState: {
        ...this.state.auctionState,
        timerDuration: sec,
        timerRemaining: sec,
      },
    });
  }

  resetTimer() {
    const dur = this.state.auctionState.timerDuration || 30;
    this.saveState({
      ...this.state,
      auctionState: {
        ...this.state.auctionState,
        timerRemaining: dur,
      },
    });
  }

  /* ----------------- TEAM & PLACE MANAGEMENT ----------------- */

  addTeam({ name, startingPurse, color }) {
    const purse = Number(startingPurse) || DEFAULT_STARTING_PURSE;
    const teamId = `team-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
    const randomCode = `${name.slice(0, 4).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const newTeam = {
      id: teamId,
      name,
      code: randomCode,
      startingPurse: purse,
      remainingPurse: purse,
      totalSpent: 0,
      purchasedPlaceIds: [],
      active: true,
      color: color || '#f472b6',
    };

    this.saveState({
      ...this.state,
      teams: [...this.state.teams, newTeam],
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'TEAM_CREATED',
          actor: 'Auctioneer',
          details: `Created new team "${name}" with starting purse ¥${purse.toLocaleString()}. Access Code: ${randomCode}`,
        },
        ...this.state.auditLogs,
      ],
    });

    if (isFirebaseConfigured() && db) {
      const teamRef = doc(db, 'teams', teamId);
      const publicTeamRef = doc(db, 'publicTeams', teamId);
      setDoc(teamRef, newTeam, { merge: true }).catch(console.warn);
      setDoc(publicTeamRef, { id: teamId, name, color: newTeam.color, active: true }, { merge: true }).catch(console.warn);
    }

    return newTeam;
  }

  updateTeam(teamId, updates) {
    const existing = this.state.teams.find((t) => t.id === teamId);
    if (!existing) throw new Error('Team not found');

    const updatedTeams = this.state.teams.map((t) => {
      if (t.id === teamId) {
        const startingPurse = updates.startingPurse !== undefined ? Number(updates.startingPurse) : t.startingPurse;
        const remainingPurse = startingPurse - t.totalSpent;
        return {
          ...t,
          ...updates,
          startingPurse,
          remainingPurse,
        };
      }
      return t;
    });

    this.saveState({
      ...this.state,
      teams: updatedTeams,
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'TEAM_UPDATED',
          actor: 'Auctioneer',
          details: `Updated details for team "${existing.name}".`,
        },
        ...this.state.auditLogs,
      ],
    });

    if (isFirebaseConfigured() && db) {
      const teamRef = doc(db, 'teams', teamId);
      setDoc(teamRef, updates, { merge: true }).catch(console.warn);
    }
  }

  deleteTeam(teamId) {
    const team = this.state.teams.find((t) => t.id === teamId);
    if (!team) return;
    if (team.purchasedPlaceIds && team.purchasedPlaceIds.length > 0) {
      throw new Error(`Cannot delete ${team.name} because they have already purchased places. Reverse their sales first.`);
    }

    this.saveState({
      ...this.state,
      teams: this.state.teams.filter((t) => t.id !== teamId),
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'TEAM_DELETED',
          actor: 'Auctioneer',
          details: `Deleted team "${team.name}".`,
        },
        ...this.state.auditLogs,
      ],
    });

    if (isFirebaseConfigured() && db) {
      deleteDoc(doc(db, 'teams', teamId)).catch(console.warn);
      deleteDoc(doc(db, 'publicTeams', teamId)).catch(console.warn);
    }
  }

  addPlace({ name, location, imageUrl, description, basePrice, assetValue }) {
    const placeId = `place-${Date.now()}`;
    const newPlace = {
      id: placeId,
      order: this.state.places.length + 1,
      name,
      location,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200&auto=format&fit=crop',
      description,
      basePrice: Number(basePrice) || 2_000_000,
      assetValue: Number(assetValue) || 5_000_000,
      status: 'available',
      winningTeamId: null,
      finalPurchasePrice: null,
    };

    this.saveState({
      ...this.state,
      places: [...this.state.places, newPlace],
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'PLACE_ADDED',
          actor: 'Auctioneer',
          details: `Added new auction destination "${name}" (Base: ¥${newPlace.basePrice.toLocaleString()}, Asset Value: ¥${newPlace.assetValue.toLocaleString()}).`,
        },
        ...this.state.auditLogs,
      ],
    });

    if (isFirebaseConfigured() && db) {
      const { assetValue: val, ...pub } = newPlace;
      setDoc(doc(db, 'places', placeId), pub, { merge: true }).catch(console.warn);
      setDoc(doc(db, 'secretValuations', placeId), { placeId, assetValue: val }, { merge: true }).catch(console.warn);
    }

    return newPlace;
  }

  updatePlace(placeId, updates) {
    const place = this.state.places.find((p) => p.id === placeId);
    if (!place) throw new Error('Place not found');

    const updatedPlaces = this.state.places.map((p) =>
      p.id === placeId ? { ...p, ...updates } : p
    );

    this.saveState({
      ...this.state,
      places: updatedPlaces,
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'PLACE_UPDATED',
          actor: 'Auctioneer',
          details: `Updated details for destination "${place.name}".`,
        },
        ...this.state.auditLogs,
      ],
    });

    if (isFirebaseConfigured() && db) {
      const { assetValue, ...pub } = updates;
      if (Object.keys(pub).length > 0) {
        updateDoc(doc(db, 'places', placeId), pub).catch(console.warn);
      }
      if (assetValue !== undefined) {
        setDoc(doc(db, 'secretValuations', placeId), { placeId, assetValue }, { merge: true }).catch(console.warn);
      }
    }
  }

  deletePlace(placeId) {
    const place = this.state.places.find((p) => p.id === placeId);
    if (!place) return;
    if (place.status === 'sold') {
      throw new Error(`Cannot delete "${place.name}" because it is already sold. Reverse the sale first.`);
    }

    this.saveState({
      ...this.state,
      places: this.state.places.filter((p) => p.id !== placeId),
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'PLACE_DELETED',
          actor: 'Auctioneer',
          details: `Deleted place "${place.name}" from inventory.`,
        },
        ...this.state.auditLogs,
      ],
    });

    if (isFirebaseConfigured() && db) {
      deleteDoc(doc(db, 'places', placeId)).catch(console.warn);
      deleteDoc(doc(db, 'secretValuations', placeId)).catch(console.warn);
    }
  }

  /* ----------------- GAME SETTINGS & REVEAL ----------------- */

  toggleLeadingTeamVisibility(visible) {
    this.saveState({
      ...this.state,
      auctionState: {
        ...this.state.auctionState,
        showLeadingTeamToParticipants: visible,
      },
    });
  }

  revealFinalResults() {
    this.stopTimerTicker();
    const updatedAuction = {
      ...this.state.auctionState,
      auctionStatus: 'ended',
      resultsRevealed: true,
      isTimerRunning: false,
    };

    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'FINAL_RESULTS_REVEALED',
      actor: 'Auctioneer',
      details: 'GRAND REVEAL: Auctioneer has revealed official final standings and secret asset values!',
    };

    this.saveState({
      ...this.state,
      auctionState: updatedAuction,
      auditLogs: [newLog, ...this.state.auditLogs],
    });
  }

  resetGame(confirmationText) {
    if (confirmationText !== 'RESET GAME') {
      throw new Error('Please type "RESET GAME" to confirm reset.');
    }
    this.stopTimerTicker();
    const fresh = getInitialPersistedState();
    this.saveState(fresh);
  }
}

export const auctionStore = new AuctionStore();
export default auctionStore;
