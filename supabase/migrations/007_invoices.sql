-- User action needed: run this in the Supabase SQL editor, same as 004/005/006.

-- ── Business profile (singleton platform_config row) ───────────────────────
-- Real legal/tax details for invoice headers — legal_name, tin, rc_number,
-- vat_number, address, bank_name, bank_account_number, bank_account_name.
-- Starts empty; the Settings > Business page is where staff fill it in.
-- Nothing here is fabricated — invoices render blank fields until this is set.
insert into platform_config (key, value) values ('business_profile', '{}'::jsonb)
  on conflict (key) do nothing;

-- ── Invoices / receipts ─────────────────────────────────────────────────────
-- Sequential, gapless-in-normal-operation numbering via a real Postgres
-- sequence (not a client-supplied counter) — INV-2026-00001 / RCT-2026-00001.
-- Separate sequences per doc_type since invoice and receipt numbering are
-- conventionally independent series.
create sequence invoice_number_seq start 1;
create sequence receipt_number_seq start 1;

create table invoices (
  id uuid primary key default gen_random_uuid(),
  doc_type text not null check (doc_type in ('invoice', 'receipt')),
  invoice_number text not null unique,
  vehicle_id uuid references vehicles(id),
  customer_id uuid references customers(id),
  issue_date date not null default current_date,
  line_items jsonb not null default '[]'::jsonb, -- [{description, quantity, unit_price_kobo, amount_kobo}]
  subtotal_kobo bigint not null,
  -- Vehicle-sale VAT treatment isn't asserted here — defaults to exempt (no
  -- charge added beyond the agreed sale_price_kobo already shown throughout
  -- the site) until staff confirm the correct treatment with their
  -- accountant and toggle it off per-invoice.
  vat_rate numeric(4,2) not null default 7.5,
  vat_exempt boolean not null default true,
  vat_amount_kobo bigint not null default 0,
  total_kobo bigint not null,
  notes text,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);
create index invoices_vehicle_idx on invoices(vehicle_id);
create index invoices_customer_idx on invoices(customer_id);

create or replace function dmech_assign_invoice_number()
returns trigger as $$
begin
  if new.invoice_number is null then
    if new.doc_type = 'invoice' then
      new.invoice_number := 'INV-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('invoice_number_seq')::text, 5, '0');
    else
      new.invoice_number := 'RCT-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('receipt_number_seq')::text, 5, '0');
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger dmech_invoices_number before insert on invoices
  for each row execute function dmech_assign_invoice_number();

alter table invoices enable row level security;
create policy "staff full read invoices" on invoices for select using (dmech_is_staff());
-- Writes go through service-role route handlers only (same convention as
-- every other mutation in this project) — no client-side write policy.
