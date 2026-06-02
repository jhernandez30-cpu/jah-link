import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { useApp } from '../context/AppContext';
import { DEMO_MODE_MESSAGE, isDemoMode } from '../lib/storage';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, authLoading, error } = useApp();
  const showDemoBanner = isDemoMode();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string })?.from ?? '/dashboard';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    if (password.length < 6) {
      return;
    }
    setSubmitting(true);
    const ok = await signIn(email.trim(), password);
    setSubmitting(false);
    if (ok) navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="p-4">
        <Link to="/" className="text-[var(--text-secondary)] hover:text-white text-xs font-semibold uppercase tracking-wider">
          ← Volver al inicio
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md glass-panel-glow-cyan rounded-3xl p-8 sm:p-10 space-y-6">
          <div className="flex flex-col items-center gap-2">
            <BrandLogo size="xl" />
            <p className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-widest">Iniciar sesión</p>
            {showDemoBanner && (
              <p className="text-[10px] text-amber-400/90 text-center">
                {DEMO_MODE_MESSAGE}
              </p>
            )}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {error && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">{error}</p>
            )}

            <label className="block text-left text-xs text-[var(--text-secondary)] font-semibold uppercase">
              Correo electrónico
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
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
                  placeholder="••••••••"
                  className="w-full py-3 pl-10 pr-4 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] text-white text-sm focus:border-brand-cyan focus:outline-none"
                />
              </div>
            </label>

            <p className="text-right">
              <a href="#" className="text-xs text-brand-cyan hover:underline">¿Olvidaste tu contraseña?</a>
            </p>

            <button
              type="submit"
              disabled={submitting || authLoading}
              className="w-full btn-brand py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Entrar <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <p className="text-center text-xs text-[var(--text-secondary)]">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-brand-cyan font-semibold hover:underline">
              Crear cuenta
            </Link>
          </p>
        </div>
      </div>

      <footer className="text-center text-[10px] text-[var(--text-secondary)] py-6 uppercase tracking-widest">
        JAH Link by ITSA Security
      </footer>
    </div>
  );
}
