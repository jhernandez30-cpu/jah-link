import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const DEMO_MODE_MESSAGE =
  'Modo demo activo: los datos se guardan temporalmente en este navegador. En producción se conectará Supabase desde Vercel.';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

function isConfiguredValue(value: string | undefined, placeholder: string): value is string {
  return Boolean(value && value.trim() && value.trim() !== placeholder);
}

function isValidSupabaseUrl(value: string | undefined): value is string {
  if (!isConfiguredValue(value, 'your_supabase_project_url')) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function isSupabaseConfigured(): boolean {
  return isValidSupabaseUrl(url) && isConfiguredValue(anonKey, 'your_supabase_anon_key');
}

export function isDemoMode(): boolean {
  return !isSupabaseConfigured() && import.meta.env.DEV === true;
}

export function shouldShowDemoBanner(): boolean {
  return isDemoMode();
}

if (import.meta.env.PROD && !isSupabaseConfigured()) {
  console.error(
    'JAH Link: faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Supabase no esta activo en produccion.',
  );
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}

export async function getSupabaseDevDiagnostics() {
  const enabled = import.meta.env.DEV === true;
  const sb = getSupabase();
  if (!enabled) {
    return { enabled, configured: isSupabaseConfigured(), table: 'profiles', ok: null, count: null, error: null };
  }
  if (!sb) {
    return {
      enabled,
      configured: false,
      table: 'profiles',
      ok: false,
      count: null,
      error: DEMO_MODE_MESSAGE,
    };
  }

  const { count, error } = await sb
    .from('profiles')
    .select('id', { count: 'exact', head: true });

  return {
    enabled,
    configured: true,
    table: 'profiles',
    ok: !error,
    count: count ?? null,
    error: error?.message ?? null,
  };
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          username: string | null;
          avatar_url: string | null;
          plan: string;
          requested_plan: string | null;
          role: string;
          membership: string;
          status: string;
          whatsapp: string | null;
          country: string | null;
          category: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      short_links: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          destination_url: string;
          slug: string;
          is_active: boolean;
          clicks_count: number;
          created_at: string;
          updated_at: string;
        };
      };
      bio_pages: {
        Row: {
          id: string;
          user_id: string;
          username: string;
          display_name: string;
          bio: string | null;
          avatar_url: string | null;
          whatsapp: string | null;
          email: string | null;
          category: string | null;
          country: string | null;
          theme: string;
          primary_color: string;
          button_style: string;
          background_type: string;
          background_value: string;
          social_links: unknown;
          font: string | null;
          is_public: boolean;
          views_count: number;
          created_at: string;
          updated_at: string;
        };
      };
      bio_links: {
        Row: {
          id: string;
          bio_page_id: string;
          title: string;
          url: string;
          description: string | null;
          icon: string | null;
          position: number;
          is_active: boolean;
          clicks_count: number;
          created_at: string;
          updated_at: string;
        };
      };
      qr_codes: {
        Row: {
          id: string;
          user_id: string;
          entity_type: 'short_link' | 'bio_page' | 'custom';
          entity_id: string | null;
          target_url: string;
          title: string | null;
          scans_count: number;
          created_at: string;
          updated_at: string;
        };
      };
      analytics_events: {
        Row: {
          id: string;
          user_id: string | null;
          entity_type: 'short_link' | 'bio_page' | 'bio_link' | 'qr_code';
          entity_id: string | null;
          event_type: 'view' | 'click' | 'scan';
          referrer: string | null;
          user_agent: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
      };
    };
    Functions: {
      resolve_short_link_redirect: {
        Args: { p_slug: string; p_referrer?: string | null; p_user_agent?: string | null };
        Returns: Array<{
          link_id: string;
          destination_url: string;
          is_active: boolean;
          user_id: string;
        }>;
      };
      track_bio_page_view: {
        Args: { p_username: string };
        Returns: undefined;
      };
      track_bio_link_click: {
        Args: { p_link_id: string };
        Returns: undefined;
      };
      track_qr_code_scan: {
        Args: { p_qr_id: string };
        Returns: undefined;
      };
    };
  };
};
