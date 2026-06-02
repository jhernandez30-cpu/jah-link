import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MessageCircle, Mail } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { BioPageConfig } from '../types';
import { sanitizeDisplayText } from '../lib/validation';
import BrandLogo from '../components/BrandLogo';
import InitialsAvatar from '../components/InitialsAvatar';

export default function PublicBioPage() {
  const { username = '' } = useParams();
  const { loadPublicBio, recordBioView, recordBioLinkClick } = useApp();
  const [config, setConfig] = useState<BioPageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const page = await loadPublicBio(username);
      if (cancelled) return;
      if (!page) {
        setNotFound(true);
        setConfig(null);
      } else {
        setConfig(page);
        setNotFound(false);
        await recordBioView(username);
      }
      setLoading(false);
    }

    if (username) load();
    return () => {
      cancelled = true;
    };
  }, [username, loadPublicBio, recordBioView]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <BrandLogo size="md" />
        <p className="text-[var(--text-secondary)] text-sm">Cargando perfil…</p>
      </div>
    );
  }

  if (notFound || !config) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-xl font-bold text-white">Perfil no encontrado</h1>
        <p className="text-[var(--text-secondary)] text-sm">@{username} no existe o no es público.</p>
        <Link to="/" className="btn-brand px-6 py-2.5 rounded-xl text-sm">
          Ir al inicio
        </Link>
      </div>
    );
  }

  const btnRadius =
    config.buttonStyle === 'pill'
      ? 'rounded-full'
      : config.buttonStyle === 'square'
        ? 'rounded-none'
        : 'rounded-xl';

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 py-10"
      style={{ background: config.backgroundColor || '#000000' }}
    >
      <div className="w-full max-w-md space-y-6 text-center">
        <InitialsAvatar
          name={config.displayName}
          email={config.email}
          imageUrl={config.avatarUrl}
          size="xl"
          className="mx-auto"
        />
        <div>
          <h1 className="text-xl font-bold text-white">{sanitizeDisplayText(config.displayName)}</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">@{username}</p>
          {config.bio && (
            <p className="text-white/80 text-sm mt-3 leading-relaxed">{sanitizeDisplayText(config.bio)}</p>
          )}
        </div>

        {config.socialLinks?.length > 0 && (
          <div className="flex justify-center gap-3 flex-wrap">
            {config.socialLinks.map((s) => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand-cyan hover:underline"
              >
                {s.platform}
              </a>
            ))}
          </div>
        )}

        {config.whatsapp && (
          <a
            href={`https://wa.me/${config.whatsapp.replace(/\D/g, '')}`}
            className={`w-full py-3 px-4 ${btnRadius} bg-brand-green text-black font-semibold text-sm flex items-center justify-center gap-2`}
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        )}

        {config.email && (
          <a
            href={`mailto:${config.email}`}
            className={`w-full py-3 px-4 ${btnRadius} border border-brand-cyan/40 text-white text-sm flex items-center justify-center gap-2`}
          >
            <Mail className="h-4 w-4" /> {config.email}
          </a>
        )}

        <div className="space-y-3 w-full">
          {config.links
            .filter((l) => l.active !== false)
            .map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => recordBioLinkClick(link.id)}
                className={`block w-full py-3.5 px-4 ${btnRadius} font-semibold text-sm text-black transition-transform hover:scale-[1.02]`}
                style={{ background: config.primaryColor || '#006BFF' }}
              >
                {sanitizeDisplayText(link.label)}
              </a>
            ))}
        </div>

        <footer className="pt-10 text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
          <Link to="/" className="hover:text-brand-cyan transition-colors">
            Creado con JAH Link
          </Link>
        </footer>
      </div>
    </div>
  );
}
