-- Herbal Might database setup. Run once in Supabase Dashboard > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'user' check (role in ('admin','user')),
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text not null default '',
  benefits text not null default '',
  how_to_use text not null default '',
  price numeric(12,2) not null check (price >= 0),
  category text not null check (category in ('roots','leaves','powders','mixtures')),
  image_url text not null default '',
  stock integer not null default 0 check (stock >= 0),
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  address text not null,
  total_amount numeric(12,2) not null check (total_amount >= 0),
  status text not null default 'pending' check (status in ('pending','confirmed','processing','shipped','delivered','cancelled')),
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products(category);
create index if not exists orders_owner_created_idx on public.orders(user_id, created_at desc);

-- Profiles are created automatically after email/password or Google signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, email, role)
  values (new.id, coalesce(new.email, ''), 'user')
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Helper runs as its owner so the admin check does not recurse through profile RLS.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin');
$$;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;

drop policy if exists "profiles read own or admin" on public.profiles;
create policy "profiles read own or admin" on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select public.is_admin()));
-- No browser insert/update/delete policies on profiles: role assignment is server/dashboard-only.

drop policy if exists "products public read" on public.products;
create policy "products public read" on public.products for select to anon, authenticated using (true);
drop policy if exists "products admin insert" on public.products;
create policy "products admin insert" on public.products for insert to authenticated with check ((select public.is_admin()));
drop policy if exists "products admin update" on public.products;
create policy "products admin update" on public.products for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "products admin delete" on public.products;
create policy "products admin delete" on public.products for delete to authenticated using ((select public.is_admin()));

drop policy if exists "orders user insert own" on public.orders;
-- New orders are created by the trusted transaction below; no direct client insert policy.
drop policy if exists "orders read own or admin" on public.orders;
create policy "orders read own or admin" on public.orders for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "orders admin update" on public.orders;
create policy "orders admin update" on public.orders for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Server-validated checkout: lock inventory, derive current DB prices, and create one order atomically.
create or replace function public.create_order(
  p_customer_name text, p_customer_email text, p_customer_phone text, p_address text, p_items jsonb
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
  v_total numeric(12,2) := 0;
  v_lines jsonb := '[]'::jsonb;
  v_order public.orders%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if nullif(trim(p_customer_name), '') is null or nullif(trim(p_customer_phone), '') is null or nullif(trim(p_address), '') is null then
    raise exception 'Complete delivery details are required';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Cart is empty'; end if;
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::integer;
    if v_qty < 1 then raise exception 'Invalid item quantity'; end if;
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid for update;
    if not found then raise exception 'A product is no longer available'; end if;
    if v_product.stock < v_qty then raise exception 'Insufficient stock for %', v_product.name; end if;
    update public.products set stock = stock - v_qty where id = v_product.id;
    v_total := v_total + v_product.price * v_qty;
    v_lines := v_lines || jsonb_build_array(jsonb_build_object('product_id',v_product.id,'name',v_product.name,'quantity',v_qty,'unit_price',v_product.price,'image_url',v_product.image_url));
  end loop;
  insert into public.orders(user_id,customer_name,customer_email,customer_phone,address,total_amount,status,items)
  values(auth.uid(),trim(p_customer_name),trim(p_customer_email),trim(p_customer_phone),trim(p_address),v_total,'pending',v_lines)
  returning * into v_order;
  return to_jsonb(v_order);
end;
$$;
revoke all on function public.create_order(text,text,text,text,jsonb) from public, anon;
grant execute on function public.create_order(text,text,text,text,jsonb) to authenticated;

-- Storage bucket is created in the Dashboard as public. Public read; writes limited to admins.
drop policy if exists "product images public read" on storage.objects;
create policy "product images public read" on storage.objects for select to anon, authenticated
using (bucket_id = 'product-images');
drop policy if exists "product images admin insert" on storage.objects;
create policy "product images admin insert" on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and (select public.is_admin()));
drop policy if exists "product images admin update" on storage.objects;
create policy "product images admin update" on storage.objects for update to authenticated
using (bucket_id = 'product-images' and (select public.is_admin()))
with check (bucket_id = 'product-images' and (select public.is_admin()));
drop policy if exists "product images admin delete" on storage.objects;
create policy "product images admin delete" on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and (select public.is_admin()));
