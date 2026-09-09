import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  limit,
  Firestore
} from 'firebase/firestore';

let clientFirestoreDb: Firestore | null = null;

export function getClientFirestore(): Firestore | null {
  if (clientFirestoreDb) return clientFirestoreDb;

  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) {
      return null;
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const app = getApps().length === 0 ? initializeApp(config) : getApp();
    clientFirestoreDb = getFirestore(app, config.firestoreDatabaseId);
    return clientFirestoreDb;
  } catch (err) {
    console.warn('[ClientFirestore] Initialization note:', err);
    return null;
  }
}

/**
 * Persist an order to Firestore
 */
export async function persistOrder(order: any): Promise<boolean> {
  const db = getClientFirestore();
  if (!db || !order?.orderId) return false;

  try {
    await setDoc(doc(db, 'orders', String(order.orderId)), order);
    return true;
  } catch (err) {
    console.warn('[ClientFirestore] Failed to persist order:', err);
    return false;
  }
}

/**
 * Retrieve an order by Order ID
 */
export async function fetchOrderById(orderId: string): Promise<any | null> {
  const db = getClientFirestore();
  if (!db || !orderId) return null;

  try {
    const cleanId = String(orderId).trim();
    const docRef = doc(db, 'orders', cleanId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }

    // Secondary search by orderId property
    const q = query(collection(db, 'orders'), where('orderId', '==', cleanId), limit(1));
    const querySnap = await getDocs(q);
    if (!querySnap.empty) {
      return querySnap.docs[0].data();
    }
  } catch (err) {
    console.warn('[ClientFirestore] Fetch order error:', err);
  }
  return null;
}

/**
 * Fetch orders for a customer by mobile number or customer ID
 */
export async function fetchOrdersByCustomer(mobile: string, customerId?: string): Promise<any[]> {
  const db = getClientFirestore();
  if (!db) return [];

  const results: any[] = [];
  try {
    const cleanMobile = (mobile || '').replace(/\D/g, '') || mobile;
    if (cleanMobile) {
      const qMobile = query(collection(db, 'orders'), where('mobileNumber', '==', cleanMobile));
      const snap = await getDocs(qMobile);
      snap.forEach((d) => results.push(d.data()));
    }

    if (customerId && customerId !== cleanMobile) {
      const qCust = query(collection(db, 'orders'), where('customerId', '==', customerId));
      const snapCust = await getDocs(qCust);
      snapCust.forEach((d) => {
        const data = d.data();
        if (!results.some((r) => r.orderId === data.orderId)) {
          results.push(data);
        }
      });
    }
  } catch (err) {
    console.warn('[ClientFirestore] Customer orders query note:', err);
  }

  // Sort descending by creation date
  results.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  return results;
}

/**
 * Fetch all orders for staff / admin dashboard
 */
export async function fetchAllOrders(): Promise<any[]> {
  const db = getClientFirestore();
  if (!db) return [];

  const results: any[] = [];
  try {
    const snap = await getDocs(collection(db, 'orders'));
    snap.forEach((d) => results.push(d.data()));
  } catch (err) {
    console.warn('[ClientFirestore] Fetch all orders note:', err);
  }

  results.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  return results;
}

/**
 * Update status of an order
 */
export async function updateFirestoreOrderStatus(
  orderId: string,
  status: string,
  statusNotes?: string
): Promise<any | null> {
  const db = getClientFirestore();
  if (!db || !orderId) return null;

  try {
    const cleanId = String(orderId).trim();
    const docRef = doc(db, 'orders', cleanId);
    const existing = await getDoc(docRef);

    const now = new Date().toISOString();
    const patchData: Record<string, any> = {
      status,
      updatedAt: now
    };
    if (statusNotes) {
      patchData.statusNotes = statusNotes;
    }

    if (existing.exists()) {
      await updateDoc(docRef, patchData);
      return { ...existing.data(), ...patchData };
    }
  } catch (err) {
    console.warn('[ClientFirestore] Order status update note:', err);
  }
  return null;
}

/**
 * Save customer token
 */
export async function saveCustomerNotificationToken(
  customerId: string,
  token: string,
  mobileNumber?: string
): Promise<void> {
  const db = getClientFirestore();
  if (!db || !customerId || !token) return;

  try {
    const cleanId = String(customerId).trim();
    const docRef = doc(db, 'customers', cleanId);
    const snap = await getDoc(docRef);

    const now = new Date().toISOString();
    if (snap.exists()) {
      const data = snap.data() || {};
      const tokens: string[] = Array.isArray(data.notificationTokens) ? data.notificationTokens : [];
      if (!tokens.includes(token)) {
        tokens.push(token);
        await updateDoc(docRef, {
          notificationTokens: tokens,
          updatedAt: now,
          ...(mobileNumber ? { mobileNumber } : {})
        });
      }
    } else {
      await setDoc(docRef, {
        customerId: cleanId,
        mobileNumber: mobileNumber || '',
        notificationTokens: [token],
        createdAt: now,
        updatedAt: now
      });
    }
  } catch (err) {
    console.warn('[ClientFirestore] Save customer token note:', err);
  }
}

/**
 * Fetch tokens for a customer or order
 */
export async function fetchRecipientTokens(customerId?: string, orderId?: string): Promise<string[]> {
  const db = getClientFirestore();
  if (!db) return [];

  const tokens = new Set<string>();

  try {
    if (customerId) {
      const snap = await getDoc(doc(db, 'customers', String(customerId).trim()));
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data?.notificationTokens)) {
          data.notificationTokens.forEach((t: string) => tokens.add(t));
        }
      }
    }

    if (orderId) {
      const snap = await getDoc(doc(db, 'orders', String(orderId).trim()));
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data?.deviceTokens)) {
          data.deviceTokens.forEach((t: string) => tokens.add(t));
        }
      }
    }
  } catch (err) {
    console.warn('[ClientFirestore] Fetch recipient tokens note:', err);
  }

  return Array.from(tokens);
}

/**
 * Persist notification log
 */
export async function persistNotificationLog(logEntry: any): Promise<void> {
  const db = getClientFirestore();
  if (!db || !logEntry) return;

  try {
    const logId = logEntry.notificationId || `notif_${Date.now()}`;
    await setDoc(doc(db, 'notificationLogs', logId), logEntry);
  } catch (err) {
    console.warn('[ClientFirestore] Persist notification log note:', err);
  }
}

/**
 * Fetch recent notification logs
 */
export async function fetchRecentNotificationLogs(limitCount = 50): Promise<any[]> {
  const db = getClientFirestore();
  if (!db) return [];

  const logs: any[] = [];
  try {
    const snap = await getDocs(collection(db, 'notificationLogs'));
    snap.forEach((d) => logs.push(d.data()));
  } catch (err) {
    console.warn('[ClientFirestore] Fetch notification logs note:', err);
  }

  logs.sort((a, b) => new Date(b.sentAt || 0).getTime() - new Date(a.sentAt || 0).getTime());
  return logs.slice(0, limitCount);
}
