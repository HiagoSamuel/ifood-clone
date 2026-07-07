create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text,
  delivery_fee numeric(10,2) default 0,
  estimated_time_min integer default 30,
  image_url text,
  rating numeric(2,1) default 4.5,
  created_at timestamptz default now()
);

delete from public.restaurants duplicate
using public.restaurants kept
where duplicate.name = kept.name
  and duplicate.id <> kept.id
  and (
    duplicate.created_at > kept.created_at
    or (duplicate.created_at = kept.created_at and duplicate.id::text > kept.id::text)
  );

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'restaurants_name_key'
      and conrelid = 'public.restaurants'::regclass
  ) then
    alter table public.restaurants
      add constraint restaurants_name_key unique (name);
  end if;
end $$;

create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

create index if not exists menu_categories_restaurant_id_idx
  on public.menu_categories(restaurant_id);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id uuid references public.menu_categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  image_url text,
  available boolean not null default true,
  created_at timestamptz default now()
);

create index if not exists menu_items_restaurant_id_idx
  on public.menu_items(restaurant_id);

create index if not exists menu_items_category_id_idx
  on public.menu_items(category_id);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cep text,
  nickname text not null,
  street text not null,
  number text not null,
  neighborhood text not null,
  complement text,
  reference_point text,
  is_default boolean not null default false,
  created_at timestamptz default now()
);

create index if not exists addresses_user_id_idx
  on public.addresses(user_id);

create unique index if not exists addresses_one_default_per_user_idx
  on public.addresses(user_id)
  where is_default;

alter table public.addresses
  add column if not exists cep text;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id),
  status text not null default 'recebido'
    check (status in ('recebido', 'confirmado', 'preparando', 'saiu_para_entrega', 'entregue', 'reembolsado')),
  subtotal numeric(10,2) not null default 0,
  delivery_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  delivery_address text not null,
  payment_method text not null,
  payment_status text not null default 'pendente'
    check (payment_status in ('pendente', 'pago', 'reembolsado')),
  paid_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz default now()
);

alter table public.orders
  add column if not exists payment_status text not null default 'pendente';

alter table public.orders
  add column if not exists paid_at timestamptz;

alter table public.orders
  add column if not exists refunded_at timestamptz;

alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in ('recebido', 'confirmado', 'preparando', 'saiu_para_entrega', 'entregue', 'reembolsado'));

alter table public.orders
  drop constraint if exists orders_payment_status_check;

alter table public.orders
  add constraint orders_payment_status_check
  check (payment_status in ('pendente', 'pago', 'reembolsado'));

create index if not exists orders_user_id_idx
  on public.orders(user_id);

create index if not exists orders_restaurant_id_idx
  on public.orders(restaurant_id);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  name_at_order text not null,
  unit_price numeric(10,2) not null,
  quantity integer not null check (quantity > 0),
  observation text,
  created_at timestamptz default now()
);

create index if not exists order_items_order_id_idx
  on public.order_items(order_id);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  constraint reviews_order_id_key unique (order_id)
);

create index if not exists reviews_restaurant_id_idx
  on public.reviews(restaurant_id);

create index if not exists reviews_user_id_idx
  on public.reviews(user_id);

create or replace function public.create_order_with_items(
  p_user_id uuid,
  p_restaurant_id uuid,
  p_subtotal numeric,
  p_delivery_fee numeric,
  p_total numeric,
  p_delivery_address text,
  p_payment_method text,
  p_items jsonb
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  created_order public.orders;
begin
  insert into public.orders (
    user_id,
    restaurant_id,
    status,
    subtotal,
    delivery_fee,
    total,
    delivery_address,
    payment_method
  )
  values (
    p_user_id,
    p_restaurant_id,
    'recebido',
    p_subtotal,
    p_delivery_fee,
    p_total,
    p_delivery_address,
    p_payment_method
  )
  returning * into created_order;

  insert into public.order_items (
    order_id,
    menu_item_id,
    name_at_order,
    unit_price,
    quantity,
    observation
  )
  select
    created_order.id,
    (item->>'menu_item_id')::uuid,
    item->>'name_at_order',
    (item->>'unit_price')::numeric,
    (item->>'quantity')::integer,
    nullif(item->>'observation', '')
  from jsonb_array_elements(p_items) as item;

  return created_order;
end;
$$;

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.addresses enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "Users can read own orders" on public.orders;
create policy "Users can read own orders"
  on public.orders for select
  using (auth.uid() = user_id);

drop policy if exists "Users can read own order items" on public.order_items;
create policy "Users can read own order items"
  on public.order_items for select
  using (
    exists (
      select 1
      from public.orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );

drop policy if exists "Users can read own addresses" on public.addresses;
create policy "Users can read own addresses"
  on public.addresses for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own addresses" on public.addresses;
create policy "Users can insert own addresses"
  on public.addresses for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own addresses" on public.addresses;
create policy "Users can update own addresses"
  on public.addresses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own addresses" on public.addresses;
create policy "Users can delete own addresses"
  on public.addresses for delete
  using (auth.uid() = user_id);

drop policy if exists "Anyone can read reviews" on public.reviews;
create policy "Anyone can read reviews"
  on public.reviews for select
  using (true);

drop policy if exists "Users can insert own reviews" on public.reviews;
create policy "Users can insert own reviews"
  on public.reviews for insert
  with check (auth.uid() = user_id);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;

notify pgrst, 'reload schema';
