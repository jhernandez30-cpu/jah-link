import { activateUserPlan } from '../_lib/activatePlan.js';
import { capturePayPalOrder } from '../_lib/paypal.js';
import { isPaidPlanId } from '../_lib/plans.js';
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js';
import { requireAuthenticatedUser } from '../_lib/auth.js';
import { json, methodNotAllowed, optionsResponse, readJsonBody } from '../_lib/http.js';

function firstCapture(order) {
  return order?.purchase_units?.[0]?.payments?.captures?.[0] ?? null;
}

function parseCustomId(customId) {
  if (!customId || typeof customId !== 'string') return null;
  const [userId, plan] = customId.split(':');
  if (!userId || !isPaidPlanId(plan)) return null;
  return { userId, plan };
}

export function OPTIONS() {
  return optionsResponse();
}

export function GET() {
  return methodNotAllowed();
}

export async function POST(request) {
  try {
    const body = await readJsonBody(request);
    const orderID = String(body.orderID || '').trim();

    if (!orderID) {
      return json({ error: 'orderID requerido para capturar el pago.' }, { status: 400 });
    }

    let authUser;
    try {
      authUser = await requireAuthenticatedUser(request);
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : 'Debes iniciar sesión.';
      return json({
        error: message,
      }, { status: message.includes('variable de entorno backend') ? 500 : 401 });
    }
    const supabase = getSupabaseAdmin();
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('provider_order_id', orderID)
      .maybeSingle();

    if (paymentError || !payment) {
      return json({ error: 'No se encontró pago pendiente para esta orden.' }, { status: 404 });
    }

    if (payment.user_id !== authUser.id) {
      return json({ error: 'No puedes capturar pagos de otro usuario.' }, { status: 403 });
    }

    const capturedOrder = await capturePayPalOrder(orderID);
    if (capturedOrder.status !== 'COMPLETED') {
      return json({ error: 'El pago no fue completado por PayPal.' }, { status: 400 });
    }

    const capture = firstCapture(capturedOrder);
    const customData = parseCustomId(
      capture?.custom_id ?? capturedOrder.purchase_units?.[0]?.custom_id,
    );

    const userId = payment.user_id ?? customData?.userId;
    const plan = payment.plan ?? customData?.plan;

    if (!userId || !isPaidPlanId(plan)) {
      return json({ error: 'No se pudo validar usuario y plan del pago.' }, { status: 400 });
    }

    const payerId = capturedOrder.payer?.payer_id ?? null;
    await supabase
      .from('payments')
      .update({
        status: 'completed',
        provider_capture_id: capture?.id ?? null,
        provider_payer_id: payerId,
        raw_response: capturedOrder,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    const activation = await activateUserPlan({
      userId,
      plan,
      paymentId: payment.id,
      providerOrderId: orderID,
      providerCaptureId: capture?.id ?? null,
    });

    return json({
      success: true,
      userId,
      plan,
      captureID: capture?.id ?? null,
      activation,
    });
  } catch (error) {
    return json({
      error: error instanceof Error ? error.message : 'No se pudo capturar el pago PayPal.',
    }, { status: 500 });
  }
}
