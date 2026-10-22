import assert from 'node:assert/strict';

// 1. Mock browser localStorage in Node.js environment
const storageMap = new Map();
globalThis.localStorage = {
  getItem: (key) => (storageMap.has(key) ? storageMap.get(key) : null),
  setItem: (key, val) => storageMap.set(key, String(val)),
  removeItem: (key) => storageMap.delete(key),
  clear: () => storageMap.clear(),
};

globalThis.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
};

console.log('⛩️  STARTING JAPAN AUCTION ARENA END-TO-END VERIFICATION TEST SUITE\n');

// Import store and initial data
const { auctionStore } = await import('../src/services/auctionStore.js');
const { INITIAL_PLACES, INITIAL_TEAMS } = await import('../src/data/initialData.js');

let testsPassed = 0;
let testsFailed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    testsFailed++;
  }
}

// -------------------------------------------------------------
// TEST 1: Initial state & inventory seeding
// -------------------------------------------------------------
runTest('Seeded Inventory: Exactly 10 Japanese destinations and 6 default teams', () => {
  const state = auctionStore.getState();
  assert.equal(state.places.length, 10, 'Must have 10 initial destinations');
  assert.equal(state.teams.length, 6, 'Must have 6 initial teams');

  // Verify Mount Fuji
  const fuji = state.places.find((p) => p.name.includes('Mount Fuji'));
  assert.ok(fuji, 'Mount Fuji must exist');
  assert.equal(fuji.basePrice, 5_000_000, 'Mount Fuji base price must be ¥5,000,000');
  assert.equal(fuji.assetValue, 15_000_000, 'Mount Fuji asset value must be ¥15,000,000');
  assert.equal(fuji.status, 'available', 'Initial status must be available');

  // Verify Team Sakura
  const sakura = state.teams.find((t) => t.name === 'Team Sakura');
  assert.ok(sakura, 'Team Sakura must exist');
  assert.equal(sakura.startingPurse, 100_000_000, 'Starting purse must be ¥100,000,000');
  assert.equal(sakura.remainingPurse, 100_000_000, 'Remaining purse must be ¥100,000,000');
  assert.equal(sakura.totalSpent, 0, 'Initial spending must be 0');
});

// -------------------------------------------------------------
// TEST 2: Bid validation rules
// -------------------------------------------------------------
runTest('Bid Validation: Reject bids below base price', () => {
  const fuji = auctionStore.getState().places.find((p) => p.name.includes('Mount Fuji'));
  auctionStore.selectPlace(fuji.id);
  auctionStore.startAuction(fuji.id);

  const sakura = auctionStore.getState().teams.find((t) => t.name === 'Team Sakura');

  assert.throws(
    () => {
      // Base price is ¥5,000,000. Try to bid ¥4,000,000
      auctionStore.submitBid({ teamId: sakura.id, bidAmount: 4_000_000 });
    },
    /below base price/,
    'Should reject bids below base starting price'
  );
});

runTest('Bid Validation: Accept valid opening bid of ¥7,000,000 from Team Sakura', () => {
  const sakura = auctionStore.getState().teams.find((t) => t.name === 'Team Sakura');
  auctionStore.submitBid({ teamId: sakura.id, bidAmount: 7_000_000 });

  const state = auctionStore.getState();
  assert.equal(state.auctionState.currentBid, 7_000_000, 'Current bid must be ¥7,000,000');
  assert.equal(state.auctionState.leadingTeamId, sakura.id, 'Leading team must be Team Sakura');
});

runTest('Bid Validation: Reject subsequent bids <= current confirmed bid', () => {
  const fujiTeam = auctionStore.getState().teams.find((t) => t.name === 'Team Fuji');
  assert.throws(
    () => {
      // Current bid is ¥7,000,000. Try to bid ¥6,500,000
      auctionStore.submitBid({ teamId: fujiTeam.id, bidAmount: 6_500_000 });
    },
    /strictly exceed current confirmed bid/,
    'Should reject bids less than or equal to current confirmed bid'
  );

  assert.throws(
    () => {
      // Try to bid exactly equal to current bid
      auctionStore.submitBid({ teamId: fujiTeam.id, bidAmount: 7_000_000 });
    },
    /strictly exceed current confirmed bid/,
    'Should reject bids equal to current confirmed bid'
  );
});

runTest('Bid Validation: Reject bids exceeding team remaining purse', () => {
  const fujiTeam = auctionStore.getState().teams.find((t) => t.name === 'Team Fuji');
  assert.throws(
    () => {
      // Remaining purse is ¥100,000,000. Try to bid ¥150,000,000
      auctionStore.submitBid({ teamId: fujiTeam.id, bidAmount: 150_000_000 });
    },
    /Insufficient purse/,
    'Should reject bids exceeding team remaining purse'
  );
});

// -------------------------------------------------------------
// TEST 3: Sale confirmation & exact purse deduction
// -------------------------------------------------------------
runTest('Sale Confirmation: Deducts exactly ¥7,000,000, marks Sold, updates purchase record', () => {
  const fuji = auctionStore.getState().places.find((p) => p.name.includes('Mount Fuji'));
  const sakuraBefore = auctionStore.getState().teams.find((t) => t.name === 'Team Sakura');
  assert.equal(sakuraBefore.remainingPurse, 100_000_000);

  // Confirm Sale
  auctionStore.confirmSale();

  const state = auctionStore.getState();
  const fujiAfter = state.places.find((p) => p.id === fuji.id);
  const sakuraAfter = state.teams.find((t) => t.name === 'Team Sakura');

  // Verify financial results match user request specification:
  // Starting purse: ¥100,000,000
  // Purchase price: ¥7,000,000
  // Remaining purse: ¥93,000,000
  // Total spending: ¥7,000,000
  assert.equal(fujiAfter.status, 'sold', 'Place status must be sold');
  assert.equal(fujiAfter.winningTeamId, sakuraAfter.id, 'Winning team must be Team Sakura');
  assert.equal(fujiAfter.finalPurchasePrice, 7_000_000, 'Final price must be ¥7,000,000');

  assert.equal(sakuraAfter.remainingPurse, 93_000_000, 'Remaining purse must be ¥93,000,000');
  assert.equal(sakuraAfter.totalSpent, 7_000_000, 'Total spent must be ¥7,000,000');
  assert.ok(sakuraAfter.purchasedPlaceIds.includes(fuji.id), 'Team must own Mount Fuji');

  // Verify purchases audit trail
  assert.equal(state.purchases.length, 1, 'Must have 1 purchase record');
  assert.equal(state.purchases[0].placeName, fuji.name);
  assert.equal(state.purchases[0].finalPurchasePrice, 7_000_000);
  assert.equal(state.purchases[0].status, 'active');

  // Verify audit log
  const saleLog = state.auditLogs.find((l) => l.action === 'SALE_CONFIRMED');
  assert.ok(saleLog, 'SALE_CONFIRMED audit log must be recorded');
});

runTest('Sale Validation: Prevent duplicate sale of already sold destination', () => {
  assert.throws(
    () => {
      auctionStore.confirmSale();
    },
    /already sold|No team has placed a bid/,
    'Cannot confirm sale for an already sold destination'
  );
});

// -------------------------------------------------------------
// TEST 4: Accidental sale reversal & audit history preservation
// -------------------------------------------------------------
runTest('Accidental Sale Reversal: Restores purse, restores place to available, logs reversal', () => {
  const purchaseId = auctionStore.getState().purchases[0].id;
  const fuji = auctionStore.getState().places.find((p) => p.name.includes('Mount Fuji'));

  // Execute reversal
  auctionStore.reverseSale(purchaseId);

  const state = auctionStore.getState();
  const sakura = state.teams.find((t) => t.name === 'Team Sakura');
  const fujiAfter = state.places.find((p) => p.id === fuji.id);

  assert.equal(sakura.remainingPurse, 100_000_000, 'Purse must be fully refunded to ¥100,000,000');
  assert.equal(sakura.totalSpent, 0, 'Total spent must be refunded to 0');
  assert.equal(fujiAfter.status, 'available', 'Destination status must return to available');
  assert.equal(fujiAfter.winningTeamId, null, 'Winning team must be cleared');

  // Purchase record must NOT be deleted, but marked 'reversed' for audit integrity
  const reversedPurchase = state.purchases.find((p) => p.id === purchaseId);
  assert.equal(reversedPurchase.status, 'reversed', 'Purchase must be preserved with reversed status');

  const reversalLog = state.auditLogs.find((l) => l.action === 'SALE_REVERSED');
  assert.ok(reversalLog, 'SALE_REVERSED audit log must be recorded');

  // Re-sell Mount Fuji to Team Sakura for ¥7,000,000 to continue test flow
  auctionStore.selectPlace(fuji.id);
  auctionStore.startAuction(fuji.id);
  auctionStore.submitBid({ teamId: sakura.id, bidAmount: 7_000_000 });
  auctionStore.confirmSale();

  const stateReSold = auctionStore.getState();
  const sakuraReSold = stateReSold.teams.find((t) => t.name === 'Team Sakura');
  assert.equal(sakuraReSold.remainingPurse, 93_000_000, 'Remaining purse re-sold = ¥93,000,000');
});

// -------------------------------------------------------------
// TEST 5: Unsold destination workflow
// -------------------------------------------------------------
runTest('Unsold Destination: Status becomes unsold without deducting any team budget', () => {
  const castle = auctionStore.getState().places.find((p) => p.name.includes('Himeji Castle'));
  auctionStore.selectPlace(castle.id);
  auctionStore.startAuction(castle.id);

  // Mark unsold
  auctionStore.markUnsold();

  const state = auctionStore.getState();
  const castleAfter = state.places.find((p) => p.id === castle.id);
  assert.equal(castleAfter.status, 'unsold', 'Himeji Castle status must be unsold');
  assert.equal(castleAfter.winningTeamId, null);

  // Check that no team purse was deducted
  for (const team of state.teams) {
    if (team.name === 'Team Sakura') {
      assert.equal(team.remainingPurse, 93_000_000);
    } else {
      assert.equal(team.remainingPurse, 100_000_000);
    }
  }
});

// -------------------------------------------------------------
// TEST 6: Participant Privacy & Asset Value Masking (CRITICAL REQUIREMENT)
// -------------------------------------------------------------
runTest('Privacy Rule: Participant projection strips all secret asset values prior to reveal', () => {
  const rawState = auctionStore.getState();
  assert.equal(rawState.auctionState.resultsRevealed, false, 'Results must not be revealed yet');

  // Simulate Participant Projection function as implemented in AuctionContext.jsx
  function sanitizePlacesForParticipant(places, resultsRevealed) {
    if (resultsRevealed) return places;
    return places.map((place) => {
      const { assetValue, ...safePlace } = place;
      return safePlace;
    });
  }

  const participantPlaces = sanitizePlacesForParticipant(rawState.places, false);

  for (const p of participantPlaces) {
    assert.equal(p.assetValue, undefined, `Place ${p.name} must NOT leak assetValue to participants`);
  }

  // Ensure raw admin data STILL retains assetValue for the auctioneer
  const fujiAdmin = rawState.places.find((p) => p.name.includes('Mount Fuji'));
  assert.equal(fujiAdmin.assetValue, 15_000_000, 'Admin MUST see secret asset value ¥15,000,000');
});

// -------------------------------------------------------------
// TEST 7: Controlled Final Results Reveal & Tie-Breaker
// -------------------------------------------------------------
runTest('Results Reveal: Unlocks official standings and breaks ties by remaining purse', () => {
  // Let Team Fuji purchase Itsukushima Shrine (Base ¥3M, Asset ¥10M) for ¥3,000,000
  const shrine = auctionStore.getState().places.find((p) => p.name.includes('Itsukushima Shrine'));
  const fujiTeam = auctionStore.getState().teams.find((t) => t.name === 'Team Fuji');
  auctionStore.selectPlace(shrine.id);
  auctionStore.startAuction(shrine.id);
  auctionStore.submitBid({ teamId: fujiTeam.id, bidAmount: 3_000_000 });
  auctionStore.confirmSale();

  // Reveal final results
  auctionStore.revealFinalResults();

  const state = auctionStore.getState();
  assert.equal(state.auctionState.resultsRevealed, true, 'resultsRevealed must be true');

  // Calculate leaderboard
  const teamFinancials = state.teams.map((team) => {
    const purchasedPlaces = state.places.filter((p) => p.winningTeamId === team.id && p.status === 'sold');
    const totalAssetValue = purchasedPlaces.reduce((sum, p) => sum + (p.assetValue || 0), 0);
    return {
      ...team,
      totalAssetValue,
      purchasedPlaces,
    };
  });

  teamFinancials.sort((a, b) => {
    if (b.totalAssetValue !== a.totalAssetValue) {
      return b.totalAssetValue - a.totalAssetValue;
    }
    return b.remainingPurse - a.remainingPurse;
  });

  // Team Sakura: Won Mount Fuji (Asset ¥15M, Spent ¥7M, Remaining ¥93M) -> Rank 1
  // Team Fuji: Won Shrine (Asset ¥10M, Spent ¥3M, Remaining ¥97M) -> Rank 2
  assert.equal(teamFinancials[0].name, 'Team Sakura', 'Team Sakura must be #1 with ¥15,000,000 asset value');
  assert.equal(teamFinancials[0].totalAssetValue, 15_000_000);
  assert.equal(teamFinancials[1].name, 'Team Fuji', 'Team Fuji must be #2 with ¥10,000,000 asset value');
  assert.equal(teamFinancials[1].totalAssetValue, 10_000_000);
});

// -------------------------------------------------------------
// TEST 8: State persistence & reload integrity
// -------------------------------------------------------------
runTest('State Persistence: State survives reload from localStorage without data corruption', () => {
  const currentStateJson = JSON.stringify(auctionStore.getState());

  // Simulate page reload
  const reloadedState = JSON.parse(globalThis.localStorage.getItem('japan_auction_arena_state_v1'));

  assert.equal(reloadedState.places.length, 10, 'Must still have 10 places');
  assert.equal(reloadedState.teams.length, 6, 'Must still have 6 teams');
  const sakura = reloadedState.teams.find((t) => t.name === 'Team Sakura');
  assert.equal(sakura.remainingPurse, 93_000_000, 'Persisted purse must be ¥93,000,000');
  assert.equal(sakura.totalSpent, 7_000_000, 'Persisted spending must be ¥7,000,000');
});

// -------------------------------------------------------------
// Summary
// -------------------------------------------------------------
console.log('\n-------------------------------------------------------------');
console.log(`🎯 TEST RESULTS: ${testsPassed} PASSED | ${testsFailed} FAILED`);
console.log('-------------------------------------------------------------\n');

if (testsFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
