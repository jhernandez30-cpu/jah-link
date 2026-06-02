import { isReservedSlug } from './reservedSlugs';

const SLUG_PATTERN = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;
const URL_PROTOCOL_PATTERN = /^[a-z][a-z0-9+.-]*:\/\//i;

export function normalizeDestinationUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (!URL_PROTOCOL_PATTERN.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

export function isValidDestinationUrl(input: string): boolean {
  try {
    const parsed = new URL(input);
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      Boolean(parsed.hostname) &&
      !/\s/.test(input)
    );
  } catch {
    return false;
  }
}

function slugSeedFromUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(normalizeDestinationUrl(trimmed));
    const pathSegment = parsed.pathname
      .split('/')
      .map((part) => part.trim())
      .filter(Boolean)
      .pop();
    if (pathSegment) return pathSegment;

    const hostParts = parsed.hostname
      .replace(/^www\./i, '')
      .split('.')
      .filter(Boolean);
    return hostParts[0] ?? null;
  } catch {
    return null;
  }
}

export function sanitizeSlug(input: string): string {
  const urlSeed = URL_PROTOCOL_PATTERN.test(input.trim()) || input.includes('/')
    ? slugSeedFromUrl(input)
    : null;
  const seed = urlSeed ?? input;

  return seed
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[\\/]+/g, '-')
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '')
    .slice(0, 64);
}

export function normalizeUrl(url: string): string {
  return normalizeDestinationUrl(url);
}

export function isValidUrl(url: string): boolean {
  return isValidDestinationUrl(url);
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

export function generateSlug(seed?: string): string {
  const sanitized = seed ? sanitizeSlug(seed) : '';
  if (sanitized && !isReservedSlug(sanitized)) return sanitized;

  const prefixes = ['link', 'promo', 'bio', 'qr', 'camp'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
}

export function extractSlugFromShortUrl(shortUrl: string): string {
  const parts = shortUrl.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? '';
}
