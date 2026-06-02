import { getPaidPlan } from './plans.js';

function requireEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Falta la variable de entorno backend ${name}.`);
  }
  return value;
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function getPayPalBaseUrl() {
  return process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

export async function getPayPalAccessToken() {
  const clientId = requireEnv('PAYPAL_CLIENT_ID');
  const clientSecret = requireEnv('PAYPAL_CLIENT_SECRET');
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const text = await response.text();
  const payload = safeJsonParse(text);

  if (!response.ok || !payload?.access_token) {
    throw new Error('No se pudo autenticar con PayPal.');
  }

  return payload.access_token;
}

export async function createPayPalOrder({ plan, userId, returnUrl, cancelUrl }) {
  const planConfig = getPaidPlan(plan);
  const accessToken = await getPayPalAccessToken();
  const customId = `${userId}:${planConfig.id}`;
  const invoiceId = `jahlink-${planConfig.id}-${Date.now()}`;

  const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          custom_id: customId,
          invoice_id: invoiceId,
          description: planConfig.paypalProductName,
          amount: {
            currency_code: planConfig.currency,
            value: planConfig.price.toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: 'JAH Link',
        landing_page: 'LOGIN',
        user_action: 'PAY_NOW',
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.id) {
    throw new Error('PayPal no pudo crear la orden de pago.');
  }

  return payload;
}

export async function capturePayPalOrder(orderID) {
  if (!orderID || typeof orderID !== 'string') {
    throw new Error('orderID de PayPal requerido.');
  }

  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders/${encodeURIComponent(orderID)}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload) {
    throw new Error('PayPal no pudo capturar la orden.');
  }

  return payload;
}

export async function verifyPayPalWebhookSignature(headers, webhookEvent) {
  const webhookId = requireEnv('PAYPAL_WEBHOOK_ID');
  const accessToken = await getPayPalAccessToken();

  const verificationPayload = {
    auth_algo: headers.get('paypal-auth-algo'),
    cert_url: headers.get('paypal-cert-url'),
    transmission_id: headers.get('paypal-transmission-id'),
    transmission_sig: headers.get('paypal-transmission-sig'),
    transmission_time: headers.get('paypal-transmission-time'),
    webhook_id: webhookId,
    webhook_event: webhookEvent,
  };

  if (Object.values(verificationPayload).some((value) => !value)) {
    throw new Error('Faltan cabeceras de verificación del webhook PayPal.');
  }

  const response = await fetch(`${getPayPalBaseUrl()}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(verificationPayload),
  });

  const payload = await response.json().catch(() => null);
  return response.ok && payload?.verification_status === 'SUCCESS';
}
