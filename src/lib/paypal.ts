export type PayPalPaidPlan = 'pro' | 'business';

const DEFAULT_PAYPAL_CLIENT_ID =
  'BAA9KGxlu0G1DQmVZzfBn38ViW3pzAZ9d4m9qJ0jOLM4ps7NYAkW7wYM2NV2188Q9c_If3TQMxkCCZKMww';

const configuredClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined;
const configuredCurrency = import.meta.env.VITE_PAYPAL_CURRENCY as string | undefined;

export const PAYPAL_CLIENT_ID =
  configuredClientId?.trim() || DEFAULT_PAYPAL_CLIENT_ID;

export const PAYPAL_CURRENCY =
  configuredCurrency?.trim().toUpperCase() || 'USD';

export const PAYPAL_HOSTED_BUTTONS = {
  business: '3DP34KZHDUYFG',
} as const;

export const PAYPAL_PAYMENT_LINKS: Record<PayPalPaidPlan, string> = {
  pro: 'https://www.paypal.com/ncp/payment/KXKYAMRPDNKXG',
  business: 'https://www.paypal.com/ncp/payment/3DP34KZHDUYFG',
};

export const PAYPAL_RETURN_URLS: Record<PayPalPaidPlan, string> = {
  pro: '/payment/success?plan=pro',
  business: '/payment/success?plan=business',
};

export const PAYPAL_SDK_COMPONENTS = 'buttons,hosted-buttons';

export function buildPayPalSdkUrl(
  clientId = PAYPAL_CLIENT_ID,
  currency = PAYPAL_CURRENCY,
): string {
  const params = new URLSearchParams({
    'client-id': clientId,
    components: PAYPAL_SDK_COMPONENTS,
    'disable-funding': 'venmo',
    currency,
  });
  return `https://www.paypal.com/sdk/js?${params.toString()}`;
}

export const PAYPAL_SDK_URL = buildPayPalSdkUrl();
