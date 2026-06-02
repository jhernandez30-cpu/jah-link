import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import BrandLogo from '../components/BrandLogo';

export default function RedirectPage() {
  const { slug = '' } = useParams();
  const { resolveRedirect } = useApp();
  const [status, setStatus] = useState<'loading' | 'redirect' | 'notfound' | 'inactive'>('loading');

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!slug) {
        if (!cancelled) setStatus('notfound');
        return;
      }

      const result = await resolveRedirect(slug);
      if (cancelled) return;

      if (!result) {
        setStatus('notfound');
        return;
      }

      if (!result.isActive) {
        setStatus('inactive');
        return;
      }

      setStatus('redirect');
      window.location.href = result.destination;
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [slug, resolveRedirect]);

  if (status === 'loading' || status === 'redirect') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-white">
        <BrandLogo size="md" />
        <p className="text-[var(--text-secondary)] text-sm">Redirigiendo…</p>
      </div>
    );
  }

  if (status === 'inactive') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 px-6 text-center">
        <BrandLogo size="md" />
        <h1 className="text-xl font-bold text-white">Enlace no disponible</h1>
        <p className="text-[var(--text-secondary)] max-w-md text-sm">
          Este enlace está desactivado o ha expirado. Contacta al propietario si necesitas acceso.
        </p>
        <Link to="/" className="btn-brand px-6 py-2.5 rounded-xl text-sm">
          Ir al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 px-6 text-center">
      <BrandLogo size="md" />
      <h1 className="text-2xl font-bold text-white">404 — Enlace no encontrado</h1>
      <p className="text-[var(--text-secondary)] max-w-md text-sm">
        No existe un enlace corto con esa dirección en JAH Link.
      </p>
      <Link to="/" className="btn-brand px-6 py-2.5 rounded-xl text-sm">
        Volver al inicio
      </Link>
    </div>
  );
}
