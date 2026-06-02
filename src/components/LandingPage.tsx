import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Link2, QrCode, TrendingUp, Layers, Check, ArrowRight, Menu, X } from 'lucide-react';
import BrandLogo from './BrandLogo';
import { PLAN_DEFINITIONS, type PlanId } from '../lib/plans';
import { useApp } from '../context/AppContext';

const features = [
  { icon: Link2, title: 'Enlaces cortos', desc: 'Acorta URLs con slugs personalizados y seguimiento de clics.' },
  { icon: Layers, title: 'Páginas Bio', desc: 'Una página móvil con todos tus enlaces y redes.' },
  { icon: QrCode, title: 'Códigos QR', desc: 'Genera QR para enlaces o tu página bio al instante.' },
  { icon: TrendingUp, title: 'Analítica', desc: 'Mide clics, visitas y rendimiento en tiempo real.' },
];

const useCases = ['Emprendedores', 'Docentes', 'Creadores', 'Negocios locales', 'Empresas'];

const plans = [
  { ...PLAN_DEFINITIONS.gratis, highlight: false },
  { ...PLAN_DEFINITIONS.pro, highlight: true },
  { ...PLAN_DEFINITIONS.business, highlight: false },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated } = useApp();

  const getPlanHref = (plan: PlanId) => {
    if (plan === 'gratis') return isAuthenticated ? '/dashboard' : '/register?plan=gratis';
    return isAuthenticated ? `/checkout?plan=${plan}` : `/register?plan=${plan}`;
  };

  const getPlanCta = (plan: PlanId) => {
    if (plan === 'gratis') return 'Empezar gratis';
    if (plan === 'pro') return 'Actualizar a Pro';
    return 'Actualizar a Business';
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-blue/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[45%] h-[45%] rounded-full bg-brand-cyan/10 blur-[130px] pointer-events-none" />

      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link to="/">
            <BrandLogo size="md" />
          </Link>

          <nav className="hidden md:flex gap-8 text-sm text-[var(--text-secondary)]">
            <a href="#funciones" className="hover:text-white">Funciones</a>
            <a href="#casos" className="hover:text-white">Casos de uso</a>
            <a href="#planes" className="hover:text-white">Planes</a>
          </nav>

          <div className="hidden md:flex gap-3">
            <Link to="/login" className="text-sm text-[var(--text-secondary)] hover:text-white px-4 py-2">
              Iniciar sesión
            </Link>
            <Link to="/register" className="btn-brand text-sm px-5 py-2.5 rounded-xl">
              Crear cuenta
            </Link>
          </div>

          <button type="button" className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-[var(--border)] p-4 space-y-3 bg-[var(--surface)]">
            <a href="#funciones" className="block text-sm" onClick={() => setMenuOpen(false)}>Funciones</a>
            <a href="#casos" className="block text-sm" onClick={() => setMenuOpen(false)}>Casos de uso</a>
            <a href="#planes" className="block text-sm" onClick={() => setMenuOpen(false)}>Planes</a>
            <Link to="/login" className="block text-sm">Iniciar sesión</Link>
            <Link to="/register" className="btn-brand block text-center py-2 rounded-lg text-sm">Crear cuenta</Link>
          </div>
        )}
      </header>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-24 text-center lg:text-left">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
          <div className="space-y-8">
            <p className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-brand-cyan border border-brand-cyan/30 bg-brand-cyan/10 px-3 py-1 rounded-full font-bold">
              Plataforma JAH Link
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
              Un solo enlace para tus links, QR y analítica
            </h1>
            <p className="text-[var(--text-secondary)] text-lg max-w-xl mx-auto lg:mx-0">
              Crea enlaces cortos, páginas bio y mide cada clic con JAH Link.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/register" className="btn-brand px-8 py-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                Crear mi JAH Link <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#funciones"
                className="px-8 py-4 rounded-xl border border-[var(--border)] text-sm font-semibold hover:bg-white/5 text-center"
              >
                Ver demo
              </a>
            </div>
          </div>
          <div className="hidden lg:flex justify-center mt-12 lg:mt-0">
            <div className="glass-panel-glow-cyan rounded-3xl p-10 w-full max-w-md">
              <BrandLogo size="xl" className="mx-auto" />
              <div className="mt-8 space-y-3 text-left text-sm text-[var(--text-secondary)]">
                <p className="flex items-center gap-2"><Check className="h-4 w-4 text-brand-green" /> jah.link/tu-marca</p>
                <p className="flex items-center gap-2"><Check className="h-4 w-4 text-brand-green" /> Página bio móvil</p>
                <p className="flex items-center gap-2"><Check className="h-4 w-4 text-brand-green" /> QR y analítica integrados</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="funciones" className="max-w-7xl mx-auto px-4 sm:px-6 py-20 border-t border-[var(--border)]">
        <h2 className="text-2xl font-bold text-center mb-12">Funciones principales</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="glass-panel rounded-2xl p-6 space-y-3">
              <f.icon className="h-8 w-8 text-brand-cyan" />
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-[var(--text-secondary)]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="casos" className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-2xl font-bold text-center mb-10">Casos de uso</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {useCases.map((u) => (
            <span key={u} className="px-5 py-2.5 rounded-full border border-brand-blue/30 bg-brand-blue/10 text-sm text-brand-cyan">
              {u}
            </span>
          ))}
        </div>
      </section>

      <section id="planes" className="max-w-7xl mx-auto px-4 sm:px-6 py-20 border-t border-[var(--border)]">
        <h2 className="text-2xl font-bold text-center mb-12">Planes</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`rounded-2xl p-8 border ${
                p.highlight ? 'border-brand-cyan bg-[var(--surface-soft)]' : 'border-[var(--border)] bg-[var(--surface)]'
              }`}
            >
              <h3 className="text-xl font-bold">{p.label}</h3>
              <p className="text-3xl font-bold mt-2 text-brand-cyan">{p.price}<span className="text-sm text-[var(--text-secondary)]">/mes</span></p>
              <ul className="mt-6 space-y-2 text-sm text-[var(--text-secondary)]">
                {p.benefits.map((i) => (
                  <li key={i} className="flex gap-2"><Check className="h-4 w-4 text-brand-green shrink-0" />{i}</li>
                ))}
              </ul>
              <Link
                to={getPlanHref(p.id)}
                className={`mt-8 block text-center py-3 rounded-xl text-sm font-semibold ${
                  p.highlight ? 'btn-brand' : 'border border-[var(--border)] hover:bg-white/5'
                }`}
              >
                {getPlanCta(p.id)}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-[var(--border)] py-10 text-center text-sm text-[var(--text-secondary)]">
        <BrandLogo size="sm" className="mx-auto mb-4" />
        <p>JAH Link by ITSA Security</p>
        <p className="text-xs mt-2">&copy; {new Date().getFullYear()} ITSA Security. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
