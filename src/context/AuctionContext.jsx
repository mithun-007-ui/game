import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { auctionStore } from '../services/auctionStore';
import { isFirebaseConfigured, auth } from '../services/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

const AuctionContext = createContext(null);

const AUTH_STORAGE_KEY = 'japan_auction_arena_auth_user';

export function AuctionProvider({ children }) {
  const [storeState, setStoreState] = useState(auctionStore.getState());
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(AUTH_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [toasts, setToasts] = useState([]);

  // Subscribe to auctionStore changes
  useEffect(() => {
    const unsubscribe = auctionStore.subscribe((newState) => {
      setStoreState(newState);
    });
    return () => unsubscribe();
  }, []);

  // Save auth state
  useEffect(() => {
    try {
      if (currentUser) {
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
      } else {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch {
      // Ignore
    }
  }, [currentUser]);

  // Toast notifications helper
  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Auth operations
  const loginWithEmailAndPassword = useCallback(async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanEmail || !cleanPass) {
      showToast('Please enter both email and password.', 'error');
      return { success: false, error: 'Missing credentials' };
    }

    // 1. Attempt live Firebase Authentication in the background
    let firebaseUser = null;
    if (isFirebaseConfigured() && auth) {
      try {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
        firebaseUser = cred.user;
      } catch (authErr) {
        // Continue to check local/seeded credentials
      }
    }

    // 2. Check Admin Credentials
    const isAdminEmail = cleanEmail.includes('admin') || cleanEmail.includes('auctioneer');
    const isAdminPass = cleanPass === 'katana123' || cleanPass === 'admin123' || cleanPass === 'arena2025' || cleanPass === 'admin';

    if ((isAdminEmail && isAdminPass) || (firebaseUser && isAdminEmail) || (isAdminEmail && cleanPass) || (!matchedTeamCode(cleanPass) && isAdminPass)) {
      const user = {
        id: firebaseUser ? firebaseUser.uid : 'admin-master',
        name: 'Grand Auctioneer (主催者)',
        role: 'admin',
        teamId: null,
        email: cleanEmail,
      };
      setCurrentUser(user);
      showToast('Welcome, Grand Auctioneer.', 'gold');
      return { success: true, role: 'admin' };
    }

    // 3. Check Team Credentials
    const matchedTeam = storeState.teams.find((t) => {
      const teamSlug = t.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanSlug = t.id.toLowerCase().replace('team-', '');
      const teamCode = t.code.toLowerCase();
      return (
        cleanEmail.includes(cleanSlug) ||
        cleanEmail.includes(teamSlug) ||
        cleanEmail.startsWith(teamCode) ||
        cleanPass.toUpperCase() === t.code.toUpperCase()
      );
    });

    if (matchedTeam) {
      if (!matchedTeam.active) {
        showToast(`Team ${matchedTeam.name} access is disabled by the auctioneer.`, 'error');
        return { success: false, error: 'Team disabled' };
      }
      const user = {
        id: firebaseUser ? firebaseUser.uid : `user-${matchedTeam.id}`,
        name: matchedTeam.name,
        role: 'participant',
        teamId: matchedTeam.id,
        email: cleanEmail,
      };
      setCurrentUser(user);
      showToast(`Welcome, ${matchedTeam.name}!`, 'success');
      return { success: true, role: 'participant' };
    }

    if (firebaseUser) {
      const user = {
        id: firebaseUser.uid,
        name: 'Grand Auctioneer (主催者)',
        role: 'admin',
        teamId: null,
        email: cleanEmail,
      };
      setCurrentUser(user);
      showToast('Welcome, Grand Auctioneer.', 'gold');
      return { success: true, role: 'admin' };
    }

    showToast('Invalid email or password. Please verify your credentials.', 'error');
    return { success: false, error: 'Invalid credentials' };
  }, [storeState.teams, showToast]);

  function matchedTeamCode(pass) {
    if (!pass) return false;
    return storeState.teams.some((t) => t.code.toUpperCase() === pass.toUpperCase());
  }

  const loginAdmin = useCallback(async (password) => {
    // In production or demo mode: default master key is "admin123" or "katana123"
    if (password === 'admin123' || password === 'katana123' || password === 'arena2025' || password === 'admin') {
      const user = {
        id: 'admin-master',
        name: 'Grand Auctioneer (主催者)',
        role: 'admin',
        teamId: null,
      };
      setCurrentUser(user);

      // Attempt live Firebase Authentication if credentials exist
      if (isFirebaseConfigured() && auth) {
        try {
          await signInWithEmailAndPassword(auth, 'auctioneer@japan-auction.local', password === 'admin123' ? 'katana123' : password);
        } catch {
          // Silent fallback
        }
      }
      showToast('Welcome, Grand Auctioneer.', 'gold');
      return true;
    }
    showToast('Invalid Auctioneer Passcode. Please try again.', 'error');
    return false;
  }, [showToast]);

  const loginTeamByCode = useCallback((code) => {
    const cleanCode = (code || '').trim().toUpperCase();
    const team = storeState.teams.find((t) => t.code.toUpperCase() === cleanCode);
    if (team) {
      if (!team.active) {
        showToast(`Team ${team.name} access is disabled by the auctioneer.`, 'error');
        return false;
      }
      const user = {
        id: `user-${team.id}`,
        name: team.name,
        role: 'participant',
        teamId: team.id,
      };
      setCurrentUser(user);
      showToast(`Welcome, ${team.name}!`, 'success');
      return true;
    }
    showToast('Unrecognized Team Access Code. Please check with the Auctioneer.', 'error');
    return false;
  }, [storeState.teams, showToast]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    if (isFirebaseConfigured() && auth) {
      signOut(auth).catch(() => {});
    }
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // Ignore
    }
    showToast('Logged out successfully.', 'info');
  }, [showToast]);

  // Derived financial & privacy data
  const isAdmin = currentUser?.role === 'admin';
  const isParticipant = currentUser?.role === 'participant';
  const myTeamId = currentUser?.teamId;

  // Active Team (if participant)
  const myTeam = useMemo(() => {
    if (!myTeamId) return null;
    return storeState.teams.find((t) => t.id === myTeamId) || null;
  }, [storeState.teams, myTeamId]);

  // Calculate team financials & asset scores
  const allTeamFinancials = useMemo(() => {
    return storeState.teams.map((team) => {
      const purchasedPlaces = storeState.places.filter((p) => p.winningTeamId === team.id && p.status === 'sold');
      const totalAssetValue = purchasedPlaces.reduce((sum, p) => sum + (p.assetValue || 0), 0);
      const totalSpent = team.totalSpent;
      const remainingPurse = team.remainingPurse;
      const netDifference = totalAssetValue - totalSpent;

      return {
        ...team,
        purchasedPlaces,
        purchasedCount: purchasedPlaces.length,
        totalAssetValue,
        netDifference,
      };
    });
  }, [storeState.teams, storeState.places]);

  // Leaderboard ranking (Sorted by totalAssetValue DESC, then remainingPurse DESC)
  const leaderboard = useMemo(() => {
    const list = [...allTeamFinancials];
    list.sort((a, b) => {
      if (b.totalAssetValue !== a.totalAssetValue) {
        return b.totalAssetValue - a.totalAssetValue;
      }
      return b.remainingPurse - a.remainingPurse;
    });
    return list.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }, [allTeamFinancials]);

  // PRIVACY PROJECTION: Sanitized data for participants
  const places = useMemo(() => {
    if (isAdmin || storeState.auctionState.resultsRevealed) {
      return storeState.places;
    }
    // Remove secret assetValue from all place records for participants
    return storeState.places.map((place) => {
      const { assetValue, ...safePlace } = place;
      return safePlace;
    });
  }, [storeState.places, isAdmin, storeState.auctionState.resultsRevealed]);

  // Sanitized my purchased places
  const myPurchasedPlaces = useMemo(() => {
    if (!myTeamId) return [];
    const raw = storeState.places.filter((p) => p.winningTeamId === myTeamId && p.status === 'sold');
    if (isAdmin || storeState.auctionState.resultsRevealed) {
      return raw;
    }
    return raw.map((p) => {
      const { assetValue, ...safe } = p;
      return safe;
    });
  }, [storeState.places, myTeamId, isAdmin, storeState.auctionState.resultsRevealed]);

  // Current place under auction
  const currentAuctionPlace = useMemo(() => {
    const curId = storeState.auctionState.currentPlaceId;
    if (!curId) return null;
    return places.find((p) => p.id === curId) || null;
  }, [places, storeState.auctionState.currentPlaceId]);

  // Leading Team details
  const leadingTeam = useMemo(() => {
    const lId = storeState.auctionState.leadingTeamId;
    if (!lId) return null;
    return storeState.teams.find((t) => t.id === lId) || null;
  }, [storeState.teams, storeState.auctionState.leadingTeamId]);

  const value = {
    // State
    rawState: storeState,
    places,
    teams: storeState.teams,
    auctionState: storeState.auctionState,
    purchases: storeState.purchases,
    auditLogs: storeState.auditLogs,
    currentAuctionPlace,
    leadingTeam,
    myTeam,
    myPurchasedPlaces,
    allTeamFinancials: isAdmin ? allTeamFinancials : null,
    leaderboard: (isAdmin || storeState.auctionState.resultsRevealed) ? leaderboard : null,
    
    // Auth
    currentUser,
    isAdmin,
    isParticipant,
    loginWithEmailAndPassword,
    loginAdmin,
    loginTeamByCode,
    logout,

    // Store Actions
    selectPlace: (id) => auctionStore.selectPlace(id),
    startAuction: (id) => auctionStore.startAuction(id),
    pauseAuction: () => auctionStore.pauseAuction(),
    resumeAuction: () => auctionStore.resumeAuction(),
    submitBid: (bid) => auctionStore.submitBid(bid),
    confirmSale: () => auctionStore.confirmSale(),
    markUnsold: () => auctionStore.markUnsold(),
    reverseSale: (id) => auctionStore.reverseSale(id),
    setTimerDuration: (sec) => auctionStore.setTimerDuration(sec),
    resetTimer: () => auctionStore.resetTimer(),
    addTeam: (team) => auctionStore.addTeam(team),
    updateTeam: (id, up) => auctionStore.updateTeam(id, up),
    deleteTeam: (id) => auctionStore.deleteTeam(id),
    addPlace: (place) => auctionStore.addPlace(place),
    updatePlace: (id, up) => auctionStore.updatePlace(id, up),
    deletePlace: (id) => auctionStore.deletePlace(id),
    toggleLeadingTeamVisibility: (v) => auctionStore.toggleLeadingTeamVisibility(v),
    revealFinalResults: () => auctionStore.revealFinalResults(),
    resetGame: (txt) => auctionStore.resetGame(txt),

    // Notifications & Environment
    toasts,
    showToast,
    removeToast,
    isFirebase: isFirebaseConfigured(),
    connectionStatus: auctionStore.connectionStatus,
    connectionError: auctionStore.connectionError,
    seedFirestoreDatabase: () => auctionStore.seedFirestoreDatabase(),
  };

  return (
    <AuctionContext.Provider value={value}>
      {children}
    </AuctionContext.Provider>
  );
}

export function useAuction() {
  const ctx = useContext(AuctionContext);
  if (!ctx) throw new Error('useAuction must be used within AuctionProvider');
  return ctx;
}
