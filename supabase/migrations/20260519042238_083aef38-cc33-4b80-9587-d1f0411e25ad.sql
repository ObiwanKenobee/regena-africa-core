
-- Roles
create type public.app_role as enum ('admin','operator','member');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  preferred_role text default 'household',
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

-- Profiles policies
create policy "profiles self read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "profiles self update" on public.profiles for update to authenticated using (id = auth.uid());
create policy "profiles self insert" on public.profiles for insert to authenticated with check (id = auth.uid());

-- user_roles policies
create policy "roles self read" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "roles admin write" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- Auto-create profile + bootstrap first admin
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare _count int;
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), new.raw_user_meta_data->>'phone')
  on conflict (id) do nothing;

  select count(*) into _count from public.user_roles;
  if _count = 0 then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'member') on conflict do nothing;
  end if;
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Zones
create table public.zones (
  id text primary key,
  name text not null,
  x int not null,
  y int not null,
  size int not null default 12,
  households int not null default 0,
  waste numeric not null default 0,
  deliveries int not null default 0,
  jobs int not null default 0,
  co2 numeric not null default 0,
  revenue numeric not null default 0,
  status text not null default 'pilot',
  updated_at timestamptz not null default now()
);
alter table public.zones enable row level security;
create policy "zones public read" on public.zones for select using (true);
create policy "zones admin write" on public.zones for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

insert into public.zones (id,name,x,y,size,households,waste,deliveries,jobs,co2,revenue,status) values
  ('nairobi','Nairobi',62,58,24,18420,642,4120,540,1180,78400000,'online'),
  ('kiambu','Kiambu',58,52,12,6210,218,1240,168,410,22300000,'online'),
  ('nakuru','Nakuru',48,48,16,9340,384,1840,224,612,34800000,'online'),
  ('kisumu','Kisumu',28,50,14,7820,296,1420,196,488,28600000,'scaling'),
  ('eldoret','Eldoret',38,38,10,4180,142,620,88,224,12400000,'scaling'),
  ('mombasa','Mombasa',82,80,12,5620,124,180,56,188,6800000,'pilot'),
  ('nyeri','Nyeri',60,44,8,2640,41,0,12,18,1200000,'pilot');

-- Listings
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  zone_id text references public.zones(id) on delete set null,
  farm text not null,
  name text not null,
  price numeric not null,
  unit text not null default 'kg',
  image text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.listings enable row level security;
create policy "listings public read" on public.listings for select using (active or public.has_role(auth.uid(),'admin'));
create policy "listings admin write" on public.listings for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

insert into public.listings (zone_id,farm,name,price,unit) values
  ('kiambu','Mwangi Family Farm','Heirloom tomatoes',180,'kg'),
  ('nakuru','Kibet Cooperative','Sukuma wiki bunch',45,'bunch'),
  ('kisumu','Otieno Lakeside','Fresh tilapia',520,'kg'),
  ('nairobi','Karen Greens','Mixed salad box',650,'box'),
  ('kiambu','Limuru Dairy','Yoghurt 500ml',180,'btl'),
  ('nakuru','Subukia Orchards','Tree tomato',220,'kg');

-- Orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  phone text not null,
  total numeric not null default 0,
  status text not null default 'pending', -- pending|stk_sent|paid|preparing|picked|in_transit|delivered|failed|cancelled
  progress int not null default 0,
  channel text not null default 'marketplace',
  rider text,
  route text,
  mpesa_checkout_id text unique,
  mpesa_receipt text,
  failure_reason text,
  zone_id text references public.zones(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.orders enable row level security;
create policy "orders self read" on public.orders for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "orders self insert" on public.orders for insert to authenticated with check (user_id = auth.uid());
create policy "orders admin write" on public.orders for update to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  name text not null,
  farm text not null,
  price numeric not null,
  unit text not null,
  qty int not null
);
alter table public.order_items enable row level security;
create policy "order_items read" on public.order_items for select to authenticated using (
  exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.has_role(auth.uid(),'admin')))
);
create policy "order_items insert" on public.order_items for insert to authenticated with check (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);

-- updated_at trigger
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
create trigger zones_touch before update on public.zones for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();

-- Realtime
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.zones;
alter publication supabase_realtime add table public.listings;
alter table public.orders replica identity full;
alter table public.zones replica identity full;
alter table public.listings replica identity full;
