-- AURELIA / E-COMMERCE DATABASE
-- PostgreSQL / Supabase
-- Ready for products, inventory, customers, carts, orders, payments and shipping.
-- NEVER put a Supabase service-role key in the frontend.

create extension if not exists pgcrypto;

create type product_status as enum ('draft','active','archived');
create type order_status as enum ('pending','paid','processing','shipped','completed','cancelled','refunded');
create type payment_status as enum ('pending','authorized','paid','failed','refunded');
create type fulfillment_status as enum ('unfulfilled','partial','fulfilled','cancelled');

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  slug text not null unique,
  name text not null,
  short_description text,
  description text,
  category_id uuid references categories(id) on delete set null,
  price numeric(12,2) not null check (price >= 0),
  compare_at_price numeric(12,2) check (compare_at_price is null or compare_at_price >= price),
  currency char(3) not null default 'PLN',
  status product_status not null default 'draft',
  is_featured boolean not null default false,
  is_bestseller boolean not null default false,
  is_new boolean not null default false,
  weight_kg numeric(10,2),
  width_cm numeric(10,2),
  height_cm numeric(10,2),
  depth_cm numeric(10,2),
  meta_title text,
  meta_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false
);

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  sku text not null unique,
  name text not null,
  price numeric(12,2) check (price is null or price >= 0),
  attributes jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete cascade,
  quantity integer not null default 0 check (quantity >= 0),
  reserved_quantity integer not null default 0 check (reserved_quantity >= 0),
  reorder_level integer not null default 0 check (reorder_level >= 0),
  updated_at timestamptz not null default now(),
  check (
    (product_id is not null and variant_id is null)
    or (product_id is null and variant_id is not null)
  )
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  email text not null unique,
  first_name text,
  last_name text,
  phone text,
  marketing_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  label text,
  first_name text not null,
  last_name text not null,
  company text,
  street text not null,
  postal_code text not null,
  city text not null,
  country_code char(2) not null default 'PL',
  phone text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists carts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  session_id text unique,
  currency char(3) not null default 'PLN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  variant_id uuid references product_variants(id) on delete set null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  customer_id uuid references customers(id) on delete set null,
  email text not null,
  status order_status not null default 'pending',
  payment_status payment_status not null default 'pending',
  fulfillment_status fulfillment_status not null default 'unfulfilled',
  currency char(3) not null default 'PLN',
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  shipping_cost numeric(12,2) not null default 0 check (shipping_cost >= 0),
  discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0),
  tax_amount numeric(12,2) not null default 0 check (tax_amount >= 0),
  total numeric(12,2) not null default 0 check (total >= 0),
  notes text,
  shipping_address jsonb not null default '{}'::jsonb,
  billing_address jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  variant_id uuid references product_variants(id) on delete set null,
  sku text not null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  total_price numeric(12,2) not null check (total_price >= 0),
  product_snapshot jsonb not null default '{}'::jsonb
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  provider text not null,
  provider_payment_id text,
  status payment_status not null default 'pending',
  amount numeric(12,2) not null check (amount >= 0),
  currency char(3) not null default 'PLN',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique(provider, provider_payment_id)
);

create table if not exists shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  carrier text,
  service_name text,
  tracking_number text,
  shipping_cost numeric(12,2) not null default 0 check (shipping_cost >= 0),
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null check (discount_type in ('percent','fixed')),
  discount_value numeric(12,2) not null check (discount_value > 0),
  minimum_order_value numeric(12,2) not null default 0 check (minimum_order_value >= 0),
  max_uses integer,
  used_count integer not null default 0 check (used_count >= 0),
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  marketing_consent boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null,
  phone text,
  subject text,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_status on products(status);
create index if not exists idx_product_images_product on product_images(product_id);
create index if not exists idx_variants_product on product_variants(product_id);
create index if not exists idx_inventory_product on inventory(product_id);
create index if not exists idx_inventory_variant on inventory(variant_id);
create index if not exists idx_orders_customer on orders(customer_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created_at on orders(created_at desc);
create index if not exists idx_order_items_order on order_items(order_id);
create index if not exists idx_payments_order on payments(order_id);
create index if not exists idx_shipments_order on shipments(order_id);

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_updated_at on products;
create trigger products_updated_at before update on products for each row execute function set_updated_at();

drop trigger if exists customers_updated_at on customers;
create trigger customers_updated_at before update on customers for each row execute function set_updated_at();

drop trigger if exists carts_updated_at on carts;
create trigger carts_updated_at before update on carts for each row execute function set_updated_at();

drop trigger if exists orders_updated_at on orders;
create trigger orders_updated_at before update on orders for each row execute function set_updated_at();

drop trigger if exists inventory_updated_at on inventory;
create trigger inventory_updated_at before update on inventory for each row execute function set_updated_at();

-- Public storefront view: only active products are exposed by default.
create or replace view storefront_products as
select
  p.id, p.sku, p.slug, p.name, p.short_description, p.description,
  c.slug as category_slug, c.name as category_name,
  p.price, p.compare_at_price, p.currency,
  p.is_featured, p.is_bestseller, p.is_new,
  coalesce(i.quantity - i.reserved_quantity, 0) as available_quantity,
  (
    select pi.url
    from product_images pi
    where pi.product_id = p.id
    order by pi.is_primary desc, pi.sort_order asc
    limit 1
  ) as image_url
from products p
left join categories c on c.id = p.category_id
left join inventory i on i.product_id = p.id
where p.status = 'active';

-- NOTE:
-- Before production, enable Supabase Row Level Security (RLS).
-- Public users should only SELECT storefront_products.
-- Customers should only access their own carts/orders.
-- Admin writes should go through authenticated admin roles or server-side functions.
