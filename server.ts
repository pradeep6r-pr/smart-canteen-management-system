import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import {
  registerCustomerToken,
  removeCustomerToken,
  sendOrderStatusNotification,
  sendNotificationToTokens,
  inMemoryNotificationLogs
} from './server/notificationService';
import { getAdminFirestore, getAdminMessaging } from './server/firebaseAdmin';
import {
  persistOrder,
  fetchOrderById,
  fetchOrdersByCustomer,
  fetchAllOrders,
  updateFirestoreOrderStatus,
  fetchRecentNotificationLogs
} from './server/firestoreClient';

const app = express();

// Detect production / Cloud Run deployment environment
const isCloudRun = Boolean(process.env.K_SERVICE);
const isRunningFromDist = typeof __filename !== 'undefined' && __filename.includes('dist');
const isProduction = process.env.NODE_ENV === 'production' || isCloudRun || isRunningFromDist;

// In Cloud Run or explicit production, bind to the PORT injected by the platform (default 8080).
// In AI Studio local dev server, strictly bind to 3000 to match the nginx reverse proxy.
const PORT = isCloudRun || (process.env.NODE_ENV === 'production' && process.env.PORT)
  ? parseInt(process.env.PORT || '8080', 10)
  : 3000;

app.use(express.json());

// In-memory fallback cache for orders and tokens to guarantee 100% functionality even during network/security rule sync
const inMemoryOrders = new Map<string, any>();
const inMemoryTokens = new Map<string, Set<string>>();
const inMemoryLogs: any[] = [];

// Helper: Read Firebase Applet Config
function getFirebaseConfig() {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (e) {
    console.warn('Could not read firebase-applet-config.json:', e);
  }
  return {};
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Smart Canteen Management API',
    timestamp: new Date().toISOString()
  });
});

// Expose public Firebase config to client / service-worker securely (no private server keys)
app.get('/api/firebase-config', (req: Request, res: Response) => {
  const config = getFirebaseConfig();
  res.json({
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId,
    firestoreDatabaseId: config.firestoreDatabaseId,
    vapidKey: process.env.VITE_FIREBASE_VAPID_KEY || process.env.FIREBASE_VAPID_KEY || ''
  });
});

// Customer Token Registration
app.post('/api/notifications/register-token', async (req: Request, res: Response) => {
  const { customerId, token, mobileNumber } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  const effectiveCustomerId = customerId || (mobileNumber ? `cust_${mobileNumber}` : `cust_guest_${Date.now()}`);

  console.log(`[Server FCM] Registering token for customer=${effectiveCustomerId}, mobile=${mobileNumber || 'N/A'}`);

  // Store in memory
  if (!inMemoryTokens.has(effectiveCustomerId)) {
    inMemoryTokens.set(effectiveCustomerId, new Set<string>());
  }
  inMemoryTokens.get(effectiveCustomerId)!.add(token);

  // Store via Firestore
  const result = await registerCustomerToken(effectiveCustomerId, token, mobileNumber);
  console.log(`[Server FCM] Token successfully registered for ${effectiveCustomerId}`);

  res.json({
    success: true,
    message: 'Token registered successfully',
    customerId: effectiveCustomerId,
    tokenPreview: token.substring(0, 16) + '...'
  });
});

// Remove Customer Token
app.post('/api/notifications/remove-token', async (req: Request, res: Response) => {
  const { customerId, token } = req.body;
  if (!customerId || !token) {
    return res.status(400).json({ error: 'customerId and token are required' });
  }

  if (inMemoryTokens.has(customerId)) {
    inMemoryTokens.get(customerId)!.delete(token);
  }

  await removeCustomerToken(customerId, token);
  res.json({ success: true });
});

// Create Order API
app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    const { customerName, mobileNumber, email, items, totalAmount, customerId, deviceToken } = req.body;

    // Validate 10-digit mobile number
    const cleanMobile = String(mobileNumber || '').replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      return res.status(400).json({
        error: 'Invalid mobile number. Please provide a valid 10-digit mobile number.'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty. Please select items to order.' });
    }

    if (!customerName || customerName.trim().length === 0) {
      return res.status(400).json({ error: 'Customer name is required.' });
    }

    // Generate Unique Order ID and Unique Token Number
    const timestamp = Date.now();
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const orderId = `ORD-${timestamp.toString().slice(-6)}-${randomSuffix}`;
    // Daily style Token: e.g. T-104
    const tokenNumber = `T-${Math.floor(100 + Math.random() * 900)}`;

    const effectiveCustomerId = customerId || `cust_${cleanMobile}`;

    const newOrder = {
      id: orderId,
      orderId,
      customerId: effectiveCustomerId,
      customerName: customerName.trim(),
      mobileNumber: cleanMobile,
      email: email ? String(email).trim() : '',
      tokenNumber,
      items,
      totalAmount: Number(totalAmount) || 0,
      status: 'PENDING',
      statusNotes: 'Order received and in queue',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deviceTokens: deviceToken ? [deviceToken] : []
    };

    // Save in memory
    inMemoryOrders.set(orderId, newOrder);

    // Save in Firestore
    await persistOrder(newOrder);

    // Associate token if provided
    if (deviceToken) {
      if (!inMemoryTokens.has(effectiveCustomerId)) {
        inMemoryTokens.set(effectiveCustomerId, new Set<string>());
      }
      inMemoryTokens.get(effectiveCustomerId)!.add(deviceToken);
      await registerCustomerToken(effectiveCustomerId, deviceToken, cleanMobile);
    }

    // Automatically trigger PENDING push notification
    try {
      await sendOrderStatusNotification({
        orderId,
        tokenNumber,
        status: 'PENDING',
        customerId: effectiveCustomerId,
        mobileNumber: cleanMobile,
        tokens: deviceToken ? [deviceToken] : []
      });
    } catch (notifErr) {
      // Handled gracefully
    }

    res.status(201).json({
      success: true,
      order: newOrder
    });
  } catch (err: any) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: err?.message || 'Failed to place order.' });
  }
});

// Get Order by Order ID (Tracking)
app.get('/api/orders/:orderId', async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const cleanId = (orderId || '').trim();

  // Try in-memory first
  if (inMemoryOrders.has(cleanId)) {
    return res.json({ order: inMemoryOrders.get(cleanId) });
  }

  // Try Firestore
  const fsOrder = await fetchOrderById(cleanId);
  if (fsOrder) {
    inMemoryOrders.set(cleanId, fsOrder);
    return res.json({ order: fsOrder });
  }

  res.status(404).json({ error: `Order with ID "${cleanId}" was not found.` });
});

// Get Customer Order History
app.get('/api/orders/customer/:mobileOrCustomerId', async (req: Request, res: Response) => {
  const { mobileOrCustomerId } = req.params;
  const cleanParam = (mobileOrCustomerId || '').replace(/\D/g, '') || mobileOrCustomerId;

  const orders: any[] = [];

  // From memory
  for (const ord of inMemoryOrders.values()) {
    if (ord.mobileNumber === cleanParam || ord.customerId === mobileOrCustomerId) {
      orders.push(ord);
    }
  }

  // From Firestore
  const fsCustomerOrders = await fetchOrdersByCustomer(cleanParam, mobileOrCustomerId);
  for (const fo of fsCustomerOrders) {
    if (!orders.some((o) => o.orderId === fo.orderId)) {
      orders.push(fo);
    }
  }

  // Sort newest first
  orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ orders });
});

// Admin: Get all orders
app.get('/api/admin/orders', async (req: Request, res: Response) => {
  const orders: any[] = [];

  // Memory orders
  for (const ord of inMemoryOrders.values()) {
    orders.push(ord);
  }

  // Firestore orders
  const fsAll = await fetchAllOrders();
  for (const fo of fsAll) {
    const existingIdx = orders.findIndex((o) => o.orderId === fo.orderId);
    if (existingIdx >= 0) {
      orders[existingIdx] = fo;
    } else {
      orders.push(fo);
    }
  }

  orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ orders });
});

// Admin: Update Order Status & Send Automatic FCM Notification
app.patch('/api/admin/orders/:orderId/status', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status, statusNotes } = req.body;

    const validStatuses = ['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status: ${status}` });
    }

    // Retrieve order
    let order: any = inMemoryOrders.get(orderId);
    if (!order) {
      order = await fetchOrderById(orderId);
    }

    if (!order) {
      return res.status(404).json({ error: `Order ${orderId} not found` });
    }

    // Check if status actually changed to prevent duplicate spam notifications
    const previousStatus = order.status;
    const statusChanged = previousStatus !== status;

    order.status = status;
    order.updatedAt = new Date().toISOString();
    if (statusNotes) order.statusNotes = statusNotes;

    // Update in memory
    inMemoryOrders.set(orderId, order);

    // Update in Firestore
    await updateFirestoreOrderStatus(orderId, status, statusNotes);

    // If status actually changed, send push notification
    let notificationResult = null;
    if (statusChanged) {
      // Gather customer tokens
      let customerTokens: string[] = [];
      if (inMemoryTokens.has(order.customerId)) {
        customerTokens = Array.from(inMemoryTokens.get(order.customerId)!);
      }
      if (Array.isArray(order.deviceTokens)) {
        customerTokens.push(...order.deviceTokens);
      }

      notificationResult = await sendOrderStatusNotification({
        orderId: order.orderId,
        tokenNumber: order.tokenNumber,
        status,
        customerId: order.customerId,
        mobileNumber: order.mobileNumber,
        tokens: customerTokens
      });
    }

    res.json({
      success: true,
      order,
      statusChanged,
      notification: notificationResult
    });
  } catch (err: any) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: err?.message || 'Failed to update order status' });
  }
});

// Admin: Send Test Notification
app.post('/api/admin/send-test-notification', async (req: Request, res: Response) => {
  try {
    const { token, title, body } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Target FCM registration token is required' });
    }

    const testTitle = title || '👑 Royal Smart Canteen Test';
    const testBody = body || 'This is a live test push notification from the Admin console.';

    const result = await sendNotificationToTokens([token], testTitle, testBody, {
      type: 'ADMIN_TEST',
      sentAt: new Date().toISOString()
    });

    res.json({
      success: result.successCount > 0,
      delivered: result.successCount,
      failed: result.failureCount,
      errors: result.errors
    });
  } catch (err: any) {
    console.error('Error sending test notification:', err);
    res.status(500).json({ error: err?.message || 'Failed to send test notification' });
  }
});

// Get Notification Logs (Admin)
app.get('/api/admin/notification-logs', async (req: Request, res: Response) => {
  const logs: any[] = [...inMemoryNotificationLogs];

  try {
    const fsLogs = await fetchRecentNotificationLogs(50);
    for (const fl of fsLogs) {
      if (!logs.some((l) => l.notificationId === fl.notificationId)) {
        logs.push(fl);
      }
    }
  } catch (e) {
    // Non-blocking
  }

  logs.sort((a, b) => new Date(b.sentAt || 0).getTime() - new Date(a.sentAt || 0).getTime());
  res.json({ logs });
});

// ----------------------------------------------------
// VITE MIDDLEWARE / PRODUCTION SERVER
// ----------------------------------------------------
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application build not found. Please run npm run build.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Smart Canteen] Server listening on http://0.0.0.0:${PORT} (mode: ${isProduction ? 'production' : 'development'}, Cloud Run: ${isCloudRun})`);
  });
}
app.get('/api/whatsapp/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

app.post('/api/whatsapp/webhook', (req, res) => {
  console.log('[WhatsApp] Webhook event:', JSON.stringify(req.body));
  res.sendStatus(200);
});
startServer();
