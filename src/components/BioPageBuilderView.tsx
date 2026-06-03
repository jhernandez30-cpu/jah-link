import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Camera,
  Check,
  Copy,
  Edit3,
  ExternalLink,
  Eye,
  Facebook,
  Globe2,
  GripVertical,
  Image as ImageIcon,
  Instagram,
  Link2,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Music,
  Palette,
  Plus,
  QrCode,
  Save,
  Search,
  Send,
  Sparkles,
  Trash2,
  Upload,
  Youtube,
} from 'lucide-react';
import type { BioBanner, BioBannerAspectRatio, BioPageConfig, SocialLink } from '../types';
import { useApp } from '../context/AppContext';
import { getPublicBioUrl, PUBLIC_BASE_URL } from '../lib/config';
import { getPlanDefinition, normalizePlan } from '../lib/plans';
import { isValidSlug } from '../lib/validation';
import { isReservedSlug } from '../lib/reservedSlugs';
import InitialsAvatar from './InitialsAvatar';
import BrandLogo from './BrandLogo';

type ViewMode = 'list' | 'editor';
type BannerLinkSource = 'new' | 'existing';

interface BioPageBuilderViewProps {
  initialConfig: BioPageConfig;
  onSaveConfig: (config: BioPageConfig) => void | Promise<boolean>;
}

type SocialOption = {
  id: string;
  label: string;
  placeholder: string;
  icon: ComponentType<{ className?: string }>;
};

const SOCIAL_OPTIONS: SocialOption[] = [
  { id: 'instagram', label: 'Instagram', placeholder: 'usuario', icon: Instagram },
  { id: 'facebook', label: 'Facebook', placeholder: 'usuario o pagina', icon: Facebook },
  { id: 'youtube', label: 'YouTube', placeholder: '@usuario', icon: Youtube },
  { id: 'whatsapp', label: 'WhatsApp', placeholder: '50588887777', icon: MessageCircle },
  { id: 'telegram', label: 'Telegram', placeholder: 'usuario', icon: Send },
  { id: 'tiktok', label: 'TikTok', placeholder: '@usuario', icon: Music },
  { id: 'snapchat', label: 'Snapchat', placeholder: 'usuario', icon: Camera },
  { id: 'spotify', label: 'Spotify', placeholder: 'URL de artista o playlist', icon: Music },
  { id: 'email', label: 'Email', placeholder: 'correo@dominio.com', icon: Mail },
];

const ASPECT_OPTIONS: { value: BioBannerAspectRatio; label: string; className: string }[] = [
  { value: 'original', label: 'Original', className: 'aspect-[16/9]' },
  { value: '1:1', label: '1:1', className: 'aspect-square' },
  { value: '3:2', label: '3:2', className: 'aspect-[3/2]' },
  { value: '16:9', label: '16:9', className: 'aspect-video' },
];

function cleanConfig(config: BioPageConfig): BioPageConfig {
  return {
    ...config,
    displayName: config.displayName || '',
    username: config.username || '',
    bio: config.bio || '',
    avatarUrl: config.avatarUrl || '',
    socialLinks: config.socialLinks ?? [],
    links: config.links ?? [],
    banners: config.banners ?? [],
    theme: config.theme ?? 'Modern',
    backgroundColor: config.backgroundColor || '#000000',
    primaryColor: config.primaryColor || '#006BFF',
    buttonStyle: config.buttonStyle || 'rounded',
    font: config.font || 'Inter',
    backgroundImageUrl: config.backgroundImageUrl || '',
    backgroundOverlay: config.backgroundOverlay || 'rgba(0,0,0,0.35)',
    isPublic: config.isPublic !== false,
    viewsCount: config.viewsCount ?? 0,
    interactionsCount: config.interactionsCount ?? 0,
    qrColor: config.qrColor || '#00CFFF',
    qrLogoEnabled: config.qrLogoEnabled ?? false,
  };
}

function hasRealBioPage(config: BioPageConfig): boolean {
  return Boolean(
    config.createdAt ||
      config.updatedAt ||
      config.avatarUrl ||
      config.bio ||
      (config.links?.length ?? 0) > 0 ||
      (config.banners?.length ?? 0) > 0 ||
      (config.socialLinks?.length ?? 0) > 0 ||
      (config.displayName && config.displayName !== 'Mi perfil') ||
      (config.username && config.username !== 'miperfil'),
  );
}

function formatDate(value?: string): string {
  if (!value) return 'Sin fecha';
  try {
    return new Date(value).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Sin fecha';
  }
}

function buttonRadius(style: BioPageConfig['buttonStyle']): string {
  if (style === 'pill') return 'rounded-full';
  if (style === 'square') return 'rounded-none';
  if (style === 'bordered') return 'rounded-xl border border-white/25 bg-transparent';
  return 'rounded-xl';
}

function aspectClass(aspect: BioBannerAspectRatio): string {
  return ASPECT_OPTIONS.find((option) => option.value === aspect)?.className ?? 'aspect-video';
}

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function normalizeSocialUrl(platform: string, rawValue: string): string {
  const value = rawValue.trim();
  if (!value) return '';
  const lowerPlatform = platform.toLowerCase();
  if (lowerPlatform === 'email') {
    if (value.startsWith('mailto:')) return value;
    return `mailto:${value.replace(/^mailto:/i, '')}`;
  }
  if (/^https?:\/\//i.test(value)) return value;
  if (lowerPlatform === 'whatsapp') return `https://wa.me/${value.replace(/\D/g, '')}`;
  const handle = value.replace(/^@/, '').replace(/^\/+/, '');
  if (lowerPlatform === 'instagram') return `https://www.instagram.com/${handle}/`;
  if (lowerPlatform === 'facebook') return `https://www.facebook.com/${handle}`;
  if (lowerPlatform === 'youtube') return `https://www.youtube.com/${value.startsWith('@') ? value : `@${handle}`}`;
  if (lowerPlatform === 'telegram') return `https://t.me/${handle}`;
  if (lowerPlatform === 'tiktok') return `https://www.tiktok.com/${value.startsWith('@') ? value : `@${handle}`}`;
  if (lowerPlatform === 'snapchat') return `https://www.snapchat.com/add/${handle}`;
  if (lowerPlatform === 'spotify') return `https://open.spotify.com/search/${encodeURIComponent(value)}`;
  return normalizeUrl(value);
}

function isValidSocialUrl(platform: string, url: string): boolean {
  if (!url) return false;
  if (platform.toLowerCase() === 'email') {
    return /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(url);
  }
  return isValidHttpUrl(url);
}

function socialLabel(platform: string): string {
  return SOCIAL_OPTIONS.find((option) => option.id === platform)?.label ?? platform;
}

function socialIcon(platform: string) {
  return SOCIAL_OPTIONS.find((option) => option.id === platform)?.icon ?? Globe2;
}

function slugFromInput(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 64);
}

function newBanner(): BioBanner {
  return {
    id: crypto.randomUUID(),
    title: '',
    description: '',
    imageUrl: '',
    destinationUrl: '',
    aspectRatio: '16:9',
    active: true,
    position: 0,
    clicksCount: 0,
  };
}

export default function BioPageBuilderView({ initialConfig, onSaveConfig }: BioPageBuilderViewProps) {
  const {
    user,
    links,
    bioPageId,
    uploadBioAvatar,
    uploadBioBannerImage,
    uploadBioBackgroundImage,
    deleteBioAsset,
    createQr,
    clearMessages,
  } = useApp();

  const [draft, setDraft] = useState<BioPageConfig>(() => cleanConfig(initialConfig));
  const [mode, setMode] = useState<ViewMode>(() => (hasRealBioPage(initialConfig) ? 'list' : 'editor'));
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [localError, setLocalError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [customSocialOpen, setCustomSocialOpen] = useState(false);
  const [customSocialLabel, setCustomSocialLabel] = useState('');
  const [customSocialUrl, setCustomSocialUrl] = useState('');
  const [bannerPanelOpen, setBannerPanelOpen] = useState(false);
  const [bannerDraft, setBannerDraft] = useState<BioBanner>(() => newBanner());
  const [bannerLinkEnabled, setBannerLinkEnabled] = useState(false);
  const [bannerLinkSource, setBannerLinkSource] = useState<BannerLinkSource>('new');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  const plan = normalizePlan(user?.plan ?? 'gratis');
  const planDef = getPlanDefinition(plan);
  const isFree = plan === 'gratis';
  const bannerLimit = isFree ? 2 : 4;
  const canUseAdvanced = plan !== 'gratis';
  const hasPage = hasRealBioPage(draft);
  const publicUrl = draft.username ? getPublicBioUrl(draft.username) : `${PUBLIC_BASE_URL}/m/usuario`;
  const remainingPages = planDef.limits.bioPages === null ? null : Math.max(0, planDef.limits.bioPages - (hasPage ? 1 : 0));
  const filteredPageVisible = !query.trim() || publicUrl.toLowerCase().includes(query.toLowerCase()) || draft.displayName.toLowerCase().includes(query.toLowerCase());
  const activeBanners = draft.banners.filter((banner) => banner.active !== false);
  const activeSocials = draft.socialLinks.filter((social) => social.active !== false && social.url);
  const activeLinks = draft.links.filter((link) => link.active !== false);
  const interactions =
    draft.interactionsCount ??
    [...draft.links, ...draft.banners, ...draft.socialLinks].reduce((sum, item) => sum + (item.clicksCount ?? 0), 0);

  useEffect(() => {
    setDraft(cleanConfig(initialConfig));
    setMode(hasRealBioPage(initialConfig) ? 'list' : 'editor');
  }, [initialConfig]);

  function patchDraft(patch: Partial<BioPageConfig>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3500);
  }

  function showError(message: string) {
    setLocalError(message);
    window.setTimeout(() => setLocalError(''), 5000);
  }

  async function handleAvatarFile(file?: File) {
    if (!file) return;
    setUploading('avatar');
    const uploaded = await uploadBioAvatar(file);
    setUploading(null);
    if (!uploaded) return;
    patchDraft({ avatarUrl: uploaded.url, avatarPath: uploaded.path });
  }

  async function removeAvatar() {
    if (draft.avatarPath) await deleteBioAsset(draft.avatarPath);
    patchDraft({ avatarUrl: '', avatarPath: undefined });
  }

  async function handleBackgroundFile(file?: File) {
    if (!file) return;
    if (!canUseAdvanced) {
      showError('La imagen de fondo personalizada está disponible en Pro y Business.');
      return;
    }
    setUploading('background');
    const uploaded = await uploadBioBackgroundImage(file);
    setUploading(null);
    if (!uploaded) return;
    patchDraft({ backgroundImageUrl: uploaded.url, backgroundImagePath: uploaded.path });
  }

  async function removeBackground() {
    if (draft.backgroundImagePath) await deleteBioAsset(draft.backgroundImagePath);
    patchDraft({ backgroundImageUrl: '', backgroundImagePath: undefined });
  }

  async function handleBannerFile(file?: File) {
    if (!file) return;
    setUploading('banner');
    const uploaded = await uploadBioBannerImage(file);
    setUploading(null);
    if (!uploaded) return;
    setBannerDraft((prev) => ({ ...prev, imageUrl: uploaded.url, imagePath: uploaded.path }));
  }

  function openNewBannerPanel() {
    if (draft.banners.length >= bannerLimit) {
      showError('Has alcanzado el límite del plan Gratis. Actualiza a Pro para continuar.');
      return;
    }
    setBannerDraft({ ...newBanner(), position: draft.banners.length });
    setBannerLinkEnabled(false);
    setBannerLinkSource('new');
    setBannerPanelOpen(true);
  }

  function openEditBannerPanel(banner: BioBanner) {
    setBannerDraft({ ...banner });
    setBannerLinkEnabled(Boolean(banner.destinationUrl));
    setBannerLinkSource('new');
    setBannerPanelOpen(true);
  }

  function saveBannerDraft() {
    const title = bannerDraft.title.trim();
    if (!title) {
      showError('Escribe un título para el banner.');
      return;
    }
    if (!bannerDraft.imageUrl) {
      showError('Sube una imagen para el banner.');
      return;
    }
    const destination = bannerLinkEnabled && bannerDraft.destinationUrl
      ? normalizeUrl(bannerDraft.destinationUrl)
      : '';
    if (destination && !isValidHttpUrl(destination)) {
      showError('Ingresa una URL de destino válida.');
      return;
    }

    const nextBanner: BioBanner = {
      ...bannerDraft,
      title,
      destinationUrl: destination,
      description: bannerDraft.description?.trim() ?? '',
      active: bannerDraft.active !== false,
    };

    setDraft((prev) => {
      const exists = prev.banners.some((banner) => banner.id === nextBanner.id);
      const banners = exists
        ? prev.banners.map((banner) => (banner.id === nextBanner.id ? nextBanner : banner))
        : [...prev.banners, nextBanner];
      return {
        ...prev,
        banners: banners.map((banner, position) => ({ ...banner, position })),
      };
    });
    setBannerPanelOpen(false);
    showNotice('Banner guardado en la página.');
  }

  function removeBanner(id: string) {
    setDraft((prev) => ({
      ...prev,
      banners: prev.banners
        .filter((banner) => banner.id !== id)
        .map((banner, position) => ({ ...banner, position })),
    }));
  }

  function moveBanner(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= draft.banners.length) return;
    setDraft((prev) => {
      const banners = [...prev.banners];
      const current = banners[index];
      banners[index] = banners[nextIndex];
      banners[nextIndex] = current;
      return { ...prev, banners: banners.map((banner, position) => ({ ...banner, position })) };
    });
  }

  function toggleSocial(platform: string) {
    const exists = draft.socialLinks.some((social) => social.platform === platform);
    if (exists) {
      patchDraft({ socialLinks: draft.socialLinks.filter((social) => social.platform !== platform) });
      return;
    }
    const option = SOCIAL_OPTIONS.find((item) => item.id === platform);
    const next: SocialLink = {
      id: crypto.randomUUID(),
      platform,
      label: option?.label ?? platform,
      icon: platform,
      url: '',
      active: true,
      position: draft.socialLinks.length,
      clicksCount: 0,
    };
    patchDraft({ socialLinks: [...draft.socialLinks, next] });
  }

  function updateSocial(id: string, patch: Partial<SocialLink>) {
    patchDraft({
      socialLinks: draft.socialLinks.map((social, position) =>
        social.id === id ? { ...social, ...patch, position } : social,
      ),
    });
  }

  function normalizeSocial(id: string) {
    const social = draft.socialLinks.find((item) => item.id === id);
    if (!social || !social.url) return;
    updateSocial(id, { url: normalizeSocialUrl(social.platform, social.url) });
  }

  function addCustomSocial() {
    const label = customSocialLabel.trim();
    const normalized = normalizeUrl(customSocialUrl);
    if (!label || !isValidHttpUrl(normalized)) {
      showError('Agrega un nombre y una URL válida para la red personalizada.');
      return;
    }
    patchDraft({
      socialLinks: [
        ...draft.socialLinks,
        {
          id: crypto.randomUUID(),
          platform: 'custom',
          label,
          icon: 'custom',
          url: normalized,
          active: true,
          position: draft.socialLinks.length,
          clicksCount: 0,
        },
      ],
    });
    setCustomSocialLabel('');
    setCustomSocialUrl('');
    setCustomSocialOpen(false);
  }

  function validateBeforeSave(): BioPageConfig | null {
    const username = slugFromInput(draft.username);
    if (!draft.displayName.trim()) {
      showError('Escribe el nombre público de la página.');
      return null;
    }
    if (!username || username.includes('/') || username.includes('http') || isReservedSlug(username) || !isValidSlug(username)) {
      showError('El username debe usar solo letras, números, guion o guion bajo, y no puede ser reservado.');
      return null;
    }
    if (draft.banners.length > bannerLimit) {
      showError('Has alcanzado el límite del plan Gratis. Actualiza a Pro para continuar.');
      return null;
    }

    const normalizedSocials = draft.socialLinks.map((social, position) => ({
      ...social,
      label: social.label || socialLabel(social.platform),
      url: normalizeSocialUrl(social.platform, social.url),
      active: social.active !== false,
      position,
    }));
    const invalidSocial = normalizedSocials.find((social) => social.url && !isValidSocialUrl(social.platform, social.url));
    if (invalidSocial) {
      showError(`Revisa la URL de ${invalidSocial.label}.`);
      return null;
    }

    const normalizedBanners = draft.banners.map((banner, position) => {
      const destinationUrl = banner.destinationUrl ? normalizeUrl(banner.destinationUrl) : '';
      return { ...banner, destinationUrl, position, active: banner.active !== false };
    });
    const invalidBanner = normalizedBanners.find((banner) => banner.destinationUrl && !isValidHttpUrl(banner.destinationUrl));
    if (invalidBanner) {
      showError(`Revisa la URL del banner "${invalidBanner.title}".`);
      return null;
    }

    return {
      ...draft,
      displayName: draft.displayName.trim(),
      username,
      bio: draft.bio.trim(),
      socialLinks: normalizedSocials,
      banners: normalizedBanners,
      isPublic: true,
      qrLogoEnabled: canUseAdvanced ? draft.qrLogoEnabled : false,
      backgroundImageUrl: canUseAdvanced ? draft.backgroundImageUrl : '',
      backgroundImagePath: canUseAdvanced ? draft.backgroundImagePath : undefined,
    };
  }

  async function savePage() {
    clearMessages();
    const validConfig = validateBeforeSave();
    if (!validConfig) return;
    setSaving(true);
    const result = await Promise.resolve(onSaveConfig(validConfig));
    setSaving(false);
    if (result === false) return;
    setDraft(cleanConfig(validConfig));
    setMode('list');
    showNotice('Página guardada correctamente.');
  }

  async function copyPublicUrl() {
    await navigator.clipboard?.writeText(publicUrl);
    showNotice('Link copiado al portapapeles.');
  }

  async function saveQr() {
    const validConfig = validateBeforeSave();
    if (!validConfig) return;
    await createQr({
      entityType: 'bio_page',
      entityId: bioPageId,
      targetUrl: getPublicBioUrl(validConfig.username),
      title: `Página Bio: ${validConfig.displayName}`,
    });
    showNotice('Código QR guardado.');
  }

  function downloadQr() {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `jah-link-${draft.username || 'bio'}-qr.png`;
    link.click();
  }

  const pageCard = (
    <div className="rounded-2xl border border-white/10 bg-[#050816] p-4 sm:p-5 shadow-2xl shadow-black/25">
      <div className="flex flex-col lg:flex-row lg:items-center gap-5">
        <div className="h-28 w-full lg:w-44 overflow-hidden rounded-xl border border-white/10 bg-black/40 shrink-0">
          {draft.avatarUrl ? (
            <img src={draft.avatarUrl} alt={draft.displayName} className="h-full w-full object-cover" />
          ) : activeBanners[0]?.imageUrl ? (
            <img src={activeBanners[0].imageUrl} alt={activeBanners[0].title} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <BrandLogo variant="icon" size="lg" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-white truncate">{draft.displayName || 'Página Bio'}</h3>
            <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-cyan hover:underline break-all">
              {publicUrl}
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="rounded-xl bg-black/35 border border-white/10 p-3">
              <span className="text-[var(--text-secondary)] block">Creada</span>
              <strong className="text-white">{formatDate(draft.createdAt)}</strong>
            </div>
            <div className="rounded-xl bg-black/35 border border-white/10 p-3">
              <span className="text-[var(--text-secondary)] block">Actualizada</span>
              <strong className="text-white">{formatDate(draft.updatedAt)}</strong>
            </div>
            <div className="rounded-xl bg-black/35 border border-white/10 p-3">
              <span className="text-[var(--text-secondary)] block">Visitas</span>
              <strong className="text-white">{draft.viewsCount ?? 0}</strong>
            </div>
            <div className="rounded-xl bg-black/35 border border-white/10 p-3">
              <span className="text-[var(--text-secondary)] block">Interacciones</span>
              <strong className="text-white">{interactions}</strong>
            </div>
          </div>
        </div>

        <div className="flex lg:flex-col flex-wrap gap-2 lg:w-40">
          <button type="button" onClick={() => setMode('editor')} className="px-3 py-2 rounded-xl bg-white text-black text-xs font-semibold flex items-center gap-2 justify-center">
            <Edit3 className="h-4 w-4" /> Editar
          </button>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-xl border border-brand-cyan/40 text-brand-cyan text-xs font-semibold flex items-center gap-2 justify-center">
            <ExternalLink className="h-4 w-4" /> Ver página
          </a>
          <button type="button" onClick={copyPublicUrl} className="px-3 py-2 rounded-xl border border-white/10 text-white text-xs font-semibold flex items-center gap-2 justify-center">
            <Copy className="h-4 w-4" /> Copiar link
          </button>
          <div className="relative">
            <button type="button" onClick={() => setMenuOpen((open) => !open)} className="w-full px-3 py-2 rounded-xl border border-white/10 text-white text-xs font-semibold flex items-center gap-2 justify-center">
              <MoreHorizontal className="h-4 w-4" /> Más opciones
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-white/10 bg-[#050816] p-2 shadow-2xl">
                <button type="button" onClick={() => { setAnalyticsOpen((open) => !open); setMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-xs text-white hover:bg-white/10">
                  Ver analítica
                </button>
                <button type="button" onClick={copyPublicUrl} className="w-full text-left px-3 py-2 rounded-lg text-xs text-white hover:bg-white/10">
                  Compartir
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (mode === 'list') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">JAH Link Pages</h1>
            <p className="text-sm text-[var(--text-secondary)]">Administra tus Páginas Bio, enlaces públicos, QR y métricas.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (hasPage && remainingPages === 0) {
                showError('Has alcanzado el límite del plan Gratis. Actualiza a Pro para continuar.');
                return;
              }
              setMode('editor');
            }}
            className="btn-brand px-5 py-3 rounded-xl text-sm inline-flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" /> Crear página
          </button>
        </div>

        <div className="grid lg:grid-cols-[1fr_auto] gap-4 items-center">
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar páginas"
              className="w-full rounded-xl border border-white/10 bg-[#050816] py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-brand-cyan"
            />
          </label>
          <div className="rounded-xl border border-white/10 bg-[#050816] px-4 py-3 text-sm text-[var(--text-secondary)]">
            {remainingPages === null ? 'Tu plan incluye páginas ilimitadas' : `Tu plan incluye ${remainingPages} página más`}
          </div>
        </div>

        {notice && <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm text-emerald-300">{notice}</div>}
        {localError && <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-200">{localError}</div>}

        {hasPage && filteredPageVisible ? (
          pageCard
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 bg-[#050816] p-8 text-center">
            <BrandLogo size="md" className="mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white">Todavía no tienes una Página Bio publicada</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Crea tu página, sube imágenes, agrega redes y comparte un link público en `/m/usuario`.</p>
            <button type="button" onClick={() => setMode('editor')} className="btn-brand mt-5 px-5 py-3 rounded-xl text-sm inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> Crear página
            </button>
          </div>
        )}

        {analyticsOpen && hasPage && (
          <div className="rounded-2xl border border-white/10 bg-[#050816] p-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-brand-cyan" /> Analítica de Página Bio
            </h2>
            <div className="mt-4 grid sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-black/35 border border-white/10 p-4">
                <span className="text-xs text-[var(--text-secondary)]">Visitas</span>
                <strong className="block text-2xl text-white">{draft.viewsCount ?? 0}</strong>
              </div>
              <div className="rounded-xl bg-black/35 border border-white/10 p-4">
                <span className="text-xs text-[var(--text-secondary)]">Banners activos</span>
                <strong className="block text-2xl text-white">{activeBanners.length}</strong>
              </div>
              <div className="rounded-xl bg-black/35 border border-white/10 p-4">
                <span className="text-xs text-[var(--text-secondary)]">Interacciones</span>
                <strong className="block text-2xl text-white">{interactions}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-start gap-6">
        <div className="min-w-0 flex-1 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#050816] p-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">Configura cómo quieres compartir la página</h1>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">Configura tu link y código QR para obtener visitas a la página.</p>
              </div>
              <button type="button" onClick={() => setMode('list')} className="px-4 py-2 rounded-xl border border-white/10 text-sm text-white">
                Volver al listado
              </button>
            </div>

            <div className="mt-5 grid lg:grid-cols-[1fr_260px] gap-5">
              <div className="space-y-3">
                <label className="text-xs uppercase tracking-wide text-[var(--text-secondary)] font-semibold">URL de la página</label>
                <div className="grid sm:grid-cols-[minmax(0,1fr)_auto_minmax(160px,220px)] gap-2">
                  <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-3 text-sm text-white truncate">{PUBLIC_BASE_URL.replace(/^https?:\/\//, '')}</div>
                  <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-3 text-sm text-brand-cyan">/m/</div>
                  <input
                    value={draft.username}
                    onChange={(event) => patchDraft({ username: slugFromInput(event.target.value) })}
                    placeholder="usuario"
                    className="rounded-xl border border-white/10 bg-black/35 px-3 py-3 text-sm text-white outline-none focus:border-brand-cyan"
                  />
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  {planDef.limits.customDomain ? 'Tu plan permite conectar dominio personalizado cuando jah.link esté listo.' : 'Dominio personalizado disponible en Pro y Business.'}
                </p>
                <div className="rounded-xl border border-brand-cyan/20 bg-brand-cyan/10 px-4 py-3 text-sm text-brand-cyan break-all">
                  {publicUrl}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/35 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white flex items-center gap-2"><QrCode className="h-4 w-4 text-brand-cyan" /> Código QR</span>
                  <input type="color" value={draft.qrColor} onChange={(event) => patchDraft({ qrColor: event.target.value })} className="h-8 w-10 rounded bg-transparent" />
                </div>
                <div ref={qrRef} className="mx-auto w-fit rounded-xl bg-white p-3">
                  <QRCodeCanvas value={publicUrl} size={136} fgColor={draft.qrColor || '#00CFFF'} bgColor="#FFFFFF" includeMargin />
                </div>
                <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    checked={draft.qrLogoEnabled ?? false}
                    disabled={isFree}
                    onChange={(event) => patchDraft({ qrLogoEnabled: event.target.checked })}
                  />
                  Logo QR {isFree ? 'bloqueado en Gratis' : 'activo'}
                </label>
                {isFree && <p className="text-xs text-yellow-200">El logo en QR está disponible en Pro y Business.</p>}
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={saveQr} className="rounded-xl bg-white text-black py-2 text-xs font-semibold">Guardar QR</button>
                  <button type="button" onClick={downloadQr} className="rounded-xl border border-white/10 text-white py-2 text-xs font-semibold">Descargar</button>
                </div>
              </div>
            </div>
          </div>

          {notice && <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm text-emerald-300 flex items-center gap-2"><Check className="h-4 w-4" /> {notice}</div>}
          {localError && <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-200">{localError}</div>}

          <section className="rounded-2xl border border-white/10 bg-[#050816] p-5 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Eye className="h-5 w-5 text-brand-cyan" /> Perfil</h2>
                <p className="text-sm text-[var(--text-secondary)]">Imagen, nombre público y descripción principal.</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-[180px_1fr] gap-5">
              <div className="space-y-3">
                <div className="rounded-2xl border border-white/10 bg-black/35 p-4 flex flex-col items-center gap-3">
                  <InitialsAvatar name={draft.displayName} email={draft.email} imageUrl={draft.avatarUrl} size="xl" />
                  <input ref={avatarInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" hidden onChange={(event) => void handleAvatarFile(event.target.files?.[0])} />
                  <button type="button" onClick={() => avatarInputRef.current?.click()} className="w-full rounded-xl bg-white text-black py-2 text-xs font-semibold flex items-center justify-center gap-2">
                    <Upload className="h-4 w-4" /> {uploading === 'avatar' ? 'Subiendo...' : 'Editar imagen'}
                  </button>
                  <button type="button" onClick={() => void removeAvatar()} className="w-full rounded-xl border border-white/10 text-white py-2 text-xs font-semibold flex items-center justify-center gap-2">
                    <Trash2 className="h-4 w-4" /> Eliminar
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-wide text-[var(--text-secondary)] font-semibold">Nombre público</span>
                  <input value={draft.displayName} onChange={(event) => patchDraft({ displayName: event.target.value })} className="w-full rounded-xl border border-white/10 bg-black/35 px-3 py-3 text-sm text-white outline-none focus:border-brand-cyan" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-wide text-[var(--text-secondary)] font-semibold">Email visible opcional</span>
                  <input value={draft.email ?? ''} onChange={(event) => patchDraft({ email: event.target.value })} className="w-full rounded-xl border border-white/10 bg-black/35 px-3 py-3 text-sm text-white outline-none focus:border-brand-cyan" />
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-xs uppercase tracking-wide text-[var(--text-secondary)] font-semibold">Bio / slogan / descripción</span>
                  <textarea value={draft.bio} onChange={(event) => patchDraft({ bio: event.target.value })} rows={4} className="w-full rounded-xl border border-white/10 bg-black/35 px-3 py-3 text-sm text-white outline-none focus:border-brand-cyan resize-none" />
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#050816] p-5 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Sparkles className="h-5 w-5 text-brand-cyan" /> Redes sociales</h2>
              <p className="text-sm text-[var(--text-secondary)]">Seleccionar tus iconos y editar tus links.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {SOCIAL_OPTIONS.map((option) => {
                const Icon = option.icon;
                const selected = draft.socialLinks.some((social) => social.platform === option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleSocial(option.id)}
                    className={`rounded-xl border px-3 py-3 text-xs font-semibold flex items-center justify-center gap-2 ${
                      selected ? 'border-brand-cyan bg-brand-cyan/15 text-brand-cyan' : 'border-white/10 bg-black/25 text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" /> {option.label}
                  </button>
                );
              })}
            </div>

            <button type="button" onClick={() => setCustomSocialOpen((open) => !open)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> Agregar red personalizada
            </button>
            {customSocialOpen && (
              <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 rounded-xl border border-white/10 bg-black/25 p-3">
                <input value={customSocialLabel} onChange={(event) => setCustomSocialLabel(event.target.value)} placeholder="Nombre de red" className="rounded-xl border border-white/10 bg-black/35 px-3 py-3 text-sm text-white outline-none focus:border-brand-cyan" />
                <input value={customSocialUrl} onChange={(event) => setCustomSocialUrl(event.target.value)} placeholder="https://ejemplo.com/perfil" className="rounded-xl border border-white/10 bg-black/35 px-3 py-3 text-sm text-white outline-none focus:border-brand-cyan" />
                <button type="button" onClick={addCustomSocial} className="btn-brand px-4 py-3 rounded-xl text-sm">Listo</button>
              </div>
            )}

            <div className="space-y-3">
              {draft.socialLinks.map((social) => {
                const Icon = socialIcon(social.platform);
                const option = SOCIAL_OPTIONS.find((item) => item.id === social.platform);
                return (
                  <div key={social.id} className="rounded-xl border border-white/10 bg-black/25 p-3 grid lg:grid-cols-[auto_150px_1fr_auto_auto] gap-3 items-center">
                    <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-brand-cyan"><Icon className="h-4 w-4" /></div>
                    <input value={social.label ?? option?.label ?? social.platform} onChange={(event) => updateSocial(social.id, { label: event.target.value })} className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white outline-none focus:border-brand-cyan" />
                    <input value={social.url} onChange={(event) => updateSocial(social.id, { url: event.target.value })} onBlur={() => normalizeSocial(social.id)} placeholder={option?.placeholder ?? 'https://'} className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white outline-none focus:border-brand-cyan" />
                    <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                      <input type="checkbox" checked={social.active !== false} onChange={(event) => updateSocial(social.id, { active: event.target.checked })} />
                      Activo
                    </label>
                    <button type="button" onClick={() => patchDraft({ socialLinks: draft.socialLinks.filter((item) => item.id !== social.id) })} className="rounded-xl border border-white/10 p-2 text-white">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#050816] p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2"><ImageIcon className="h-5 w-5 text-brand-cyan" /> Banners de marca</h2>
                <p className="text-sm text-[var(--text-secondary)]">Gratis permite 2 banners. Pro y Business permiten 4.</p>
              </div>
              <button type="button" onClick={openNewBannerPanel} className="btn-brand px-4 py-2.5 rounded-xl text-sm inline-flex items-center gap-2">
                <Plus className="h-4 w-4" /> Añadir banner
              </button>
            </div>

            <div className="space-y-3">
              {draft.banners.map((banner, index) => (
                <div key={banner.id} className="rounded-xl border border-white/10 bg-black/25 p-3 grid lg:grid-cols-[auto_76px_1fr_auto_auto] gap-3 items-center">
                  <div className="flex lg:flex-col gap-1 text-[var(--text-secondary)]">
                    <GripVertical className="h-4 w-4" />
                    <button type="button" onClick={() => moveBanner(index, -1)} disabled={index === 0} className="disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                    <button type="button" onClick={() => moveBanner(index, 1)} disabled={index === draft.banners.length - 1} className="disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                  </div>
                  <div className={`w-20 overflow-hidden rounded-lg border border-white/10 bg-black ${aspectClass(banner.aspectRatio)}`}>
                    {banner.imageUrl ? <img src={banner.imageUrl} alt={banner.title} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center"><ImageIcon className="h-5 w-5 text-white/40" /></div>}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wide text-brand-cyan">Imagen</span>
                      <span className="text-[10px] text-[var(--text-secondary)]">Datos de clics: {banner.clicksCount ?? 0}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-white truncate">{banner.title || 'Banner sin título'}</h3>
                    <p className="text-xs text-[var(--text-secondary)] truncate">{banner.destinationUrl || 'Sin URL de destino'}</p>
                    <span className="text-[10px] text-[var(--text-secondary)]">Establecer programación</span>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <input type="checkbox" checked={banner.active !== false} onChange={(event) => patchDraft({ banners: draft.banners.map((item) => item.id === banner.id ? { ...item, active: event.target.checked } : item) })} />
                    Activo
                  </label>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => openEditBannerPanel(banner)} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-white">Editar</button>
                    <button type="button" onClick={() => removeBanner(banner.id)} className="rounded-xl border border-white/10 p-2 text-white"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}

              {draft.banners.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/15 bg-black/25 p-6 text-center text-sm text-[var(--text-secondary)]">
                  Aún no hay banners de marca.
                </div>
              )}
            </div>

            {bannerPanelOpen && (
              <div className="rounded-2xl border border-brand-cyan/30 bg-black/45 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white">Editor de banner</h3>
                  <button type="button" onClick={() => setBannerPanelOpen(false)} className="text-sm text-[var(--text-secondary)]">Cancelar</button>
                </div>

                <div className="grid lg:grid-cols-[220px_1fr] gap-4">
                  <div className="space-y-3">
                    <div className={`overflow-hidden rounded-xl border border-white/10 bg-[#050816] ${aspectClass(bannerDraft.aspectRatio)}`}>
                      {bannerDraft.imageUrl ? <img src={bannerDraft.imageUrl} alt={bannerDraft.title} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-[var(--text-secondary)]"><ImageIcon className="h-8 w-8" /></div>}
                    </div>
                    <input ref={bannerInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" hidden onChange={(event) => void handleBannerFile(event.target.files?.[0])} />
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => bannerInputRef.current?.click()} className="rounded-xl bg-white text-black py-2 text-xs font-semibold">{uploading === 'banner' ? 'Subiendo...' : 'Editar imagen'}</button>
                      <button type="button" onClick={() => setBannerDraft((prev) => ({ ...prev, imageUrl: '', imagePath: undefined }))} className="rounded-xl border border-white/10 text-white py-2 text-xs font-semibold">Eliminar</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {ASPECT_OPTIONS.map((option) => (
                        <button key={option.value} type="button" onClick={() => setBannerDraft((prev) => ({ ...prev, aspectRatio: option.value }))} className={`rounded-xl border px-3 py-2 text-xs ${bannerDraft.aspectRatio === option.value ? 'border-brand-cyan text-brand-cyan bg-brand-cyan/10' : 'border-white/10 text-white'}`}>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <input value={bannerDraft.title} onChange={(event) => setBannerDraft((prev) => ({ ...prev, title: event.target.value }))} placeholder="Título" className="w-full rounded-xl border border-white/10 bg-[#050816] px-3 py-3 text-sm text-white outline-none focus:border-brand-cyan" />
                    <label className="flex items-center gap-2 text-sm text-white">
                      <input type="checkbox" checked={Boolean(bannerDraft.description)} onChange={(event) => setBannerDraft((prev) => ({ ...prev, description: event.target.checked ? prev.description || '' : '' }))} />
                      Descripción
                    </label>
                    {bannerDraft.description !== undefined && (
                      <textarea value={bannerDraft.description} onChange={(event) => setBannerDraft((prev) => ({ ...prev, description: event.target.value }))} rows={3} placeholder="Descripción opcional" className="w-full rounded-xl border border-white/10 bg-[#050816] px-3 py-3 text-sm text-white outline-none focus:border-brand-cyan resize-none" />
                    )}
                    <label className="flex items-center gap-2 text-sm text-white">
                      <input type="checkbox" checked={bannerLinkEnabled} onChange={(event) => setBannerLinkEnabled(event.target.checked)} />
                      Añadir un link
                    </label>
                    {bannerLinkEnabled && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <button type="button" onClick={() => setBannerLinkSource('new')} className={`rounded-xl border px-3 py-2 text-xs ${bannerLinkSource === 'new' ? 'border-brand-cyan text-brand-cyan bg-brand-cyan/10' : 'border-white/10 text-white'}`}>Crear nuevo</button>
                          <button type="button" onClick={() => setBannerLinkSource('existing')} className={`rounded-xl border px-3 py-2 text-xs ${bannerLinkSource === 'existing' ? 'border-brand-cyan text-brand-cyan bg-brand-cyan/10' : 'border-white/10 text-white'}`}>Seleccionar link existente</button>
                        </div>
                        {bannerLinkSource === 'existing' && (
                          <select onChange={(event) => setBannerDraft((prev) => ({ ...prev, destinationUrl: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-[#050816] px-3 py-3 text-sm text-white outline-none focus:border-brand-cyan">
                            <option value="">Selecciona un enlace</option>
                            {links.map((link) => <option key={link.id} value={link.destination}>{link.title || link.slug || link.shortUrl}</option>)}
                          </select>
                        )}
                        <input value={bannerDraft.destinationUrl ?? ''} onChange={(event) => setBannerDraft((prev) => ({ ...prev, destinationUrl: event.target.value }))} onBlur={() => setBannerDraft((prev) => ({ ...prev, destinationUrl: prev.destinationUrl ? normalizeUrl(prev.destinationUrl) : '' }))} placeholder="URL de destino" className="w-full rounded-xl border border-white/10 bg-[#050816] px-3 py-3 text-sm text-white outline-none focus:border-brand-cyan" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-2">
                      <button type="button" onClick={saveBannerDraft} className="btn-brand px-5 py-2.5 rounded-xl text-sm">Listo</button>
                      <button type="button" onClick={() => setBannerPanelOpen(false)} className="px-5 py-2.5 rounded-xl border border-white/10 text-sm text-white">Cancelar</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#050816] p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Palette className="h-5 w-5 text-brand-cyan" /> Diseño y fondo</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-wide text-[var(--text-secondary)] font-semibold">Color de fondo</span>
                <input type="color" value={draft.backgroundColor} onChange={(event) => patchDraft({ backgroundColor: event.target.value })} className="h-12 w-full rounded-xl bg-transparent" />
              </label>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-wide text-[var(--text-secondary)] font-semibold">Color principal</span>
                <input type="color" value={draft.primaryColor} onChange={(event) => patchDraft({ primaryColor: event.target.value })} className="h-12 w-full rounded-xl bg-transparent" />
              </label>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-wide text-[var(--text-secondary)] font-semibold">Estilo de botón</span>
                <select value={draft.buttonStyle} onChange={(event) => patchDraft({ buttonStyle: event.target.value as BioPageConfig['buttonStyle'] })} className="w-full rounded-xl border border-white/10 bg-black/35 px-3 py-3 text-sm text-white outline-none focus:border-brand-cyan">
                  <option value="rounded">Redondeado</option>
                  <option value="pill">Píldora</option>
                  <option value="square">Cuadrado</option>
                  <option value="bordered">Bordeado</option>
                </select>
              </label>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/25 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">Imagen de fondo personalizada</h3>
                  <p className="text-xs text-[var(--text-secondary)]">{isFree ? 'La imagen de fondo personalizada está disponible en Pro y Business.' : 'Sube una foto desde celular o computadora.'}</p>
                </div>
                <input ref={backgroundInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" hidden onChange={(event) => void handleBackgroundFile(event.target.files?.[0])} />
                <button type="button" onClick={() => backgroundInputRef.current?.click()} disabled={isFree} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-40">
                  {uploading === 'background' ? 'Subiendo...' : 'Editar imagen'}
                </button>
              </div>
              {draft.backgroundImageUrl && (
                <div className="flex items-center gap-3">
                  <img src={draft.backgroundImageUrl} alt="Fondo" className="h-16 w-24 rounded-lg object-cover border border-white/10" />
                  <button type="button" onClick={() => void removeBackground()} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-white">Eliminar fondo</button>
                </div>
              )}
            </div>
          </section>

          <div className="sticky bottom-4 z-20 rounded-2xl border border-white/10 bg-[#050816]/95 p-4 backdrop-blur flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-sm text-[var(--text-secondary)] break-all">Link público: <span className="text-brand-cyan">{publicUrl}</span></div>
            <button type="button" onClick={() => void savePage()} disabled={saving} className="btn-brand px-5 py-3 rounded-xl text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60">
              <Save className="h-4 w-4" /> {saving ? 'Guardando...' : 'Guardar página'}
            </button>
          </div>
        </div>

        <aside className="xl:w-[360px] shrink-0 xl:sticky xl:top-24 space-y-3">
          <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
            <span>Vista previa</span>
            <span>Vista móvil</span>
          </div>
          <div className="mx-auto w-full max-w-[340px] rounded-[42px] border border-white/15 bg-black p-2 shadow-2xl">
            <div
              className="min-h-[660px] max-h-[740px] overflow-y-auto rounded-[34px] px-5 py-8 text-center"
              style={{
                backgroundColor: draft.backgroundColor || '#000',
                backgroundImage: draft.backgroundImageUrl ? `linear-gradient(${draft.backgroundOverlay || 'rgba(0,0,0,0.35)'}, ${draft.backgroundOverlay || 'rgba(0,0,0,0.35)'}), url(${draft.backgroundImageUrl})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                fontFamily: draft.font,
              }}
            >
              <div className="space-y-4">
                <InitialsAvatar name={draft.displayName} email={draft.email} imageUrl={draft.avatarUrl} size="xl" className="mx-auto" />
                <div>
                  <h3 className="text-lg font-bold text-white">{draft.displayName || 'Mi perfil JAH Link'}</h3>
                  <p className="text-xs text-white/65">@{draft.username || 'usuario'}</p>
                  <p className="mt-3 text-sm leading-relaxed text-white/80">{draft.bio || 'Conecta tus enlaces, redes y recursos en un solo lugar.'}</p>
                </div>
                {activeSocials.length > 0 && (
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {activeSocials.map((social) => {
                      const Icon = socialIcon(social.platform);
                      return (
                        <span key={social.id} className="h-9 w-9 rounded-full bg-white/12 border border-white/10 flex items-center justify-center text-white">
                          <Icon className="h-4 w-4" />
                        </span>
                      );
                    })}
                  </div>
                )}
                <div className="space-y-3 pt-2">
                  {activeBanners.map((banner) => (
                    <div key={banner.id} className={`relative overflow-hidden rounded-xl border border-white/10 ${aspectClass(banner.aspectRatio)}`}>
                      <img src={banner.imageUrl || '/brand/jah-link-logo.png'} alt={banner.title} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent flex flex-col justify-end p-3 text-left">
                        <strong className="text-sm text-white">{banner.title}</strong>
                        {banner.description && <span className="text-xs text-white/75">{banner.description}</span>}
                      </div>
                    </div>
                  ))}
                  {activeLinks.map((link) => (
                    <div key={link.id} className={`w-full py-3 px-4 text-sm font-semibold text-center ${buttonRadius(draft.buttonStyle)}`} style={{ background: draft.buttonStyle === 'bordered' ? 'transparent' : draft.primaryColor, color: draft.buttonStyle === 'bordered' ? '#fff' : '#000' }}>
                      {link.label}
                    </div>
                  ))}
                </div>
                <footer className="pt-8 flex justify-center">
                  <BrandLogo size="sm" />
                </footer>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
