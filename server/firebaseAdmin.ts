import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getMessaging, Messaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin lazily and securely
let adminInitialized = false;
let firestoreDb: Firestore | null = null;
let messagingService: Messaging | null = null;

function parseServiceAccount(raw: string | undefined): any | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '""' || trimmed === "''" || trimmed.length < 20) return null;
  try {
    const creds = JSON.parse(trimmed);
    if (
      creds &&
      typeof creds === 'object' &&
      typeof creds.client_email === 'string' &&
      typeof creds.private_key === 'string' &&
      creds.client_email.length > 0 &&
      creds.private_key.length > 0
    ) {
      return creds;
    }
  } catch (e) {
    // Silently ignore non-JSON or invalid strings
  }
  return null;
}

export function initFirebaseAdmin() {
  if (adminInitialized) {
    return { firestoreDb, messagingService };
  }

  try {
    // Read the applet Firebase config
    let config: any = {};
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    const projectId = process.env.FIREBASE_PROJECT_ID || config.projectId;
    const databaseId = config.firestoreDatabaseId || process.env.FIREBASE_DATABASE_ID;

    // Check if service account credentials are provided in env
    const serviceAccountJson =
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    const validCreds = parseServiceAccount(serviceAccountJson);

    let appInstance;
    if (validCreds) {
      if (getApps().length === 0) {
        appInstance = initializeApp({
          credential: cert(validCreds),
          projectId: validCreds.project_id || projectId
        });
        console.log('[FirebaseAdmin] Initialized with verified service account JSON');
      } else {
        appInstance = getApps()[0];
      }

      if (databaseId) {
        try {
          firestoreDb = getFirestore(appInstance, databaseId);
        } catch (e) {
          firestoreDb = getFirestore(appInstance);
        }
      } else {
        firestoreDb = getFirestore(appInstance);
      }

      try {
        messagingService = getMessaging(appInstance);
      } catch (msgErr) {
        console.warn('[FirebaseAdmin] Messaging init note:', msgErr);
      }
    } else {
      // Without valid service account credentials, do not initialize unauthenticated firebase-admin
      // as gRPC calls will fail with PERMISSION_DENIED. Client Firestore SDK will handle database operations.
      firestoreDb = null;
      messagingService = null;
    }

    adminInitialized = true;
  } catch (err: any) {
    adminInitialized = true;
  }

  return { firestoreDb, messagingService };
}

export function getAdminFirestore(): Firestore | null {
  initFirebaseAdmin();
  return firestoreDb;
}

export function getAdminMessaging(): Messaging | null {
  initFirebaseAdmin();
  return messagingService;
}
