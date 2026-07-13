-- Run this in your Supabase SQL editor.
-- Creates the anonymous feedback table used by the in-app feedback modal.

create table if not exists public.feedbacks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  content text not null check (char_length(content) between 10 and 1000),
  locale text check (locale in ('fr', 'en'))
);

grant insert on public.feedbacks to anon, authenticated;
grant select on public.feedbacks to authenticated;
grant all on public.feedbacks to service_role;

alter table public.feedbacks enable row level security;

drop policy if exists "anyone can insert feedback" on public.feedbacks;
create policy "anyone can insert feedback"
  on public.feedbacks
  for insert
  to anon, authenticated
  with check (
    char_length(content) between 10 and 1000
    and (locale is null or locale in ('fr','en'))
  );

drop policy if exists "authenticated can read feedback" on public.feedbacks;
create policy "authenticated can read feedback"
  on public.feedbacks
  for select
  to authenticated
  using (true);
