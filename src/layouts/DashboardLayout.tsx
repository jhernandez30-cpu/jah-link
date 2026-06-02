import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Link2,
  LayoutDashboard,
  Layers,
  TrendingUp,
  QrCode,
  Settings,
  HelpCircle,
  LogOut,
  Search,
  Bell,
  ChevronDown,
  User,
  Menu,
  X,
} from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import InitialsAvatar from '../components/InitialsAvatar';
import { useApp } from '../context/AppContext';
import { getMembershipLabel, getPlanLabel } from '../lib/plans';

const navItems = [
  { to: '/dashboard', label: 'Panel principal', icon: LayoutDashboard, end: true },
  { to: '/dashboard/links', label: 'Enlaces', icon: Link2 },
  { to: '/dashboard/bio', label: 'Página Bio', icon: Layers },
  { to: '/dashboard/analytics', label: 'Analítica', icon: TrendingUp },
  { to: '/dashboard/qr', label: 'Códigos QR', icon: QrCode },
  { to: '/dashboard/settings', label: 'Configuración', icon: Settings },
];

export default function DashboardLayout() {
  const { user, searchQuery, setSearchQuery, logout, loading, error, successMessage, clearMessages, isSupabaseMode } = useApp();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const planLabel = getPlanLabel(user?.plan ?? 'gratis');
  const membershipLabel = getMembershipLabel(user?.plan ?? 'gratis');
  const displayName = user?.name || user?.email || 'Usuario';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col md:flex-row overflow-x-hidden">
      <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] rounded-full bg-brand-cyan/5 blur-[120px] pointer-events-none z-0" />

      <div className="md:hidden flex items-center justify-between px-4 py-4 bg-[var(--surface)] border-b border-[var(--border)] z-40 w-full shrink-0">
        <BrandLogo variant="full" size="md" />
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-[var(--text-secondary)] hover:text-white p-2 border border-[var(--border)] rounded-lg bg-[var(--surface-soft)]"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <aside
        className={`fixed md:sticky top-0 left-0 h-full w-[260px] bg-[var(--surface)] border-r border-[var(--border)] p-6 flex flex-col justify-between shrink-0 transform transition-transform duration-300 z-40 ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-8">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-5">
            <BrandLogo variant="full" size="lg" />
            <button type="button" className="md:hidden text-slate-500" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `w-full py-3 px-4 rounded-xl text-left text-sm font-semibold flex items-center gap-3 transition-all ${
                      isActive
                        ? 'bg-brand-blue/10 border-l-[3px] border-brand-blue text-brand-cyan'
                        : 'text-[var(--text-secondary)] hover:text-white border-l-[3px] border-transparent'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="space-y-4 border-t border-[var(--border)] pt-5">
          <button
            type="button"
            onClick={() => navigate('/dashboard/settings')}
            className="w-full py-2 px-4 rounded-lg text-[var(--text-secondary)] hover:text-white text-xs font-semibold flex items-center gap-3"
          >
            <HelpCircle className="h-4 w-4" /> Ayuda y soporte
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-3 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-sm font-bold flex items-center justify-center gap-2 border border-rose-500/20"
          >
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col z-10 bg-black">
        <header className="h-20 bg-[var(--surface)]/80 border-b border-[var(--border)] px-6 flex items-center justify-between shrink-0">
          <div className="relative w-full max-w-md hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
            <input
              type="search"
              placeholder="Buscar enlaces, páginas o campañas…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2.5 pl-10 pr-4 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] focus:border-brand-cyan focus:outline-none text-sm text-white placeholder:text-[var(--text-secondary)]"
            />
          </div>

          <div className="flex items-center gap-5 ml-auto">
            <button type="button" className="hidden sm:block p-2 text-[var(--text-secondary)] relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-brand-cyan rounded-full" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5"
              >
                <InitialsAvatar
                  name={user?.name}
                  email={user?.email}
                  imageUrl={user?.avatarUrl}
                  size="sm"
                />
                <div className="hidden sm:block text-left text-xs">
                  <div className="font-bold text-white">{displayName}</div>
                  <div className="text-[var(--text-secondary)]">{membershipLabel}</div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[var(--surface-soft)] border border-[var(--border)] p-2 shadow-2xl z-50">
                  <div className="px-2.5 py-2 border-b border-[var(--border)] mb-1">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">Plan actual</p>
                    <p className="text-xs font-semibold text-brand-cyan">Plan {planLabel}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setProfileOpen(false); navigate('/dashboard/settings'); }}
                    className="w-full text-left p-2.5 text-xs text-slate-300 hover:bg-white/5 rounded-lg flex items-center gap-2"
                  >
                    <User className="h-3.5 w-3.5 text-brand-cyan" /> Perfil
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left p-2.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center gap-2"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto space-y-4">
          {!isSupabaseMode && (
            <p className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2">
              Modo demo activo: los datos se guardan temporalmente en este navegador. En producción se conectará Supabase desde Vercel.
            </p>
          )}
          {error && (
            <div className="flex items-center justify-between text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
              <span>{error}</span>
              <button type="button" onClick={clearMessages} className="text-rose-300 hover:text-white ml-2">×</button>
            </div>
          )}
          {successMessage && (
            <div className="flex items-center justify-between text-xs text-brand-green bg-brand-green/10 border border-brand-green/20 rounded-xl px-4 py-3">
              <span>{successMessage}</span>
              <button type="button" onClick={clearMessages} className="ml-2 hover:text-white">×</button>
            </div>
          )}
          {loading && (
            <p className="text-sm text-[var(--text-secondary)]">Cargando datos…</p>
          )}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
