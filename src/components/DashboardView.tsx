import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Link2, Eye, Layers, QrCode, Plus, ArrowUpRight } from 'lucide-react';
import type { ShortLink } from '../types';

interface DashboardViewProps {
  links: ShortLink[];
  bioPagesCount: number;
  qrCount?: number;
  onCreateNewLink: () => void;
  onNavigate: (path: string) => void;
}

export default function DashboardView({
  links,
  bioPagesCount,
  qrCount = 0,
  onNavigate,
}: DashboardViewProps) {
  const navigate = useNavigate();
  const totalLinks = links.length;
  const totalClicks = links.reduce((s, l) => s + l.clicks, 0);
  const bioViews = Math.round(totalClicks * 0.35);
  const qrCreated = qrCount || links.filter((l) => l.qrCodeGenerated).length;

  const formatNumber = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toLocaleString('es-ES');
  };

  const chartData = [
    { date: 'Lun', clicks: 120 },
    { date: 'Mar', clicks: 180 },
    { date: 'Mié', clicks: 240 },
    { date: 'Jue', clicks: 190 },
    { date: 'Vie', clicks: 320 },
    { date: 'Sáb', clicks: 280 },
    { date: 'Dom', clicks: 350 },
  ];

  const quickActions = [
    { label: 'Crear enlace', path: '/dashboard/links', icon: Link2 },
    { label: 'Editar página bio', path: '/dashboard/bio', icon: Layers },
    { label: 'Ver analítica', path: '/dashboard/analytics', icon: Eye },
    { label: 'Crear código QR', path: '/dashboard/qr', icon: QrCode },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Panel principal</h1>
          <p className="text-[var(--text-secondary)] text-sm">Resumen de enlaces, clics y actividad reciente.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/dashboard/links')}
          className="btn-brand px-5 py-3 rounded-xl text-sm flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" /> Crear enlace
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total de enlaces', value: totalLinks, icon: Link2, color: 'text-brand-cyan' },
          { label: 'Clics totales', value: totalClicks, icon: Eye, color: 'text-brand-blue' },
          { label: 'Visitas a página bio', value: bioViews, icon: Layers, color: 'text-brand-green' },
          { label: 'Códigos QR creados', value: qrCreated, icon: QrCode, color: 'text-brand-cyan' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <div className="flex justify-between items-start">
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-bold">
                {card.label}
              </span>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <p className="text-3xl font-bold text-white mt-3">{formatNumber(card.value)}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="font-semibold text-white mb-4">Actividad de clics</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="jahGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#006BFF" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#006BFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" stroke="#A8B3CF" fontSize={11} />
                <YAxis stroke="#A8B3CF" fontSize={11} />
                <Tooltip contentStyle={{ background: '#050816', border: '1px solid rgba(255,255,255,0.12)' }} />
                <Area type="monotone" dataKey="clicks" stroke="#00CFFF" fill="url(#jahGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-3">
          <h2 className="font-semibold text-white">Accesos rápidos</h2>
          {quickActions.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => navigate(a.path)}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-[var(--border)] hover:border-brand-cyan/40 text-sm text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <a.icon className="h-4 w-4 text-brand-cyan" />
                {a.label}
              </span>
              <ArrowUpRight className="h-4 w-4 text-[var(--text-secondary)]" />
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="font-semibold text-white mb-4">Enlaces recientes</h2>
        {links.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">Aún no tienes enlaces. Crea el primero desde Enlaces.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[var(--text-secondary)] text-xs uppercase">
                <tr>
                  <th className="pb-3">Enlace corto</th>
                  <th className="pb-3 hidden sm:table-cell">Destino</th>
                  <th className="pb-3">Clics</th>
                  <th className="pb-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {links.slice(0, 5).map((link) => (
                  <tr key={link.id} className="border-t border-[var(--border)]">
                    <td className="py-3 font-mono text-brand-cyan">{link.shortUrl}</td>
                    <td className="py-3 hidden sm:table-cell text-[var(--text-secondary)] truncate max-w-[200px]">
                      {link.destination}
                    </td>
                    <td className="py-3">{link.clicks}</td>
                    <td className="py-3">
                      <span
                        className={
                          link.active === false || link.status === 'Expired'
                            ? 'text-rose-400'
                            : 'text-brand-green'
                        }
                      >
                        {link.active === false ? 'Inactivo' : link.status === 'Expired' ? 'Expirado' : 'Activo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-[var(--text-secondary)]">
        Páginas bio activas: {bioPagesCount} · Vista previa pública: /u/{'username'}
      </p>
    </div>
  );
}
