export const RESERVED_SLUGS = new Set([
  'dashboard',
  'login',
  'register',
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
