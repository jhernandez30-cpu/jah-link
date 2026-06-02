/**
 * Capa de datos JAH Link — Supabase con fallback local.
 * Sin VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY usa localStorage (modo demo).
 */

import type { BioLink, BioPageConfig, ShortLink } from '../types';
import { getSupabase, isSupabaseConfigured } from './supabase';
import {
  configToBioPagePayload,
  planFromDb,
  planToDb,
  rowToShortLink,
  rowsToBioPageConfig,
} from './mappers';
import {
  canCreateShortLink,
  FREE_PLAN_LIMIT_MESSAGE,
  getMembershipLabel,
  normalizePlan,
  type PlanId,
} from './plans';
import {
  localStore,
  defaultBio,
  type AnalyticsEvent,
  type QrCodeRecord,
  type StoredUser,
} from './storageLocal';

export type { AnalyticsEvent, QrCodeRecord, StoredUser };
export { isSupabaseConfigured };

export class StorageError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'StorageError';
  }
}

export interface AnalyticsSummary {
  totalClicks: number;
  totalVisits: number;
  clicksByLink: { name: string; clicks: number }[];
  recentEvents: AnalyticsEvent[];
}

export interface RedirectResult {
  destination: string;
  isActive: boolean;
  linkId?: string;
}

export type BioPageWithId = BioPageConfig & { bioPageId?: string };

// ——— Auth ———

export async function getSession() {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session;
}

export async function signInWithEmailPassword(email: string, password: string) {
  const sb = getSupabase();
  if (!sb) {
    localStore.setLoggedIn(true);
    const existing = localStore.loadUser();
    localStore.saveUser(existing ?? {
      email,
      name: email.split('@')[0],
      avatarUrl: null,
      plan: 'gratis',
      requestedPlan: null,
      role: 'user',
      membership: 'Miembro Gratis',
      status: 'active',
    });
    return { user: { email } };
  }
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.message.includes('Invalid login')) {
      throw new StorageError('auth', 'Correo o contraseña incorrectos.');
    }
    throw new StorageError('auth', error.message);
  }
  return data;
}

export async function signUpWithEmailPassword(
  email: string,
  password: string,
  fullName: string,
  username?: string,
  requestedPlan?: PlanId | null,
) {
  const sb = getSupabase();
  const requested = normalizePlan(requestedPlan);
  const paidRequestedPlan = requested === 'gratis' ? null : requested;
  if (!sb) {
    localStore.setLoggedIn(true);
    localStore.saveUser({
      email,
      name: fullName,
      username,
      avatarUrl: null,
      plan: 'gratis',
      requestedPlan: paidRequestedPlan,
      role: 'user',
      membership: 'Miembro Gratis',
      status: 'active',
    });
    return { user: { email } };
  }
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        username: username?.toLowerCase(),
        requested_plan: paidRequestedPlan,
      },
    },
  });
  if (error) {
    if (error.message.includes('already registered')) {
      throw new StorageError('auth', 'Este correo ya está registrado.');
    }
    throw new StorageError('auth', error.message);
  }
  return data;
}

export async function signOut() {
  const sb = getSupabase();
  if (!sb) {
    localStore.setLoggedIn(false);
    localStore.saveUser(null);
    return;
  }
  await sb.auth.signOut();
}

export function onAuthStateChange(callback: (signedIn: boolean) => void) {
  const sb = getSupabase();
  if (!sb) {
    callback(localStore.isLoggedIn());
    return () => undefined;
  }
  const { data } = sb.auth.onAuthStateChange((_event, session) => {
    callback(!!session);
  });
  return () => data.subscription.unsubscribe();
}

export function isLoggedIn(): boolean {
  if (!isSupabaseConfigured()) return localStore.isLoggedIn();
  return false;
}

// ——— Perfil ———

export async function getCurrentProfile(): Promise<StoredUser | null> {
  const sb = getSupabase();
  if (!sb) return localStore.loadUser();

  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !data) {
    return {
      id: user.id,
      email: user.email ?? '',
      name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Usuario',
      avatarUrl: null,
      plan: 'gratis',
      requestedPlan: user.user_metadata?.requested_plan
        ? normalizePlan(user.user_metadata.requested_plan)
        : null,
      role: 'user',
      membership: 'Miembro Gratis',
      status: 'active',
    };
  }

  return {
    id: data.id,
    email: data.email ?? user.email ?? '',
    name: data.full_name ?? data.email?.split('@')[0] ?? 'Usuario',
    username: data.username ?? undefined,
    avatarUrl: data.avatar_url ?? null,
    plan: planFromDb(data.plan),
    requestedPlan: data.requested_plan ? normalizePlan(data.requested_plan) : null,
    role: 'user',
    membership: getMembershipLabel(data.plan),
    status: data.status === 'active' ? 'active' : 'active',
    whatsapp: data.whatsapp ?? '',
    country: data.country ?? '',
    category: data.category ?? '',
  };
}

export async function updateProfile(patch: Partial<StoredUser>): Promise<StoredUser> {
  const sb = getSupabase();
  if (!sb) {
    const current = localStore.loadUser() ?? {
      email: patch.email ?? '',
      name: patch.name ?? 'Usuario',
      plan: 'gratis' as const,
      avatarUrl: null,
      requestedPlan: null,
      role: 'user' as const,
      membership: 'Miembro Gratis',
      status: 'active' as const,
    };
    const plan = normalizePlan(current?.plan ?? 'gratis');
    const next = {
      ...current!,
      ...patch,
      plan,
      requestedPlan: patch.requestedPlan ? normalizePlan(patch.requestedPlan) : current?.requestedPlan ?? null,
      avatarUrl: patch.avatarUrl ?? current?.avatarUrl ?? null,
      role: 'user',
      membership: getMembershipLabel(plan),
      status: 'active',
    } as StoredUser;
    localStore.saveUser(next);
    return next;
  }

  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new StorageError('auth', 'Debes iniciar sesión para continuar.');

  const { data, error } = await sb
    .from('profiles')
    .update({
      full_name: patch.name,
      username: patch.username?.toLowerCase(),
      avatar_url: patch.avatarUrl === undefined ? undefined : patch.avatarUrl,
      plan: undefined,
      requested_plan: patch.requestedPlan === undefined ? undefined : patch.requestedPlan ? planToDb(patch.requestedPlan) : null,
      whatsapp: patch.whatsapp,
      country: patch.country,
      category: patch.category,
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw new StorageError('save', 'No se pudo actualizar el perfil.');

  return {
    id: data.id,
    email: data.email ?? '',
    name: data.full_name ?? '',
    username: data.username ?? undefined,
    avatarUrl: data.avatar_url ?? null,
    plan: planFromDb(data.plan),
    requestedPlan: data.requested_plan ? normalizePlan(data.requested_plan) : null,
    role: 'user',
    membership: getMembershipLabel(data.plan),
    status: data.status === 'active' ? 'active' : 'active',
    whatsapp: data.whatsapp ?? '',
    country: data.country ?? '',
    category: data.category ?? '',
  };
}

async function requireUserId(): Promise<string> {
  const sb = getSupabase();
  if (!sb) throw new StorageError('auth', 'Debes iniciar sesión para continuar.');
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new StorageError('auth', 'Sesión expirada. Debes iniciar sesión para continuar.');
  return user.id;
}

// ——— Enlaces cortos ———

export async function getShortLinks(): Promise<ShortLink[]> {
  if (!isSupabaseConfigured()) return localStore.loadLinks();

  const userId = await requireUserId();
  const sb = getSupabase()!;
  const { data, error } = await sb
    .from('short_links')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new StorageError('load', 'No se pudo cargar la información.');
  return (data ?? []).map(rowToShortLink);
}

export async function createShortLink(input: {
  title: string;
  destination: string;
  slug: string;
  isActive?: boolean;
}): Promise<ShortLink> {
  if (!isSupabaseConfigured()) {
    const links = localStore.loadLinks();
    const profile = localStore.loadUser();
    if (!canCreateShortLink(profile?.plan ?? 'gratis', links.length)) {
      throw new StorageError('plan_limit', FREE_PLAN_LIMIT_MESSAGE);
    }
    const item: ShortLink = {
      id: crypto.randomUUID(),
      shortUrl: `jah.link/${input.slug}`,
      destination: input.destination,
      slug: input.slug,
      title: input.title,
      clicks: 0,
      status: 'Active',
      active: true,
      domain: 'jah.link',
      passwordProtected: false,
      expirationEnabled: false,
      createdAt: new Date().toLocaleDateString('es-ES'),
    };
    localStore.saveLinks([item, ...links]);
    return item;
  }

  const userId = await requireUserId();
  const sb = getSupabase()!;
  const [{ count }, profile] = await Promise.all([
    sb.from('short_links').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    getCurrentProfile(),
  ]);
  if (!canCreateShortLink(profile?.plan ?? 'gratis', count ?? 0)) {
    throw new StorageError('plan_limit', FREE_PLAN_LIMIT_MESSAGE);
  }
  const { data, error } = await sb
    .from('short_links')
    .insert({
      user_id: userId,
      title: input.title,
      destination_url: input.destination,
      slug: input.slug.toLowerCase(),
      is_active: input.isActive ?? true,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new StorageError('slug_taken', 'Este slug ya está en uso.');
    }
    throw new StorageError('save', 'No se pudo guardar el enlace.');
  }
  return rowToShortLink(data);
}

export async function updateShortLink(
  id: string,
  patch: Partial<{ title: string; destination: string; slug: string; isActive: boolean }>,
): Promise<ShortLink> {
  if (!isSupabaseConfigured()) {
    const links = localStore.loadLinks().map((l) => {
      if (l.id !== id) return l;
      const slug = patch.slug ?? l.slug ?? '';
      return {
        ...l,
        title: patch.title ?? l.title,
        destination: patch.destination ?? l.destination,
        slug,
        shortUrl: `jah.link/${slug}`,
        active: patch.isActive ?? l.active,
        status: patch.isActive === false ? 'Draft' as const : 'Active' as const,
      };
    });
    localStore.saveLinks(links);
    return links.find((l) => l.id === id)!;
  }

  await requireUserId();
  const sb = getSupabase()!;
  const payload: Record<string, unknown> = {};
  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.destination !== undefined) payload.destination_url = patch.destination;
  if (patch.slug !== undefined) payload.slug = patch.slug.toLowerCase();
  if (patch.isActive !== undefined) payload.is_active = patch.isActive;

  const { data, error } = await sb
    .from('short_links')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') throw new StorageError('slug_taken', 'Este slug ya está en uso.');
    throw new StorageError('save', 'No se pudo guardar el enlace.');
  }
  return rowToShortLink(data);
}

export async function deleteShortLink(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    localStore.saveLinks(localStore.loadLinks().filter((l) => l.id !== id));
    return;
  }
  await requireUserId();
  const sb = getSupabase()!;
  const { error } = await sb.from('short_links').delete().eq('id', id);
  if (error) throw new StorageError('delete', 'No se pudo eliminar el enlace.');
}

export async function getShortLinkBySlug(slug: string): Promise<ShortLink | null> {
  if (!isSupabaseConfigured()) {
    const found = localStore.loadLinks().find(
      (l) => (l.slug ?? '').toLowerCase() === slug.toLowerCase(),
    );
    return found ?? null;
  }

  const sb = getSupabase()!;
  const { data, error } = await sb
    .from('short_links')
    .select('*')
    .eq('slug', slug.toLowerCase())
    .maybeSingle();

  if (error || !data) return null;
  return rowToShortLink(data);
}

export async function resolveSlugRedirect(slug: string): Promise<RedirectResult | null> {
  if (!isSupabaseConfigured()) {
    const link = await getShortLinkBySlug(slug);
    if (!link) return null;
    const active = link.active !== false && link.status !== 'Expired';
    if (active) {
      const links = localStore.loadLinks().map((l) =>
        l.id === link.id ? { ...l, clicks: l.clicks + 1 } : l,
      );
      localStore.saveLinks(links);
      localStore.pushAnalytics({ type: 'link_click', label: slug });
    }
    return { destination: link.destination, isActive: active, linkId: link.id };
  }

  const sb = getSupabase()!;
  const { data, error } = await sb.rpc('resolve_short_link_redirect', { p_slug: slug });

  if (error || !data || (Array.isArray(data) && data.length === 0)) return null;

  const row = Array.isArray(data) ? data[0] : data;
  return {
    destination: row.destination_url,
    isActive: row.is_active,
    linkId: row.link_id,
  };
}

// ——— Bio ———

export async function getBioPage(): Promise<BioPageWithId> {
  if (!isSupabaseConfigured()) return { ...localStore.loadBio(), bioPageId: undefined };

  const userId = await requireUserId();
  const sb = getSupabase()!;
  const { data: page, error } = await sb
    .from('bio_pages')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new StorageError('load', 'No se pudo cargar la información.');
  if (!page) return { ...defaultBio, bioPageId: undefined };

  const { data: links } = await sb
    .from('bio_links')
    .select('*')
    .eq('bio_page_id', page.id)
    .order('position');

  return rowsToBioPageConfig(page, links ?? []);
}

export async function getPublicBioPageByUsername(username: string): Promise<BioPageWithId | null> {
  if (!isSupabaseConfigured()) {
    const bio = localStore.loadBio();
    if (bio.username.toLowerCase() !== username.toLowerCase()) return null;
    return { ...bio, bioPageId: undefined };
  }

  const sb = getSupabase()!;
  const { data: page, error } = await sb
    .from('bio_pages')
    .select('*')
    .eq('username', username.toLowerCase())
    .eq('is_public', true)
    .maybeSingle();

  if (error || !page) return null;

  const { data: links } = await sb
    .from('bio_links')
    .select('*')
    .eq('bio_page_id', page.id)
    .eq('is_active', true)
    .order('position');

  return rowsToBioPageConfig(page, links ?? []);
}

export async function upsertBioPage(config: BioPageConfig): Promise<BioPageWithId> {
  if (!isSupabaseConfigured()) {
    localStore.saveBio(config);
    return { ...config, bioPageId: undefined };
  }

  const userId = await requireUserId();
  const sb = getSupabase()!;

  const { data: existing } = await sb
    .from('bio_pages')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  let pageId: string;

  if (existing?.id) {
    const { user_id: _uid, ...updatePayload } = configToBioPagePayload(userId, config, existing.id);
    const { data, error } = await sb
      .from('bio_pages')
      .update(updatePayload)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) {
      if (error.code === '23505') throw new StorageError('slug_taken', 'Este nombre de usuario ya está en uso.');
      throw new StorageError('save', 'No se pudo guardar la página bio.');
    }
    pageId = data.id;
  } else {
    const insertPayload = configToBioPagePayload(userId, config);
    const { data, error } = await sb.from('bio_pages').insert(insertPayload).select().single();
    if (error) {
      if (error.code === '23505') throw new StorageError('slug_taken', 'Este nombre de usuario ya está en uso.');
      throw new StorageError('save', 'No se pudo guardar la página bio.');
    }
    pageId = data.id;
  }

  await sb.from('bio_links').delete().eq('bio_page_id', pageId);

  if (config.links.length > 0) {
    const rows = config.links.map((link, i) => ({
      bio_page_id: pageId,
      title: link.label,
      url: link.url,
      icon: link.platform,
      position: i,
      is_active: link.active !== false,
    }));
    const { error: linksError } = await sb.from('bio_links').insert(rows);
    if (linksError) throw new StorageError('save', 'No se pudieron guardar los botones.');
  }

  return getBioPage();
}

export async function incrementBioPageView(username: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    localStore.pushAnalytics({ type: 'bio_view', label: username });
    return;
  }
  const sb = getSupabase()!;
  await sb.rpc('track_bio_page_view', { p_username: username });
}

export async function incrementBioLinkClick(linkId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    localStore.pushAnalytics({ type: 'bio_button_click', label: linkId });
    return;
  }
  const sb = getSupabase()!;
  await sb.rpc('track_bio_link_click', { p_link_id: linkId });
}

// ——— QR ———

export async function getQrCodes(): Promise<QrCodeRecord[]> {
  if (!isSupabaseConfigured()) return localStore.loadQrCodes();

  const userId = await requireUserId();
  const sb = getSupabase()!;
  const { data, error } = await sb
    .from('qr_codes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new StorageError('load', 'No se pudo cargar la información.');
  return (data ?? []).map((r) => ({
    id: r.id,
    entityType: r.entity_type as 'short_link' | 'bio_page',
    entityId: r.entity_id ?? undefined,
    targetUrl: r.target_url,
    title: r.title ?? undefined,
    scansCount: r.scans_count,
    createdAt: r.created_at,
  }));
}

export async function createQrCode(input: {
  entityType: string;
  entityId?: string;
  targetUrl: string;
  title?: string;
}): Promise<QrCodeRecord> {
  if (!isSupabaseConfigured()) {
    const item: QrCodeRecord = {
      id: crypto.randomUUID(),
      entityType: input.entityType as 'short_link' | 'bio_page',
      entityId: input.entityId,
      targetUrl: input.targetUrl,
      title: input.title,
      scansCount: 0,
      createdAt: new Date().toISOString(),
    };
    const all = [item, ...localStore.loadQrCodes()];
    localStore.saveQrCodes(all);
    return item;
  }

  const userId = await requireUserId();
  const sb = getSupabase()!;
  const { data, error } = await sb
    .from('qr_codes')
    .insert({
      user_id: userId,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      target_url: input.targetUrl,
      title: input.title ?? null,
    })
    .select()
    .single();

  if (error) throw new StorageError('save', 'No se pudo crear el código QR.');

  return {
    id: data.id,
    entityType: data.entity_type as 'short_link' | 'bio_page',
    entityId: data.entity_id ?? undefined,
    targetUrl: data.target_url,
    title: data.title ?? undefined,
    scansCount: data.scans_count,
    createdAt: data.created_at,
  };
}

export async function deleteQrCode(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    localStore.saveQrCodes(localStore.loadQrCodes().filter((q) => q.id !== id));
    return;
  }
  await requireUserId();
  const sb = getSupabase()!;
  const { error } = await sb.from('qr_codes').delete().eq('id', id);
  if (error) throw new StorageError('delete', 'No se pudo eliminar el código QR.');
}

// ——— Analítica ———

export async function trackAnalyticsEvent(event: {
  entityType: string;
  entityId?: string;
  eventType: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!isSupabaseConfigured()) {
    localStore.pushAnalytics({
      type: event.eventType as AnalyticsEvent['type'],
      label: event.entityId ?? event.entityType,
    });
    return;
  }

  const sb = getSupabase()!;
  let userId: string | null = null;
  try {
    userId = await requireUserId();
  } catch {
    userId = null;
  }

  await sb.from('analytics_events').insert({
    user_id: userId,
    entity_type: event.entityType,
    entity_id: event.entityId ?? null,
    event_type: event.eventType,
    metadata: event.metadata ?? {},
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
  });
}

export async function getAnalyticsEvents(limit = 100): Promise<AnalyticsEvent[]> {
  if (!isSupabaseConfigured()) return localStore.loadAnalytics();

  const userId = await requireUserId();
  const sb = getSupabase()!;
  const { data, error } = await sb
    .from('analytics_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new StorageError('load', 'No se pudo cargar la información.');

  return (data ?? []).map((e) => ({
    id: e.id,
    type: mapEventType(e.event_type),
    label: (e.metadata as { slug?: string; username?: string })?.slug
      ?? (e.metadata as { username?: string })?.username
      ?? e.entity_type,
    timestamp: e.created_at,
    entityType: e.entity_type,
    entityId: e.entity_id ?? undefined,
  }));
}

function mapEventType(t: string): AnalyticsEvent['type'] {
  if (t === 'bio_view') return 'bio_view';
  if (t === 'bio_button_click') return 'bio_button_click';
  return 'link_click';
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const links = await getShortLinks();
  const events = await getAnalyticsEvents(200);

  const totalClicks =
    links.reduce((s, l) => s + l.clicks, 0) +
    events.filter((e) => e.type === 'link_click').length;

  const bioViews = events.filter((e) => e.type === 'bio_view').length;

  return {
    totalClicks,
    totalVisits: totalClicks + bioViews,
    clicksByLink: links.map((l) => ({
      name: l.slug ?? l.shortUrl,
      clicks: l.clicks,
    })),
    recentEvents: events,
  };
}

// ——— Storage avatar ———

export async function uploadAvatar(file: File): Promise<string> {
  const sb = getSupabase();
  if (!sb) throw new StorageError('storage', 'Supabase no configurado para subir archivos.');

  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    throw new StorageError('validation', 'Formato no válido. Usa JPG, PNG o WebP.');
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new StorageError('validation', 'El archivo debe pesar menos de 2 MB.');
  }

  const userId = await requireUserId();
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await sb.storage.from('avatars').upload(path, file, {
    upsert: true,
    cacheControl: '3600',
  });

  if (error) {
    throw new StorageError('storage', 'No se pudo subir la imagen. Verifica el bucket "avatars" en Supabase.');
  }

  const { data } = sb.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}

// Compatibilidad con código anterior
export { defaultBio } from './storageLocal';
export const defaultLinks: ShortLink[] = [];
export function loadLinks() { return localStore.loadLinks(); }
export function saveLinks(links: ShortLink[]) { localStore.saveLinks(links); }
export function loadBio() { return localStore.loadBio(); }
export function saveBio(bio: BioPageConfig) { localStore.saveBio(bio); }
export function loadUser() { return localStore.loadUser(); }
export function saveUser(user: StoredUser | null) { localStore.saveUser(user); }
export function setLoggedIn(v: boolean) { localStore.setLoggedIn(v); }
export function loadAnalytics() { return localStore.loadAnalytics(); }
export function pushAnalyticsEvent(e: Omit<AnalyticsEvent, 'id' | 'timestamp'>) {
  localStore.pushAnalytics(e);
}
