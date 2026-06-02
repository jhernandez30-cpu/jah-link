import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Calendar, Smartphone, Monitor } from 'lucide-react';
import type { ShortLink } from '../types';
import type { AnalyticsEvent } from '../lib/storage';
import { useApp } from '../context/AppContext';
import { getPlanDefinition, PRO_PENDING_MESSAGE } from '../lib/plans';

interface AnalyticsViewProps {
  links: ShortLink[];
  events: AnalyticsEvent[];
}

export default function AnalyticsView({ links, events }: AnalyticsViewProps) {
  const { user } = useApp();
  const planInfo = getPlanDefinition(user?.plan ?? 'gratis');
  const [timeRange, setTimeRange] = useState('7');
  const maxDays = planInfo.limits.analyticsDays;

  useEffect(() => {
    if (maxDays !== null && Number(timeRange) > maxDays) {
      setTimeRange(String(maxDays));
    }
  }, [maxDays, timeRange]);

  const totalClicks = links.reduce((s, l) => s + l.clicks, 0);
  const totalVisits = Math.round(totalClicks * 1.2);

  const chartData = [
    { name: 'Lun', clicks: 420 },
    { name: 'Mar', clicks: 380 },
    { name: 'Mié', clicks: 510 },
    { name: 'Jue', clicks: 470 },
    { name: 'Vie', clicks: 620 },
    { name: 'Sáb', clicks: 390 },
    { name: 'Dom', clicks: 440 },
  ];

  const byLink = [...links]
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5)
    .map((l) => ({ name: l.slug ?? l.shortUrl, clicks: l.clicks }));

  const recent =
    events.length > 0
      ? events.slice(0, 8)
      : [
          { id: '1', type: 'link_click' as const, label: 'summer-sale', timestamp: new Date().toISOString() },
          { id: '2', type: 'bio_view' as const, label: 'alexjohnson', timestamp: new Date().toISOString() },
        ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Analítica</h1>
          <p className="text-[var(--text-secondary)] text-sm">Clics, visitas y actividad reciente de tus enlaces.</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="bg-[var(--surface-soft)] border border-[var(--border)] rounded-xl px-4 py-2 text-sm text-white"
        >
          <option value="7">Últimos 7 días</option>
          <option value="30" disabled={maxDays !== null && maxDays < 30}>Últimos 30 días</option>
          <option value="90" disabled={maxDays !== null && maxDays < 90}>Últimos 90 días</option>
        </select>
      </div>
      {maxDays === 7 && (
        <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
          El plan Gratis muestra analítica de 7 días. {PRO_PENDING_MESSAGE}
        </p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Clics totales', value: totalClicks },
          { label: 'Visitas totales', value: totalVisits },
          { label: 'Enlaces activos', value: links.filter((l) => l.active !== false).length },
          { label: 'Eventos registrados', value: events.length },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <p className="text-xs text-[var(--text-secondary)] uppercase font-bold">{m.label}</p>
            <p className="text-3xl font-bold text-white mt-2">{m.value.toLocaleString('es-ES')}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="font-semibold text-white mb-4">Clics por período</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" stroke="#A8B3CF" fontSize={11} />
              <YAxis stroke="#A8B3CF" fontSize={11} />
              <Tooltip contentStyle={{ background: '#050816', border: '1px solid rgba(255,255,255,0.12)' }} />
              <Area type="monotone" dataKey="clicks" stroke="#006BFF" fill="#006BFF" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="font-semibold text-white mb-4">Clics por enlace</h2>
          <ul className="space-y-3">
            {byLink.map((row) => (
              <li key={row.name} className="flex justify-between text-sm">
                <span className="font-mono text-brand-cyan truncate max-w-[60%]">{row.name}</span>
                <span className="text-white font-semibold">{row.clicks}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="font-semibold text-white mb-4">Actividad reciente</h2>
          <ul className="space-y-3 text-sm">
            {recent.map((ev) => (
              <li key={ev.id} className="flex items-center gap-3 border-b border-[var(--border)] pb-2">
                {ev.type === 'bio_view' ? (
                  <Monitor className="h-4 w-4 text-brand-green" />
                ) : (
                  <Smartphone className="h-4 w-4 text-brand-cyan" />
                )}
                <span className="flex-1 text-white">
                  {ev.type === 'link_click' ? 'Clic en enlace' : ev.type === 'bio_view' ? 'Visita bio' : 'Clic botón bio'}{' '}
                  <span className="text-[var(--text-secondary)]">· {ev.label}</span>
                </span>
                <Calendar className="h-3 w-3 text-[var(--text-secondary)]" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
