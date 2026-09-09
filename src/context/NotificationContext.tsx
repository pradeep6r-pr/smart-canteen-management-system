import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  requestNotificationPermissionAndGetToken,
  setupForegroundMessageListener,
  isFCMSupported,
  isRunningInIframe,
  subscribeFCMLogs,
  fcmLog,
  getVapidKey,
  FCMDiagnosticLog
} from '../lib/firebase';

export type FCMState = 'idle' | 'loading' | 'enabled' | 'denied' | 'unsupported' | 'config_missing';

interface NotificationContextType {
  fcmToken: string | null;
  permissionStatus: NotificationPermission | 'unsupported';
  fcmState: FCMState;
  isSupported: boolean;
  isLoading: boolean;
  isIframe: boolean;
  isModalOpen: boolean;
  error: string | null;
  recentNotification: any | null;
  diagnosticLogs: FCMDiagnosticLog[];
  requestPermission: (mobileNumber?: string, customerId?: string, customVapidKey?: string) => Promise<string | null>;
  sendTestNotification: () => Promise<{ success: boolean; message: string }>;
  recheckPermission: () => Promise<void>;
  saveVapidKey: (key: string) => Promise<void>;
  openModal: () => void;
  closeModal: () => void;
  dismissNotification: () => void;
  clearToken: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default');
  const [fcmState, setFcmState] = useState<FCMState>('idle');
  const [isSupportedState, setIsSupportedState] = useState(false);
  const [isIframe, setIsIframe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentNotification, setRecentNotification] = useState<any | null>(null);
  const [diagnosticLogs, setDiagnosticLogs] = useState<FCMDiagnosticLog[]>([]);

  // Subscribe to diagnostic logs
  useEffect(() => {
    const unsub = subscribeFCMLogs((logs) => {
      setDiagnosticLogs(logs);
    });
    return unsub;
  }, []);

  // Initial environment assessment
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const inIframe = isRunningInIframe();
    setIsIframe(inIframe);

    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setPermissionStatus('unsupported');
      setIsSupportedState(false);
      setFcmState('unsupported');
      setError('Push notifications are not supported by this browser.');
      return;
    }

    const currentPerm = Notification.permission;
    setPermissionStatus(currentPerm);

    isFCMSupported().then((supported) => {
      setIsSupportedState(supported);
    });

    const savedToken = localStorage.getItem('smart_canteen_fcm_token');
    if (savedToken) {
      setFcmToken(savedToken);
      if (currentPerm === 'granted') {
        setFcmState('enabled');
        fcmLog('info', 'Loaded existing FCM token from storage:', savedToken.substring(0, 16) + '...');
      }
    } else if (currentPerm === 'denied') {
      setFcmState('denied');
      setError('Notification permission is blocked in your browser settings.');
    } else if (inIframe && currentPerm !== 'granted') {
      setFcmState('unsupported');
      setError('Running in embedded frame. Browser blocks notification prompts inside iframes.');
    }

    // Check VAPID availability
    getVapidKey().then((key) => {
      if (key) {
        fcmLog('info', 'Active Web Push VAPID key detected.');
      } else {
        fcmLog('warn', 'No Web Push VAPID key found in configuration.');
      }
    });

    // Foreground notification listener
    const cleanup = setupForegroundMessageListener((payload) => {
      fcmLog('info', 'Received foreground message:', payload);
      setRecentNotification({
        title: payload.notification?.title || payload.data?.title || 'Smart Canteen',
        body: payload.notification?.body || payload.data?.body || 'Order status update',
        orderId: payload.data?.orderId,
        tokenNumber: payload.data?.tokenNumber,
        status: payload.data?.status,
        receivedAt: new Date().toLocaleTimeString()
      });
    });

    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, []);

  const requestPermission = async (
    mobileNumber?: string,
    customerId?: string,
    customVapidKey?: string
  ): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    fcmLog('info', 'Initiating requestPermission workflow...');

    try {
      const result = await requestNotificationPermissionAndGetToken(customVapidKey);

      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermissionStatus(Notification.permission);
      }

      setFcmState(result.state);

      if (result.state !== 'enabled') {
        const errorMsg = result.error || 'Failed to complete notification activation.';
        setError(errorMsg);
        setIsLoading(false);
        // Automatically open the modal so user sees the guidance
        setIsModalOpen(true);
        return null;
      }

      if (result.token) {
        setFcmToken(result.token);
        localStorage.setItem('smart_canteen_fcm_token', result.token);

        // Sync token with server for this customer
        const effectiveCustomerId =
          customerId ||
          localStorage.getItem('smart_canteen_customer_id') ||
          (mobileNumber ? `cust_${mobileNumber}` : `cust_${Date.now()}`);

        try {
          fcmLog('info', `Syncing token with backend for customer ${effectiveCustomerId}...`);
          const res = await fetch('/api/notifications/register-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: result.token,
              customerId: effectiveCustomerId,
              mobileNumber: mobileNumber || localStorage.getItem('smart_canteen_customer_mobile') || undefined
            })
          });

          if (res.ok) {
            fcmLog('success', 'Token successfully synchronized with server backend.');
          } else {
            fcmLog('warn', 'Server token registration responded with status ' + res.status);
          }
        } catch (syncErr) {
          fcmLog('warn', 'Network note while syncing token with server:', syncErr);
        }

        setIsLoading(false);
        return result.token;
      }
    } catch (err: any) {
      fcmLog('error', 'Unexpected error in requestPermission:', err);
      setError(err?.message || 'Error requesting notification permission');
      setFcmState('config_missing');
      setIsModalOpen(true);
    }

    setIsLoading(false);
    return null;
  };

  const recheckPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const perm = Notification.permission;
    setPermissionStatus(perm);
    fcmLog('info', `Rechecking browser permission: "${perm}"`);

    if (perm === 'granted') {
      await requestPermission();
    } else if (perm === 'denied') {
      setFcmState('denied');
      setError('Permission is still blocked. Please allow notifications in browser address bar settings.');
    } else {
      setFcmState('idle');
      setError(null);
    }
  };

  const saveVapidKey = async (key: string) => {
    const trimmed = key.trim();
    if (!trimmed) return;
    localStorage.setItem('smart_canteen_fcm_vapid_key', trimmed);
    fcmLog('info', 'Saved custom VAPID key to localStorage. Retrying registration...');
    await requestPermission(undefined, undefined, trimmed);
  };

  const sendTestNotification = async (): Promise<{ success: boolean; message: string }> => {
    if (!fcmToken) {
      return { success: false, message: 'No active device FCM token to send to.' };
    }

    try {
      fcmLog('info', 'Triggering test push notification via /api/admin/send-test-notification...');
      const res = await fetch('/api/admin/send-test-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: fcmToken,
          title: '👑 Royal Smart Canteen Test',
          body: 'Success! Web Push notifications are fully connected and active.'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        fcmLog('success', 'Test push notification delivered successfully to FCM!');
        return { success: true, message: 'Test notification dispatched to your device!' };
      } else {
        const errorDetail = data.errors?.[0]?.error || data.error || 'FCM dispatch failed.';
        fcmLog('error', 'Test push delivery failed:', errorDetail);
        return { success: false, message: errorDetail };
      }
    } catch (err: any) {
      fcmLog('error', 'Network error sending test notification:', err);
      return { success: false, message: err?.message || 'Failed to dispatch test notification.' };
    }
  };

  const clearToken = () => {
    localStorage.removeItem('smart_canteen_fcm_token');
    localStorage.removeItem('smart_canteen_fcm_vapid_key');
    setFcmToken(null);
    setFcmState('idle');
    fcmLog('info', 'FCM token cleared from device storage.');
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const dismissNotification = () => setRecentNotification(null);

  return (
    <NotificationContext.Provider
      value={{
        fcmToken,
        permissionStatus,
        fcmState,
        isSupported: isSupportedState,
        isLoading,
        isIframe,
        isModalOpen,
        error,
        recentNotification,
        diagnosticLogs,
        requestPermission,
        sendTestNotification,
        recheckPermission,
        saveVapidKey,
        openModal,
        closeModal,
        dismissNotification,
        clearToken
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
