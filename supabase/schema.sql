-- Our Family Tree — PostgreSQL schema for Supabase
-- Connect after the UI shell is complete.

create extension if not exists "pgcrypto";

create table if not exists public.family_trees (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete cascade,
  name text not null,
  share_access text not null default 'private',
  hide_living_dates boolean not null default true,
  hide_contact_info boolean not null default true,
  hide_private_notes boolean not null default true,
  hide_photos_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  family_tree_id uuid not null references public.family_trees (id) on delete cascade,
  first_name text not null,
  middle_name text not null default '',
  last_name text not null default '',
  preferred_name text not null default '',
  gender text not null default 'unknown',
  birth_date date,
  death_date date,
  birth_place text not null default '',
  death_place text not null default '',
  current_location text not null default '',
  occupation text not null default '',
  education text not null default '',
  biography text not null default '',
  email text not null default '',
  phone text not null default '',
  website text not null default '',
  profile_photo_url text not null default '',
  generation integer not null default 1,
  branch text not null default '',
  notes text not null default '',
  hide_birth_date boolean not null default false,
  hide_contact boolean not null default false,
  hide_notes boolean not null default false,
  hide_photos boolean not null default false,
  hide_from_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.relationships (
  id uuid primary key default gen_random_uuid(),
  family_tree_id uuid not null references public.family_trees (id) on delete cascade,
  person_id uuid not null references public.people (id) on delete cascade,
  related_person_id uuid not null references public.people (id) on delete cascade,
  relationship_type text not null,
  created_at timestamptz not null default now(),
  unique (person_id, related_person_id, relationship_type)
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  family_tree_id uuid not null references public.family_trees (id) on delete cascade,
  url text not null,
  caption text not null default '',
  date date,
  location text not null default '',
  description text not null default '',
  is_private boolean not null default false,
  uploaded_at timestamptz not null default now()
);

create table if not exists public.photo_tags (
  photo_id uuid not null references public.photos (id) on delete cascade,
  person_id uuid not null references public.people (id) on delete cascade,
  primary key (photo_id, person_id)
);

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  family_tree_id uuid not null references public.family_trees (id) on delete cascade,
  title text not null,
  cover_photo_url text not null default '',
  body text not null default '',
  date date,
  location text not null default '',
  is_private boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.story_people (
  story_id uuid not null references public.stories (id) on delete cascade,
  person_id uuid not null references public.people (id) on delete cascade,
  primary key (story_id, person_id)
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  family_tree_id uuid not null references public.family_trees (id) on delete cascade,
  person_id uuid references public.people (id) on delete set null,
  title text not null,
  date date,
  location text not null default '',
  description text not null default ''
);

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  family_tree_id uuid not null references public.family_trees (id) on delete cascade,
  title text not null,
  type text not null default '',
  citation text not null default '',
  url text not null default '',
  notes text not null default ''
);

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  family_tree_id uuid not null references public.family_trees (id) on delete cascade,
  email text not null,
  role text not null default 'viewer',
  created_at timestamptz not null default now()
);

create table if not exists public.privacy_settings (
  family_tree_id uuid primary key references public.family_trees (id) on delete cascade,
  hide_living_dates boolean not null default true,
  hide_contact_info boolean not null default true,
  hide_private_notes boolean not null default true,
  hide_photos boolean not null default false
);

create index if not exists people_tree_idx on public.people (family_tree_id);
create index if not exists people_name_idx on public.people (last_name, first_name);
create index if not exists relationships_tree_idx on public.relationships (family_tree_id);
create index if not exists relationships_person_idx on public.relationships (person_id);
create index if not exists relationships_related_idx on public.relationships (related_person_id);
create index if not exists photos_tree_idx on public.photos (family_tree_id);
create index if not exists stories_tree_idx on public.stories (family_tree_id);
create index if not exists events_person_idx on public.events (person_id);
