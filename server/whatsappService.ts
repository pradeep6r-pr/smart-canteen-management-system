export interface WhatsAppMessageOptions {
  mobileNumber: string;
  message: string;
}

export async function sendWhatsAppMessage({
  mobileNumber,
  message,
}: WhatsAppMessageOptions) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.warn('[WhatsApp] API credentials are not configured.');
    return {
      success: false,
      error: 'WhatsApp API credentials are missing.',
    };
  }

  const recipient = mobileNumber.replace(/\D/g, '');

  if (recipient.length !== 10) {
    return {
      success: false,
      error: 'Invalid WhatsApp recipient number.',
    };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: `91${recipient}`,
          type: 'text',
          text: {
            preview_url: false,
            body: message,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('[WhatsApp] API error:', data);

      return {
        success: false,
        error: data?.error?.message || 'WhatsApp API request failed.',
      };
    }

    console.log('[WhatsApp] Message sent successfully.');

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error('[WhatsApp] Request failed:', error);

    return {
      success: false,
      error: error?.message || 'Failed to send WhatsApp message.',
    };
  }
}