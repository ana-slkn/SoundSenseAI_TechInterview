-- Run in the Supabase SQL editor. Enable anonymous sign-ins under Auth first.
begin;
create table public.reviews (
  user_id uuid not null references auth.users(id) on delete cascade,
  call_id text not null check (call_id ~ '^CALL-(00[1-9]|01[0-9]|020)$'),
  decision text not null default 'Unreviewed'
    check (decision in ('Unreviewed', 'Acceptable', 'Needs correction', 'Uncertain')),
  notes text not null default '' check (char_length(notes) <= 20000),
  findings jsonb not null default '{}'::jsonb check (jsonb_typeof(findings) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (user_id, call_id)
);
alter table public.reviews enable row level security;
revoke all on public.reviews from anon;
grant select, insert, update on public.reviews to authenticated;
create policy "Read own reviews" on public.reviews for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Insert own reviews" on public.reviews for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Update own reviews" on public.reviews for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create function public.set_review_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger reviews_updated_at before update on public.reviews
for each row execute function public.set_review_updated_at();
commit;
