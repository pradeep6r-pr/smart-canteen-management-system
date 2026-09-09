// Firebase Cloud Messaging Service Worker for Background Push Notifications
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

self.addEventListener('install', (event) => {
  console.log('[FCM-SW] Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[FCM-SW] Service Worker activated and claiming clients.');
  event.waitUntil(self.clients.claim());
});

// Synchronous Firebase initialization with default project config
const firebaseConfig = {
  apiKey: "AIzaSyD0sytbKiIGZUP1SeSdETYaZU5bdgL_uDc",
  authDomain: "gen-lang-client-0150006932.firebaseapp.com",
  projectId: "gen-lang-client-0150006932",
  storageBucket: "gen-lang-client-0150006932.firebasestorage.app",
  messagingSenderId: "938455844227",
  appId: "1:938455844227:web:bd2acbe2f6c7008565a2b6"
};

let messaging = null;

try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  messaging = firebase.messaging();
  console.log('[FCM-SW] Firebase Messaging initialized successfully.');

  messaging.onBackgroundMessage((payload) => {
    console.log('[FCM-SW] Received onBackgroundMessage:', payload);
    const notificationTitle =
      payload.notification?.title ||
      payload.data?.title ||
      payload.title ||
      'Smart Canteen Notification';

    const notificationOptions = {
      body:
        payload.notification?.body ||
        payload.data?.body ||
        payload.body ||
        'Order status update available.',
      icon: payload.notification?.icon || '/icon.png',
      badge: '/icon.png',
      data: payload.data || payload || {},
      vibrate: [200, 100, 200],
      tag: payload.data?.orderId || 'smart-canteen-order',
      renotify: true,
      requireInteraction: true
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (initErr) {
  console.warn('[FCM-SW] Synchronous init note:', initErr);
}

// Fallback push event listener for raw FCM or Web Push payloads
self.addEventListener('push', (event) => {
  console.log('[FCM-SW] Raw Push event received:', event);
  if (!event.data) return;

  try {
    const payload = event.data.json();
    console.log('[FCM-SW] Parsed push payload JSON:', payload);

    // If Firebase SDK handled it, don't duplicate
    if (payload.fcmMessageId && payload.notification) {
      return;
    }

    const title =
      payload.notification?.title ||
      payload.data?.title ||
      payload.title ||
      'Smart Canteen Update';

    const body =
      payload.notification?.body ||
      payload.data?.body ||
      payload.body ||
      'Your order status has changed.';

    const orderId = payload.data?.orderId || payload.orderId || '';

    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon: '/icon.png',
        badge: '/icon.png',
        data: payload.data || payload,
        tag: orderId || 'smart-canteen-order',
        vibrate: [200, 100, 200],
        renotify: true,
        requireInteraction: true
      })
    );
  } catch (err) {
    console.log('[FCM-SW] Push data as text:', event.data.text());
    event.waitUntil(
      self.registration.showNotification('Smart Canteen Update', {
        body: event.data.text() || 'Order status update available.',
        icon: '/icon.png'
      })
    );
  }
});

// Handle notification click: focus app window or navigate to order tracking
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const orderId = event.notification.data?.orderId;
  const targetUrl = orderId ? `/?track=${encodeURIComponent(orderId)}` : '/';

  console.log('[FCM-SW] Notification clicked, targeting:', targetUrl);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url && 'focus' in client) {
          client.postMessage({ type: 'NAVIGATE_ORDER', orderId });
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
