import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, LifeBuoy } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { useApp } from '../context/AppContext';
import { getPlanDefinition, normalizePlan } from '../lib/plans';
import { isPaidCheckoutPlan } from '../lib/payments';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const { authLoading, isAuthenticated, user, refreshProfile } = useApp();
  const [checking, setChecking] = useState(false);
  const selectedPlan = normalizePlan(searchParams.get('plan'));
  const plan = isPaidCheckoutPlan(selectedPlan) ? selectedPlan : null;
  const planInfo = plan ? getPlanDefinition(plan) : null;
  const activePlan = Boolean(plan && (user?.plan === plan || (plan === 'pro' && user?.plan === 'business')));

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    let cancelled = false;
    setChecking(true);
    refreshProfile().finally(() => {
      if (!cancelled) setChecking(false);
    });
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, refreshProfile]);

  return (
    <main className="min-h-screen bg-black text-white px-4 py-10 flex items-center justify-center">
      <section className="w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 space-y-6 text-center">
        <BrandLogo size="lg" className="mx-auto" />

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-brand-green/30 bg-brand-green/10">
          <CheckCircle2 className="h-7 w-7 text-brand-green" />
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-amber-300 font-bold">
            Pendiente de confirmación
          </p>
          <h1 className="text-3xl font-bold">Pago recibido</h1>
          <p className="text-[var(--text-secondary)]">Gracias por completar tu pago.</p>
        </div>

        <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-4 space-y-2">
          <p className="text-sm text-white">
            Plan solicitado: {planInfo ? planInfo.label : 'No especificado'}
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            {activePlan && planInfo
              ? `Tu plan ${planInfo.label} ya está activo.`
              : 'Tu pago está siendo verificado. Esto puede tomar unos minutos.'}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            Esta ruta no activa planes por sí sola; la activación ocurre solo desde backend seguro.
          </p>
          {checking && (
            <p className="text-xs text-brand-cyan">
              Verificando estado de tu perfil...
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/dashboard" className="btn-brand px-6 py-3 rounded-xl text-sm">
            Ir al panel
          </Link>
          <a
            href="mailto:soporte@jah.link"
            className="px-6 py-3 rounded-xl border border-[var(--border)] text-sm text-white hover:bg-white/5 inline-flex items-center justify-center gap-2"
          >
            <LifeBuoy className="h-4 w-4" />
            Contactar soporte
          </a>
        </div>
      </section>
    </main>
  );
}
