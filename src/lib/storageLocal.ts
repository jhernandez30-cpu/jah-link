import type { BioPageConfig, ShortLink } from '../types';
import type { PlanId } from './plans';
import { normalizePlan } from './plans';

const KEYS = {
  links: 'jahlink:links',
  bio: 'jahlink:bio',
  user: 'jahlink:user',
  analytics: 'jahlink:analytics',
  session: 'jahlink:session',
  qr: 'jahlink:qr',
} as const;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export interface AnalyticsEvent {
  id: string;
  type: 'link_click' | 'bio_view' | 'bio_button_click';
  label: string;
  timestamp: string;
  entityType?: string;
  entityId?: string;
}

export interface StoredUser {
  id?: string;
  email: string;
  name: string;
  username?: string;
  avatarUrl?: string | null;
  plan: PlanId;
  requestedPlan?: PlanId | null;
  role?: 'user';
  membership?: string;
  status?: 'active';
  whatsapp?: string;
  country?: string;
  category?: string;
}

export interface QrCodeRecord {
  id: string;
  entityType: 'short_link' | 'bio_page';
  entityId?: string;
  targetUrl: string;
  title?: string;
  scansCount: number;
  createdAt: string;
}

export const defaultLinks: ShortLink[] = [];

export const defaultBio: BioPageConfig = {
  displayName: 'Mi perfil',
  username: 'miperfil',
  bio: '',
  avatarUrl: '',
  whatsapp: '',
  email: '',
  socialLinks: [],
  links: [],
  theme: 'Modern',
  backgroundColor: '#000000',
  primaryColor: '#006BFF',
  buttonStyle: 'rounded',
  font: 'Inter',
};

function normalizeStoredUser(user: StoredUser | null): StoredUser | null {
  if (!user) return null;
  const plan = normalizePlan(user.plan);
  const requestedPlan = user.requestedPlan ? normalizePlan(user.requestedPlan) : null;
  const legacyPersonAvatar = 'images.unsplash.com/photo-1507003211169';
  return {
    ...user,
    avatarUrl: user.avatarUrl?.includes(legacyPersonAvatar) ? null : user.avatarUrl ?? null,
    plan,
    requestedPlan,
    role: 'user',
    membership: plan === 'gratis' ? 'Miembro Gratis' : plan === 'pro' ? 'Miembro Pro' : 'Miembro Business',
    status: 'active',
  };
}

function normalizeBio(bio: BioPageConfig): BioPageConfig {
  const legacyPersonAvatar = 'images.unsplash.com/photo-1507003211169';
  return {
    ...bio,
    avatarUrl: bio.avatarUrl?.includes(legacyPersonAvatar) ? '' : bio.avatarUrl ?? '',
  };
}

export const localStore = {
  loadLinks: () => readJson(KEYS.links, defaultLinks),
  saveLinks: (links: ShortLink[]) => writeJson(KEYS.links, links),
  loadBio: () => normalizeBio(readJson(KEYS.bio, defaultBio)),
  saveBio: (bio: BioPageConfig) => writeJson(KEYS.bio, bio),
  loadUser: () => normalizeStoredUser(readJson<StoredUser | null>(KEYS.user, null)),
  saveUser: (user: StoredUser | null) => writeJson(KEYS.user, normalizeStoredUser(user)),
  isLoggedIn: () => readJson(KEYS.session, false),
  setLoggedIn: (v: boolean) => writeJson(KEYS.session, v),
  loadAnalytics: () => readJson<AnalyticsEvent[]>(KEYS.analytics, []),
  pushAnalytics: (e: Omit<AnalyticsEvent, 'id' | 'timestamp'>) => {
    const events = readJson<AnalyticsEvent[]>(KEYS.analytics, []);
    events.unshift({
      ...e,
      id: Math.random().toString(36).slice(2, 9),
      timestamp: new Date().toISOString(),
    });
    writeJson(KEYS.analytics, events.slice(0, 500));
  },
  loadQrCodes: () => readJson<QrCodeRecord[]>(KEYS.qr, []),
  saveQrCodes: (qr: QrCodeRecord[]) => writeJson(KEYS.qr, qr),
};
