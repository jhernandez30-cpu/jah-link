import type { BioLink, BioPageConfig, ShortLink, SocialLink } from '../types';
import type { Database } from './supabase';
import { normalizePlan, type PlanId } from './plans';

type ShortLinkRow = Database['public']['Tables']['short_links']['Row'];
type BioPageRow = Database['public']['Tables']['bio_pages']['Row'];
type BioLinkRow = Database['public']['Tables']['bio_links']['Row'];

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
      url: String((x as SocialLink).url),
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
): BioPageConfig & { bioPageId: string } {
  return {
    bioPageId: page.id,
    displayName: page.display_name,
    username: page.username,
    bio: page.bio ?? '',
    avatarUrl: page.avatar_url ?? '',
    whatsapp: page.whatsapp ?? '',
    email: page.email ?? '',
    socialLinks: parseSocialLinks(page.social_links),
    links: links
      .sort((a, b) => a.position - b.position)
      .map((l) => ({
        id: l.id,
        label: l.title,
        url: l.url,
        platform: l.icon ?? 'Website',
        active: l.is_active,
      })),
    theme: page.theme === 'classic' ? 'Classic' : 'Modern',
    backgroundColor: page.background_value,
    primaryColor: page.primary_color,
    buttonStyle: mapButtonStyle(page.button_style),
    font: page.font ?? 'Inter',
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
  return {
    ...(existingId ? { id: existingId } : {}),
    user_id: userId,
    username: config.username.toLowerCase().trim(),
    display_name: config.displayName,
    bio: config.bio,
    avatar_url: config.avatarUrl || null,
    whatsapp: config.whatsapp || null,
    email: config.email || null,
    theme: config.theme === 'Classic' ? 'classic' : 'dark',
    primary_color: config.primaryColor,
    button_style: config.buttonStyle,
    background_type: 'solid',
    background_value: config.backgroundColor,
    social_links: config.socialLinks,
    font: config.font,
    is_public: true,
  };
}
