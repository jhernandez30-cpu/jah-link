-- JAH Link — Esquema Supabase
-- Ejecutar en SQL Editor del proyecto Supabase

-- Extensiones
create extension if not exists "pgcrypto";

-- Perfiles (vinculados a auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  username text unique,
  avatar_url text,
  plan text not null default 'gratis',
  requested_plan text,
  role text not null default 'user',
  status text not null default 'active',
  whatsapp text,
  country text,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists requested_plan text;
alter table public.profiles add column if not exists role text not null default 'user';
alter table public.profiles add column if not exists status text not null default 'active';
alter table public.profiles add column if not exists whatsapp text;
alter table public.profiles add column if not exists country text;
alter table public.profiles add column if not exists category text;

-- Enlaces cortos
create table if not exists public.short_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  destination_url text not null,
  slug text not null unique,
  is_active boolean not null default true,
  clicks_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists short_links_user_id_idx on public.short_links(user_id);
create index if not exists short_links_slug_idx on public.short_links(lower(slug));

-- Páginas bio
create table if not exists public.bio_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null,
  bio text,
  avatar_url text,
  whatsapp text,
  email text,
  category text,
  country text,
  theme text not null default 'dark',
  primary_color text not null default '#006BFF',
  button_style text not null default 'rounded',
  background_type text not null default 'solid',
  background_value text not null default '#000000',
  social_links jsonb not null default '[]'::jsonb,
  font text default 'Inter',
  is_public boolean not null default true,
  views_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bio_pages_user_id_idx on public.bio_pages(user_id);
create index if not exists bio_pages_username_idx on public.bio_pages(lower(username));

-- Botones / enlaces de bio
create table if not exists public.bio_links (
  id uuid primary key default gen_random_uuid(),
  bio_page_id uuid not null references public.bio_pages(id) on delete cascade,
  title text not null,
  url text not null,
  description text,
  icon text,
  position integer not null default 0,
  is_active boolean not null default true,
  clicks_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bio_links_page_id_idx on public.bio_links(bio_page_id);

-- Códigos QR
create table if not exists public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id uuid,
  target_url text not null,
  title text,
  scans_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists qr_codes_user_id_idx on public.qr_codes(user_id);

-- Eventos de analítica
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  event_type text not null,
  referrer text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_user_id_idx on public.analytics_events(user_id);
create index if not exists analytics_events_created_at_idx on public.analytics_events(created_at desc);

-- Trigger: perfil al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
begin
  base_username := lower(regexp_replace(
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    '[^a-z0-9_-]', '', 'g'
  ));
  if base_username = '' or length(base_username) < 3 then
    base_username := 'user_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  final_username := base_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    final_username := base_username || '_' || floor(random() * 9000 + 1000)::text;
  end loop;

  insert into public.profiles (id, email, full_name, username, avatar_url, plan, requested_plan, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    final_username,
    null,
    'gratis',
    nullif(new.raw_user_meta_data->>'requested_plan', ''),
    'user',
    'active'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at automático
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists short_links_updated_at on public.short_links;
create trigger short_links_updated_at before update on public.short_links
  for each row execute function public.set_updated_at();

drop trigger if exists bio_pages_updated_at on public.bio_pages;
create trigger bio_pages_updated_at before update on public.bio_pages
  for each row execute function public.set_updated_at();

drop trigger if exists bio_links_updated_at on public.bio_links;
create trigger bio_links_updated_at before update on public.bio_links
  for each row execute function public.set_updated_at();

drop trigger if exists qr_codes_updated_at on public.qr_codes;
create trigger qr_codes_updated_at before update on public.qr_codes
  for each row execute function public.set_updated_at();

-- RPC: redirección pública por slug
create or replace function public.resolve_short_link_redirect(p_slug text)
returns table (
  link_id uuid,
  destination_url text,
  is_active boolean,
  user_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.short_links%rowtype;
begin
  select * into v_row from public.short_links where lower(slug) = lower(p_slug) limit 1;
  if not found then return; end if;

  if v_row.is_active then
    update public.short_links
    set clicks_count = clicks_count + 1, updated_at = now()
    where id = v_row.id;

    insert into public.analytics_events (user_id, entity_type, entity_id, event_type, metadata)
    values (v_row.user_id, 'short_link', v_row.id, 'link_click', jsonb_build_object('slug', p_slug));
  end if;

  return query select v_row.id, v_row.destination_url, v_row.is_active, v_row.user_id;
end;
$$;

-- RPC: vista pública bio
create or replace function public.track_bio_page_view(p_username text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_page public.bio_pages%rowtype;
begin
  select * into v_page from public.bio_pages
  where lower(username) = lower(p_username) and is_public = true
  limit 1;
  if not found then return; end if;

  update public.bio_pages set views_count = views_count + 1, updated_at = now() where id = v_page.id;

  insert into public.analytics_events (user_id, entity_type, entity_id, event_type, metadata)
  values (v_page.user_id, 'bio_page', v_page.id, 'bio_view', jsonb_build_object('username', p_username));
end;
$$;

-- RPC: clic en botón bio
create or replace function public.track_bio_link_click(p_link_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link public.bio_links%rowtype;
  v_page public.bio_pages%rowtype;
begin
  select bl.* into v_link from public.bio_links bl where bl.id = p_link_id and bl.is_active = true;
  if not found then return; end if;

  select * into v_page from public.bio_pages where id = v_link.bio_page_id and is_public = true;
  if not found then return; end if;

  update public.bio_links set clicks_count = clicks_count + 1, updated_at = now() where id = p_link_id;

  insert into public.analytics_events (user_id, entity_type, entity_id, event_type, metadata)
  values (v_page.user_id, 'bio_link', p_link_id, 'bio_button_click', '{}'::jsonb);
end;
$$;

grant execute on function public.resolve_short_link_redirect(text) to anon, authenticated;
grant execute on function public.track_bio_page_view(text) to anon, authenticated;
grant execute on function public.track_bio_link_click(uuid) to anon, authenticated;

-- RLS
alter table public.profiles enable row level security;
alter table public.short_links enable row level security;
alter table public.bio_pages enable row level security;
alter table public.bio_links enable row level security;
alter table public.qr_codes enable row level security;
alter table public.analytics_events enable row level security;

-- profiles
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_select_public_username" on public.profiles for select using (true);

-- short_links
create policy "short_links_select_own" on public.short_links for select using (auth.uid() = user_id);
create policy "short_links_insert_own" on public.short_links for insert with check (auth.uid() = user_id);
create policy "short_links_update_own" on public.short_links for update using (auth.uid() = user_id);
create policy "short_links_delete_own" on public.short_links for delete using (auth.uid() = user_id);
create policy "short_links_select_active_public" on public.short_links for select using (is_active = true);

-- bio_pages
create policy "bio_pages_select_own" on public.bio_pages for select using (auth.uid() = user_id);
create policy "bio_pages_insert_own" on public.bio_pages for insert with check (auth.uid() = user_id);
create policy "bio_pages_update_own" on public.bio_pages for update using (auth.uid() = user_id);
create policy "bio_pages_delete_own" on public.bio_pages for delete using (auth.uid() = user_id);
create policy "bio_pages_select_public" on public.bio_pages for select using (is_public = true);

-- bio_links
create policy "bio_links_select_own" on public.bio_links for select using (
  exists (select 1 from public.bio_pages bp where bp.id = bio_page_id and bp.user_id = auth.uid())
);
create policy "bio_links_insert_own" on public.bio_links for insert with check (
  exists (select 1 from public.bio_pages bp where bp.id = bio_page_id and bp.user_id = auth.uid())
);
create policy "bio_links_update_own" on public.bio_links for update using (
  exists (select 1 from public.bio_pages bp where bp.id = bio_page_id and bp.user_id = auth.uid())
);
create policy "bio_links_delete_own" on public.bio_links for delete using (
  exists (select 1 from public.bio_pages bp where bp.id = bio_page_id and bp.user_id = auth.uid())
);
create policy "bio_links_select_public" on public.bio_links for select using (
  is_active = true and exists (
    select 1 from public.bio_pages bp where bp.id = bio_page_id and bp.is_public = true
  )
);

-- qr_codes
create policy "qr_codes_select_own" on public.qr_codes for select using (auth.uid() = user_id);
create policy "qr_codes_insert_own" on public.qr_codes for insert with check (auth.uid() = user_id);
create policy "qr_codes_update_own" on public.qr_codes for update using (auth.uid() = user_id);
create policy "qr_codes_delete_own" on public.qr_codes for delete using (auth.uid() = user_id);

-- analytics_events
create policy "analytics_select_own" on public.analytics_events for select using (auth.uid() = user_id);
create policy "analytics_insert_authenticated" on public.analytics_events for insert with check (
  auth.uid() = user_id or user_id is null
);
create policy "analytics_insert_anon_tracking" on public.analytics_events for insert to anon with check (true);

-- Storage: bucket avatars (ejecutar en Storage o añadir políticas en dashboard)
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;
