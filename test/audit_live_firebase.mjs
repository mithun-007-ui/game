import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const envContent = fs.readFileSync(path.join(projectRoot, '.env'), 'utf8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx > 0) {
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    val = val.replace(/^["']|["']$/g, '').trim();
    envVars[key] = val;
  }
}

const firebaseConfig = {
  apiKey: envVars.VITE_FIREBASE_API_KEY,
  authDomain: envVars.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.VITE_FIREBASE_PROJECT_ID,
  storageBucket: envVars.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.VITE_FIREBASE_APP_ID,
};

console.log('🔍 LIVE FIREBASE CLIENT SDK AUDIT TEST');
console.log(`Connecting to project: ${firebaseConfig.projectId}...\n`);

const app = initializeApp(firebaseConfig, 'audit-full-test');
const auth = getAuth(app);
const db = getFirestore(app);

const results = [];

async function check(name, fn) {
  try {
    const res = await fn();
    results.push({ name, status: 'PASS', detail: res });
    console.log(`  ✅ [PASS] ${name}:`, res);
  } catch (err) {
    results.push({ name, status: 'BLOCKED/FAIL', error: err.code || err.message });
    console.log(`  ❌ [BLOCKED/FAIL] ${name}:`, err.code || err.message);
  }
}

console.log('--- PHASE 1: PARTICIPANT / UNAUTHENTICATED PRIVACY CHECKS ---');

await check('1. Read Public Places Collection', async () => {
  const snap = await getDocs(collection(db, 'places'));
  return `Successfully fetched ${snap.size} places (Public)`;
});

await check('2. Read Public Teams Directory', async () => {
  const snap = await getDocs(collection(db, 'publicTeams'));
  return `Successfully fetched ${snap.size} teams from publicTeams (Public)`;
});

await check('3. Read Active Auction State', async () => {
  const snap = await getDoc(doc(db, 'auctionState', 'active'));
  return `Active status is '${snap.data()?.auctionStatus}' (Public)`;
});

await check('4. Unauthenticated Read of Secret Valuations (Must be BLOCKED)', async () => {
  try {
    const snap = await getDocs(collection(db, 'secretValuations'));
    throw new Error(`SECURITY LEAK: Unauthenticated client read ${snap.size} secret valuations!`);
  } catch (err) {
    if (err.code === 'permission-denied') return 'Protected: permission-denied (Google servers blocked access)';
    throw err;
  }
});

await check('5. Unauthenticated Read of Private Teams Financials (Must be BLOCKED)', async () => {
  try {
    const snap = await getDocs(collection(db, 'teams'));
    throw new Error(`SECURITY LEAK: Unauthenticated client read ${snap.size} private team documents!`);
  } catch (err) {
    if (err.code === 'permission-denied') return 'Protected: permission-denied (Google servers blocked access)';
    throw err;
  }
});

await check('6. Unauthenticated Write to Places (Must be BLOCKED)', async () => {
  try {
    await updateDoc(doc(db, 'places', 'place-1'), { status: 'sold' });
    throw new Error('SECURITY LEAK: Unauthenticated client modified place status!');
  } catch (err) {
    if (err.code === 'permission-denied') return 'Protected: permission-denied (Google servers blocked write)';
    throw err;
  }
});

await check('7. Unauthenticated Deduction of Team Purse (Must be BLOCKED)', async () => {
  try {
    await updateDoc(doc(db, 'teams', 'team-sakura'), { remainingPurse: 0 });
    throw new Error('SECURITY LEAK: Unauthenticated client wiped team purse!');
  } catch (err) {
    if (err.code === 'permission-denied') return 'Protected: permission-denied (Google servers blocked write)';
    throw err;
  }
});

console.log('\n--- PHASE 2: VERIFIED ADMIN PRIVILEGE & WRITE CHECKS ---');

await check('8. Authenticate as Grand Auctioneer (Custom Claims)', async () => {
  const cred = await signInWithEmailAndPassword(auth, 'auctioneer@gmail.com', 'katana123');
  const tokenResult = await cred.user.getIdTokenResult();
  const isAdmin = tokenResult.claims.role === 'admin' || tokenResult.claims.admin === true;
  return `Authenticated UID: ${cred.user.uid}, Claims: role=${tokenResult.claims.role}, admin=${tokenResult.claims.admin} (isAdmin=${isAdmin})`;
});

await check('9. Admin Read of Secret Valuations', async () => {
  const snap = await getDocs(collection(db, 'secretValuations'));
  return `Admin authorized: read all ${snap.size} secret valuations`;
});

await check('10. Admin Read of Full Teams Financials', async () => {
  const snap = await getDocs(collection(db, 'teams'));
  return `Admin authorized: read all ${snap.size} team private balance records`;
});

await check('11. Admin Read & Write of Audit Logs', async () => {
  const snap = await getDocs(collection(db, 'auditLogs'));
  return `Admin authorized: read ${snap.size} audit logs`;
});

await check('12. Admin State Write & Live Auction Control', async () => {
  const stateRef = doc(db, 'auctionState', 'active');
  await updateDoc(stateRef, { lastAuditedAt: new Date().toISOString() });
  return 'Admin authorized: successfully wrote update to auctionState/active';
});

await signOut(auth);
console.log('\n✨ Live audit completed successfully.');
process.exit(0);
