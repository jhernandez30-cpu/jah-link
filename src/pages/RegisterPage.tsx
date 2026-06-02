import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { useApp } from '../context/AppContext';
import { getPlanLabel, normalizePlan } from '../lib/plans';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp, error, successMessage, isSupabaseMode } = useApp();
  const requestedPlan = normalizePlan(searchParams.get('plan'));
  const requestedPlanLabel = getPlanLabel(requestedPlan);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (!name.trim()) {
      setLocalError('Ingresa tu nombre.');
      return;
    }
    if (password !== confirm) {
      setLocalError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setSubmitting(true);
    const ok = await signUp(email.trim(), password, name.trim(), requestedPlan);
    setSubmitting(false);
    if (ok) navigate('/dashboard', { replace: true });
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="p-4">
        <Link to="/" className="text-[var(--text-secondary)] hover:text-white text-xs font-semibold uppercase tracking-wider">
          ← Volver al inicio
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md glass-panel rounded-3xl p-8 sm:p-10 space-y-6 border border-[var(--border)]">
          <div className="flex flex-col items-center gap-2">
            <BrandLogo size="xl" />
            <p className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-widest">Crear cuenta</p>
            {!isSupabaseMode && (
              <p className="text-[10px] text-amber-400/90 text-center">
                Modo demo activo: los datos se guardan temporalmente en este navegador.
              </p>
            )}
            {requestedPlan !== 'gratis' && (
              <p className="text-[10px] text-brand-cyan/90 text-center">
                Plan solicitado: {requestedPlanLabel}. Tu cuenta iniciará en Plan Gratis hasta completar el pago.
              </p>
            )}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {displayError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">{displayError}</p>
            )}
            {successMessage && (
              <p className="text-xs text-brand-green bg-brand-green/10 border border-brand-green/20 p-3 rounded-xl">
                {successMessage}
              </p>
            )}

            <label className="block text-left text-xs text-[var(--text-secondary)] font-semibold uppercase">
              Nombre
              <div className="relative mt-2">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full py-3 pl-10 pr-4 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] text-white text-sm focus:border-brand-cyan focus:outline-none"
                />
              </div>
            </label>

            <label className="block text-left text-xs text-[var(--text-secondary)] font-semibold uppercase">
              Correo electrónico
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full py-3 pl-10 pr-4 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] text-white text-sm focus:border-brand-cyan focus:outline-none"
                />
              </div>
            </label>

            <label className="block text-left text-xs text-[var(--text-secondary)] font-semibold uppercase">
              Contraseña
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full py-3 pl-10 pr-4 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] text-white text-sm focus:border-brand-cyan focus:outline-none"
                />
              </div>
            </label>

            <label className="block text-left text-xs text-[var(--text-secondary)] font-semibold uppercase">
              Confirmar contraseña
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full py-3 pl-10 pr-4 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] text-white text-sm focus:border-brand-cyan focus:outline-none"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-brand py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Registrarme <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <p className="text-center text-xs text-[var(--text-secondary)]">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-brand-cyan font-semibold hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
