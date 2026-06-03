-- JAH Link - Supabase schema
-- Run this complete file in Supabase SQL Editor.
-- Do not use the Vercel notes example as the production schema.

create extension if not exists "pgcrypto";

-- Core tables
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  username text unique,
  avatar_url text,
  plan text not null default 'gratis',
  requested_plan text,
  role text not null default 'user',
  membership text not null default 'Miembro Gratis',
  status text not null default 'active',
  country text,
  category text,
  whatsapp text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists requested_plan text;
alter table public.profiles add column if not exists role text not null default 'user';
alter table public.profiles add column if not exists membership text not null default 'Miembro Gratis';
alter table public.profiles add column if not exists status text not null default 'active';
alter table public.profiles add column if not exists country text;
alter table public.profiles add column if not exists category text;
alter table public.profiles add column if not exists whatsapp text;

update public.profiles
set plan = 'gratis'
where plan is null or plan not in ('gratis', 'pro', 'business');

update public.profiles
set requested_plan = null
where requested_plan is not null and requested_plan not in ('gratis', 'pro', 'business');

update public.profiles
set membership = case
  when plan = 'pro' then 'Miembro Pro'
  when plan = 'business' then 'Miembro Business'
  else 'Miembro Gratis'
end
where membership is null
   or membership not in ('Miembro Gratis', 'Miembro Pro', 'Miembro Business')
   or (plan = 'gratis' and membership <> 'Miembro Gratis');

alter table public.profiles alter column plan set default 'gratis';
alter table public.profiles alter column plan set not null;
alter table public.profiles alter column role set default 'user';
alter table public.profiles alter column role set not null;
alter table public.profiles alter column membership set default 'Miembro Gratis';
alter table public.profiles alter column membership set not null;

create table if not exists public.short_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  destination_url text not null,
  slug text unique not null,
  is_active boolean not null default true,
  clicks_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bio_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  bio text,
  avatar_url text,
  avatar_path text,
  whatsapp text,
  email text,
  category text,
  country text,
  theme text not null default 'dark',
  primary_color text not null default '#006BFF',
  button_style text not null default 'gradient',
  background_type text not null default 'solid',
  background_value text not null default '#000000',
  social_links jsonb not null default '[]'::jsonb,
  font text default 'Inter',
  background_image_url text,
  background_image_path text,
  background_overlay text,
  is_public boolean not null default true,
  views_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bio_pages add column if not exists category text;
alter table public.bio_pages add column if not exists country text;
alter table public.bio_pages add column if not exists social_links jsonb not null default '[]'::jsonb;
alter table public.bio_pages add column if not exists font text default 'Inter';
alter table public.bio_pages add column if not exists avatar_path text;
alter table public.bio_pages add column if not exists background_image_url text;
alter table public.bio_pages add column if not exists background_image_path text;
alter table public.bio_pages add column if not exists background_overlay text;
alter table public.bio_pages alter column button_style set default 'gradient';

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

create table if not exists public.bio_banners (
  id uuid primary key default gen_random_uuid(),
  bio_page_id uuid not null references public.bio_pages(id) on delete cascade,
  title text not null,
  description text,
  image_url text,
  image_path text,
  destination_url text,
  aspect_ratio text not null default 'original',
  position integer not null default 0,
  is_active boolean not null default true,
  clicks_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  bio_page_id uuid not null references public.bio_pages(id) on delete cascade,
  platform text not null,
  label text,
  url text not null,
  icon text,
  position integer not null default 0,
  is_active boolean not null default true,
  clicks_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id uuid,
  event_type text not null,
  referrer text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('pro', 'business')),
  amount numeric not null,
  currency text not null default 'USD',
  provider text not null default 'paypal',
  provider_order_id text,
  provider_capture_id text,
  provider_payer_id text,
  provider_webhook_event_id text unique,
  provider_payment_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'completed', 'failed', 'cancelled', 'refunded')),
  raw_response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payments add column if not exists provider_order_id text;
alter table public.payments add column if not exists provider_capture_id text;
alter table public.payments add column if not exists provider_payer_id text;
alter table public.payments add column if not exists provider_webhook_event_id text;
alter table public.payments add column if not exists provider_payment_url text;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('gratis', 'pro', 'business')),
  status text not null default 'active',
  provider text not null default 'paypal',
  provider_order_id text,
  provider_capture_id text,
  current_period_start timestamptz default now(),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Normalize legacy event names before adding checks.
update public.analytics_events
set event_type = case
  when event_type in ('link_click', 'bio_button_click') then 'click'
  when event_type = 'bio_view' then 'view'
  else event_type
end
where event_type in ('link_click', 'bio_button_click', 'bio_view');

-- Indexes
create index if not exists profiles_username_idx on public.profiles(lower(username));
create index if not exists short_links_user_id_idx on public.short_links(user_id);
create index if not exists short_links_slug_idx on public.short_links(lower(slug));
create index if not exists short_links_active_slug_idx on public.short_links(lower(slug)) where is_active = true;
create index if not exists bio_pages_user_id_idx on public.bio_pages(user_id);
create index if not exists bio_pages_username_idx on public.bio_pages(lower(username));
create index if not exists bio_pages_public_username_idx on public.bio_pages(lower(username)) where is_public = true;
create index if not exists bio_links_page_id_idx on public.bio_links(bio_page_id);
create index if not exists bio_links_page_position_idx on public.bio_links(bio_page_id, position);
create index if not exists bio_banners_page_id_idx on public.bio_banners(bio_page_id);
create index if not exists bio_banners_page_position_idx on public.bio_banners(bio_page_id, position);
create index if not exists bio_banners_active_idx on public.bio_banners(is_active);
create index if not exists social_links_page_id_idx on public.social_links(bio_page_id);
create index if not exists social_links_page_position_idx on public.social_links(bio_page_id, position);
create index if not exists social_links_active_idx on public.social_links(is_active);
create index if not exists qr_codes_user_id_idx on public.qr_codes(user_id);
create index if not exists analytics_events_user_id_idx on public.analytics_events(user_id);
create index if not exists analytics_events_entity_idx on public.analytics_events(entity_type, entity_id);
create index if not exists analytics_events_created_at_idx on public.analytics_events(created_at desc);
create index if not exists payments_user_id_idx on public.payments(user_id);
create index if not exists payments_user_status_idx on public.payments(user_id, status);
create index if not exists payments_user_plan_status_idx on public.payments(user_id, plan, status);
create unique index if not exists payments_provider_order_id_uidx on public.payments(provider_order_id) where provider_order_id is not null;
create unique index if not exists payments_webhook_event_id_uidx on public.payments(provider_webhook_event_id) where provider_webhook_event_id is not null;
create index if not exists payments_created_at_idx on public.payments(created_at desc);
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_user_status_idx on public.subscriptions(user_id, status);
create index if not exists subscriptions_provider_order_id_idx on public.subscriptions(provider_order_id);

-- Constraints. These DO blocks make the file safe to run again.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_plan_check') then
    alter table public.profiles add constraint profiles_plan_check check (plan in ('gratis', 'pro', 'business'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_requested_plan_check') then
    alter table public.profiles add constraint profiles_requested_plan_check check (requested_plan is null or requested_plan in ('gratis', 'pro', 'business'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_role_check') then
    alter table public.profiles add constraint profiles_role_check check (role in ('user', 'admin'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_membership_check') then
    alter table public.profiles add constraint profiles_membership_check check (membership in ('Miembro Gratis', 'Miembro Pro', 'Miembro Business'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'short_links_clicks_nonnegative') then
    alter table public.short_links add constraint short_links_clicks_nonnegative check (clicks_count >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'short_links_slug_format') then
    alter table public.short_links add constraint short_links_slug_format check (slug ~ '^[a-z0-9][a-z0-9_-]{2,63}$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'bio_pages_views_nonnegative') then
    alter table public.bio_pages add constraint bio_pages_views_nonnegative check (views_count >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'bio_pages_background_type_check') then
    alter table public.bio_pages add constraint bio_pages_background_type_check check (background_type in ('solid', 'gradient', 'image'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'bio_pages_button_style_check') then
    alter table public.bio_pages add constraint bio_pages_button_style_check check (button_style in ('gradient', 'rounded', 'square', 'pill', 'bordered', 'outline'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'bio_links_clicks_nonnegative') then
    alter table public.bio_links add constraint bio_links_clicks_nonnegative check (clicks_count >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'bio_links_position_nonnegative') then
    alter table public.bio_links add constraint bio_links_position_nonnegative check (position >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'bio_banners_aspect_ratio_check') then
    alter table public.bio_banners add constraint bio_banners_aspect_ratio_check check (aspect_ratio in ('original', '1:1', '3:2', '16:9'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'bio_banners_clicks_nonnegative') then
    alter table public.bio_banners add constraint bio_banners_clicks_nonnegative check (clicks_count >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'bio_banners_position_nonnegative') then
    alter table public.bio_banners add constraint bio_banners_position_nonnegative check (position >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'social_links_clicks_nonnegative') then
    alter table public.social_links add constraint social_links_clicks_nonnegative check (clicks_count >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'social_links_position_nonnegative') then
    alter table public.social_links add constraint social_links_position_nonnegative check (position >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'qr_codes_entity_type_check') then
    alter table public.qr_codes add constraint qr_codes_entity_type_check check (entity_type in ('short_link', 'bio_page', 'custom'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'qr_codes_scans_nonnegative') then
    alter table public.qr_codes add constraint qr_codes_scans_nonnegative check (scans_count >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'analytics_events_entity_type_check') then
    alter table public.analytics_events add constraint analytics_events_entity_type_check check (entity_type in ('short_link', 'bio_page', 'bio_link', 'qr_code'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'analytics_events_event_type_check') then
    alter table public.analytics_events add constraint analytics_events_event_type_check check (event_type in ('view', 'click', 'scan'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'payments_plan_check') then
    alter table public.payments add constraint payments_plan_check check (plan in ('pro', 'business'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'payments_amount_positive') then
    alter table public.payments add constraint payments_amount_positive check (amount > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'payments_currency_check') then
    alter table public.payments add constraint payments_currency_check check (currency = 'USD');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'payments_provider_check') then
    alter table public.payments add constraint payments_provider_check check (provider = 'paypal');
  end if;
end $$;

alter table public.payments drop constraint if exists payments_status_check;
alter table public.payments
  add constraint payments_status_check
  check (status in ('pending', 'approved', 'completed', 'failed', 'cancelled', 'refunded'));

alter table public.analytics_events drop constraint if exists analytics_events_entity_type_check;
alter table public.analytics_events
  add constraint analytics_events_entity_type_check
  check (entity_type in ('short_link', 'bio_page', 'bio_link', 'bio_banner', 'social_link', 'qr_code'));

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'subscriptions_plan_check') then
    alter table public.subscriptions add constraint subscriptions_plan_check check (plan in ('gratis', 'pro', 'business'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'subscriptions_status_check') then
    alter table public.subscriptions add constraint subscriptions_status_check check (status in ('active', 'cancelled', 'past_due', 'review'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'subscriptions_provider_check') then
    alter table public.subscriptions add constraint subscriptions_provider_check check (provider = 'paypal');
  end if;
end $$;

-- Ensure analytics_events uses cascade if this file is applied to an older schema.
do $$
declare
  fk_name text;
begin
  select conname into fk_name
  from pg_constraint
  where conrelid = 'public.analytics_events'::regclass
    and contype = 'f'
    and pg_get_constraintdef(oid) like '%auth.users%';

  if fk_name is not null then
    execute format('alter table public.analytics_events drop constraint %I', fk_name);
  end if;

  alter table public.analytics_events
    add constraint analytics_events_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;
exception
  when duplicate_object then null;
end $$;

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Keep membership consistent with the real plan.
create or replace function public.sync_profile_membership()
returns trigger
language plpgsql
as $$
begin
  new.membership = case
    when new.plan = 'pro' then 'Miembro Pro'
    when new.plan = 'business' then 'Miembro Business'
    else 'Miembro Gratis'
  end;
  return new;
end;
$$;

drop trigger if exists profiles_membership_sync on public.profiles;
create trigger profiles_membership_sync
  before insert or update of plan on public.profiles
  for each row execute function public.sync_profile_membership();

-- Prevent browser clients from changing paid plan fields directly.
create or replace function public.prevent_client_plan_update()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role'
    and (
      new.plan is distinct from old.plan
      or new.membership is distinct from old.membership
    )
  then
    raise exception 'Plan changes must be performed by the secure backend.';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_plan_update_guard on public.profiles;
create trigger profiles_plan_update_guard
  before update of plan, membership on public.profiles
  for each row execute function public.prevent_client_plan_update();

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

drop trigger if exists bio_banners_updated_at on public.bio_banners;
create trigger bio_banners_updated_at before update on public.bio_banners
  for each row execute function public.set_updated_at();

drop trigger if exists social_links_updated_at on public.social_links;
create trigger social_links_updated_at before update on public.social_links
  for each row execute function public.set_updated_at();

drop trigger if exists qr_codes_updated_at on public.qr_codes;
create trigger qr_codes_updated_at before update on public.qr_codes
  for each row execute function public.set_updated_at();

drop trigger if exists payments_updated_at on public.payments;
create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

drop trigger if exists subscriptions_updated_at on public.subscriptions;
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- Create profile automatically when a Supabase Auth user registers.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
  requested text;
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

  requested := lower(coalesce(new.raw_user_meta_data->>'requested_plan', ''));
  if requested not in ('pro', 'business') then
    requested := null;
  end if;

  insert into public.profiles (
    id,
    email,
    full_name,
    username,
    avatar_url,
    plan,
    requested_plan,
    role,
    membership,
    status
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    final_username,
    null,
    'gratis',
    requested,
    'user',
    'Miembro Gratis',
    'active'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Public RPCs for redirect and analytics tracking.
drop function if exists public.resolve_short_link_redirect(text);
create or replace function public.resolve_short_link_redirect(
  p_slug text,
  p_referrer text default null,
  p_user_agent text default null
)
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
  select * into v_row
  from public.short_links
  where lower(slug) = lower(p_slug)
  limit 1;

  if not found then
    return;
  end if;

  if v_row.is_active then
    update public.short_links
    set clicks_count = clicks_count + 1,
        updated_at = now()
    where id = v_row.id;

    insert into public.analytics_events (
      user_id,
      entity_type,
      entity_id,
      event_type,
      referrer,
      user_agent,
      metadata
    )
    values (
      v_row.user_id,
      'short_link',
      v_row.id,
      'click',
      p_referrer,
      p_user_agent,
      jsonb_build_object('slug', p_slug)
    );
  end if;

  return query select v_row.id, v_row.destination_url, v_row.is_active, v_row.user_id;
end;
$$;

create or replace function public.track_bio_page_view(p_username text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_page public.bio_pages%rowtype;
begin
  select * into v_page
  from public.bio_pages
  where lower(username) = lower(p_username)
    and is_public = true
  limit 1;

  if not found then
    return;
  end if;

  update public.bio_pages
  set views_count = views_count + 1,
      updated_at = now()
  where id = v_page.id;

  insert into public.analytics_events (user_id, entity_type, entity_id, event_type, metadata)
  values (v_page.user_id, 'bio_page', v_page.id, 'view', jsonb_build_object('username', p_username));
end;
$$;

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
  select * into v_link
  from public.bio_links
  where id = p_link_id
    and is_active = true;

  if not found then
    return;
  end if;

  select * into v_page
  from public.bio_pages
  where id = v_link.bio_page_id
    and is_public = true;

  if not found then
    return;
  end if;

  update public.bio_links
  set clicks_count = clicks_count + 1,
      updated_at = now()
  where id = p_link_id;

  insert into public.analytics_events (user_id, entity_type, entity_id, event_type, metadata)
  values (v_page.user_id, 'bio_link', p_link_id, 'click', jsonb_build_object('bio_page_id', v_page.id));
end;
$$;

create or replace function public.track_bio_banner_click(p_banner_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_banner public.bio_banners%rowtype;
  v_page public.bio_pages%rowtype;
begin
  select * into v_banner
  from public.bio_banners
  where id = p_banner_id
    and is_active = true;

  if not found then
    return;
  end if;

  select * into v_page
  from public.bio_pages
  where id = v_banner.bio_page_id
    and is_public = true;

  if not found then
    return;
  end if;

  update public.bio_banners
  set clicks_count = clicks_count + 1,
      updated_at = now()
  where id = p_banner_id;

  insert into public.analytics_events (user_id, entity_type, entity_id, event_type, metadata)
  values (v_page.user_id, 'bio_banner', p_banner_id, 'click', jsonb_build_object('bio_page_id', v_page.id));
end;
$$;

create or replace function public.track_social_link_click(p_social_link_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_social public.social_links%rowtype;
  v_page public.bio_pages%rowtype;
begin
  select * into v_social
  from public.social_links
  where id = p_social_link_id
    and is_active = true;

  if not found then
    return;
  end if;

  select * into v_page
  from public.bio_pages
  where id = v_social.bio_page_id
    and is_public = true;

  if not found then
    return;
  end if;

  update public.social_links
  set clicks_count = clicks_count + 1,
      updated_at = now()
  where id = p_social_link_id;

  insert into public.analytics_events (user_id, entity_type, entity_id, event_type, metadata)
  values (v_page.user_id, 'social_link', p_social_link_id, 'click', jsonb_build_object('bio_page_id', v_page.id, 'platform', v_social.platform));
end;
$$;

create or replace function public.track_qr_code_scan(p_qr_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_qr public.qr_codes%rowtype;
begin
  select * into v_qr
  from public.qr_codes
  where id = p_qr_id;

  if not found then
    return;
  end if;

  update public.qr_codes
  set scans_count = scans_count + 1,
      updated_at = now()
  where id = p_qr_id;

  insert into public.analytics_events (user_id, entity_type, entity_id, event_type, metadata)
  values (v_qr.user_id, 'qr_code', p_qr_id, 'scan', jsonb_build_object('target_url', v_qr.target_url));
end;
$$;

grant execute on function public.resolve_short_link_redirect(text, text, text) to anon, authenticated;
grant execute on function public.track_bio_page_view(text) to anon, authenticated;
grant execute on function public.track_bio_link_click(uuid) to anon, authenticated;
grant execute on function public.track_bio_banner_click(uuid) to anon, authenticated;
grant execute on function public.track_social_link_click(uuid) to anon, authenticated;
grant execute on function public.track_qr_code_scan(uuid) to anon, authenticated;

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.short_links enable row level security;
alter table public.bio_pages enable row level security;
alter table public.bio_links enable row level security;
alter table public.bio_banners enable row level security;
alter table public.social_links enable row level security;
alter table public.qr_codes enable row level security;
alter table public.analytics_events enable row level security;
alter table public.payments enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_select_public_username" on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "short_links_select_own" on public.short_links;
drop policy if exists "short_links_insert_own" on public.short_links;
drop policy if exists "short_links_update_own" on public.short_links;
drop policy if exists "short_links_delete_own" on public.short_links;
drop policy if exists "short_links_select_active_public" on public.short_links;
drop policy if exists "Public can read active short links" on public.short_links;
drop policy if exists "short_links_manage_own" on public.short_links;

create policy "short_links_manage_own"
  on public.short_links for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Public can read active short links"
  on public.short_links for select to anon, authenticated
  using (is_active = true);

drop policy if exists "bio_pages_select_own" on public.bio_pages;
drop policy if exists "bio_pages_insert_own" on public.bio_pages;
drop policy if exists "bio_pages_update_own" on public.bio_pages;
drop policy if exists "bio_pages_delete_own" on public.bio_pages;
drop policy if exists "bio_pages_select_public" on public.bio_pages;
drop policy if exists "bio_pages_manage_own" on public.bio_pages;

create policy "bio_pages_manage_own"
  on public.bio_pages for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "bio_pages_select_public"
  on public.bio_pages for select to anon, authenticated
  using (is_public = true);

drop policy if exists "bio_links_select_own" on public.bio_links;
drop policy if exists "bio_links_insert_own" on public.bio_links;
drop policy if exists "bio_links_update_own" on public.bio_links;
drop policy if exists "bio_links_delete_own" on public.bio_links;
drop policy if exists "bio_links_select_public" on public.bio_links;
drop policy if exists "bio_links_manage_own" on public.bio_links;

create policy "bio_links_manage_own"
  on public.bio_links for all to authenticated
  using (
    exists (
      select 1 from public.bio_pages bp
      where bp.id = bio_page_id
        and bp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.bio_pages bp
      where bp.id = bio_page_id
        and bp.user_id = auth.uid()
    )
  );

create policy "bio_links_select_public"
  on public.bio_links for select to anon, authenticated
  using (
    is_active = true
    and exists (
      select 1 from public.bio_pages bp
      where bp.id = bio_page_id
        and bp.is_public = true
    )
  );

drop policy if exists "bio_banners_manage_own" on public.bio_banners;
drop policy if exists "bio_banners_select_public" on public.bio_banners;

create policy "bio_banners_manage_own"
  on public.bio_banners for all to authenticated
  using (
    exists (
      select 1 from public.bio_pages bp
      where bp.id = bio_page_id
        and bp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.bio_pages bp
      where bp.id = bio_page_id
        and bp.user_id = auth.uid()
    )
  );

create policy "bio_banners_select_public"
  on public.bio_banners for select to anon, authenticated
  using (
    is_active = true
    and exists (
      select 1 from public.bio_pages bp
      where bp.id = bio_page_id
        and bp.is_public = true
    )
  );

drop policy if exists "social_links_manage_own" on public.social_links;
drop policy if exists "social_links_select_public" on public.social_links;

create policy "social_links_manage_own"
  on public.social_links for all to authenticated
  using (
    exists (
      select 1 from public.bio_pages bp
      where bp.id = bio_page_id
        and bp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.bio_pages bp
      where bp.id = bio_page_id
        and bp.user_id = auth.uid()
    )
  );

create policy "social_links_select_public"
  on public.social_links for select to anon, authenticated
  using (
    is_active = true
    and exists (
      select 1 from public.bio_pages bp
      where bp.id = bio_page_id
        and bp.is_public = true
    )
  );

drop policy if exists "qr_codes_select_own" on public.qr_codes;
drop policy if exists "qr_codes_insert_own" on public.qr_codes;
drop policy if exists "qr_codes_update_own" on public.qr_codes;
drop policy if exists "qr_codes_delete_own" on public.qr_codes;
drop policy if exists "qr_codes_manage_own" on public.qr_codes;

create policy "qr_codes_manage_own"
  on public.qr_codes for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "analytics_select_own" on public.analytics_events;
drop policy if exists "analytics_insert_authenticated" on public.analytics_events;
drop policy if exists "analytics_insert_anon_tracking" on public.analytics_events;
drop policy if exists "analytics_insert_controlled" on public.analytics_events;

create policy "analytics_select_own"
  on public.analytics_events for select to authenticated
  using (auth.uid() = user_id);

create policy "analytics_insert_controlled"
  on public.analytics_events for insert to anon, authenticated
  with check (
    entity_type in ('short_link', 'bio_page', 'bio_link', 'bio_banner', 'social_link', 'qr_code')
    and event_type in ('view', 'click', 'scan')
    and (user_id is null or auth.uid() = user_id)
  );

drop policy if exists "payments_select_own" on public.payments;
drop policy if exists "payments_insert_pending_own" on public.payments;
drop policy if exists "payments_update_own" on public.payments;
drop policy if exists "payments_delete_own" on public.payments;
drop policy if exists "Users can read their own payments" on public.payments;
drop policy if exists "Users can insert their own pending payments" on public.payments;

create policy "Users can read their own payments"
  on public.payments for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own pending payments"
  on public.payments for insert to authenticated
  with check (
    auth.uid() = user_id
    and status = 'pending'
    and provider = 'paypal'
    and currency = 'USD'
    and plan in ('pro', 'business')
  );

drop policy if exists "subscriptions_select_own" on public.subscriptions;
drop policy if exists "subscriptions_insert_own" on public.subscriptions;
drop policy if exists "subscriptions_update_own" on public.subscriptions;
drop policy if exists "subscriptions_delete_own" on public.subscriptions;
drop policy if exists "Users can read their own subscriptions" on public.subscriptions;

create policy "Users can read their own subscriptions"
  on public.subscriptions for select to authenticated
  using (auth.uid() = user_id);

-- Storage setup for Bio images.
insert into storage.buckets (id, name, public)
values ('bio-assets', 'bio-assets', true)
on conflict (id) do update set public = true;

drop policy if exists "bio_assets_public_read" on storage.objects;
drop policy if exists "bio_assets_insert_own" on storage.objects;
drop policy if exists "bio_assets_update_own" on storage.objects;
drop policy if exists "bio_assets_delete_own" on storage.objects;

create policy "bio_assets_public_read"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'bio-assets');

create policy "bio_assets_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'bio-assets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "bio_assets_update_own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'bio-assets'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'bio-assets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "bio_assets_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'bio-assets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
