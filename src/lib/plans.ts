import { PAYPAL_PAYMENT_LINKS } from './paypal';

export const PLAN_IDS = ['gratis', 'pro', 'business'] as const;

export type PlanId = (typeof PLAN_IDS)[number];

export type PlanLimits = {
  shortLinks: number | null;
  bioPages: number | null;
  analyticsDays: number | null;
  basicQrOnly: boolean;
  requiresBranding: boolean;
  customDomain: boolean;
  whiteLabel: boolean;
  advancedApi: boolean;
  advancedCustomization: boolean;
};

export type PlanDefinition = {
  id: PlanId;
  label: 'Gratis' | 'Pro' | 'Business';
  membership: 'Miembro Gratis' | 'Miembro Pro' | 'Miembro Business';
  description: string;
  price: string;
  amount: number;
  currency: 'USD';
  paypalProductName?: 'JAH Link Pro' | 'JAH Link Business';
  benefits: string[];
  limits: PlanLimits;
  paypalPaymentUrl: string | null;
  requiresPayment: boolean;
};

export const PAYPAL_PAYMENT_URLS = {
  pro: PAYPAL_PAYMENT_LINKS.pro,
  business: PAYPAL_PAYMENT_LINKS.business,
} as const;

export const FREE_PLAN_LIMIT_MESSAGE =
  'Has alcanzado el límite del plan Gratis. Actualiza a Pro para continuar.';

export const PRO_PENDING_MESSAGE =
  'Esta función estará disponible al activar el plan Pro.';

export const BUSINESS_PENDING_MESSAGE =
  'Función Business preparada para integración.';

export const PLAN_DEFINITIONS: Record<PlanId, PlanDefinition> = {
  gratis: {
    id: 'gratis',
    label: 'Gratis',
    membership: 'Miembro Gratis',
    description: 'Estás usando el plan gratuito.',
    price: '$0',
    amount: 0,
    currency: 'USD',
    benefits: [
      '10 enlaces cortos',
      '1 página bio',
      'QR básicos',
      'Analítica de 7 días',
      'Branding "Creado con JAH Link"',
    ],
    limits: {
      shortLinks: 10,
      bioPages: 1,
      analyticsDays: 7,
      basicQrOnly: true,
      requiresBranding: true,
      customDomain: false,
      whiteLabel: false,
      advancedApi: false,
      advancedCustomization: false,
    },
    paypalPaymentUrl: null,
    requiresPayment: false,
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    membership: 'Miembro Pro',
    description: 'Plan para creadores, negocios y equipos pequeños.',
    price: '$12',
    amount: 12,
    currency: 'USD',
    paypalProductName: 'JAH Link Pro',
    benefits: [
      'Enlaces ilimitados',
      'Dominio personalizado',
      'QR avanzados',
      'Analítica de 90 días',
      'Personalización avanzada',
    ],
    limits: {
      shortLinks: null,
      bioPages: null,
      analyticsDays: 90,
      basicQrOnly: false,
      requiresBranding: false,
      customDomain: true,
      whiteLabel: false,
      advancedApi: false,
      advancedCustomization: true,
    },
    paypalPaymentUrl: PAYPAL_PAYMENT_URLS.pro,
    requiresPayment: true,
  },
  business: {
    id: 'business',
    label: 'Business',
    membership: 'Miembro Business',
    description: 'Plan empresarial para equipos, API y marca blanca.',
    price: '$49',
    amount: 49,
    currency: 'USD',
    paypalProductName: 'JAH Link Business',
    benefits: [
      'Equipos',
      'API',
      'Soporte prioritario',
      'Marca blanca',
      'Analítica avanzada',
    ],
    limits: {
      shortLinks: null,
      bioPages: null,
      analyticsDays: null,
      basicQrOnly: false,
      requiresBranding: false,
      customDomain: true,
      whiteLabel: true,
      advancedApi: true,
      advancedCustomization: true,
    },
    paypalPaymentUrl: PAYPAL_PAYMENT_URLS.business,
    requiresPayment: true,
  },
};

export function isValidPlan(plan: unknown): plan is PlanId {
  return typeof plan === 'string' && PLAN_IDS.includes(plan.toLowerCase() as PlanId);
}

export function normalizePlan(plan: unknown): PlanId {
  if (typeof plan !== 'string') return 'gratis';
  const normalized = plan.trim().toLowerCase();
  if (normalized === 'free' || normalized === 'gratuito') return 'gratis';
  if (normalized === 'premium') return 'pro';
  return isValidPlan(normalized) ? normalized : 'gratis';
}

export function getPlanDefinition(plan: unknown): PlanDefinition {
  return PLAN_DEFINITIONS[normalizePlan(plan)];
}

export function getPlanLabel(plan: unknown): PlanDefinition['label'] {
  return getPlanDefinition(plan).label;
}

export function getMembershipLabel(plan: unknown): PlanDefinition['membership'] {
  return getPlanDefinition(plan).membership;
}

export function canCreateShortLink(plan: unknown, currentCount: number): boolean {
  const limit = getPlanDefinition(plan).limits.shortLinks;
  return limit === null || currentCount < limit;
}

export function getRemainingShortLinks(plan: unknown, currentCount: number): number | null {
  const limit = getPlanDefinition(plan).limits.shortLinks;
  if (limit === null) return null;
  return Math.max(0, limit - currentCount);
}

export function isPaidPlan(plan: unknown): boolean {
  return normalizePlan(plan) !== 'gratis';
}
