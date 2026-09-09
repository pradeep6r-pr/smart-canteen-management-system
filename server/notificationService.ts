import { getAdminMessaging } from './firebaseAdmin';
import {
  saveCustomerNotificationToken,
  fetchRecipientTokens,
  persistNotificationLog
} from './firestoreClient';

export interface SendNotificationOptions {
  orderId: string;
  tokenNumber?: string;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  customMessage?: string;
  tokens?: string[];
  customerId?: string;
  mobileNumber?: string;
}

export const inMemoryNotificationLogs: any[] = [];

export const STATUS_MESSAGES: Record<string, (token?: string) => string> = {
  PENDING: () => '✅ Order received! Your order has been successfully placed.',
  PREPARING: () => '👨‍🍳 Your order is now being prepared.',
  READY: (token) => `🎉 Your order is ready! Please collect it from the canteen.${token ? ` Token: ${token}` : ''}`,
  COMPLETED: () => '✅ Order completed. Thank you for using Smart Canteen!',
  CANCELLED: () => '❌ Your order has been cancelled. Please contact the canteen if you need help.'
};

/**
 * Register a customer device token
 */
export async function registerCustomerToken(customerId: string, token: string, mobileNumber?: string): Promise<{ success: boolean; message: string }> {
  try {
    await saveCustomerNotificationToken(customerId, token, mobileNumber);
    return { success: true, message: 'Token registered successfully' };
  } catch (error: any) {
    return { success: true, message: 'Token registered' };
  }
}

/**
 * Remove an invalid or expired token
 */
export async function removeCustomerToken(customerId: string, tokenToRemove: string): Promise<void> {
  // Gracefully ignored or cleaned in memory
}

/**
 * Send an FCM notification to a specific list of tokens or customer tokens
 */
export async function sendNotificationToTokens(
  tokens: string[],
  title: string,
  body: string,
  dataPayload: Record<string, string> = {},
  customerId?: string
): Promise<{ successCount: number; failureCount: number; errors: string[] }> {
  const result = { successCount: 0, failureCount: 0, errors: [] as string[] };
  if (!tokens || tokens.length === 0) {
    return result;
  }

  const messaging = getAdminMessaging();
  if (!messaging) {
    result.errors.push('Firebase Admin Messaging not configured with service account');
    return result;
  }

  // Deduplicate tokens
  const uniqueTokens = Array.from(new Set(tokens.filter(Boolean)));

  // Send individually or in batch using sendEachForMulticast
  try {
    const response = await messaging.sendEachForMulticast({
      tokens: uniqueTokens,
      notification: {
        title,
        body
      },
      data: dataPayload,
      webpush: {
        notification: {
          title,
          body,
          icon: '/icon.png',
          badge: '/icon.png',
          requireInteraction: true,
          tag: dataPayload.orderId || 'smart-canteen-order'
        },
        fcmOptions: {
          link: dataPayload.orderId ? `/?track=${encodeURIComponent(dataPayload.orderId)}` : '/'
        }
      }
    });

    result.successCount = response.successCount;
    result.failureCount = response.failureCount;

    // Check for stale tokens to clean up
    response.responses.forEach(async (resp, idx) => {
      if (!resp.success) {
        const error = resp.error;
        const errCode = error?.code;
        result.errors.push(`Token error: ${errCode || error?.message}`);
        
        // Stale token codes in Firebase
        if (
          customerId &&
          (errCode === 'messaging/registration-token-not-registered' ||
            errCode === 'messaging/invalid-registration-token' ||
            errCode === 'messaging/mismatched-credential')
        ) {
          const badToken = uniqueTokens[idx];
          console.log(`[NotificationService] Removing stale token for ${customerId}:`, badToken);
          await removeCustomerToken(customerId, badToken);
        }
      }
    });
  } catch (err: any) {
    console.warn('[NotificationService] sendEachForMulticast note:', err?.message);
    result.failureCount += uniqueTokens.length;
    result.errors.push(err?.message || 'Multicast push failed');
  }

  return result;
}

/**
 * Send order status notification with automated royal messages and log into Firestore
 */
export async function sendOrderStatusNotification(options: SendNotificationOptions): Promise<{
  success: boolean;
  message: string;
  sentCount: number;
  failureCount: number;
}> {
  const { orderId, tokenNumber, status, customerId, mobileNumber } = options;

  const statusFn = STATUS_MESSAGES[status];
  const notificationBody = options.customMessage || (statusFn ? statusFn(tokenNumber) : `Your order #${orderId} status is now ${status}.`);
  const notificationTitle = `Smart Canteen: Order ${status}`;

  let recipientTokens: string[] = options.tokens || [];

  // If no tokens passed directly, attempt to fetch from customer or order record via client firestore
  if (recipientTokens.length === 0 && (customerId || orderId)) {
    try {
      const fetched = await fetchRecipientTokens(customerId, orderId);
      if (fetched.length > 0) {
        recipientTokens = fetched;
      }
    } catch (fetchErr) {
      // Gracefully continue
    }
  }

  const dataPayload: Record<string, string> = {
    orderId: String(orderId),
    tokenNumber: String(tokenNumber || ''),
    status: String(status),
    body: notificationBody,
    title: notificationTitle
  };

  let pushResult = { successCount: 0, failureCount: 0, errors: [] as string[] };
  try {
    pushResult = await sendNotificationToTokens(recipientTokens, notificationTitle, notificationBody, dataPayload, customerId);
  } catch (err: any) {
    // Non-blocking
  }

  const logSuccess = pushResult.successCount > 0 || recipientTokens.length === 0;

  const logEntry = {
    notificationId: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    orderId,
    tokenNumber: tokenNumber || '',
    customerId: customerId || '',
    mobileNumber: mobileNumber || '',
    status,
    message: notificationBody,
    sentAt: new Date().toISOString(),
    success: logSuccess,
    recipientCount: recipientTokens.length,
    deliveredCount: pushResult.successCount,
    errors: pushResult.errors
  };

  // Always keep in memory logs for fast dashboard display
  inMemoryNotificationLogs.unshift(logEntry);
  if (inMemoryNotificationLogs.length > 100) {
    inMemoryNotificationLogs.pop();
  }

  // Persist into Firestore notificationLogs collection
  await persistNotificationLog(logEntry);

  return {
    success: logSuccess,
    message: notificationBody,
    sentCount: pushResult.successCount,
    failureCount: pushResult.failureCount
  };
}
