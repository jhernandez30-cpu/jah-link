import { activateUserPlan } from '../_lib/activatePlan.js';
import { verifyPayPalWebhookSignature } from '../_lib/paypal.js';
import { isPaidPlanId } from '../_lib/plans.js';
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js';
import { json, methodNotAllowed, optionsResponse } from '../_lib/http.js';

function relatedOrderId(resource) {
  return resource?.supplementary_data?.related_ids?.order_id
    ?? resource?.order_id
    ?? resource?.parent_payment
    ?? null;
}

function parseCustomId(customId) {
  if (!customId || typeof customId !== 'string') return null;
  const [userId, plan] = customId.split(':');
  if (!userId || !isPaidPlanId(plan)) return null;
  return { userId, plan };
}

async function markPaymentStatus({ supabase, orderId, status, eventId, resource }) {
  if (!orderId) return null;
  const { data: current } = await supabase
    .from('payments')
    .select('*')
    .eq('provider_order_id', orderId)
    .maybeSingle();

  if (
    current?.status === 'completed' &&
    (status === 'approved' || status === 'failed' || status === 'pending')
  ) {
    return current;
  }

  const { data, error } = await supabase
    .from('payments')
    .update({
      status,
      provider_webhook_event_id: eventId,
      raw_response: resource,
      updated_at: new Date().toISOString(),
    })
    .eq('provider_order_id', orderId)
    .select('*')
    .maybeSingle();

  if (error) throw new Error('No se pudo actualizar el estado del pago.');
  return data;
}

export function OPTIONS() {
  return optionsResponse();
}

export function GET() {
  return methodNotAllowed();
}

export async function POST(request) {
  let event;
  try {
    event = await request.json();
  } catch {
    return json({ error: 'Webhook JSON inválido.' }, { status: 400 });
  }

  try {
    const verified = await verifyPayPalWebhookSignature(request.headers, event);
    if (!verified) {
      return json({ error: 'Firma de webhook PayPal inválida.' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const eventId = event.id;
    const eventType = event.event_type;
    const resource = event.resource ?? {};

    if (eventId) {
      const { data: processed } = await supabase
        .from('payments')
        .select('id, status')
        .eq('provider_webhook_event_id', eventId)
        .maybeSingle();

      if (processed) return json({ received: true, duplicate: true });
    }

    if (eventType === 'CHECKOUT.ORDER.APPROVED') {
      const orderId = resource.id;
      await markPaymentStatus({
        supabase,
        orderId,
        status: 'approved',
        eventId,
        resource,
      });
      return json({ received: true, status: 'approved' });
    }

    if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      const orderId = relatedOrderId(resource);
      const captureId = resource.id ?? null;
      const payment = await markPaymentStatus({
        supabase,
        orderId,
        status: 'completed',
        eventId,
        resource,
      });

      if (!payment) return json({ received: true, skipped: 'payment_not_found' });
      if (payment.status === 'completed' && payment.provider_capture_id === captureId) {
        return json({ received: true, duplicate: true });
      }

      const customData = parseCustomId(resource.custom_id);
      const userId = payment.user_id ?? customData?.userId;
      const plan = payment.plan ?? customData?.plan;

      if (!userId || !isPaidPlanId(plan)) {
        return json({ received: true, skipped: 'invalid_payment_context' });
      }

      await supabase
        .from('payments')
        .update({
          provider_capture_id: captureId,
          provider_payer_id: resource.payer?.payer_id ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id);

      await activateUserPlan({
        userId,
        plan,
        paymentId: payment.id,
        providerOrderId: orderId,
        providerCaptureId: captureId,
      });

      return json({ received: true, activated: true, plan });
    }

    if (eventType === 'PAYMENT.CAPTURE.DENIED') {
      await markPaymentStatus({
        supabase,
        orderId: relatedOrderId(resource),
        status: 'failed',
        eventId,
        resource,
      });
      return json({ received: true, status: 'failed' });
    }

    if (eventType === 'PAYMENT.CAPTURE.REFUNDED' || eventType === 'PAYMENT.CAPTURE.REVERSED') {
      await markPaymentStatus({
        supabase,
        orderId: relatedOrderId(resource),
        status: eventType === 'PAYMENT.CAPTURE.REFUNDED' ? 'refunded' : 'cancelled',
        eventId,
        resource,
      });
      return json({ received: true, status: 'review_required' });
    }

    return json({ received: true, ignored: eventType });
  } catch (error) {
    return json({
      error: error instanceof Error ? error.message : 'No se pudo procesar webhook PayPal.',
    }, { status: 500 });
  }
}
