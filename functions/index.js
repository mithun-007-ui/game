const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

/**
 * 1. Seed Initial Data Callable (Admin Only)
 * Seeds the 10 Japanese tourist destinations, secret valuations, default teams,
 * and initial live auction state into Firestore without duplication.
 */
exports.seedInitialData = functions.https.onCall(async (data, context) => {
  if (!context.auth || (context.auth.token.role !== 'admin' && !context.auth.token.admin)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only the authorized auctioneer admin can initialize database inventory.'
    );
  }

  const { places, teams, auctionState } = data;
  if (!Array.isArray(places) || !Array.isArray(teams)) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing places or teams inventory payload.');
  }

  const batch = db.batch();

  // 1. Seed places (public fields) and secretValuations (admin/reveal only)
  for (const place of places) {
    const placeRef = db.collection('places').doc(place.id);
    const valuationRef = db.collection('secretValuations').doc(place.id);

    const { assetValue, ...publicPlaceData } = place;

    batch.set(placeRef, publicPlaceData, { merge: true });
    batch.set(valuationRef, { placeId: place.id, assetValue: assetValue || 0 }, { merge: true });
  }

  // 2. Seed teams & public team directory
  for (const team of teams) {
    const teamRef = db.collection('teams').doc(team.id);
    const publicTeamRef = db.collection('publicTeams').doc(team.id);

    batch.set(teamRef, team, { merge: true });
    batch.set(publicTeamRef, {
      id: team.id,
      name: team.name,
      color: team.color,
      active: team.active !== false,
    }, { merge: true });
  }

  // 3. Seed active auction state
  const stateRef = db.collection('auctionState').doc('active');
  batch.set(stateRef, auctionState || {}, { merge: true });

  await batch.commit();

  return { success: true, message: 'Seeded 10 Japanese destinations, secret valuations, and default teams into Firestore.' };
});

/**
 * 2. Atomic Server-Side Confirm Sale Transaction
 * Enforces atomic deduction of team remaining purse, marking place as Sold,
 * creating immutable purchase records, and logging an audit event.
 */
exports.confirmSale = functions.https.onCall(async (data, context) => {
  // 1. Verify auctioneer admin privileges
  if (!context.auth || (context.auth.token.role !== 'admin' && !context.auth.token.admin)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only the authorized auctioneer can confirm sales.'
    );
  }

  const { placeId, teamId, finalPrice } = data;
  if (!placeId || !teamId || !finalPrice || finalPrice <= 0) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing or invalid sale confirmation parameters.'
    );
  }

  return db.runTransaction(async (transaction) => {
    const placeRef = db.collection('places').doc(placeId);
    const teamRef = db.collection('teams').doc(teamId);
    const auctionStateRef = db.collection('auctionState').doc('active');

    const placeDoc = await transaction.get(placeRef);
    const teamDoc = await transaction.get(teamRef);

    if (!placeDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Destination place not found.');
    }
    if (!teamDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Bidding team not found.');
    }

    const placeData = placeDoc.data();
    const teamData = teamDoc.data();

    if (placeData.status === 'sold') {
      throw new functions.https.HttpsError('already-exists', 'This destination has already been sold.');
    }

    if (teamData.remainingPurse < finalPrice) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Team ${teamData.name} has insufficient purse (Remaining: ¥${teamData.remainingPurse.toLocaleString()}).`
      );
    }

    // Deduct purse
    const newSpent = (teamData.totalSpent || 0) + finalPrice;
    const newRemaining = teamData.startingPurse - newSpent;

    transaction.update(teamRef, {
      totalSpent: newSpent,
      remainingPurse: newRemaining,
      purchasedPlaceIds: admin.firestore.FieldValue.arrayUnion(placeId),
    });

    // Update place status
    transaction.update(placeRef, {
      status: 'sold',
      winningTeamId: teamId,
      finalPurchasePrice: finalPrice,
    });

    // Create purchase record
    const purchaseRef = db.collection('purchases').doc();
    transaction.set(purchaseRef, {
      placeId,
      placeName: placeData.name,
      teamId,
      teamName: teamData.name,
      finalPurchasePrice: finalPrice,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active',
    });

    // Create audit log
    const auditRef = db.collection('auditLogs').doc();
    transaction.set(auditRef, {
      action: 'SALE_CONFIRMED',
      actorId: context.auth.uid,
      actorName: 'Auctioneer',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      placeId,
      teamId,
      finalPrice,
      details: `SOLD: "${placeData.name}" won by ${teamData.name} for ¥${finalPrice.toLocaleString()}.`,
    });

    // Update auction state
    transaction.update(auctionStateRef, {
      auctionStatus: 'idle',
      currentBid: 0,
      leadingTeamId: null,
      bidHistory: [],
    });

    return { success: true, message: `Sale confirmed for ${placeData.name}.` };
  });
});

/**
 * 3. Atomic Server-Side Reverse Sale Transaction
 */
exports.reverseSale = functions.https.onCall(async (data, context) => {
  if (!context.auth || (context.auth.token.role !== 'admin' && !context.auth.token.admin)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only the auctioneer can execute sale reversals.'
    );
  }

  const { purchaseId } = data;
  if (!purchaseId) {
    throw new functions.https.HttpsError('invalid-argument', 'Purchase ID is required.');
  }

  return db.runTransaction(async (transaction) => {
    const purchaseRef = db.collection('purchases').doc(purchaseId);
    const purchaseDoc = await transaction.get(purchaseRef);

    if (!purchaseDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Purchase record not found.');
    }

    const purchase = purchaseDoc.data();
    if (purchase.status === 'reversed') {
      throw new functions.https.HttpsError('failed-precondition', 'Transaction already reversed.');
    }

    const placeRef = db.collection('places').doc(purchase.placeId);
    const teamRef = db.collection('teams').doc(purchase.teamId);

    const teamDoc = await transaction.get(teamRef);
    const teamData = teamDoc.data();

    // Refund purse
    const newSpent = Math.max(0, (teamData.totalSpent || 0) - purchase.finalPurchasePrice);
    const newRemaining = teamData.startingPurse - newSpent;

    transaction.update(teamRef, {
      totalSpent: newSpent,
      remainingPurse: newRemaining,
      purchasedPlaceIds: admin.firestore.FieldValue.arrayRemove(purchase.placeId),
    });

    // Restore place
    transaction.update(placeRef, {
      status: 'available',
      winningTeamId: null,
      finalPurchasePrice: null,
    });

    // Mark purchase reversed
    transaction.update(purchaseRef, {
      status: 'reversed',
      reversedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Audit log
    const auditRef = db.collection('auditLogs').doc();
    transaction.set(auditRef, {
      action: 'SALE_REVERSED',
      actorId: context.auth.uid,
      actorName: 'Auctioneer',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      purchaseId,
      refundAmount: purchase.finalPurchasePrice,
      details: `Reversed sale for "${purchase.placeName}". Refunded ¥${purchase.finalPurchasePrice.toLocaleString()} to ${purchase.teamName}.`,
    });

    return { success: true };
  });
});
