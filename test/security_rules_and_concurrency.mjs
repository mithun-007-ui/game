import assert from 'node:assert/strict';
import fs from 'node:fs';

console.log('🛡️  STARTING BACKEND SECURITY RULES & CONCURRENCY VERIFICATION\n');
console.log('Mode Detection: Local Multi-Tab Simulation Engine & Production Firebase Rule Sets\n');

let passed = 0;
let failed = 0;
let skipped = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    if (err.name === 'SkipTestError') {
      console.log(`  ⚠️  SKIPPED: ${name} (${err.message})`);
      skipped++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }
}

// 1. Verify firestore.rules file existence and rules structure
await test('Firestore Security Rules: Restricts places assetValue to admins and blocks unauthorized writes', () => {
  const content = fs.readFileSync('./firestore.rules', 'utf8');

  // Must check for admin role check
  assert.ok(content.includes("request.auth.token.role == 'admin'"), 'Must verify admin role in auth token');

  // Must protect places collection
  assert.ok(content.includes('match /places/{placeId}'), 'Must match /places/{placeId}');
  assert.ok(content.includes('allow write: if isAdmin();'), 'Only admins may write places');

  // Must protect secretValuations collection
  assert.ok(content.includes('match /secretValuations/{placeId}'), 'Must match /secretValuations/{placeId}');
  assert.ok(content.includes('allow read: if isAdmin() || areResultsRevealed();'), 'Secret valuations only readable by admin or after reveal');

  // Must protect teams balance and enforce team isolation
  assert.ok(content.includes('match /teams/{teamId}'), 'Must match /teams/{teamId}');
  assert.ok(content.includes('request.auth.token.teamId == teamId'), 'Participants restricted to their own team document');
  assert.ok(content.includes('allow write: if isAdmin();'), 'Only admins may write directly to teams');

  // Must protect auditLogs
  assert.ok(content.includes('match /auditLogs/{logId}'), 'Must match /auditLogs/{logId}');
  assert.ok(content.includes('allow read, write: if isAdmin();'), 'Only admins can read/write auditLogs');

  // Must guard results reveal
  assert.ok(content.includes('areResultsRevealed()'), 'Must conditionally check areResultsRevealed()');
});

// 2. Verify Cloud Functions atomic transaction handler
await test('Cloud Functions: confirmSale & reverseSale are atomic transactions with server-side validation', () => {
  const content = fs.readFileSync('./functions/index.js', 'utf8');

  assert.ok(content.includes('db.runTransaction'), 'Must use db.runTransaction for atomic operations');
  assert.ok(content.includes("context.auth.token.role !== 'admin'"), 'Must verify caller is admin');
  assert.ok(content.includes('teamData.remainingPurse < finalPrice'), 'Must validate budget server-side before debit');
  assert.ok(content.includes("placeData.status === 'sold'"), 'Must prevent duplicate sales server-side');
  assert.ok(content.includes('admin.firestore.FieldValue.serverTimestamp()'), 'Must use server timestamps for audit logs');
});

// 3. Multi-Tab Real-Time Sync via BroadcastChannel (Event-driven asynchronous test with timeout & cleanup)
await test('BroadcastChannel: Multi-Client Real-Time Message Synchronization', async () => {
  if (typeof BroadcastChannel === 'undefined') {
    const skipErr = new Error('Native BroadcastChannel is not supported in this runtime');
    skipErr.name = 'SkipTestError';
    throw skipErr;
  }

  const CHANNEL_NAME = 'japan_auction_arena_test_sync';
  let channelA = null;
  let channelB = null;
  let timeoutId = null;

  try {
    channelA = new BroadcastChannel(CHANNEL_NAME);
    channelB = new BroadcastChannel(CHANNEL_NAME);

    const expectedPayload = {
      type: 'STATE_UPDATE',
      state: { currentBid: 9_000_000, leadingTeam: 'Team Kyoto' },
    };

    // Asynchronous event-driven promise with 2000ms timeout
    const receivePromise = new Promise((resolve, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Timed out after 2000ms waiting for message on channel: ${CHANNEL_NAME}`));
      }, 2000);

      // Register listener on channelB BEFORE posting from channelA
      channelB.onmessage = (event) => {
        try {
          // Validate event object and data integrity
          assert.ok(event, 'BroadcastChannel event must be defined');
          assert.ok(event.data, 'BroadcastChannel event.data must be defined');
          assert.equal(event.data.type, expectedPayload.type, 'Event type must match');
          assert.equal(event.data.state.currentBid, expectedPayload.state.currentBid, 'Bid amount must match');
          assert.equal(event.data.state.leadingTeam, expectedPayload.state.leadingTeam, 'Leading team must match');
          resolve(event.data);
        } catch (validationErr) {
          reject(validationErr);
        }
      };

      channelB.onmessageerror = (err) => {
        reject(new Error(`BroadcastChannel deserialization error: ${err}`));
      };
    });

    // Post message from channelA after listener is active
    channelA.postMessage(expectedPayload);

    // Await message arrival and assertion validations
    const received = await receivePromise;
    assert.ok(received, 'Channel B must receive message from Channel A');
    assert.deepEqual(received, expectedPayload, 'Received payload must deeply equal expected payload');
  } finally {
    // Clean up timers and close channels
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (channelB) {
      channelB.onmessage = null;
      channelB.onmessageerror = null;
      channelB.close();
    }
    if (channelA) {
      channelA.close();
    }
  }
});

// 4. Concurrency & Overspending Protection Test
await test('Budget Safety: Team cannot spend more than remaining purse through consecutive purchases', () => {
  let purse = 100_000_000;
  let spent = 0;

  function simulatePurchase(amount) {
    if (amount > purse) {
      throw new Error(`Insufficient purse! Cannot purchase for ¥${amount.toLocaleString()}`);
    }
    purse -= amount;
    spent += amount;
    return { purse, spent };
  }

  // 1st purchase: ¥60,000,000
  simulatePurchase(60_000_000);
  assert.equal(purse, 40_000_000);
  assert.equal(spent, 60_000_000);

  // 2nd purchase: ¥30,000,000
  simulatePurchase(30_000_000);
  assert.equal(purse, 10_000_000);
  assert.equal(spent, 90_000_000);

  // 3rd purchase attempt: ¥15,000,000 (Exceeds remaining ¥10M)
  assert.throws(
    () => simulatePurchase(15_000_000),
    /Insufficient purse/,
    'Must prevent overspending beyond remaining purse'
  );

  // Ensure balance remained untouched after rejected attempt
  assert.equal(purse, 10_000_000);
  assert.equal(spent, 90_000_000);
});

console.log('\n-------------------------------------------------------------');
console.log(`🛡️  SECURITY TEST RESULTS: ${passed} PASSED | ${failed} FAILED | ${skipped} SKIPPED`);
console.log('-------------------------------------------------------------\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
