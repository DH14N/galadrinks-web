-- ---------------------------------------------------------------------------
-- Linking website products to Sage 50.
--
-- Sage is the real source of truth for prices, but the two systems have
-- never shared a product code (Sage says ABSOLUTVOD, the website says
-- 0002841). So each Sage line has to be pointed at the right website
-- product ONCE, by a person, on the matching screen in the admin area.
--
-- After that the link is permanent: a fresh price export from Sage
-- updates every matched product automatically.
--
-- Safe to run more than once.
-- ---------------------------------------------------------------------------

-- The Sage code lives on the product itself, so a price import can find it.
alter table products add column if not exists sage_code text;

create unique index if not exists products_sage_code_key
  on products (sage_code)
  where sage_code is not null;

-- One row per line in the Sage product export.
create table if not exists sage_products (
  code          text primary key,
  description   text not null,
  price_pence   integer,
  product_id    uuid references products (id) on delete set null,
  status        text not null default 'pending',
  decided_at    timestamptz,
  imported_at   timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'sage_products_status_check'
  ) then
    alter table sage_products add constraint sage_products_status_check
      check (status in ('pending', 'matched', 'not_stocked', 'skipped'));
  end if;
end $$;

create index if not exists sage_products_status_idx on sage_products (status);
create index if not exists sage_products_product_idx on sage_products (product_id);

-- Nothing in here should ever be readable by a customer's browser: it holds
-- buying-side product codes and prices. Only the server's service key
-- touches it, and that bypasses RLS, so no policies are needed.
alter table sage_products enable row level security;
