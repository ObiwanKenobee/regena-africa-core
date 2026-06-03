
-- =========================
-- GOVERNANCE
-- =========================
create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  zone_id text,
  title text not null,
  body text not null,
  status text not null default 'voting', -- voting | passed | rejected | closed
  quorum_pct int not null default 60,
  yes_count int not null default 0,
  no_count int not null default 0,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.proposals to anon, authenticated;
grant insert, update on public.proposals to authenticated;
grant all on public.proposals to service_role;
alter table public.proposals enable row level security;

create policy "proposals public read" on public.proposals for select using (true);
create policy "proposals authed insert" on public.proposals for insert to authenticated with check (created_by = auth.uid());
create policy "proposals admin update" on public.proposals for update to authenticated using (has_role(auth.uid(), 'admin'));

create trigger touch_proposals before update on public.proposals
  for each row execute function public.touch_updated_at();

create table public.proposal_votes (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  user_id uuid not null,
  vote boolean not null,
  created_at timestamptz not null default now(),
  unique (proposal_id, user_id)
);
grant select, insert on public.proposal_votes to authenticated;
grant all on public.proposal_votes to service_role;
alter table public.proposal_votes enable row level security;

create policy "votes self read" on public.proposal_votes for select to authenticated
  using (user_id = auth.uid() or has_role(auth.uid(), 'admin'));
create policy "votes self insert" on public.proposal_votes for insert to authenticated
  with check (user_id = auth.uid());

create or replace function public.tally_proposal_vote()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.vote then
    update public.proposals set yes_count = yes_count + 1 where id = new.proposal_id;
  else
    update public.proposals set no_count = no_count + 1 where id = new.proposal_id;
  end if;
  return new;
end; $$;
create trigger tally_proposal_vote_aiu after insert on public.proposal_votes
  for each row execute function public.tally_proposal_vote();

-- =========================
-- WALLETS / FINANCE
-- =========================
create table public.wallets (
  user_id uuid primary key,
  balance numeric not null default 0,
  currency text not null default 'KES',
  updated_at timestamptz not null default now()
);
grant select on public.wallets to authenticated;
grant all on public.wallets to service_role;
alter table public.wallets enable row level security;

create policy "wallet self read" on public.wallets for select to authenticated
  using (user_id = auth.uid() or has_role(auth.uid(), 'admin'));

create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  kind text not null check (kind in ('in','out')),
  category text not null default 'transfer',
  amount numeric not null check (amount > 0),
  memo text,
  created_at timestamptz not null default now()
);
grant select on public.wallet_transactions to authenticated;
grant all on public.wallet_transactions to service_role;
alter table public.wallet_transactions enable row level security;

create policy "wallet tx self read" on public.wallet_transactions for select to authenticated
  using (user_id = auth.uid() or has_role(auth.uid(), 'admin'));

create or replace function public.apply_wallet_tx()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.wallets (user_id, balance) values (new.user_id, 0)
    on conflict (user_id) do nothing;
  update public.wallets
    set balance = balance + case when new.kind = 'in' then new.amount else -new.amount end,
        updated_at = now()
    where user_id = new.user_id;
  return new;
end; $$;
create trigger apply_wallet_tx_ai after insert on public.wallet_transactions
  for each row execute function public.apply_wallet_tx();

-- =========================
-- SAVINGS CIRCLES (SACCO)
-- =========================
create table public.savings_circles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  zone_id text,
  target numeric not null default 0,
  balance numeric not null default 0,
  contribution_amount numeric not null default 500,
  contribution_period text not null default 'weekly',
  created_at timestamptz not null default now()
);
grant select on public.savings_circles to anon, authenticated;
grant all on public.savings_circles to service_role;
alter table public.savings_circles enable row level security;
create policy "circles public read" on public.savings_circles for select using (true);
create policy "circles admin write" on public.savings_circles for all to authenticated
  using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));

create table public.circle_contributions (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.savings_circles(id) on delete cascade,
  user_id uuid not null,
  amount numeric not null check (amount > 0),
  created_at timestamptz not null default now()
);
grant select, insert on public.circle_contributions to authenticated;
grant all on public.circle_contributions to service_role;
alter table public.circle_contributions enable row level security;
create policy "contributions self read" on public.circle_contributions for select to authenticated
  using (user_id = auth.uid() or has_role(auth.uid(),'admin'));
create policy "contributions self insert" on public.circle_contributions for insert to authenticated
  with check (user_id = auth.uid());

create or replace function public.apply_circle_contribution()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.savings_circles set balance = balance + new.amount where id = new.circle_id;
  -- mirror as wallet outflow
  insert into public.wallet_transactions (user_id, kind, category, amount, memo)
    values (new.user_id, 'out', 'sacco', new.amount, 'Savings circle contribution');
  return new;
end; $$;
create trigger apply_circle_contribution_ai after insert on public.circle_contributions
  for each row execute function public.apply_circle_contribution();

-- =========================
-- AUTO-CREATE WALLET FOR NEW USERS
-- =========================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare _count int;
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), new.raw_user_meta_data->>'phone')
  on conflict (id) do nothing;

  insert into public.wallets (user_id, balance) values (new.id, 0)
    on conflict (user_id) do nothing;

  select count(*) into _count from public.user_roles;
  if _count = 0 then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'member') on conflict do nothing;
  end if;
  return new;
end; $$;

-- enable realtime on new tables
alter publication supabase_realtime add table public.proposals;
alter publication supabase_realtime add table public.savings_circles;
alter publication supabase_realtime add table public.wallets;

-- seed a few proposals + circles so the UI has content
insert into public.proposals (title, body, status, quorum_pct, yes_count, no_count, zone_id) values
  ('Fund 3 new compost hubs in Mathare', 'Allocate KSh 1.8M from Q3 treasury to build sorting + briquette capacity.', 'voting', 60, 412, 38, 'nairobi'),
  ('Increase rider weekly minimum to KSh 4,800', 'Adjust last-mile compensation across Nakuru and Naivasha clusters.', 'voting', 72, 286, 92, 'nakuru'),
  ('Partner with 4 Kisumu schools as collection nodes', '12-month pilot · revenue share with PTA-managed accounts.', 'passed', 100, 198, 14, 'kisumu');

insert into public.savings_circles (name, zone_id, target, balance, contribution_amount, contribution_period) values
  ('Mama Mboga Westlands', 'nairobi', 250000, 142500, 500, 'weekly'),
  ('Kangemi Riders Pool', 'nairobi', 180000, 98400, 800, 'weekly'),
  ('Nakuru Farmers Co-op', 'nakuru', 500000, 312800, 1500, 'weekly'),
  ('Kisumu Compost Circle', 'kisumu', 120000, 41200, 300, 'weekly');
