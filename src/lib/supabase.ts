import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey && url.length > 0 && anonKey.length > 0);
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
          entity_type: string;
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
          entity_type: string;
          entity_id: string | null;
          event_type: string;
          referrer: string | null;
          user_agent: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
      };
    };
  };
};
