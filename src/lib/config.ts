export const PUBLIC_BASE_URL = (() => {
  const configured = import.meta.env.VITE_PUBLIC_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }
  return 'https://jah-link.vercel.app';
})();

export function getPublicBioUrl(username: string): string {
  return `${PUBLIC_BASE_URL}/m/${username.trim().toLowerCase()}`;
}

export function isCustomDomainConfigured(): boolean {
  try {
    const host = new URL(PUBLIC_BASE_URL).hostname.toLowerCase();
    return host === 'jah.link' || host === 'www.jah.link';
  } catch {
    return false;
  }
}

export function getCustomDomainAdminWarning(): string | null {
  if (!isCustomDomainConfigured()) return null;
  return 'Asegúrate de que jah.link esté configurado en Vercel y DNS antes de usarlo.';
}
