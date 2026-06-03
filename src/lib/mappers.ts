import type { BioBanner, BioLink, BioPageConfig, ShortLink, SocialLink } from '../types';
import type { Database } from './supabase';
import { normalizePlan, type PlanId } from './plans';

type ShortLinkRow = Database['public']['Tables']['short_links']['Row'];
type BioPageRow = Database['public']['Tables']['bio_pages']['Row'];
type BioLinkRow = Database['public']['Tables']['bio_links']['Row'];
type BioBannerRow = Database['public']['Tables']['bio_banners']['Row'];
type SocialLinkRow = Database['public']['Tables']['social_links']['Row'];

const DOMAIN = 'jah.link';

export function formatDateEs(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function planFromDb(plan: string): PlanId {
  return normalizePlan(plan);
}

export function planToDb(plan: string): string {
  return normalizePlan(plan);
}

export function rowToShortLink(row: ShortLinkRow): ShortLink {
  return {
    id: row.id,
    shortUrl: `${DOMAIN}/${row.slug}`,
    destination: row.destination_url,
    clicks: row.clicks_count,
    status: row.is_active ? 'Active' : 'Draft',
    active: row.is_active,
    slug: row.slug,
    title: row.title,
    domain: DOMAIN,
    passwordProtected: false,
    expirationEnabled: false,
    createdAt: formatDateEs(row.created_at),
  };
}

function parseSocialLinks(raw: unknown): SocialLink[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is SocialLink => typeof x === 'object' && x !== null && 'platform' in x && 'url' in x)
    .map((x, i) => ({
      id: (x as SocialLink).id ?? `s-${i}`,
      platform: String((x as SocialLink).platform),
      label: (x as SocialLink).label ? String((x as SocialLink).label) : String((x as SocialLink).platform),
      url: String((x as SocialLink).url),
      icon: (x as SocialLink).icon ? String((x as SocialLink).icon) : String((x as SocialLink).platform),
      active: (x as SocialLink).active !== false,
      position: (x as SocialLink).position ?? i,
      clicksCount: (x as SocialLink).clicksCount ?? 0,
    }));
}

function mapButtonStyle(style: string): BioPageConfig['buttonStyle'] {
  if (style === 'pill') return 'pill';
  if (style === 'square') return 'square';
  if (style === 'bordered' || style === 'outline') return 'bordered';
  return 'rounded';
}

export function rowsToBioPageConfig(
  page: BioPageRow,
  links: BioLinkRow[],
  banners: BioBannerRow[] = [],
  socialRows: SocialLinkRow[] = [],
): BioPageConfig & { bioPageId: string } {
  const mappedLinks = links
    .sort((a, b) => a.position - b.position)
    .map((l) => ({
      id: l.id,
      label: l.title,
      url: l.url,
      platform: l.icon ?? 'Website',
      active: l.is_active,
      clicksCount: l.clicks_count,
    }));
  const mappedBanners: BioBanner[] = banners
    .sort((a, b) => a.position - b.position)
    .map((banner) => ({
      id: banner.id,
      title: banner.title,
      description: banner.description ?? '',
      imageUrl: banner.image_url ?? '',
      imagePath: banner.image_path ?? undefined,
      destinationUrl: banner.destination_url ?? '',
      aspectRatio: banner.aspect_ratio,
      active: banner.is_active,
      position: banner.position,
      clicksCount: banner.clicks_count,
      createdAt: banner.created_at,
      updatedAt: banner.updated_at,
    }));
  const mappedSocialLinks = socialRows.length > 0
    ? socialRows
      .sort((a, b) => a.position - b.position)
      .map((row) => ({
        id: row.id,
        platform: row.platform,
        label: row.label ?? row.platform,
        url: row.url,
        icon: row.icon ?? row.platform,
        active: row.is_active,
        position: row.position,
        clicksCount: row.clicks_count,
      }))
    : parseSocialLinks(page.social_links);
  const interactionsCount =
    mappedLinks.reduce((sum, link) => sum + (link.clicksCount ?? 0), 0) +
    mappedBanners.reduce((sum, banner) => sum + (banner.clicksCount ?? 0), 0) +
    mappedSocialLinks.reduce((sum, social) => sum + (social.clicksCount ?? 0), 0);

  return {
    bioPageId: page.id,
    displayName: page.display_name,
    username: page.username,
    bio: page.bio ?? '',
    avatarUrl: page.avatar_url ?? '',
    avatarPath: page.avatar_path ?? undefined,
    whatsapp: page.whatsapp ?? '',
    email: page.email ?? '',
    category: page.category ?? '',
    country: page.country ?? '',
    socialLinks: mappedSocialLinks,
    links: mappedLinks,
    banners: mappedBanners,
    theme: page.theme === 'classic' ? 'Classic' : 'Modern',
    backgroundColor: page.background_value,
    primaryColor: page.primary_color,
    buttonStyle: mapButtonStyle(page.button_style),
    font: page.font ?? 'Inter',
    backgroundImageUrl: page.background_image_url ?? '',
    backgroundImagePath: page.background_image_path ?? undefined,
    backgroundOverlay: page.background_overlay ?? 'rgba(0,0,0,0.35)',
    isPublic: page.is_public,
    viewsCount: page.views_count,
    interactionsCount,
    createdAt: page.created_at,
    updatedAt: page.updated_at,
  };
}

export function bioLinkToInsert(
  bioPageId: string,
  link: BioLink,
  position: number,
): Omit<BioLinkRow, 'id' | 'created_at' | 'updated_at' | 'clicks_count'> & { id?: string } {
  return {
    bio_page_id: bioPageId,
    title: link.label,
    url: link.url,
    description: null,
    icon: link.platform,
    position,
    is_active: link.active !== false,
  };
}

export function configToBioPagePayload(
  userId: string,
  config: BioPageConfig,
  existingId?: string,
) {
  const hasBackgroundImage = Boolean(config.backgroundImageUrl);
  return {
    ...(existingId ? { id: existingId } : {}),
    user_id: userId,
    username: config.username.toLowerCase().trim(),
    display_name: config.displayName,
    bio: config.bio,
    avatar_url: config.avatarUrl || null,
    avatar_path: config.avatarPath || null,
    whatsapp: config.whatsapp || null,
    email: config.email || null,
    category: config.category || null,
    country: config.country || null,
    theme: config.theme === 'Classic' ? 'classic' : 'dark',
    primary_color: config.primaryColor,
    button_style: config.buttonStyle,
    background_type: hasBackgroundImage ? 'image' : 'solid',
    background_value: config.backgroundColor,
    social_links: config.socialLinks,
    font: config.font,
    background_image_url: config.backgroundImageUrl || null,
    background_image_path: config.backgroundImagePath || null,
    background_overlay: config.backgroundOverlay || null,
    is_public: config.isPublic !== false,
  };
}
