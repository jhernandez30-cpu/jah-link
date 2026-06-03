import type { BioBanner, BioPageConfig, SocialLink } from '../types';

export interface BioDraftRecord {
  updatedAt: string;
  bioPageId?: string;
  userId: string;
  profileDraft: {
    displayName: string;
    username: string;
    bio: string;
    email?: string;
    whatsapp?: string;
    avatarUrl: string;
    avatarPath?: string;
    country?: string;
    category?: string;
  };
  bannersDraft: BioBanner[];
  socialLinksDraft: SocialLink[];
  themeDraft: {
    theme: BioPageConfig['theme'];
    backgroundColor: string;
    primaryColor: string;
    buttonStyle: BioPageConfig['buttonStyle'];
    font: string;
    backgroundImageUrl?: string;
    backgroundImagePath?: string;
    backgroundOverlay?: string;
    isPublic?: boolean;
  };
  qrDraft: {
    qrColor?: string;
    qrLogoEnabled?: boolean;
  };
  fullConfig: BioPageConfig;
  editorState?: {
    mode?: 'list' | 'editor';
    bannerPanelOpen?: boolean;
    bannerDraft?: BioBanner;
    bannerLinkEnabled?: boolean;
    bannerLinkSource?: 'new' | 'existing';
    imageWarning?: string;
  };
}

function safeKeyPart(value: string | undefined): string {
  return (value || 'anonymous')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.:@-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'anonymous';
}

export function getBioDraftKey(userId: string | undefined, bioPageId: string | undefined): string {
  return `jahlink:bio-draft:${safeKeyPart(userId)}:${safeKeyPart(bioPageId || 'new')}`;
}

export function saveBioDraft(userId: string | undefined, bioPageId: string | undefined, draft: BioDraftRecord): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getBioDraftKey(userId, bioPageId), JSON.stringify(draft));
  } catch (error) {
    console.warn('No se pudo guardar el borrador local de Página Bio.', error);
  }
}

export function loadBioDraft(userId: string | undefined, bioPageId: string | undefined): BioDraftRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(getBioDraftKey(userId, bioPageId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BioDraftRecord;
    if (!parsed?.updatedAt || !parsed?.fullConfig) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearBioDraft(userId: string | undefined, bioPageId: string | undefined): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(getBioDraftKey(userId, bioPageId));
}

export function hasUnsavedBioDraft(userId: string | undefined, bioPageId: string | undefined): boolean {
  return Boolean(loadBioDraft(userId, bioPageId));
}

export function buildBioDraftRecord(input: {
  userId: string;
  bioPageId?: string;
  config: BioPageConfig;
  editorState?: BioDraftRecord['editorState'];
}): BioDraftRecord {
  const { userId, bioPageId, config, editorState } = input;
  return {
    updatedAt: new Date().toISOString(),
    bioPageId,
    userId,
    profileDraft: {
      displayName: config.displayName,
      username: config.username,
      bio: config.bio,
      email: config.email,
      whatsapp: config.whatsapp,
      avatarUrl: config.avatarUrl,
      avatarPath: config.avatarPath,
      country: config.country,
      category: config.category,
    },
    bannersDraft: config.banners,
    socialLinksDraft: config.socialLinks,
    themeDraft: {
      theme: config.theme,
      backgroundColor: config.backgroundColor,
      primaryColor: config.primaryColor,
      buttonStyle: config.buttonStyle,
      font: config.font,
      backgroundImageUrl: config.backgroundImageUrl,
      backgroundImagePath: config.backgroundImagePath,
      backgroundOverlay: config.backgroundOverlay,
      isPublic: config.isPublic,
    },
    qrDraft: {
      qrColor: config.qrColor,
      qrLogoEnabled: config.qrLogoEnabled,
    },
    fullConfig: config,
    editorState,
  };
}
