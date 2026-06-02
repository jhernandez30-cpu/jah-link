/**
 * Capa de datos JAH Link — Supabase con fallback local.
 * Sin VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY usa localStorage solo en desarrollo local (modo demo).
 */

import type { BioLink, BioPageConfig, ShortLink } from '../types';
import { DEMO_MODE_MESSAGE, getSupabase, isDemoMode, isSupabaseConfigured } from './supabase';
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
  buildPendingPayment,
  isPaidCheckoutPlan,
  type PaidPlanId,
  type PendingPayment,
  type PaymentStatus,
  type PlanPayment,
} from './payments';
import { isValidDestinationUrl, isValidSlug, normalizeDestinationUrl, sanitizeSlug } from './validation';
import {
  localStore,
  defaultBio,
  type AnalyticsEvent,
  type QrCodeRecord,
  type StoredUser,
} from './storageLocal';

export type { AnalyticsEvent, QrCodeRecord, StoredUser };
export type { PaidPlanId, PendingPayment, PlanPayment };
export { DEMO_MODE_MESSAGE, isDemoMode, isSupabaseConfigured };

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
export type PublicShortLink = {
  id: string;
  title: string;
  destination: string;
  slug: string;
  isActive: boolean;
  clicks: number;
};
type DbEventType = 'view' | 'click' | 'scan';
type DbEntityType = 'short_link' | 'bio_page' | 'bio_link' | 'qr_code';
type QrEntityType = 'short_link' | 'bio_page' | 'custom';

function mapDbEventType(eventType: string): DbEventType {
  if (eventType === 'view' || eventType === 'bio_view') return 'view';
  if (eventType === 'scan') return 'scan';
  return 'click';
}

function mapLocalEventType(eventType: string, entityType?: string): AnalyticsEvent['type'] {
  if (eventType === 'bio_view' || (eventType === 'view' && entityType === 'bio_page')) return 'bio_view';
  if (eventType === 'bio_button_click' || entityType === 'bio_link') return 'bio_button_click';
  return 'link_click';
}

function mapDbEntityType(entityType: string): DbEntityType {
  if (entityType === 'bio_page' || entityType === 'bio_link' || entityType === 'qr_code') return entityType;
  return 'short_link';
}

function mapQrEntityType(entityType: string): QrEntityType {
  if (entityType === 'bio_page' || entityType === 'custom') return entityType;
  return 'short_link';
}

function bioLinkFromRow(row: {
  id: string;
  title: string;
  url: string;
  icon: string | null;
  is_active: boolean;
}): BioLink {
  return {
    id: row.id,
    label: row.title,
    url: row.url,
    platform: row.icon ?? 'Website',
    active: row.is_active,
  };
}

// ——— Auth ———

export async function getSession() {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session;
}

export async function signInWithEmailPassword(email: string, password: string) {
  const sb = getSupabase();
  if (!sb && isDemoMode()) {
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
  if (!sb) {
    throw new StorageError('config', 'Supabase no está configurado para iniciar sesión.');
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
  if (!sb && isDemoMode()) {
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
  if (!sb) {
    throw new StorageError('config', 'Supabase no está configurado para registrar usuarios.');
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
  if (!sb && isDemoMode()) {
    localStore.setLoggedIn(false);
    localStore.saveUser(null);
    return;
  }
  if (!sb) return;
  await sb.auth.signOut();
}

export function onAuthStateChange(callback: (signedIn: boolean) => void) {
  const sb = getSupabase();
  if (!sb) {
    callback(isDemoMode() ? localStore.isLoggedIn() : false);
    return () => undefined;
  }
  const { data } = sb.auth.onAuthStateChange((_event, session) => {
    callback(!!session);
  });
  return () => data.subscription.unsubscribe();
}

export function isLoggedIn(): boolean {
  if (isDemoMode()) return localStore.isLoggedIn();
  return false;
}

// ——— Perfil ———

export async function getCurrentProfile(): Promise<StoredUser | null> {
  const sb = getSupabase();
  if (!sb) return isDemoMode() ? localStore.loadUser() : null;

  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !data) {
    const fullName = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Usuario';
    const username = String(user.user_metadata?.username ?? user.email?.split('@')[0] ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '');
    const requestedPlan = user.user_metadata?.requested_plan
      ? normalizePlan(user.user_metadata.requested_plan)
      : null;
    const { data: inserted } = await sb
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email ?? '',
        full_name: fullName,
        username: username || `user_${user.id.replaceAll('-', '').slice(0, 8)}`,
        avatar_url: null,
        plan: 'gratis',
        requested_plan: requestedPlan,
        role: 'user',
        membership: 'Miembro Gratis',
        status: 'active',
      }, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (inserted) {
      return {
        id: inserted.id,
        email: inserted.email ?? user.email ?? '',
        name: inserted.full_name ?? fullName,
        username: inserted.username ?? undefined,
        avatarUrl: inserted.avatar_url ?? null,
        plan: planFromDb(inserted.plan),
        requestedPlan: inserted.requested_plan ? normalizePlan(inserted.requested_plan) : null,
        role: 'user',
        membership: inserted.membership ?? getMembershipLabel(inserted.plan),
        status: 'active',
        whatsapp: inserted.whatsapp ?? '',
        country: inserted.country ?? '',
        category: inserted.category ?? '',
      };
    }

    return {
      id: user.id,
      email: user.email ?? '',
      name: fullName,
      username: username || undefined,
      avatarUrl: null,
      plan: 'gratis',
      requestedPlan,
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
    membership: data.membership ?? getMembershipLabel(data.plan),
    status: data.status === 'active' ? 'active' : 'active',
    whatsapp: data.whatsapp ?? '',
    country: data.country ?? '',
    category: data.category ?? '',
  };
}

export async function updateProfile(patch: Partial<StoredUser>): Promise<StoredUser> {
  const sb = getSupabase();
  if (!sb && isDemoMode()) {
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
  if (!sb) throw new StorageError('config', 'Supabase no está configurado para guardar el perfil.');

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
    membership: data.membership ?? getMembershipLabel(data.plan),
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

type PaymentRow = {
  id: string;
  user_id: string;
  plan: string;
  amount: number;
  currency: string;
  provider: string;
  provider_payment_url: string | null;
  provider_order_id?: string | null;
  provider_capture_id?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

function normalizePaymentStatus(status: string): PaymentStatus {
  if (status === 'confirmed') return 'completed';
  if (
    status === 'pending' ||
    status === 'approved' ||
    status === 'completed' ||
    status === 'failed' ||
    status === 'cancelled' ||
    status === 'refunded'
  ) {
    return status;
  }
  return 'pending';
}

function paymentFromRow(row: PaymentRow): PlanPayment | null {
  if (!isPaidCheckoutPlan(row.plan)) return null;
  const fallback = buildPendingPayment(row.plan);
  const status = normalizePaymentStatus(row.status);
  return {
    id: row.id,
    userId: row.user_id,
    plan: row.plan,
    pendingPlan: row.plan,
    amount: Number(row.amount),
    currency: row.currency === 'USD' ? 'USD' : fallback.currency,
    provider: 'paypal',
    paymentProvider: 'paypal',
    status,
    paymentStatus: status,
    providerPaymentUrl: row.provider_payment_url ?? fallback.providerPaymentUrl,
    paymentUrl: row.provider_payment_url ?? fallback.providerPaymentUrl,
    providerOrderId: row.provider_order_id ?? null,
    providerCaptureId: row.provider_capture_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getPendingPayment(): Promise<PendingPayment | null> {
  const local = localStore.loadPendingPayment();
  const sb = getSupabase();
  if (!sb) return local;

  const { data: { user } } = await sb.auth.getUser();
  if (!user) return local;

  const { data, error } = await sb
    .from('payments')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return local;

  const rowPayment = paymentFromRow(data as PaymentRow);
  const payment = rowPayment?.status === 'pending' ? rowPayment as PendingPayment : null;
  if (payment) localStore.savePendingPayment(payment);
  return payment ?? local;
}

export async function getRecentPayments(limit = 10): Promise<PlanPayment[]> {
  const local = localStore.loadPendingPayment();
  const sb = getSupabase();
  if (!sb) return local ? [local] : [];

  const { data: { user } } = await sb.auth.getUser();
  if (!user) return local ? [local] : [];

  const { data, error } = await sb
    .from('payments')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return local ? [local] : [];
  return data
    .map((row) => paymentFromRow(row as PaymentRow))
    .filter((payment): payment is PlanPayment => Boolean(payment));
}

export async function createPendingPayment(plan: PaidPlanId): Promise<PendingPayment> {
  const pending = buildPendingPayment(plan);
  const local = localStore.loadPendingPayment();
  const sb = getSupabase();

  if (!sb) {
    if (local?.plan === plan && local.status === 'pending') return local;
    localStore.savePendingPayment(pending);
    return pending;
  }

  const userId = await requireUserId();
  await sb
    .from('profiles')
    .update({ requested_plan: plan })
    .eq('id', userId);

  const { data: existing } = await sb
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .eq('plan', plan)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const existingPayment = existing ? paymentFromRow(existing as PaymentRow) : null;
  if (existingPayment?.status === 'pending') {
    const pendingExisting = existingPayment as PendingPayment;
    localStore.savePendingPayment(pendingExisting);
    return pendingExisting;
  }

  const { data, error } = await sb
    .from('payments')
    .insert({
      user_id: userId,
      plan,
      amount: pending.amount,
      currency: pending.currency,
      provider: pending.provider,
      status: pending.status,
      provider_payment_url: pending.providerPaymentUrl,
      raw_response: { source: 'paypal_hosted_buttons_checkout' },
    })
    .select()
    .single();

  if (error || !data) {
    const fallback = { ...pending, userId };
    localStore.savePendingPayment(fallback);
    return fallback;
  }

  const rowPayment = paymentFromRow(data as PaymentRow);
  const payment = rowPayment?.status === 'pending'
    ? rowPayment as PendingPayment
    : { ...pending, userId };
  localStore.savePendingPayment(payment);
  return payment;
}

export async function getShortLinks(): Promise<ShortLink[]> {
  if (isDemoMode()) return localStore.loadLinks();

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
  const destination = normalizeDestinationUrl(input.destination);
  if (!isValidDestinationUrl(destination)) {
    throw new StorageError('url', 'Ingresa una URL válida. Ejemplo: https://ejemplo.com');
  }
  const slug = sanitizeSlug(input.slug);
  if (!isValidSlug(slug)) {
    throw new StorageError('slug', 'Este slug está reservado o no es válido.');
  }

  if (isDemoMode()) {
    const links = localStore.loadLinks();
    const profile = localStore.loadUser();
    if (!canCreateShortLink(profile?.plan ?? 'gratis', links.length)) {
      throw new StorageError('plan_limit', FREE_PLAN_LIMIT_MESSAGE);
    }
    const item: ShortLink = {
      id: crypto.randomUUID(),
      shortUrl: `jah.link/${slug}`,
      destination,
      slug,
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
      destination_url: destination,
      slug,
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
  const destination = patch.destination === undefined
    ? undefined
    : normalizeDestinationUrl(patch.destination);
  if (destination !== undefined && !isValidDestinationUrl(destination)) {
    throw new StorageError('url', 'Ingresa una URL válida. Ejemplo: https://ejemplo.com');
  }
  const slugPatch = patch.slug === undefined ? undefined : sanitizeSlug(patch.slug);
  if (slugPatch !== undefined && !isValidSlug(slugPatch)) {
    throw new StorageError('slug', 'Este slug está reservado o no es válido.');
  }

  if (isDemoMode()) {
    const links = localStore.loadLinks().map((l) => {
      if (l.id !== id) return l;
      const slug = slugPatch ?? l.slug ?? '';
      return {
        ...l,
        title: patch.title ?? l.title,
        destination: destination ?? l.destination,
        slug,
        shortUrl: `jah.link/${slug}`,
        active: patch.isActive ?? l.active,
        status: patch.isActive === undefined
          ? l.status
          : patch.isActive === false ? 'Draft' as const : 'Active' as const,
      };
    });
    localStore.saveLinks(links);
    return links.find((l) => l.id === id)!;
  }

  await requireUserId();
  const sb = getSupabase()!;
  const payload: Record<string, unknown> = {};
  if (patch.title !== undefined) payload.title = patch.title;
  if (destination !== undefined) payload.destination_url = destination;
  if (slugPatch !== undefined) payload.slug = slugPatch;
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
  if (isDemoMode()) {
    localStore.saveLinks(localStore.loadLinks().filter((l) => l.id !== id));
    return;
  }
  await requireUserId();
  const sb = getSupabase()!;
  const { error } = await sb.from('short_links').delete().eq('id', id);
  if (error) throw new StorageError('delete', 'No se pudo eliminar el enlace.');
}

export async function getShortLinkBySlug(slug: string): Promise<ShortLink | null> {
  if (isDemoMode()) {
    const found = localStore.loadLinks().find(
      (l) => (l.slug ?? '').toLowerCase() === slug.toLowerCase(),
    );
    return found ?? null;
  }
  if (!isSupabaseConfigured()) return null;

  const sb = getSupabase()!;
  const trimmedSlug = slug.trim();
  const normalizedSlug = trimmedSlug.toLowerCase();
  const { data: exact, error: exactError } = await sb
    .from('short_links')
    .select('*')
    .eq('slug', trimmedSlug)
    .maybeSingle();

  if (exactError) return null;
  if (exact) return rowToShortLink(exact);

  const { data: lower } = await sb
    .from('short_links')
    .select('*')
    .eq('slug', normalizedSlug)
    .maybeSingle();

  if (lower) return rowToShortLink(lower);

  const { data: insensitive, error: insensitiveError } = await sb
    .from('short_links')
    .select('*')
    .ilike('slug', trimmedSlug)
    .maybeSingle();

  if (insensitiveError || !insensitive) return null;
  return rowToShortLink(insensitive);
}

export async function getPublicShortLinkBySlug(slug: string): Promise<PublicShortLink | null> {
  const link = await getShortLinkBySlug(slug);
  if (!link) return null;
  return {
    id: link.id,
    title: link.title ?? link.slug ?? link.shortUrl,
    destination: link.destination,
    slug: link.slug ?? slug,
    isActive: link.active !== false && link.status !== 'Expired',
    clicks: link.clicks,
  };
}

export async function incrementShortLinkClick(linkId: string): Promise<void> {
  if (isDemoMode()) {
    const links = localStore.loadLinks();
    const next = links.map((link) =>
      link.id === linkId ? { ...link, clicks: link.clicks + 1 } : link,
    );
    localStore.saveLinks(next);
    const clicked = next.find((link) => link.id === linkId);
    localStore.pushAnalytics({ type: 'link_click', label: clicked?.slug ?? clicked?.shortUrl ?? linkId });
    return;
  }

  const sb = getSupabase()!;
  const { data: link, error } = await sb
    .from('short_links')
    .select('id,user_id,slug,clicks_count')
    .eq('id', linkId)
    .maybeSingle();

  if (error || !link) return;

  await sb
    .from('short_links')
    .update({ clicks_count: (link.clicks_count ?? 0) + 1 })
    .eq('id', linkId);

  await sb.from('analytics_events').insert({
    user_id: link.user_id,
    entity_type: 'short_link',
    entity_id: link.id,
    event_type: 'click',
    metadata: { slug: link.slug },
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
  });
}

export async function resolveSlugRedirect(slug: string): Promise<RedirectResult | null> {
  if (isDemoMode()) {
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
  if (!isSupabaseConfigured()) return null;

  const sb = getSupabase()!;
  const { data, error } = await sb.rpc('resolve_short_link_redirect', {
    p_slug: slug,
    p_referrer: typeof document !== 'undefined' ? document.referrer || null : null,
    p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
  });

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
  if (isDemoMode()) return { ...localStore.loadBio(), bioPageId: undefined };

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
  if (isDemoMode()) {
    const bio = localStore.loadBio();
    if (bio.username.toLowerCase() !== username.toLowerCase()) return null;
    return { ...bio, bioPageId: undefined };
  }
  if (!isSupabaseConfigured()) return null;

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
  if (isDemoMode()) {
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

async function getOwnBioPageId(): Promise<string | undefined> {
  const userId = await requireUserId();
  const sb = getSupabase()!;
  const { data } = await sb
    .from('bio_pages')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  return data?.id;
}

export async function getBioLinks(bioPageId?: string): Promise<BioLink[]> {
  if (isDemoMode()) return localStore.loadBio().links;

  const pageId = bioPageId ?? await getOwnBioPageId();
  if (!pageId) return [];

  const sb = getSupabase()!;
  const { data, error } = await sb
    .from('bio_links')
    .select('*')
    .eq('bio_page_id', pageId)
    .order('position');

  if (error) throw new StorageError('load', 'No se pudieron cargar los botones de la bio.');
  return (data ?? []).map(bioLinkFromRow);
}

export async function createBioLink(input: {
  bioPageId?: string;
  label: string;
  url: string;
  platform?: string;
  active?: boolean;
}): Promise<BioLink> {
  if (isDemoMode()) {
    const bio = localStore.loadBio();
    const item: BioLink = {
      id: crypto.randomUUID(),
      label: input.label,
      url: input.url,
      platform: input.platform ?? 'Website',
      active: input.active !== false,
    };
    localStore.saveBio({ ...bio, links: [...bio.links, item] });
    return item;
  }

  const pageId = input.bioPageId ?? await getOwnBioPageId();
  if (!pageId) throw new StorageError('save', 'Primero debes crear la página bio.');

  const sb = getSupabase()!;
  const { count } = await sb
    .from('bio_links')
    .select('id', { count: 'exact', head: true })
    .eq('bio_page_id', pageId);

  const { data, error } = await sb
    .from('bio_links')
    .insert({
      bio_page_id: pageId,
      title: input.label,
      url: input.url,
      icon: input.platform ?? 'Website',
      position: count ?? 0,
      is_active: input.active !== false,
    })
    .select()
    .single();

  if (error) throw new StorageError('save', 'No se pudo crear el botón de la bio.');
  return bioLinkFromRow(data);
}

export async function updateBioLink(id: string, patch: Partial<BioLink>): Promise<BioLink> {
  if (isDemoMode()) {
    const bio = localStore.loadBio();
    const links = bio.links.map((link) => link.id === id ? { ...link, ...patch } : link);
    localStore.saveBio({ ...bio, links });
    const updated = links.find((link) => link.id === id);
    if (!updated) throw new StorageError('save', 'No se encontró el botón de la bio.');
    return updated;
  }

  const sb = getSupabase()!;
  const payload: Record<string, unknown> = {};
  if (patch.label !== undefined) payload.title = patch.label;
  if (patch.url !== undefined) payload.url = patch.url;
  if (patch.platform !== undefined) payload.icon = patch.platform;
  if (patch.active !== undefined) payload.is_active = patch.active;

  const { data, error } = await sb
    .from('bio_links')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new StorageError('save', 'No se pudo actualizar el botón de la bio.');
  return bioLinkFromRow(data);
}

export async function deleteBioLink(id: string): Promise<void> {
  if (isDemoMode()) {
    const bio = localStore.loadBio();
    localStore.saveBio({ ...bio, links: bio.links.filter((link) => link.id !== id) });
    return;
  }

  const sb = getSupabase()!;
  const { error } = await sb.from('bio_links').delete().eq('id', id);
  if (error) throw new StorageError('delete', 'No se pudo eliminar el botón de la bio.');
}

export async function reorderBioLinks(orderedIds: string[]): Promise<void> {
  if (isDemoMode()) {
    const bio = localStore.loadBio();
    const byId = new Map(bio.links.map((link) => [link.id, link]));
    const ordered = orderedIds
      .map((id) => byId.get(id))
      .filter((link): link is BioLink => Boolean(link));
    const rest = bio.links.filter((link) => !orderedIds.includes(link.id));
    localStore.saveBio({ ...bio, links: [...ordered, ...rest] });
    return;
  }

  const sb = getSupabase()!;
  const updates = orderedIds.map((id, position) =>
    sb.from('bio_links').update({ position }).eq('id', id),
  );
  const results = await Promise.all(updates);
  if (results.some((result) => result.error)) {
    throw new StorageError('save', 'No se pudo reordenar la bio.');
  }
}

export async function incrementBioPageView(username: string): Promise<void> {
  if (isDemoMode()) {
    localStore.pushAnalytics({ type: 'bio_view', label: username });
    return;
  }
  const sb = getSupabase()!;
  await sb.rpc('track_bio_page_view', { p_username: username });
}

export async function incrementBioLinkClick(linkId: string): Promise<void> {
  if (isDemoMode()) {
    localStore.pushAnalytics({ type: 'bio_button_click', label: linkId });
    return;
  }
  const sb = getSupabase()!;
  await sb.rpc('track_bio_link_click', { p_link_id: linkId });
}

// ——— QR ———

export async function getQrCodes(): Promise<QrCodeRecord[]> {
  if (isDemoMode()) return localStore.loadQrCodes();

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
    entityType: r.entity_type,
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
  if (isDemoMode()) {
    const item: QrCodeRecord = {
      id: crypto.randomUUID(),
      entityType: mapQrEntityType(input.entityType),
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
      entity_type: mapQrEntityType(input.entityType),
      entity_id: input.entityId ?? null,
      target_url: input.targetUrl,
      title: input.title ?? null,
    })
    .select()
    .single();

  if (error) throw new StorageError('save', 'No se pudo crear el código QR.');

  return {
    id: data.id,
    entityType: data.entity_type,
    entityId: data.entity_id ?? undefined,
    targetUrl: data.target_url,
    title: data.title ?? undefined,
    scansCount: data.scans_count,
    createdAt: data.created_at,
  };
}

export async function deleteQrCode(id: string): Promise<void> {
  if (isDemoMode()) {
    localStore.saveQrCodes(localStore.loadQrCodes().filter((q) => q.id !== id));
    return;
  }
  await requireUserId();
  const sb = getSupabase()!;
  const { error } = await sb.from('qr_codes').delete().eq('id', id);
  if (error) throw new StorageError('delete', 'No se pudo eliminar el código QR.');
}

export async function incrementQrCodeScan(id: string): Promise<void> {
  if (isDemoMode()) {
    const updated = localStore.loadQrCodes().map((qr) =>
      qr.id === id ? { ...qr, scansCount: qr.scansCount + 1 } : qr,
    );
    localStore.saveQrCodes(updated);
    localStore.pushAnalytics({ type: 'link_click', label: `qr:${id}` });
    return;
  }

  const sb = getSupabase()!;
  await sb.rpc('track_qr_code_scan', { p_qr_id: id });
}

// ——— Analítica ———

export async function trackAnalyticsEvent(event: {
  entityType: string;
  entityId?: string;
  eventType: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const dbEventType = mapDbEventType(event.eventType);
  const dbEntityType = mapDbEntityType(event.entityType);
  if (isDemoMode()) {
    localStore.pushAnalytics({
      type: mapLocalEventType(dbEventType, dbEntityType),
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
    entity_type: dbEntityType,
    entity_id: event.entityId ?? null,
    event_type: dbEventType,
    metadata: event.metadata ?? {},
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
  });
}

export async function getAnalyticsEvents(limit = 100): Promise<AnalyticsEvent[]> {
  if (isDemoMode()) return localStore.loadAnalytics();

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
    type: mapLocalEventType(e.event_type, e.entity_type),
    label: (e.metadata as { slug?: string; username?: string })?.slug
      ?? (e.metadata as { username?: string })?.username
      ?? e.entity_type,
    timestamp: e.created_at,
    entityType: e.entity_type,
    entityId: e.entity_id ?? undefined,
  }));
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
