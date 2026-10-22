import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Helper to sanitize env values (strips wrapping quotes and whitespace)
function sanitizeEnv(val) {
  if (!val) return '';
  return String(val).replace(/^["'\s]+|["'\s]+$/g, '').trim();
}

// Environment variable resolution (supports Vite import.meta.env and Node process.env in tests)
const rawEnv = (typeof import.meta !== 'undefined' && import.meta.env)
  ? import.meta.env
  : (typeof process !== 'undefined' && process.env ? process.env : {});

export const EXPECTED_PROJECT_ID = 'japan-auction-arena';

const rawApiKey = sanitizeEnv(rawEnv.VITE_FIREBASE_API_KEY);
const rawAuthDomain = sanitizeEnv(rawEnv.VITE_FIREBASE_AUTH_DOMAIN);
const rawProjectId = sanitizeEnv(rawEnv.VITE_FIREBASE_PROJECT_ID);
const rawBucket = sanitizeEnv(rawEnv.VITE_FIREBASE_STORAGE_BUCKET);
let rawSenderId = sanitizeEnv(rawEnv.VITE_FIREBASE_MESSAGING_SENDER_ID);
let rawAppId = sanitizeEnv(rawEnv.VITE_FIREBASE_APP_ID);

// Self-healing heuristic: If user swapped appId and messagingSenderId or pasted measurementId
if (rawSenderId && rawSenderId.includes(':web:') && (!rawAppId || rawAppId.startsWith('G-'))) {
  const detectedAppId = rawSenderId;
  const projectNumber = detectedAppId.split(':')[1] || '43596286203';
  rawSenderId = projectNumber;
  rawAppId = detectedAppId;
}

export const firebaseConfig = {
  apiKey: rawApiKey,
  authDomain: rawAuthDomain || `${EXPECTED_PROJECT_ID}.firebaseapp.com`,
  projectId: rawProjectId || EXPECTED_PROJECT_ID,
  storageBucket: rawBucket || `${EXPECTED_PROJECT_ID}.firebasestorage.app`,
  messagingSenderId: rawSenderId || '',
  appId: rawAppId || '',
};

/**
 * Checks whether valid Firebase credentials are configured in the environment.
 * If not configured, the application operates in Local Simulation Mode.
 */
export function isFirebaseConfigured() {
  const key = firebaseConfig.apiKey;
  return Boolean(
    key &&
    !key.includes('YOUR_') &&
    key.length > 10 &&
    firebaseConfig.projectId === EXPECTED_PROJECT_ID
  );
}

/**
 * Returns a masked configuration object suitable for UI diagnostics without exposing secrets.
 */
export function getSafeFirebaseConfig() {
  const configured = isFirebaseConfigured();
  return {
    isConfigured: configured,
    expectedProjectId: EXPECTED_PROJECT_ID,
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    storageBucket: firebaseConfig.storageBucket,
    apiKeyMasked: firebaseConfig.apiKey && firebaseConfig.apiKey.length > 10
      ? `${firebaseConfig.apiKey.slice(0, 6)}...${firebaseConfig.apiKey.slice(-4)}`
      : 'Not Configured (Using Local Mode)',
    mode: configured ? 'production_firebase' : 'local_simulation',
  };
}

// Singleton initialization (Initializes Firebase exactly once)
let app = null;
let auth = null;
let db = null;
let functions = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    try {
      functions = getFunctions(app);
    } catch {
      // Functions optional if not deployed
    }
    console.info(`🔥 Firebase initialized for project "${firebaseConfig.projectId}".`);
  } catch (err) {
    console.warn('Firebase initialization error, fallback to Local Arena Engine:', err);
  }
} else {
  console.info('⚡ Japan Auction Arena: Operating in Local Simulation Mode (Firebase credentials not yet provided in .env).');
}

export { app, auth, db, db as firestore, functions };
export default firebaseConfig;
