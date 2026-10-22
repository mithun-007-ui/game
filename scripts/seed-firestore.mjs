import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Path to secure service account credentials located outside the repository
const serviceAccountPath = 'C:\\Users\\admin\\firebase-credentials\\japan-auction-arena-seed.json';

console.log('⛩️  JAPAN AUCTION ARENA - REPEATABLE FIRESTORE SEED UTILITY');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: Service account key not found at:', serviceAccountPath);
  console.error('Please ensure the service account file exists at C:\\Users\\admin\\firebase-credentials\\japan-auction-arena-seed.json');
  process.exit(1);
}

const rawContent = fs.readFileSync(serviceAccountPath, 'utf8').replace(/^\uFEFF/, '');
const serviceAccount = JSON.parse(rawContent);

console.log(`Connecting to Cloud Firestore with Admin privileges for project: "${serviceAccount.project_id}"...`);

// Initialize Firebase Admin SDK
const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = getFirestore(app);

const { INITIAL_PLACES, INITIAL_TEAMS, INITIAL_AUCTION_STATE } = await import('../src/data/initialData.js');

try {
  const batch = db.batch();

  console.log(`\n📦 Staging 10 Japanese Destinations (Public Metadata)...`);
  for (const place of INITIAL_PLACES) {
    const placeRef = db.collection('places').doc(place.id);
    const { assetValue, ...publicPlace } = place;
    batch.set(placeRef, publicPlace, { merge: true });
    console.log(`  - places/${place.id}: ${publicPlace.name} (Base: ¥${publicPlace.basePrice.toLocaleString()})`);
  }

  console.log(`\n🔒 Staging 10 Secret Valuations (Restricted to Admin / Final Reveal)...`);
  for (const place of INITIAL_PLACES) {
    const valRef = db.collection('secretValuations').doc(place.id);
    batch.set(valRef, { placeId: place.id, assetValue: place.assetValue || 0 }, { merge: true });
    console.log(`  - secretValuations/${place.id}: Asset Value ¥${(place.assetValue || 0).toLocaleString()}`);
  }

  console.log(`\n👥 Staging 6 Default Teams & Public Directory...`);
  for (const team of INITIAL_TEAMS) {
    const teamRef = db.collection('teams').doc(team.id);
    const pubTeamRef = db.collection('publicTeams').doc(team.id);

    batch.set(teamRef, team, { merge: true });
    batch.set(pubTeamRef, {
      id: team.id,
      name: team.name,
      color: team.color,
      active: team.active,
    }, { merge: true });

    console.log(`  - teams/${team.id}: ${team.name} (Purse: ¥${team.startingPurse.toLocaleString()}, Code: ${team.code})`);
  }

  console.log(`\n⚡ Staging Active Auction State & System Audit Log...`);
  const stateRef = db.collection('auctionState').doc('active');
  batch.set(stateRef, INITIAL_AUCTION_STATE, { merge: true });

  const auditRef = db.collection('auditLogs').doc('log-init');
  batch.set(auditRef, {
    id: 'log-init',
    timestamp: new Date().toISOString(),
    action: 'SYSTEM_INITIALIZED',
    actor: 'Firebase Admin SDK (CLI Seed)',
    details: 'Initial inventory securely seeded via Admin SDK from C:\\Users\\admin\\firebase-credentials\\japan-auction-arena-seed.json',
  }, { merge: true });

  console.log('\n🚀 Committing atomic batch to Cloud Firestore...');
  await batch.commit();

  console.log('\n✨ SUCCESS! Initial inventory seeded into Cloud Firestore:');
  console.log('   ✅ 10 Public Destinations (places)');
  console.log('   ✅ 10 Secret Valuations (secretValuations)');
  console.log('   ✅ 6 Private Team Balance Records (teams)');
  console.log('   ✅ 6 Public Directory Records (publicTeams)');
  console.log('   ✅ 1 Live Auction State Document (auctionState/active)');
  console.log('   ✅ 1 Initialization Log (auditLogs/log-init)');
  console.log('\nYour Japan Auction Arena Firestore database is ready!\n');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Admin seeding failed with error:', error);
  process.exit(1);
}
