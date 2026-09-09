// Client-side Firebase App, Auth, Firestore, and Messaging initialization
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firebase Auth & Firestore
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

// In-memory diagnostic logs for UI and debugging
export interface FCMDiagnosticLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  details?: any;
}

const diagnosticLogs: FCMDiagnosticLog[] = [];
const logSubscribers: ((logs: FCMDiagnosticLog[]) => void)[] = [];

export function getFCMLogs(): FCMDiagnosticLog[] {
  return [...diagnosticLogs];
}

export function subscribeFCMLogs(callback: (logs: FCMDiagnosticLog[]) => void): () => void {
  logSubscribers.push(callback);
  callback([...diagnosticLogs]);
  return () => {
    const idx = logSubscribers.indexOf(callback);
    if (idx >= 0) logSubscribers.splice(idx, 1);
  };
}

export function fcmLog(level: 'info' | 'warn' | 'error' | 'success', message: string, details?: any) {
  const time = new Date().toLocaleTimeString();
  const entry: FCMDiagnosticLog = { timestamp: time, level, message, details };
  diagnosticLogs.unshift(entry);
  if (diagnosticLogs.length > 40) diagnosticLogs.pop();

  const prefix = `[FCM ${time}]`;
  if (level === 'error') {
    console.error(prefix, message, details || '');
  } else if (level === 'warn') {
    console.warn(prefix, message, details || '');
  } else {
    console.log(prefix, message, details || '');
  }

  logSubscribers.forEach((cb) => {
    try {
      cb([...diagnosticLogs]);
    } catch (e) {
      // subscriber callback protection
    }
  });
}

// Check if running inside an iframe (cross-origin iframes block Notification.requestPermission in modern browsers)
export function isRunningInIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

// Check if browser environment supports FCM and Notifications
export async function isFCMSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;
  if (!('serviceWorker' in navigator)) return false;

  try {
    const supported = await isSupported();
    return supported;
  } catch (e) {
    fcmLog('warn', 'FCM isSupported() returned false or threw error', e);
    return false;
  }
}

// Retrieve configured VAPID key (from env, localStorage, or server config)
export async function getVapidKey(): Promise<string | undefined> {
  if (typeof window === 'undefined') return undefined;

  // 1. Client build env variable
  const clientEnvKey = (import.meta as any).env?.VITE_FIREBASE_VAPID_KEY;
  if (clientEnvKey && typeof clientEnvKey === 'string' && clientEnvKey.trim().length > 0) {
    return clientEnvKey.trim();
  }

  // 2. Local storage override (for instant testing without rebuild)
  const localKey = localStorage.getItem('smart_canteen_fcm_vapid_key');
  if (localKey && localKey.trim().length > 0) {
    return localKey.trim();
  }

  // 3. Check server-provided config
  try {
    const res = await fetch('/api/firebase-config');
    if (res.ok) {
      const data = await res.json();
      if (data.vapidKey && typeof data.vapidKey === 'string' && data.vapidKey.trim().length > 0) {
        return data.vapidKey.trim();
      }
    }
  } catch (e) {
    // Non-blocking
  }

  return undefined;
}

export type FCMRegistrationResult = {
  state: 'enabled' | 'denied' | 'unsupported' | 'config_missing';
  token?: string | null;
  error?: string;
  isIframe?: boolean;
};

// Request notification permission and retrieve client FCM token
export async function requestNotificationPermissionAndGetToken(
  customVapidKey?: string
): Promise<FCMRegistrationResult> {
  fcmLog('info', 'Starting notification permission & FCM initialization request...');

  if (typeof window === 'undefined') {
    return { state: 'unsupported', error: 'Window environment not defined.' };
  }

  // Check iframe restriction
  if (isRunningInIframe()) {
    fcmLog('warn', 'App is running inside an embedded iframe. Browsers restrict Notification permission requests in cross-origin iframes.');
    // Check if permission was already granted in top window
    if ('Notification' in window && Notification.permission === 'granted') {
      fcmLog('info', 'Notification permission already granted in current context.');
    } else {
      return {
        state: 'unsupported',
        isIframe: true,
        error: 'Browsers block Notification permission prompts inside embedded iframes. Please open this application in a new browser tab to enable push notifications.'
      };
    }
  }

  // Check standard Notification API support
  if (!('Notification' in window)) {
    fcmLog('error', 'Notification API is not available in this browser.');
    return {
      state: 'unsupported',
      error: 'Push notifications are not supported in this browser.'
    };
  }

  // Check Service Worker support
  if (!('serviceWorker' in navigator)) {
    fcmLog('error', 'Service Worker API is not available in this browser.');
    return {
      state: 'unsupported',
      error: 'Service Workers are not supported in this browser. Web push requires HTTPS/localhost and service worker support.'
    };
  }

  // Check current permission state
  fcmLog('info', `Current Notification.permission state: "${Notification.permission}"`);

  if (Notification.permission === 'denied') {
    fcmLog('warn', 'Notification permission was previously denied by user.');
    return {
      state: 'denied',
      error: 'Notification permission is blocked by your browser settings for this site. Please click the tune/padlock icon in your address bar and allow notifications.'
    };
  }

  // Request permission from browser
  try {
    fcmLog('info', 'Requesting browser Notification.requestPermission()...');
    const permission = await Notification.requestPermission();
    fcmLog('info', `Browser permission prompt result: "${permission}"`);

    if (permission !== 'granted') {
      return {
        state: 'denied',
        error: permission === 'denied'
          ? 'Notification permission was denied. You can re-enable it in your browser address bar settings.'
          : 'Notification permission prompt was dismissed.'
      };
    }
  } catch (permErr: any) {
    fcmLog('error', 'Error while calling Notification.requestPermission()', permErr);
    return {
      state: 'denied',
      error: permErr?.message || 'Failed to request notification permission.'
    };
  }

  // Check FCM SDK support
  const supported = await isFCMSupported();
  if (!supported) {
    fcmLog('warn', 'Firebase messaging isSupported() returned false.');
  }

  // Register or get Service Worker
  let registration: ServiceWorkerRegistration;
  try {
    fcmLog('info', 'Registering service worker "/firebase-messaging-sw.js"...');
    registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    });
    fcmLog('info', 'Waiting for service worker to become ready...');
    await navigator.serviceWorker.ready;
    fcmLog('success', 'Service worker registered and active successfully.');
  } catch (swErr: any) {
    fcmLog('error', 'Service worker registration failed', swErr);
    return {
      state: 'unsupported',
      error: `Service worker registration failed: ${swErr?.message || 'HTTPS/localhost required'}`
    };
  }

  // Check for VAPID key
  const vapidKey = customVapidKey || await getVapidKey();
  if (!vapidKey) {
    fcmLog('warn', 'VAPID key is missing from client environment and server config.');
    return {
      state: 'config_missing',
      error: 'Firebase Cloud Messaging Web Push Certificate (VAPID key) is missing. Generate a Key Pair in Firebase Console > Project Settings > Cloud Messaging > Web configuration, then set VITE_FIREBASE_VAPID_KEY.'
    };
  }

  fcmLog('info', `Using VAPID Key: ${vapidKey.substring(0, 10)}... (length ${vapidKey.length})`);

  // Obtain FCM token
  try {
    fcmLog('info', 'Initializing Firebase Messaging and requesting token via getToken()...');
    const messaging = getMessaging(app);

    const token = await getToken(messaging, {
      serviceWorkerRegistration: registration,
      vapidKey
    });

    if (token) {
      fcmLog('success', `FCM Registration Token generated: ${token.substring(0, 18)}...`);
      return {
        state: 'enabled',
        token
      };
    } else {
      fcmLog('warn', 'No registration token returned by getToken().');
      return {
        state: 'config_missing',
        error: 'Unable to retrieve FCM registration token. Please verify your Firebase Cloud Messaging configuration.'
      };
    }
  } catch (tokenErr: any) {
    fcmLog('error', 'Error obtaining FCM token from Firebase:', tokenErr);
    const msg = tokenErr?.message || '';

    if (msg.includes('missing-vapid-key') || msg.includes('VAPID')) {
      return {
        state: 'config_missing',
        error: 'Firebase Messaging: Missing or invalid VAPID Web Push Key.'
      };
    }

    if (msg.includes('token-subscribe-failed') || msg.includes('401') || msg.includes('403')) {
      return {
        state: 'config_missing',
        error: `FCM Token subscription failed (${msg}). Please verify that Cloud Messaging API is enabled in your Google Cloud / Firebase project.`
      };
    }

    return {
      state: 'config_missing',
      error: `Failed to retrieve FCM registration token: ${msg}`
    };
  }
}

// Set up foreground notification listener
export function setupForegroundMessageListener(onNotificationReceived: (payload: any) => void) {
  if (typeof window === 'undefined') return () => {};

  let unsubscribe: (() => void) | null = null;

  isFCMSupported().then((supported) => {
    if (supported) {
      try {
        const messaging = getMessaging(app);
        fcmLog('info', 'Setting up foreground FCM onMessage listener...');

        unsubscribe = onMessage(messaging, (payload) => {
          fcmLog('success', 'Real FCM notification received in foreground!', payload);
          onNotificationReceived(payload);

          // If tab is hidden and permission is granted, display a real system Notification
          if (typeof document !== 'undefined' && document.hidden && Notification.permission === 'granted') {
            try {
              const title = payload.notification?.title || payload.data?.title || 'Smart Canteen';
              new Notification(title, {
                body: payload.notification?.body || payload.data?.body || 'Order update received.',
                icon: '/icon.png',
                badge: '/icon.png',
                tag: payload.data?.orderId || 'canteen-order',
                data: payload.data
              });
            } catch (notifyErr) {
              fcmLog('warn', 'Native notification display error in foreground:', notifyErr);
            }
          }
        });
      } catch (e) {
        fcmLog('warn', 'Foreground message setup skipped:', e);
      }
    }
  });

  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
}
