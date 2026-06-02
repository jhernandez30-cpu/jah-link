import { isReservedSlug } from './reservedSlugs';

const SLUG_PATTERN = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

export function isValidSlug(slug: string): boolean {
  const normalized = slug.toLowerCase().trim();
  if (!normalized || normalized.length > 64) return false;
  if (!SLUG_PATTERN.test(normalized)) return false;
  if (isReservedSlug(normalized)) return false;
  return true;
}

export function sanitizeDisplayText(text: string, maxLength = 200): string {
  return text
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
}

export function generateSlug(): string {
  const prefixes = ['link', 'promo', 'bio', 'qr', 'camp'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
}

export function extractSlugFromShortUrl(shortUrl: string): string {
  const parts = shortUrl.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? '';
}
