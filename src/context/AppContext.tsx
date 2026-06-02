import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { BioPageConfig, ShortLink } from '../types';
import {
  createShortLink,
  deleteShortLink,
  getAnalyticsEvents,
  getBioPage,
  getCurrentProfile,
  getPublicBioPageByUsername,
  getQrCodes,
  getShortLinks,
  incrementBioLinkClick,
  incrementBioPageView,
  isDemoMode,
  isSupabaseConfigured,
  resolveSlugRedirect,
  signInWithEmailPassword,
  signOut,
  signUpWithEmailPassword,
  onAuthStateChange,
  upsertBioPage,
  updateShortLink,
  updateProfile,
  uploadAvatar,
  createQrCode,
  createPendingPayment,
  deleteQrCode,
  getPendingPayment,
  getRecentPayments,
  StorageError,
  type AnalyticsEvent,
  type QrCodeRecord,
  type StoredUser,
  type BioPageWithId,
  type PaidPlanId,
  type PendingPayment,
  type PlanPayment,
  type RedirectResult,
} from '../lib/storage';
import {
  canCreateShortLink,
  FREE_PLAN_LIMIT_MESSAGE,
  getPlanDefinition,
  getPlanLabel,
  normalizePlan,
  type PlanId,
} from '../lib/plans';
import {
  generateSlug,
  isValidDestinationUrl,
  isValidSlug,
  normalizeDestinationUrl,
  sanitizeSlug,
} from '../lib/validation';
import { isReservedSlug } from '../lib/reservedSlugs';

interface AppContextValue {
  links: ShortLink[];
  bioConfig: BioPageConfig;
  bioPageId: string | undefined;
  user: StoredUser | null;
  qrCodes: QrCodeRecord[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  loading: boolean;
  authLoading: boolean;
  isAuthenticated: boolean;
  isSupabaseMode: boolean;
  error: string | null;
  successMessage: string | null;
  pendingPayment: PendingPayment | null;
  paymentHistory: PlanPayment[];
  clearMessages: () => void;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name: string, requestedPlan?: PlanId | null) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshData: () => Promise<void>;
  refreshProfile: () => Promise<StoredUser | null>;
  updateUserProfile: (patch: Partial<StoredUser>) => Promise<boolean>;
  createPlanPaymentIntent: (plan: PaidPlanId) => Promise<PendingPayment | null>;
  uploadUserAvatar: (file: File) => Promise<string | null>;
  addLink: (input: Omit<ShortLink, 'id' | 'clicks' | 'createdAt'>) => Promise<ShortLink | null>;
  updateLink: (id: string, patch: Partial<ShortLink>) => Promise<void>;
  deleteLink: (id: string) => Promise<void>;
  resolveRedirect: (slug: string) => Promise<RedirectResult | null>;
  saveBioConfig: (config: BioPageConfig) => Promise<boolean>;
  loadPublicBio: (username: string) => Promise<BioPageConfig | null>;
  recordBioView: (username: string) => Promise<void>;
  recordBioLinkClick: (linkId: string) => Promise<void>;
  analyticsEvents: AnalyticsEvent[];
  createQr: (input: { entityType: string; entityId?: string; targetUrl: string; title?: string }) => Promise<void>;
  deleteQr: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

function mapStorageError(err: unknown): string {
  if (err instanceof StorageError) return err.message;
  if (err instanceof Error) return err.message;
  return 'No se pudo completar la operación.';
}

function filterAnalyticsForPlan(events: AnalyticsEvent[], plan: PlanId | undefined): AnalyticsEvent[] {
  const days = getPlanDefinition(plan ?? 'gratis').limits.analyticsDays;
  if (days === null) return events;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return events.filter((event) => new Date(event.timestamp).getTime() >= cutoff);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const supabaseMode = isSupabaseConfigured();

  const [links, setLinks] = useState<ShortLink[]>([]);
  const [bioConfig, setBioConfig] = useState<BioPageConfig>({
    displayName: '',
    username: '',
    bio: '',
    avatarUrl: '',
    country: '',
    category: '',
    socialLinks: [],
    links: [],
    theme: 'Modern',
    backgroundColor: '#000000',
    primaryColor: '#006BFF',
    buttonStyle: 'rounded',
    font: 'Inter',
  });
  const [bioPageId, setBioPageId] = useState<string | undefined>();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [qrCodes, setQrCodes] = useState<QrCodeRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PlanPayment[]>([]);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [linksData, bioData, events, qr, payment, payments] = await Promise.all([
        getShortLinks().catch(() => []),
        getBioPage().catch(() => null),
        getAnalyticsEvents().catch(() => []),
        getQrCodes().catch(() => []),
        getPendingPayment().catch(() => null),
        getRecentPayments().catch(() => []),
      ]);
      setLinks(linksData);
      if (bioData) {
        const { bioPageId: pid, ...config } = bioData;
        setBioConfig(config);
        setBioPageId(pid);
      }
      setAnalyticsEvents(filterAnalyticsForPlan(events, user?.plan ?? 'gratis'));
      setQrCodes(qr);
      setPendingPayment(payment);
      setPaymentHistory(payments);
    } catch (e) {
      setError(mapStorageError(e));
    } finally {
      setLoading(false);
    }
  }, [supabaseMode, user?.plan]);

  const loadProfile = useCallback(async () => {
    try {
      const profile = await getCurrentProfile();
      setUser(profile);
      return profile;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => loadProfile(), [loadProfile]);

  useEffect(() => {
    const unsub = onAuthStateChange(async (signedIn) => {
      setIsAuthenticated(signedIn);
      setAuthLoading(false);
      if (signedIn) {
        await loadProfile();
        await refreshData();
      } else {
        setUser(null);
        setLinks([]);
        setQrCodes([]);
        setAnalyticsEvents([]);
        setPendingPayment(null);
        setPaymentHistory([]);
      }
    });
    return () => {
      unsub?.();
    };
  }, [loadProfile, refreshData]);

  const signIn = useCallback(async (email: string, password: string) => {
    clearMessages();
    setAuthLoading(true);
    try {
      await signInWithEmailPassword(email, password);
      setIsAuthenticated(true);
      await loadProfile();
      await refreshData();
      return true;
    } catch (e) {
      setError(mapStorageError(e));
      return false;
    } finally {
      setAuthLoading(false);
    }
  }, [clearMessages, loadProfile, refreshData]);

  const signUp = useCallback(async (email: string, password: string, name: string, requestedPlan?: PlanId | null) => {
    clearMessages();
    setAuthLoading(true);
    const normalizedRequestedPlan = requestedPlan ? normalizePlan(requestedPlan) : 'gratis';
    try {
      const result = await signUpWithEmailPassword(email, password, name, undefined, normalizedRequestedPlan);
      const hasSession =
        supabaseMode &&
        result &&
        typeof result === 'object' &&
        'session' in result &&
        !!(result as { session: unknown }).session;

      if (supabaseMode && !hasSession) {
        setSuccessMessage('Cuenta creada correctamente. Estás en el plan Gratis. Revisa tu correo para confirmar el registro.');
        return true;
      }

      setIsAuthenticated(true);
      await loadProfile();
      await refreshData();
      setSuccessMessage(
        normalizedRequestedPlan === 'gratis'
          ? 'Cuenta creada correctamente. Estás en el plan Gratis.'
          : `Cuenta creada correctamente. Estás en el plan Gratis. Plan solicitado: ${getPlanLabel(normalizedRequestedPlan)}. Para activar Pro o Business, completa el proceso de pago.`,
      );
      return true;
    } catch (e) {
      setError(mapStorageError(e));
      return false;
    } finally {
      setAuthLoading(false);
    }
  }, [clearMessages, loadProfile, refreshData, supabaseMode]);

  const updateUserProfile = useCallback(async (patch: Partial<StoredUser>) => {
    clearMessages();
    try {
      const updated = await updateProfile(patch);
      setUser(updated);
      setSuccessMessage('Perfil actualizado correctamente.');
      return true;
    } catch (e) {
      setError(mapStorageError(e));
      return false;
    }
  }, [clearMessages]);

  const createPlanPaymentIntent = useCallback(async (plan: PaidPlanId) => {
    clearMessages();
    try {
      const updated = await updateProfile({ requestedPlan: plan });
      setUser(updated);
      const payment = await createPendingPayment(plan);
      setPendingPayment(payment);
      setSuccessMessage('Pago pendiente de confirmación. Tu plan se activará después de verificar el pago.');
      return payment;
    } catch (e) {
      setError(mapStorageError(e));
      return null;
    }
  }, [clearMessages]);

  const uploadUserAvatar = useCallback(async (file: File) => {
    clearMessages();
    try {
      if (isDemoMode()) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
          reader.readAsDataURL(file);
        });
        return dataUrl;
      }
      return await uploadAvatar(file);
    } catch (e) {
      setError(mapStorageError(e));
      return null;
    }
  }, [clearMessages]);

  const logout = useCallback(async () => {
    await signOut();
    setIsAuthenticated(false);
    setUser(null);
      setLinks([]);
      setPendingPayment(null);
      setPaymentHistory([]);
  }, []);

  const addLink = useCallback(
    async (input: Omit<ShortLink, 'id' | 'clicks' | 'createdAt'>): Promise<ShortLink | null> => {
      clearMessages();
      const slug = sanitizeSlug(
        input.slug ?? input.shortUrl.split('/').pop() ?? generateSlug(),
      );

      if (!isValidSlug(slug)) {
        setError('Este slug está reservado o no es válido.');
        return null;
      }

      const destination = normalizeDestinationUrl(input.destination);
      if (!isValidDestinationUrl(destination)) {
        setError('Ingresa una URL válida. Ejemplo: https://ejemplo.com');
        return null;
      }

      const currentPlan = user?.plan ?? 'gratis';
      if (!canCreateShortLink(currentPlan, links.length)) {
        setError(FREE_PLAN_LIMIT_MESSAGE);
        return null;
      }

      try {
        const created = await createShortLink({
          title: input.title || `Enlace a ${new URL(destination).hostname}`,
          destination,
          slug,
          isActive: input.active !== false,
        });
        setLinks((prev) => [created, ...prev]);
        setSuccessMessage('Enlace creado correctamente.');

        if (input.addedToBioPage) {
          const nextBio = {
            ...bioConfig,
            links: [
              ...bioConfig.links,
              {
                id: `bl-${Date.now()}`,
                label: input.title || 'Enlace sincronizado',
                url: destination,
                platform: 'Website',
                active: true,
              },
            ],
          };
          await upsertBioPage(nextBio);
          setBioConfig(nextBio);
        }

        return created;
      } catch (e) {
        setError(mapStorageError(e));
        return null;
      }
    },
    [bioConfig, clearMessages, links.length, user?.plan],
  );

  const updateLink = useCallback(async (id: string, patch: Partial<ShortLink>) => {
    clearMessages();
    const destination = patch.destination === undefined
      ? undefined
      : normalizeDestinationUrl(patch.destination);
    if (destination !== undefined && !isValidDestinationUrl(destination)) {
      setError('Ingresa una URL válida. Ejemplo: https://ejemplo.com');
      return;
    }

    const slug = patch.slug === undefined ? undefined : sanitizeSlug(patch.slug);
    if (slug !== undefined && !isValidSlug(slug)) {
      setError('Este slug está reservado o no es válido.');
      return;
    }

    try {
      const updated = await updateShortLink(id, {
        title: patch.title,
        destination,
        slug,
        isActive: patch.active === undefined ? undefined : patch.active !== false,
      });
      setLinks((prev) => prev.map((l) => (l.id === id ? updated : l)));
      setSuccessMessage('Cambios guardados correctamente.');
    } catch (e) {
      setError(mapStorageError(e));
    }
  }, [clearMessages]);

  const deleteLink = useCallback(async (id: string) => {
    clearMessages();
    try {
      await deleteShortLink(id);
      setLinks((prev) => prev.filter((l) => l.id !== id));
      setSuccessMessage('Enlace eliminado.');
    } catch (e) {
      setError(mapStorageError(e));
    }
  }, [clearMessages]);

  const resolveRedirect = useCallback(async (slug: string) => {
    if (isReservedSlug(slug)) return null;
    return resolveSlugRedirect(slug);
  }, []);

  const saveBioConfig = useCallback(async (config: BioPageConfig) => {
    clearMessages();
    try {
      const saved = await upsertBioPage(config);
      const { bioPageId: pid, ...rest } = saved;
      setBioConfig(rest);
      setBioPageId(pid);
      setSuccessMessage('Cambios guardados correctamente.');
      return true;
    } catch (e) {
      setError(mapStorageError(e));
      return false;
    }
  }, [clearMessages]);

  const loadPublicBio = useCallback(async (username: string) => {
    const page = await getPublicBioPageByUsername(username);
    if (!page) return null;
    const { bioPageId: _pid, ...config } = page;
    return config;
  }, []);

  const recordBioView = useCallback(async (username: string) => {
    await incrementBioPageView(username);
    const events = await getAnalyticsEvents().catch(() => []);
    setAnalyticsEvents(filterAnalyticsForPlan(events, user?.plan ?? 'gratis'));
  }, [user?.plan]);

  const recordBioLinkClick = useCallback(async (linkId: string) => {
    await incrementBioLinkClick(linkId);
  }, []);

  const createQr = useCallback(
    async (input: { entityType: string; entityId?: string; targetUrl: string; title?: string }) => {
      clearMessages();
      try {
        const qr = await createQrCode(input);
        setQrCodes((prev) => [qr, ...prev]);
        setSuccessMessage(
          (user?.plan ?? 'gratis') === 'gratis'
            ? 'Código QR básico guardado en el plan Gratis.'
            : 'Código QR guardado.',
        );
      } catch (e) {
        setError(mapStorageError(e));
      }
    },
    [clearMessages, user?.plan],
  );

  const deleteQr = useCallback(
    async (id: string) => {
      try {
        await deleteQrCode(id);
        setQrCodes((prev) => prev.filter((q) => q.id !== id));
      } catch (e) {
        setError(mapStorageError(e));
      }
    },
    [],
  );

  const value = useMemo(
    () => ({
      links,
      bioConfig,
      bioPageId,
      user,
      qrCodes,
      searchQuery,
      setSearchQuery,
      loading,
      authLoading,
      isAuthenticated,
      isSupabaseMode: supabaseMode,
      error,
      successMessage,
      pendingPayment,
      paymentHistory,
      clearMessages,
      signIn,
      signUp,
      logout,
      refreshData,
      refreshProfile,
      updateUserProfile,
      createPlanPaymentIntent,
      uploadUserAvatar,
      addLink,
      updateLink,
      deleteLink,
      resolveRedirect,
      saveBioConfig,
      loadPublicBio,
      recordBioView,
      recordBioLinkClick,
      analyticsEvents,
      createQr,
      deleteQr,
    }),
    [
      links,
      bioConfig,
      bioPageId,
      user,
      qrCodes,
      searchQuery,
      loading,
      authLoading,
      isAuthenticated,
      supabaseMode,
      error,
      successMessage,
      pendingPayment,
      paymentHistory,
      clearMessages,
      signIn,
      signUp,
      logout,
      refreshData,
      refreshProfile,
      updateUserProfile,
      createPlanPaymentIntent,
      uploadUserAvatar,
      addLink,
      updateLink,
      deleteLink,
      resolveRedirect,
      saveBioConfig,
      loadPublicBio,
      recordBioView,
      recordBioLinkClick,
      analyticsEvents,
      createQr,
      deleteQr,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de AppProvider');
  return ctx;
}

export function useAuthSession() {
  const { isAuthenticated, authLoading } = useApp();
  return { isAuthenticated, authLoading };
}
