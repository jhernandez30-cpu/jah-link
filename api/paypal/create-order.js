import { getPaidPlan } from '../_lib/plans.js';
import { createPayPalOrder } from '../_lib/paypal.js';
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js';
import { requireAuthenticatedUser } from '../_lib/auth.js';
import { json, methodNotAllowed, optionsResponse, readJsonBody } from '../_lib/http.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function OPTIONS() {
  return optionsResponse();
}

export function GET() {
  return methodNotAllowed();
}

export async function POST(request) {
  try {
    const body = await readJsonBody(request);
    const plan = getPaidPlan(body.plan);
    const userId = String(body.userId || '').trim();

    if (!UUID_RE.test(userId)) {
      return json({ error: 'Usuario inválido para crear orden PayPal.' }, { status: 400 });
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
    if (authUser.id !== userId) {
      return json({ error: 'No puedes crear pagos para otro usuario.' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, plan')
      .eq('id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      return json({ error: 'Usuario no encontrado en Supabase.' }, { status: 404 });
    }

    const { data: existingPayment } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .eq('plan', plan.id)
      .eq('provider', 'paypal')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingPayment?.provider_order_id) {
      const approvalLink = existingPayment.raw_response?.links?.find?.((link) => link.rel === 'approve')?.href ?? null;
      return json({
        orderID: existingPayment.provider_order_id,
        approvalLink,
        reused: true,
      });
    }

    const url = new URL(request.url);
    const origin = url.origin;
    const paypalOrder = await createPayPalOrder({
      plan: plan.id,
      userId,
      returnUrl: `${origin}/payment/success?plan=${plan.id}`,
      cancelUrl: `${origin}/checkout?plan=${plan.id}`,
    });

    const paymentPayload = {
      user_id: userId,
      plan: plan.id,
      amount: plan.price,
      currency: plan.currency,
      provider: 'paypal',
      provider_order_id: paypalOrder.id,
      status: 'pending',
      raw_response: paypalOrder,
    };

    if (existingPayment?.id) {
      const { error } = await supabase
        .from('payments')
        .update({
          ...paymentPayload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPayment.id);
      if (error) throw new Error('No se pudo actualizar el pago pendiente.');
    } else {
      const { error } = await supabase
        .from('payments')
        .insert(paymentPayload);
      if (error) throw new Error('No se pudo guardar el pago pendiente.');
    }

    await supabase
      .from('profiles')
      .update({ requested_plan: plan.id, updated_at: new Date().toISOString() })
      .eq('id', userId);

    return json({
      orderID: paypalOrder.id,
      approvalLink: paypalOrder.links?.find((link) => link.rel === 'approve')?.href ?? null,
      reused: false,
    });
  } catch (error) {
    return json({
      error: error instanceof Error ? error.message : 'No se pudo crear la orden PayPal.',
    }, { status: 500 });
  }
}
