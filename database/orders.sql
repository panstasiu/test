-- AURELIA / PUBLIC ORDER CHECKOUT
-- Run this AFTER database/schema.sql in Supabase SQL Editor.
-- The browser may use only the publishable key.
-- No secret/service-role key belongs in the frontend.

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "public can insert orders" on public.orders;
drop policy if exists "public can insert order items" on public.order_items;
drop policy if exists "public cannot read orders" on public.orders;
drop policy if exists "public cannot read order items" on public.order_items;

create policy "public can insert orders"
on public.orders
for insert
to anon, authenticated
with check (
  status = 'pending'
  and payment_status = 'pending'
  and fulfillment_status = 'unfulfilled'
  and total >= 0
);

create policy "public can insert order items"
on public.order_items
for insert
to anon, authenticated
with check (
  quantity > 0
  and unit_price >= 0
  and total_price >= 0
);

-- Atomic order creation: one RPC creates the order and all order items.
-- It intentionally does not expose a SELECT policy for customers.
create or replace function public.create_storefront_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  new_order public.orders%rowtype;
  item jsonb;
  computed_subtotal numeric(12,2);
  computed_shipping numeric(12,2);
  computed_total numeric(12,2);
  customer_email text;
begin
  customer_email := trim(coalesce(payload->>'email',''));

  if customer_email = '' then
    raise exception 'EMAIL_REQUIRED';
  end if;

  if jsonb_typeof(coalesce(payload->'items','null'::jsonb)) <> 'array'
     or jsonb_array_length(payload->'items') = 0 then
    raise exception 'ITEMS_REQUIRED';
  end if;

  computed_subtotal := round(coalesce((payload->>'subtotal')::numeric,0),2);
  computed_shipping := round(coalesce((payload->>'shipping_cost')::numeric,0),2);
  computed_total := round(computed_subtotal + computed_shipping,2);

  if computed_subtotal < 0 or computed_shipping < 0 then
    raise exception 'INVALID_TOTAL';
  end if;

  insert into public.orders (
    email, status, payment_status, fulfillment_status,
    currency, subtotal, shipping_cost, discount_amount, tax_amount, total,
    notes, shipping_address, billing_address
  )
  values (
    customer_email,
    'pending',
    'pending',
    'unfulfilled',
    'PLN',
    computed_subtotal,
    computed_shipping,
    0,
    0,
    computed_total,
    nullif(trim(coalesce(payload->>'notes','')), ''),
    coalesce(payload->'shipping_address','{}'::jsonb),
    coalesce(payload->'billing_address',payload->'shipping_address','{}'::jsonb)
  )
  returning * into new_order;

  for item in jsonb_array_elements(payload->'items')
  loop
    if coalesce((item->>'quantity')::integer,0) <= 0
       or coalesce((item->>'unit_price')::numeric,0) < 0 then
      raise exception 'INVALID_ITEM';
    end if;

    insert into public.order_items (
      order_id, sku, product_name, quantity, unit_price, total_price, product_snapshot
    )
    values (
      new_order.id,
      coalesce(nullif(item->>'sku',''), 'WEB-' || left(md5(coalesce(item->>'id','')),8)),
      coalesce(nullif(item->>'name',''), 'Produkt'),
      (item->>'quantity')::integer,
      round((item->>'unit_price')::numeric,2),
      round((item->>'unit_price')::numeric * (item->>'quantity')::integer,2),
      item
    );
  end loop;

  return jsonb_build_object(
    'id', new_order.id,
    'order_number', new_order.order_number,
    'total', new_order.total,
    'created_at', new_order.created_at
  );
end;
$$;

revoke all on function public.create_storefront_order(jsonb) from public;
grant execute on function public.create_storefront_order(jsonb) to anon, authenticated;
