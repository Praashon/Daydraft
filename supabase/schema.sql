create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username = lower(username)),
  name text not null default '',
  email text not null unique,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are publicly readable for username lookup" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;

create policy "Profiles are publicly readable for username lookup"
  on public.profiles for select
  using (true);

-- Protect user email addresses from public/anonymous REST scraping
revoke select (email) on public.profiles from anon;

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, name, email, avatar_url)
  values (
    new.id,
    lower(new.raw_user_meta_data ->> 'username'),
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    lower(new.email),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon, authenticated;
grant execute on function public.handle_new_user() to service_role;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "Authenticated users can upload their avatar" on storage.objects;
drop policy if exists "Users can update their avatar" on storage.objects;
drop policy if exists "Users can delete their avatar" on storage.objects;
drop policy if exists "Public avatars are readable" on storage.objects;

create policy "Public avatars are readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Authenticated users can upload their avatar"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (auth.uid()::text = owner_id or (name like auth.uid()::text || '%')));

create policy "Users can update their avatar"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (auth.uid()::text = owner_id or (name like auth.uid()::text || '%')))
  with check (bucket_id = 'avatars' and (auth.uid()::text = owner_id or (name like auth.uid()::text || '%')));

create policy "Users can delete their avatar"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (auth.uid()::text = owner_id or (name like auth.uid()::text || '%')));
create table if not exists public.user_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('gemini','openrouter')),
  encrypted_key text not null,
  key_last4 text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, provider)
);

alter table public.user_api_keys enable row level security;

drop policy if exists "own keys only" on public.user_api_keys;
create policy "own keys only"
  on public.user_api_keys for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  priority text not null,
  deadline text,
  category text,
  completed boolean not null default false,
  created_at text
);
alter table public.tasks enable row level security;
drop policy if exists "Users can manage their own tasks" on public.tasks;
create policy "Users can manage their own tasks" on public.tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.daily_plan_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date text,
  time text not null,
  task text not null,
  description text,
  completed boolean default false,
  task_id text
);
alter table public.daily_plan_items enable row level security;
drop policy if exists "Users can manage their own plan items" on public.daily_plan_items;
create policy "Users can manage their own plan items" on public.daily_plan_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  created_at text,
  dismissed_from_dashboard boolean default false
);
alter table public.notes enable row level security;
drop policy if exists "Users can manage their own notes" on public.notes;
create policy "Users can manage their own notes" on public.notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.trash (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  task jsonb,
  plan_item jsonb,
  note jsonb,
  deleted_at text not null
);
alter table public.trash enable row level security;
drop policy if exists "Users can manage their own trash" on public.trash;
create policy "Users can manage their own trash" on public.trash for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  focus_task jsonb,
  insight text,
  preferences jsonb default '{}'::jsonb
);
alter table public.user_preferences enable row level security;
drop policy if exists "Users can manage their own preferences" on public.user_preferences;
create policy "Users can manage their own preferences" on public.user_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

