import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CreditCard,
  Link2,
  Palette,
  Save,
  Settings,
  ShieldCheck,
  Upload,
  User,
} from 'lucide-react';
import BrandLogo from './BrandLogo';
import InitialsAvatar from './InitialsAvatar';
import { useApp } from '../context/AppContext';
import {
  getPlanDefinition,
  getPlanLabel,
  getRemainingShortLinks,
  isPaidPlan,
  PRO_PENDING_MESSAGE,
} from '../lib/plans';

const allowedAvatarTypes = ['image/png', 'image/jpeg', 'image/webp'];

export default function SettingsView() {
  const {
    user,
    links,
    bioConfig,
    saveBioConfig,
    updateUserProfile,
    createPlanPaymentIntent,
    pendingPayment,
    paymentHistory,
    uploadUserAvatar,
    isSupabaseMode,
  } = useApp();
  const navigate = useNavigate();

  const plan = user?.plan ?? 'gratis';
  const planInfo = getPlanDefinition(plan);
  const requestedPlanLabel = user?.requestedPlan ? getPlanLabel(user.requestedPlan) : null;
  const remainingLinks = getRemainingShortLinks(plan, links.length);
  const pendingPlan = pendingPayment?.plan ??
    (user?.requestedPlan === 'pro' || user?.requestedPlan === 'business' ? user.requestedPlan : null);
  const pendingPlanInfo = pendingPlan ? getPlanDefinition(pendingPlan) : null;
  const activePlanMessage = plan === 'business'
    ? 'Plan Business activo'
    : plan === 'pro'
      ? 'Plan Pro activo'
      : null;

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [username, setUsername] = useState(user?.username ?? bioConfig.username ?? '');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp ?? bioConfig.whatsapp ?? '');
  const [country, setCountry] = useState(user?.country ?? '');
  const [category, setCategory] = useState(user?.category ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? bioConfig.avatarUrl ?? '');
  const [primaryColor, setPrimaryColor] = useState(bioConfig.primaryColor || '#006BFF');
  const [localError, setLocalError] = useState('');
  const [localNotice, setLocalNotice] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
    setUsername(user?.username ?? bioConfig.username ?? '');
    setWhatsapp(user?.whatsapp ?? bioConfig.whatsapp ?? '');
    setCountry(user?.country ?? '');
    setCategory(user?.category ?? '');
    setAvatarUrl(user?.avatarUrl ?? bioConfig.avatarUrl ?? '');
    setPrimaryColor(bioConfig.primaryColor || '#006BFF');
  }, [bioConfig, user]);

  const usage = useMemo(() => {
    const linkLimit = planInfo.limits.shortLinks;
    const bioLimit = planInfo.limits.bioPages;
    return [
      {
        label: 'Enlaces cortos',
        value: linkLimit === null ? `${links.length} / ilimitados` : `${links.length} / ${linkLimit}`,
      },
      {
        label: 'Páginas bio',
        value: bioLimit === null ? '1 / ilimitadas' : `1 / ${bioLimit}`,
      },
      {
        label: 'Analitica',
        value: planInfo.limits.analyticsDays === null ? 'Avanzada' : `${planInfo.limits.analyticsDays} días`,
      },
      {
        label: 'QR',
        value: planInfo.limits.basicQrOnly ? 'Básicos' : 'Avanzados',
      },
    ];
  }, [links.length, planInfo]);

  const handleAvatarChange = async (file?: File) => {
    if (!file) return;
    setLocalError('');

    if (!allowedAvatarTypes.includes(file.type)) {
      setLocalError('Formato no válido. Usa PNG, JPG o WEBP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLocalError('La foto debe pesar menos de 2 MB.');
      return;
    }

    const uploaded = await uploadUserAvatar(file);
    if (uploaded) setAvatarUrl(uploaded);
  };

  const handleSave = async () => {
    setLocalError('');
    setSaving(true);
    const cleanUsername = username.trim().toLowerCase();

    const okProfile = await updateUserProfile({
      name: name.trim() || email.split('@')[0] || 'Usuario',
      email: email.trim(),
      username: cleanUsername,
      whatsapp: whatsapp.trim(),
      country: country.trim(),
      category: category.trim(),
      avatarUrl: avatarUrl || null,
    });

    const okBio = await saveBioConfig({
      ...bioConfig,
      displayName: name.trim() || bioConfig.displayName || 'Mi perfil',
      username: cleanUsername || bioConfig.username || 'miperfil',
      whatsapp: whatsapp.trim(),
      email: email.trim(),
      country: country.trim(),
      category: category.trim(),
      avatarUrl: avatarUrl || '',
      primaryColor: planInfo.limits.advancedCustomization ? primaryColor : bioConfig.primaryColor,
    });

    setSaving(false);
    if (!okProfile || !okBio) {
      setLocalError('No se pudieron guardar todos los cambios. Revisa los datos e intenta nuevamente.');
    }
  };

  const requestProPlan = async () => {
    navigate('/checkout?plan=pro');
  };

  const requestBusinessPlan = () => {
    navigate('/checkout?plan=business');
  };

  const completePendingPayment = async () => {
    if (!pendingPlan) return;
    await createPlanPaymentIntent(pendingPlan);
    navigate(`/checkout?plan=${pendingPlan}`);
  };

  const markPaidNotice = () => {
    setLocalNotice('Si ya completaste el pago, PayPal lo verificará automáticamente. Esto puede tomar unos minutos.');
  };

  const paymentStatusLabel = (status: string) => {
    if (status === 'completed') return 'completado';
    if (status === 'approved') return 'aprobado';
    if (status === 'failed') return 'fallido';
    if (status === 'cancelled') return 'cancelado';
    if (status === 'refunded') return 'reembolsado';
    return 'pendiente';
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Configuración del sistema</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Administra tu perfil, plan, apariencia e integraciones de JAH Link.
          </p>
        </div>
        <BrandLogo size="lg" />
      </div>

      {localError && (
        <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
          {localError}
        </p>
      )}
      {localNotice && (
        <p className="text-sm text-brand-green bg-brand-green/10 border border-brand-green/20 p-3 rounded-xl">
          {localNotice}
        </p>
      )}

      <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-6">
        <section className="glass-panel rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
            <User className="h-5 w-5 text-brand-cyan" />
            <div>
              <h2 className="text-white font-semibold">Perfil</h2>
              <p className="text-xs text-[var(--text-secondary)]">Datos visibles en tu cuenta y página bio.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-5 sm:items-center">
            <InitialsAvatar name={name} email={email} imageUrl={avatarUrl} size="xl" />
            <div className="space-y-3">
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-cyan/40 text-brand-cyan text-sm hover:bg-brand-cyan/10 cursor-pointer">
                <Upload className="h-4 w-4" />
                Subir foto
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => void handleAvatarChange(e.target.files?.[0])}
                />
              </label>
              <p className="text-xs text-[var(--text-secondary)]">
                Si no subes foto, JAH Link mostrará un avatar con tus iniciales.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase">
              Nombre
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full px-4 py-3 rounded-xl bg-black border border-[var(--border)] text-white text-sm focus:border-brand-cyan focus:outline-none"
              />
            </label>

            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase">
              Correo
              <input
                type="email"
                value={email}
                disabled={isSupabaseMode}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full px-4 py-3 rounded-xl bg-black border border-[var(--border)] text-white text-sm focus:border-brand-cyan focus:outline-none disabled:opacity-60"
              />
            </label>

            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase">
              Username publico
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                className="mt-2 w-full px-4 py-3 rounded-xl bg-black border border-[var(--border)] text-white text-sm focus:border-brand-cyan focus:outline-none"
              />
            </label>

            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase">
              WhatsApp
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="mt-2 w-full px-4 py-3 rounded-xl bg-black border border-[var(--border)] text-white text-sm focus:border-brand-cyan focus:outline-none"
              />
            </label>

            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase">
              País
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="mt-2 w-full px-4 py-3 rounded-xl bg-black border border-[var(--border)] text-white text-sm focus:border-brand-cyan focus:outline-none"
              />
            </label>

            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase">
              Categoria
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Creador, negocio, educación..."
                className="mt-2 w-full px-4 py-3 rounded-xl bg-black border border-[var(--border)] text-white text-sm focus:border-brand-cyan focus:outline-none"
              />
            </label>
          </div>
        </section>

        <section className="glass-panel rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
            <ShieldCheck className="h-5 w-5 text-brand-green" />
            <div>
              <h2 className="text-white font-semibold">Plan actual</h2>
              <p className="text-xs text-[var(--text-secondary)]">Actualmente estás en el plan {planInfo.label}.</p>
            </div>
          </div>

          <div className="rounded-xl border border-brand-cyan/30 bg-brand-cyan/10 p-4">
            <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">Plan actual</p>
            <p className="text-2xl font-bold text-white mt-1">Plan {planInfo.label}</p>
            <p className="text-sm text-brand-cyan mt-1">{planInfo.membership}</p>
            {activePlanMessage && (
              <p className="text-xs text-brand-green mt-3">{activePlanMessage}</p>
            )}
            {plan === 'gratis' && (
              <p className="text-sm text-[var(--text-secondary)] mt-3">
                Estas usando el plan gratuito. Actualiza a Pro para desbloquear mas funciones.
              </p>
            )}
            {requestedPlanLabel && (
              <p className="text-xs text-brand-green mt-3">
                Plan solicitado: {requestedPlanLabel}. Se activará solo después del pago o asignación manual.
              </p>
            )}
          </div>

          {pendingPlanInfo && (
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 space-y-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-amber-300 font-bold">Pago pendiente de confirmación</p>
                <p className="text-sm text-white mt-1">Plan solicitado: {pendingPlanInfo.label}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Tu plan se activará después de verificar el pago.
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Si ya completaste el pago, PayPal lo verificará automáticamente. Esto puede tomar unos minutos.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => void completePendingPayment()}
                  className="btn-brand px-4 py-2.5 rounded-xl text-xs"
                >
                  Completar pago
                </button>
                <button
                  type="button"
                  onClick={markPaidNotice}
                  className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-xs text-white hover:bg-white/5"
                >
                  Ya realicé el pago
                </button>
                <a
                  href="mailto:soporte@jah.link"
                  className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-xs text-white hover:bg-white/5 text-center"
                >
                  Contactar soporte
                </a>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            {usage.map((item) => (
              <div key={item.label} className="rounded-xl bg-black/50 border border-[var(--border)] p-3">
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">{item.label}</p>
                <p className="text-sm font-semibold text-white mt-1">{item.value}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-[var(--text-secondary)] mb-2">Beneficios disponibles</p>
            <ul className="space-y-2 text-sm text-white/85">
              {planInfo.benefits.map((benefit) => (
                <li key={benefit} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-green shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {paymentHistory.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase text-[var(--text-secondary)] mb-2">Pagos recientes</p>
              <div className="space-y-2">
                {paymentHistory.slice(0, 4).map((payment) => (
                  <div key={payment.id ?? `${payment.plan}-${payment.createdAt}`} className="rounded-xl bg-black/50 border border-[var(--border)] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">Plan {getPlanLabel(payment.plan)}</p>
                      <span className="text-[10px] uppercase tracking-wider text-brand-cyan">
                        {paymentStatusLabel(payment.status)}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      ${payment.amount}/{payment.currency} · PayPal
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={requestProPlan} className="btn-brand px-5 py-2.5 rounded-xl text-sm">
              Actualizar a Pro
            </button>
            <button type="button" onClick={requestBusinessPlan} className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-sm text-white hover:bg-white/5">
              Actualizar a Business
            </button>
            {isPaidPlan(plan) && (
              <button type="button" className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-sm text-white hover:bg-white/5">
                Administrar plan
              </button>
            )}
          </div>
        </section>
      </div>

      <section className="glass-panel rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
          <Palette className="h-5 w-5 text-brand-cyan" />
          <div>
            <h2 className="text-white font-semibold">Apariencia</h2>
            <p className="text-xs text-[var(--text-secondary)]">Personaliza la identidad visual disponible para tu plan.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase">
            Color principal de Bio Page
            <div className="mt-2 flex gap-2">
              <input
                type="color"
                value={primaryColor}
                disabled={!planInfo.limits.advancedCustomization}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-11 w-14 rounded-lg bg-black border border-[var(--border)] disabled:opacity-50"
              />
              <input
                value={primaryColor}
                disabled={!planInfo.limits.advancedCustomization}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black border border-[var(--border)] text-white text-sm disabled:opacity-50"
              />
            </div>
            {!planInfo.limits.advancedCustomization && (
              <span className="block normal-case text-[11px] text-amber-400 mt-2">{PRO_PENDING_MESSAGE}</span>
            )}
          </label>

          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase">
            Dominio personalizado
            <input
              value="jah.link"
              disabled
              className="mt-2 w-full px-4 py-3 rounded-xl bg-black border border-[var(--border)] text-white text-sm opacity-70"
            />
            {!planInfo.limits.customDomain && (
              <span className="block normal-case text-[11px] text-amber-400 mt-2">{PRO_PENDING_MESSAGE}</span>
            )}
          </label>
        </div>
      </section>

      <section className="glass-panel rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
          <Settings className="h-5 w-5 text-brand-cyan" />
          <div>
            <h2 className="text-white font-semibold">Integraciones y facturación</h2>
            <p className="text-xs text-[var(--text-secondary)]">Preparado para Supabase, Vercel, pagos e integraciones futuras.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <div className="rounded-xl bg-black/50 border border-[var(--border)] p-4">
            <Link2 className="h-5 w-5 text-brand-cyan mb-3" />
            <p className="text-sm font-semibold text-white">Integraciones</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Webhooks, API y analítica externa según plan.</p>
          </div>
          <div className="rounded-xl bg-black/50 border border-[var(--border)] p-4">
            <CreditCard className="h-5 w-5 text-brand-green mb-3" />
            <p className="text-sm font-semibold text-white">Datos de facturación</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Se activarán al conectar pagos.</p>
          </div>
          <div className="rounded-xl bg-black/50 border border-[var(--border)] p-4">
            <ShieldCheck className="h-5 w-5 text-brand-cyan mb-3" />
            <p className="text-sm font-semibold text-white">Supabase</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {isSupabaseMode ? 'Persistencia real activa.' : 'Modo demo local hasta configurar Vercel.'}
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="btn-brand px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 disabled:opacity-60"
        >
          <Save className="h-4 w-4" /> {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-sm text-white hover:bg-white/5 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al panel
        </button>
      </div>
    </div>
  );
}
