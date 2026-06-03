import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Camera,
  Facebook,
  Globe2,
  Instagram,
  Mail,
  MessageCircle,
  Music,
  Send,
  Youtube,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { BioBannerAspectRatio, BioPageConfig } from '../types';
import { sanitizeDisplayText } from '../lib/validation';
import BrandLogo from '../components/BrandLogo';
import InitialsAvatar from '../components/InitialsAvatar';

type IconComponent = ComponentType<{ className?: string }>;

const SOCIAL_ICONS: Record<string, IconComponent> = {
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  whatsapp: MessageCircle,
  telegram: Send,
  tiktok: Music,
  snapchat: Camera,
  spotify: Music,
  email: Mail,
  custom: Globe2,
};

function aspectClass(aspect: BioBannerAspectRatio): string {
  if (aspect === '1:1') return 'aspect-square';
  if (aspect === '3:2') return 'aspect-[3/2]';
  if (aspect === '16:9') return 'aspect-video';
  return 'aspect-[16/9]';
}

function buttonRadius(style: BioPageConfig['buttonStyle']): string {
  if (style === 'pill') return 'rounded-full';
  if (style === 'square') return 'rounded-none';
  if (style === 'bordered') return 'rounded-xl border border-white/30 bg-transparent text-white';
  return 'rounded-xl';
}

export default function PublicBioPage() {
  const { username = '' } = useParams();
  const {
    loadPublicBio,
    recordBioView,
    recordBioLinkClick,
    recordBioBannerClick,
    recordSocialLinkClick,
  } = useApp();
  const [state, setState] = useState<{ loading: boolean; config: BioPageConfig | null; notFound: boolean }>({
    loading: true,
    config: null,
    notFound: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState((prev) => ({ ...prev, loading: true }));
      const page = await loadPublicBio(username);
      if (cancelled) return;
      if (!page || page.isPublic === false) {
        setState({ loading: false, config: null, notFound: true });
        return;
      }
      setState({ loading: false, config: page, notFound: false });
      await recordBioView(username);
    }

    if (username) void load();
    return () => {
      cancelled = true;
    };
  }, [username, loadPublicBio, recordBioView]);

  const config = state.config;
  const activeSocials = useMemo(
    () => config?.socialLinks.filter((social) => social.active !== false && social.url) ?? [],
    [config],
  );
  const activeBanners = useMemo(
    () => config?.banners.filter((banner) => banner.active !== false) ?? [],
    [config],
  );
  const activeLinks = useMemo(
    () => config?.links.filter((link) => link.active !== false) ?? [],
    [config],
  );

  if (state.loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <BrandLogo size="md" />
        <p className="text-[var(--text-secondary)] text-sm">Cargando perfil...</p>
      </div>
    );
  }

  if (state.notFound || !config) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 px-6 text-center">
        <BrandLogo variant="icon" size="lg" />
        <h1 className="text-xl font-bold text-white">Página no disponible</h1>
        <p className="text-[var(--text-secondary)] text-sm">@{username} no existe o no está publicada.</p>
        <Link to="/" className="btn-brand px-6 py-2.5 rounded-xl text-sm">
          Ir al inicio
        </Link>
      </div>
    );
  }

  const bordered = config.buttonStyle === 'bordered';

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 py-10"
      style={{
        backgroundColor: config.backgroundColor || '#000000',
        backgroundImage: config.backgroundImageUrl
          ? `linear-gradient(${config.backgroundOverlay || 'rgba(0,0,0,0.35)'}, ${config.backgroundOverlay || 'rgba(0,0,0,0.35)'}), url(${config.backgroundImageUrl})`
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        fontFamily: config.font,
      }}
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
          <p className="text-white/60 text-sm mt-1">@{username}</p>
          {config.bio && (
            <p className="text-white/80 text-sm mt-3 leading-relaxed">{sanitizeDisplayText(config.bio)}</p>
          )}
        </div>

        {activeSocials.length > 0 && (
          <div className="flex justify-center gap-3 flex-wrap">
            {activeSocials.map((social) => {
              const Icon = SOCIAL_ICONS[social.platform] ?? Globe2;
              const isMail = social.url.startsWith('mailto:');
              return (
                <a
                  key={social.id}
                  href={social.url}
                  target={isMail ? undefined : '_blank'}
                  rel={isMail ? undefined : 'noopener noreferrer'}
                  onClick={() => void recordSocialLinkClick(social.id)}
                  aria-label={social.label || social.platform}
                  className="h-10 w-10 rounded-full border border-white/12 bg-white/10 text-white inline-flex items-center justify-center hover:border-brand-cyan hover:text-brand-cyan transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        )}

        {activeBanners.length > 0 && (
          <div className="space-y-3">
            {activeBanners.map((banner) => {
              const content = (
                <div className={`relative overflow-hidden rounded-2xl border border-white/12 bg-black/40 ${aspectClass(banner.aspectRatio)}`}>
                  <img
                    src={banner.imageUrl || '/brand/jah-link-logo.png'}
                    alt={banner.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent flex flex-col justify-end p-4 text-left">
                    <strong className="text-sm text-white">{sanitizeDisplayText(banner.title)}</strong>
                    {banner.description && <span className="text-xs text-white/75 mt-1">{sanitizeDisplayText(banner.description, 120)}</span>}
                  </div>
                </div>
              );
              if (!banner.destinationUrl) return <div key={banner.id}>{content}</div>;
              return (
                <a
                  key={banner.id}
                  href={banner.destinationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => void recordBioBannerClick(banner.id)}
                  className="block transition-transform hover:scale-[1.01]"
                >
                  {content}
                </a>
              );
            })}
          </div>
        )}

        {activeLinks.length > 0 && (
          <div className="space-y-3 w-full">
            {activeLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => void recordBioLinkClick(link.id)}
                className={`block w-full py-3.5 px-4 ${buttonRadius(config.buttonStyle)} font-semibold text-sm transition-transform hover:scale-[1.02]`}
                style={{
                  background: bordered ? 'transparent' : config.primaryColor || '#006BFF',
                  color: bordered ? '#FFFFFF' : '#000000',
                }}
              >
                {sanitizeDisplayText(link.label)}
              </a>
            ))}
          </div>
        )}

        <footer className="pt-10 flex justify-center">
          <Link to="/" aria-label="JAH Link">
            <BrandLogo size="sm" />
          </Link>
        </footer>
      </div>
    </div>
  );
}
