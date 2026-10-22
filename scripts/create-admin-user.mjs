import fs from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const serviceAccountPath = 'C:\\Users\\admin\\firebase-credentials\\japan-auction-arena-seed.json';

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Service account key not found at:', serviceAccountPath);
  process.exit(1);
}

const rawContent = fs.readFileSync(serviceAccountPath, 'utf8').replace(/^\uFEFF/, '');
const serviceAccount = JSON.parse(rawContent);

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id,
}, 'admin-auth-creator');

const auth = getAuth(app);

const ADMIN_EMAIL = 'auctioneer@japan-auction.local';
const ADMIN_PASSWORD = 'katana123'; // or admin123 (at least 6 characters)

console.log(`Setting up verified Auctioneer Admin user in Firebase Authentication...`);

try {
  let user;
  try {
    user = await auth.getUserByEmail(ADMIN_EMAIL);
    console.log(`Found existing user: ${user.uid}`);
    await auth.updateUser(user.uid, { password: ADMIN_PASSWORD });
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      user = await auth.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        displayName: 'Grand Auctioneer (主催者)',
      });
      console.log(`Created new Admin user: ${user.uid}`);
    } else {
      throw err;
    }
  }

  // Set Custom Claims to satisfy Firestore Security Rules: isAdmin()
  await auth.setCustomUserClaims(user.uid, {
    role: 'admin',
    admin: true,
  });

  console.log(`✅ Successfully set custom claims { role: 'admin', admin: true } on UID: ${user.uid}`);
  console.log(`Admin email: ${ADMIN_EMAIL}`);
  console.log(`Admin passcode: ${ADMIN_PASSWORD}`);
  process.exit(0);
} catch (error) {
  console.error('❌ Failed to set up admin user:', error);
  process.exit(1);
}
