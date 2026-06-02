import {
  getPlanDefinition,
  normalizePlan,
  type PlanId,
} from './plans';

export type PaidPlanId = Exclude<PlanId, 'gratis'>;

export type PaymentStatus = 'pending' | 'approved' | 'completed' | 'failed' | 'cancelled' | 'refunded';

export type PlanPayment = {
  id?: string;
  userId?: string;
  plan: PaidPlanId;
  pendingPlan: PaidPlanId;
  amount: number;
  currency: 'USD';
  provider: 'paypal';
  paymentProvider: 'paypal';
  status: PaymentStatus;
  paymentStatus: PaymentStatus;
  providerPaymentUrl: string;
  paymentUrl: string;
  providerOrderId?: string | null;
  providerCaptureId?: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type PendingPayment = PlanPayment & {
  status: 'pending';
  paymentStatus: 'pending';
};

export function isPaidCheckoutPlan(plan: unknown): plan is PaidPlanId {
  const normalized = normalizePlan(plan);
  return normalized === 'pro' || normalized === 'business';
}

export function buildPendingPayment(plan: PaidPlanId): PendingPayment {
  const definition = getPlanDefinition(plan);
  if (!definition.paypalPaymentUrl) {
    throw new Error('Este plan no tiene enlace de pago configurado.');
  }

  return {
    plan,
    pendingPlan: plan,
    amount: definition.amount,
    currency: definition.currency,
    provider: 'paypal',
    paymentProvider: 'paypal',
    status: 'pending',
    paymentStatus: 'pending',
    providerPaymentUrl: definition.paypalPaymentUrl,
    paymentUrl: definition.paypalPaymentUrl,
    createdAt: new Date().toISOString(),
  };
}

export function getPayPalPaymentUrl(plan: PaidPlanId): string {
  return buildPendingPayment(plan).providerPaymentUrl;
}

// Futuro flujo admin/backend:
// confirmPaymentManually(paymentId) debe validar evidencia real de pago antes de confirmar.
// activatePlanAfterPayment(userId, plan) debe actualizar profiles.plan y profiles.membership solo tras confirmacion.
// handlePayPalWebhook(payload) debe vivir en backend/Edge Function con secretos de PayPal, nunca en frontend.

export async function confirmPaymentManually(_paymentId: string): Promise<void> {
  throw new Error('Confirmacion manual reservada para un flujo admin/backend.');
}

export async function activatePlanAfterPayment(_userId: string, _plan: PaidPlanId): Promise<void> {
  throw new Error('Activacion de plan reservada para un flujo admin/backend.');
}

export async function handlePayPalWebhook(_payload: unknown): Promise<void> {
  throw new Error('Webhook de PayPal pendiente de implementar en backend seguro.');
}
