export const PAID_PLAN_IDS = ['pro', 'business'];

export const PLAN_CONFIG = {
  gratis: {
    id: 'gratis',
    label: 'Gratis',
    price: 0,
    currency: 'USD',
    limits: {
      shortLinks: 10,
      bioPages: 1,
      analyticsDays: 7,
      branding: true,
    },
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    price: 12,
    currency: 'USD',
    paypalProductName: 'JAH Link Pro',
    membership: 'Miembro Pro',
    limits: {
      shortLinks: null,
      analyticsDays: 90,
      customDomain: true,
    },
  },
  business: {
    id: 'business',
    label: 'Business',
    price: 49,
    currency: 'USD',
    paypalProductName: 'JAH Link Business',
    membership: 'Miembro Business',
    limits: {
      teams: true,
      api: true,
      whiteLabel: true,
      advancedAnalytics: true,
    },
  },
};

export function isPaidPlanId(plan) {
  return PAID_PLAN_IDS.includes(String(plan || '').toLowerCase());
}

export function getPaidPlan(plan) {
  const normalized = String(plan || '').trim().toLowerCase();
  if (!isPaidPlanId(normalized)) {
    throw new Error('Plan de pago no válido.');
  }
  return PLAN_CONFIG[normalized];
}

export function getMembershipForPlan(plan) {
  return plan === 'business' ? 'Miembro Business' : 'Miembro Pro';
}
