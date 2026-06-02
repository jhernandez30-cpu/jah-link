import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, CreditCard, Loader2 } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import PayPalCheckoutButton from '../components/payments/PayPalCheckoutButton';
import { useApp } from '../context/AppContext';
import { getPlanDefinition, normalizePlan } from '../lib/plans';
import { isPaidCheckoutPlan, type PaidPlanId } from '../lib/payments';

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    authLoading,
    isAuthenticated,
    user,
    createPlanPaymentIntent,
    refreshData,
    refreshProfile,
    error,
    successMessage,
  } = useApp();
  const [preparingPayment, setPreparingPayment] = useState(false);
  const [localNotice, setLocalNotice] = useState('');
  const [localError, setLocalError] = useState('');

  const selectedPlan = normalizePlan(searchParams.get('plan'));

  if (!isPaidCheckoutPlan(selectedPlan)) {
    return <Navigate to="/#planes" replace />;
  }

  const plan = selectedPlan as PaidPlanId;
  const planInfo = getPlanDefinition(plan);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    let cancelled = false;
    setPreparingPayment(true);

    createPlanPaymentIntent(plan).finally(() => {
      if (!cancelled) setPreparingPayment(false);
    });

    return () => {
      cancelled = true;
    };
  }, [authLoading, createPlanPaymentIntent, isAuthenticated, plan]);

  const handleApproved = useCallback(async () => {
    setLocalError('');
    setLocalNotice('Pago aprobado. Tu plan ha sido activado.');
    await refreshProfile();
    await refreshData();
    navigate('/dashboard/settings', { replace: true });
  }, [navigate, refreshData, refreshProfile]);

  const handleCancel = useCallback(() => {
    setLocalError('');
    setLocalNotice('Pago cancelado. Tu plan no fue modificado.');
  }, []);

  const handlePaymentError = useCallback((message: string) => {
    setLocalNotice('');
    setLocalError(message || 'No se pudo completar el pago con PayPal.');
  }, []);

  if (authLoading) {
    return (
      <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 px-6">
        <BrandLogo size="md" />
        <p className="text-sm text-[var(--text-secondary)]">Cargando sesión...</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/register?plan=${plan}`} replace />;
  }

  return (
    <main className="min-h-screen bg-black text-white px-4 py-10">
      <section className="max-w-3xl mx-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border)] pb-5">
          <BrandLogo size="lg" />
          <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-brand-cyan bg-brand-cyan/10 border border-brand-cyan/20 px-3 py-1 rounded-full font-bold w-fit">
            <CreditCard className="h-3.5 w-3.5" />
            PayPal seguro
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Completa tu pago</h1>
          <p className="text-[var(--text-secondary)]">
            Serás redirigido a PayPal para completar el pago de forma segura.
          </p>
          <p className="text-sm text-amber-300">
            Tu plan se activará automáticamente solo después de que PayPal confirme el pago en el backend.
          </p>
        </div>

        <div className="rounded-xl border border-brand-cyan/25 bg-brand-cyan/10 p-5 space-y-3">
          <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">Plan seleccionado</p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <h2 className="text-2xl font-bold">Plan {planInfo.label}</h2>
              <p className="text-sm text-[var(--text-secondary)]">{planInfo.description}</p>
            </div>
            <p className="text-3xl font-bold text-brand-cyan">
              {planInfo.price}<span className="text-sm text-[var(--text-secondary)]">/mes</span>
            </p>
          </div>
        </div>

        <ul className="grid sm:grid-cols-2 gap-3 text-sm text-white/85">
          {planInfo.benefits.map((benefit) => (
            <li key={benefit} className="flex gap-2 rounded-xl bg-black/40 border border-[var(--border)] p-3">
              <CheckCircle2 className="h-4 w-4 text-brand-green shrink-0 mt-0.5" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        {error && (
          <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
            {error}
          </p>
        )}
        {localError && (
          <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
            {localError}
          </p>
        )}
        {successMessage && (
          <p className="text-xs text-brand-green bg-brand-green/10 border border-brand-green/20 p-3 rounded-xl">
            {successMessage}
          </p>
        )}
        {localNotice && (
          <p className="text-xs text-brand-green bg-brand-green/10 border border-brand-green/20 p-3 rounded-xl">
            {localNotice}
          </p>
        )}

        <div className="space-y-3 pt-2">
          {preparingPayment && (
            <p className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <Loader2 className="h-4 w-4 animate-spin text-brand-cyan" />
              Guardando intención de pago pendiente...
            </p>
          )}
          {!preparingPayment && (
            <PayPalCheckoutButton
              plan={plan}
              userId={user?.id}
              onApproved={handleApproved}
              onCancel={handleCancel}
              onError={handlePaymentError}
            />
          )}

          <button
            type="button"
            onClick={() => navigate('/#planes')}
            className="px-6 py-3 rounded-xl border border-[var(--border)] text-sm text-white hover:bg-white/5 flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a planes
          </button>
        </div>

        <p className="text-xs text-[var(--text-secondary)]">
          JAH Link no almacena datos completos de tarjetas. PayPal procesa el pago conforme a sus propias políticas.
          Si PayPal no puede abrirse, verifica que las variables backend estén configuradas en Vercel.
        </p>
      </section>
    </main>
  );
}
