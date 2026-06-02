import { getMembershipForPlan, isPaidPlanId } from './plans.js';
import { getSupabaseAdmin } from './supabaseAdmin.js';

export async function activateUserPlan({
  userId,
  plan,
  paymentId,
  providerOrderId,
  providerCaptureId,
}) {
  if (!userId) throw new Error('userId requerido para activar plan.');
  if (!isPaidPlanId(plan)) throw new Error('Plan inválido para activación.');

  const supabase = getSupabaseAdmin();
  const membership = getMembershipForPlan(plan);
  const now = new Date().toISOString();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .update({
      plan,
      membership,
      requested_plan: null,
      updated_at: now,
    })
    .eq('id', userId)
    .select('id, plan, membership')
    .single();

  if (profileError || !profile) {
    throw new Error('No se pudo activar el plan en el perfil.');
  }

  let updatedPayment = null;
  if (paymentId || providerOrderId) {
    let query = supabase
      .from('payments')
      .update({
        status: 'completed',
        provider_order_id: providerOrderId,
        provider_capture_id: providerCaptureId,
        updated_at: now,
      });

    query = paymentId
      ? query.eq('id', paymentId)
      : query.eq('provider_order_id', providerOrderId);

    const { data, error } = await query.select('*').maybeSingle();
    if (error) throw new Error('No se pudo marcar el pago como completado.');
    updatedPayment = data;
  }

  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'paypal')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const subscriptionPayload = {
    user_id: userId,
    plan,
    status: 'active',
    provider: 'paypal',
    provider_order_id: providerOrderId,
    provider_capture_id: providerCaptureId,
    current_period_start: now,
    updated_at: now,
  };

  let subscription = null;
  if (existingSubscription?.id) {
    const { data, error } = await supabase
      .from('subscriptions')
      .update(subscriptionPayload)
      .eq('id', existingSubscription.id)
      .select('*')
      .single();
    if (error) throw new Error('No se pudo actualizar la suscripción.');
    subscription = data;
  } else {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert(subscriptionPayload)
      .select('*')
      .single();
    if (error) throw new Error('No se pudo crear la suscripción.');
    subscription = data;
  }

  return {
    success: true,
    userId,
    plan,
    profile,
    payment: updatedPayment,
    subscription,
  };
}
