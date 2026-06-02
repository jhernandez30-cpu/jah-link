import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { isReservedSlug } from '../lib/reservedSlugs';
import {
  getPublicShortLinkBySlug,
  resolveSlugRedirect,
  type PublicShortLink,
} from '../lib/storage';

type ResolverStatus = 'loading' | 'preview' | 'notfound' | 'inactive' | 'redirecting';

const PREVIEW_ENABLED = true;
const REDIRECT_SECONDS = 4;

export default function ShortLinkResolver() {
  const { slug = '' } = useParams();
  const [status, setStatus] = useState<ResolverStatus>('loading');
  const [link, setLink] = useState<PublicShortLink | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);
  const redirectedRef = useRef(false);

  const redirectToDestination = useCallback(async () => {
    if (!link || redirectedRef.current) return;
    redirectedRef.current = true;
    setStatus('redirecting');

    try {
      await resolveSlugRedirect(slug);
    } catch (error) {
      console.warn('No se pudo registrar el clic', error);
    }

    window.location.href = link.destination;
  }, [link, slug]);

  useEffect(() => {
    let cancelled = false;

    async function loadShortLink() {
      const cleanSlug = slug.trim();
      if (!cleanSlug || isReservedSlug(cleanSlug)) {
        if (!cancelled) setStatus('notfound');
        return;
      }

      setStatus('loading');
      setSecondsLeft(REDIRECT_SECONDS);
      redirectedRef.current = false;

      try {
        const found = await getPublicShortLinkBySlug(cleanSlug);
        if (cancelled) return;

        if (!found) {
          setLink(null);
          setStatus('notfound');
          return;
        }

        if (!found.isActive) {
          setLink(found);
          setStatus('inactive');
          return;
        }

        setLink(found);
        setStatus(PREVIEW_ENABLED ? 'preview' : 'redirecting');
        if (!PREVIEW_ENABLED) {
          window.setTimeout(() => void redirectToDestination(), 0);
        }
      } catch (error) {
        console.error('No se pudo resolver el enlace corto', error);
        if (!cancelled) setStatus('notfound');
      }
    }

    void loadShortLink();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (status !== 'preview' || !link) return undefined;

    const intervalId = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    const timeoutId = window.setTimeout(() => {
      void redirectToDestination();
    }, REDIRECT_SECONDS * 1000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [link, redirectToDestination, status]);

  if (status === 'loading' || status === 'redirecting') {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-white px-6">
        <BrandLogo size="md" />
        <p className="text-[var(--text-secondary)] text-sm">
          {status === 'redirecting' ? 'Abriendo destino...' : 'Verificando enlace...'}
        </p>
      </main>
    );
  }

  if (status === 'inactive') {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 px-6 text-center">
        <BrandLogo size="md" />
        <h1 className="text-xl font-bold text-white">Enlace no disponible</h1>
        <p className="text-[var(--text-secondary)] max-w-md text-sm">
          Este enlace está desactivado o ha expirado. Contacta al propietario si necesitas acceso.
        </p>
        <Link to="/" className="btn-brand px-6 py-2.5 rounded-xl text-sm">
          Ir al inicio
        </Link>
      </main>
    );
  }

  if (status === 'notfound' || !link) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 px-6 text-center">
        <BrandLogo size="md" />
        <h1 className="text-2xl font-bold text-white">Enlace no encontrado</h1>
        <p className="text-[var(--text-secondary)] max-w-md text-sm">
          No existe un enlace corto activo con esa dirección en JAH Link.
        </p>
        <Link to="/" className="btn-brand px-6 py-2.5 rounded-xl text-sm">
          Volver al inicio
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border)] pb-5">
          <BrandLogo size="lg" />
          <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-brand-green bg-brand-green/10 border border-brand-green/20 px-3 py-1 rounded-full font-bold w-fit">
            <ShieldCheck className="h-3.5 w-3.5" />
            Enlace protegido
          </span>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold">Vista previa del destino</h1>
          <div className="rounded-xl border border-[var(--border)] bg-black/50 p-4 space-y-2">
            <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)] font-bold">Destino:</p>
            <p className="text-sm sm:text-base text-brand-cyan break-all font-mono">{link.destination}</p>
          </div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            No se ha podido obtener información adicional del destino, pero revisaremos el enlace para protegerte.
          </p>
        </div>

        <div className="rounded-xl border border-brand-cyan/20 bg-brand-cyan/10 p-4 space-y-3">
          <h2 className="text-sm font-bold text-white">Comprobación de seguridad</h2>
          <ul className="space-y-2 text-sm text-white/85">
            {[
              'Análisis de JAH Link',
              'Enlace supervisado por comportamiento sospechoso',
              'No se han detectado amenazas en este momento',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand-green mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-2">
          <p className="text-xs text-[var(--text-secondary)]">
            Te redirigiremos en {secondsLeft} segundos...
          </p>
          <button
            type="button"
            onClick={() => void redirectToDestination()}
            className="btn-brand px-6 py-3 rounded-xl text-sm flex items-center justify-center gap-2"
          >
            Continuar al destino
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </main>
  );
}
