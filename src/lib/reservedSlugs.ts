export const RESERVED_SLUGS = new Set([
  'dashboard',
  'login',
  'register',
  'checkout',
  'payment',
  'pricing',
  'features',
  'api',
  'u',
  'qr',
  'analytics',
  'settings',
  'configuracion',
  'enlaces',
  'bio',
  'legal',
  'privacy-policy',
  'cookie-policy',
  'terms-of-service',
  'acceptable-use-policy',
  'code-of-conduct',
  'transparency-report',
  'panel',
  'ayuda',
  'admin',
  'static',
  'assets',
  'brand',
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase().trim());
}
