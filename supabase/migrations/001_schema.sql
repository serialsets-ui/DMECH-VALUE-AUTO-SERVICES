-- DMECH Value Auto Services — core schema
-- All monetary columns are BIGINT storing kobo (naira * 100).
-- Only src/lib/money.ts should convert between kobo and display naira.

create extension if not exists pgcrypto;

-- ── users (staff + customers with portal logins) ──────────────────────────
create table users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  email text unique not null,
  phone text unique,
  full_name text not null,
  role text not null check (role in (
    'managing_partner','sales_manager','ops_manager','workshop_lead',
    'sales_rep','accountant','customer'
  )),
  is_active boolean not null default true,
  avatar_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── leads (top-of-funnel captures, pre-registration) ─────────────────────
-- Added in review: the marketing calculator captures a phone number with no
-- home in the original spec. This is the raw capture; it graduates into a
-- `customers` row once someone actually registers. Generalized beyond just
-- the calculator during Phase 1 build: the workshop service-booking form
-- (spec 4.5) has the same shape — a phone number plus some free-form intent
-- payload, needing staff follow-up before it becomes a real job_card — so
-- `source` distinguishes 'calculator' from 'workshop_booking' and `payload`
-- (renamed from calculator_inputs) holds whichever shape fits the source.
create table leads (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  source text not null default 'calculator',
  payload jsonb not null default '{}'::jsonb,
  converted_customer_id uuid references users(id),
  created_at timestamptz not null default now()
);
create index leads_phone_idx on leads(phone);
create index leads_converted_idx on leads(converted_customer_id);

-- ── customers ───────────────────────────────────────────────────────────
create table customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  type text not null check (type in (
    'instalment_buyer','cash_buyer','workshop_walkin','corporate',
    'parts_retail','parts_wholesale'
  )),
  full_name text not null,
  phone text not null,
  email text,
  address text,
  bvn text, -- encrypted at rest via Supabase Vault; instalment buyers only
  employer text,
  monthly_income_kobo bigint,
  guarantor jsonb,
  company_details jsonb,
  approval_status text not null default 'pending' check (approval_status in (
    'pending','stage2_docs','approved','declined'
  )),
  approval_tier int check (approval_tier in (1,2,3,4)),
  approved_by uuid[] not null default '{}',
  credit_limit_kobo bigint,
  ltv_tier text not null default 'new' check (ltv_tier in ('new','medium','high','vip')),
  documents jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index customers_phone_idx on customers(phone);
create index customers_approval_status_idx on customers(approval_status);

-- ── shipments (created before vehicles since vehicles FK to it) ──────────
create table shipments (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  cargo_type text not null,
  origin text not null,
  destination text not null,
  departed_at date,
  eta date,
  progress_pct int not null default 0 check (progress_pct between 0 and 100),
  vessel_name text,
  tracking_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── vehicles ────────────────────────────────────────────────────────────
create table vehicles (
  id uuid primary key default gen_random_uuid(),
  make text not null,
  model text not null,
  year int not null,
  vin text unique,
  colour text,
  engine_cc int, -- null for EVs
  fuel_type text check (fuel_type in ('petrol','diesel','hybrid','electric')),
  battery_range_km int, -- EVs only
  -- 'nigeria' added for the Nigerian-Used/Certified program — geographic
  -- origin only; how DMECH acquired *this* unit is acquisition_channel below.
  source_region text check (source_region in ('usa','europe','china','nigeria')),
  source_detail text,
  condition text check (condition in ('used','new')),
  purchase_price_usd_cents bigint,
  shipping_cost_usd_cents bigint,
  customs_duty_kobo bigint,
  sale_price_kobo bigint,
  cost_basis_kobo bigint,
  margin_pct numeric(5,2),
  -- 'reserved' restored here per spec section 3; the v2.4 ops mockup's UI
  -- lifecycle bar dropped it (only showed 10 stages) — this is the bug fix,
  -- the schema itself is correct. The Vehicles page must render all 11.
  -- 'intake' and 'inspection' added for the Nigerian-Used/Certified program:
  -- non-import channels enter here and skip the shipping-specific stages
  -- entirely; the Vehicles page lifecycle bar renders a channel-appropriate
  -- subset rather than forcing every vehicle through all 13 stages.
  lifecycle_stage text not null default 'sourced' check (lifecycle_stage in (
    'intake','inspection','sourced','purchased','shipped','in_transit',
    'at_port','customs','cleared','available','reserved','sold','delivered'
  )),
  reserved_until timestamptz, -- drives the reservation-hold auto-expiry cron
  buyer_id uuid references customers(id),
  shipment_id uuid references shipments(id),
  condition_report jsonb not null default '[]'::jsonb,
  photos text[] not null default '{}',
  video_url text,
  inspection_score numeric(3,1),

  -- ── Nigerian-Used/Certified program ──────────────────────────────────
  -- How DMECH obtained this specific unit — orthogonal to source_region.
  -- Defaults to 'import' since that's every vehicle in the original spec.
  acquisition_channel text not null default 'import' check (acquisition_channel in (
    'import','local_outright','consignment','trade_in'
  )),
  -- Only 'certified' vehicles may have a warranty_policies row or show the
  -- certified badge on the marketing site. 'uncertified' stock is still
  -- sellable, just as-is and at a correspondingly lower price.
  certification_status text not null default 'uncertified' check (certification_status in (
    'uncertified','pending_inspection','certified'
  )),
  -- Consignment settlement accounting (acquisition_channel = 'consignment').
  consignor_customer_id uuid references customers(id),
  consignment_commission_pct numeric(5,2),
  consignment_payout_kobo bigint,
  -- Trade-in credit accounting (acquisition_channel = 'trade_in'). FK to
  -- instalments added below via ALTER TABLE since instalments is defined
  -- later in this file.
  trade_in_credit_kobo bigint,
  trade_in_applied_to_instalment_id uuid,
  -- Acquisition-side provenance check (FRSC/lien/prior-registration lookups)
  -- — this is the real legal-exposure mitigation for buying third-party
  -- stock, distinct from the resale-side condition_report above.
  title_verification jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index vehicles_lifecycle_stage_idx on vehicles(lifecycle_stage);
create index vehicles_buyer_idx on vehicles(buyer_id);
create index vehicles_reserved_until_idx on vehicles(reserved_until) where lifecycle_stage = 'reserved';
create index vehicles_certification_status_idx on vehicles(certification_status);
create index vehicles_acquisition_channel_idx on vehicles(acquisition_channel);

-- ── instalments (plan-level) ────────────────────────────────────────────
create table instalments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id),
  vehicle_id uuid not null references vehicles(id),
  plan_type text check (plan_type in ('dmech_direct','partner_finance')),
  total_price_kobo bigint not null,
  deposit_pct numeric(5,2),
  deposit_amount_kobo bigint,
  deposit_paid boolean not null default false,
  deposit_paid_at timestamptz,
  tenor_months int not null,
  monthly_amount_kobo bigint,
  admin_fee_pct numeric(5,2), -- dmech_direct only
  status text not null default 'active' check (status in ('active','completed','defaulted','cancelled')),
  guarantor_notified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index instalments_customer_idx on instalments(customer_id);
create index instalments_status_idx on instalments(status);

-- deferred FK from vehicles (trade-in credit applied to the new purchase it
-- funded) — added here since instalments didn't exist yet when vehicles was
-- created above.
alter table vehicles
  add constraint vehicles_trade_in_instalment_fk
  foreign key (trade_in_applied_to_instalment_id) references instalments(id);

-- ── payments (individual instalment payments) ──────────────────────────
create table payments (
  id uuid primary key default gen_random_uuid(),
  instalment_id uuid not null references instalments(id),
  customer_id uuid not null references customers(id),
  amount_kobo bigint not null,
  payment_number int,
  due_date date not null,
  paid_date date,
  status text not null default 'pending' check (status in ('pending','paid','overdue','partial')),
  days_overdue int not null default 0, -- updated by cron
  paystack_ref text,
  payment_method text check (payment_method in ('bank_transfer','paystack','pos','cash')),
  receipt_url text,
  reminder_sent jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payments_instalment_idx on payments(instalment_id);
create index payments_status_idx on payments(status);
create index payments_due_date_idx on payments(due_date) where status in ('pending','overdue');

-- ── warranty_policies (Nigerian-Used/Certified program) ─────────────────
-- One per certified vehicle sale. reserve_contribution_kobo is the amount
-- accrued into warranty_reserve_ledger on sale — the self-insured-reserve
-- funding model decided over the marketing-line alternative.
create table warranty_policies (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id),
  coverage_tier text not null check (coverage_tier in ('basic','extended')),
  duration_days int not null,
  mileage_limit_km int,
  covered_components jsonb not null default '[]'::jsonb,
  excluded_items jsonb not null default '[]'::jsonb,
  price_kobo bigint not null default 0, -- 0 if bundled free with certification
  reserve_contribution_pct numeric(5,2) not null,
  reserve_contribution_kobo bigint not null,
  status text not null default 'active' check (status in ('active','expired','void','claimed_out')),
  starts_at date not null,
  expires_at date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index warranty_policies_vehicle_idx on warranty_policies(vehicle_id);
create index warranty_policies_status_idx on warranty_policies(status);

-- ── warranty_claims ──────────────────────────────────────────────────────
create table warranty_claims (
  id uuid primary key default gen_random_uuid(),
  warranty_policy_id uuid not null references warranty_policies(id),
  customer_id uuid not null references customers(id),
  reported_at timestamptz not null default now(),
  issue_description text not null,
  assessed_cost_kobo bigint,
  approved_kobo bigint,
  status text not null default 'submitted' check (status in (
    'submitted','assessed','approved','denied','paid'
  )),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index warranty_claims_policy_idx on warranty_claims(warranty_policy_id);
create index warranty_claims_status_idx on warranty_claims(status);

-- ── warranty_reserve_ledger ──────────────────────────────────────────────
-- Simple append-only ledger — reserve balance is a SUM(amount_kobo)
-- aggregate read (accruals positive, claim payouts negative), not a
-- maintained running-balance column, to keep this migration simple. A
-- cached balance can follow later if the ledger grows large enough to
-- matter for query performance.
create table warranty_reserve_ledger (
  id uuid primary key default gen_random_uuid(),
  entry_type text not null check (entry_type in ('accrual','claim_payout','adjustment')),
  amount_kobo bigint not null,
  related_policy_id uuid references warranty_policies(id),
  related_claim_id uuid references warranty_claims(id),
  note text,
  created_at timestamptz not null default now()
);
create index warranty_reserve_ledger_policy_idx on warranty_reserve_ledger(related_policy_id);

-- ── customs_entries ─────────────────────────────────────────────────────
create table customs_entries (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id),
  agent text,
  status text not null default 'documents_submitted',
  documents_checklist jsonb not null default '[]'::jsonb,
  duty_estimated_kobo bigint,
  duty_paid_kobo bigint,
  cleared_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index customs_entries_vehicle_idx on customs_entries(vehicle_id);

-- ── parts ───────────────────────────────────────────────────────────────
create table parts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  compatibility text,
  qty int not null default 0,
  cost_price_kobo bigint not null,
  sale_price_kobo bigint not null,
  source text,
  condition text check (condition in ('tested','good','excellent')),
  vin_trace text,
  reorder_threshold int not null default 2,
  units_sold int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index parts_low_stock_idx on parts(qty) where qty <= reorder_threshold;

-- ── specialists ─────────────────────────────────────────────────────────
create table specialists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  name text not null,
  specialty text,
  rating numeric(2,1),
  jobs_completed int not null default 0,
  revenue_generated_kobo bigint not null default 0,
  share_pct numeric(5,2) not null default 40,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── job_cards (workshop) ────────────────────────────────────────────────
create table job_cards (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null, -- e.g. JC-0048
  customer_id uuid references customers(id),
  vehicle_desc text not null,
  specialist_id uuid references specialists(id),
  stage text not null default 'reception' check (stage in (
    'reception','diagnostics','planning','execution','qa','released'
  )),
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  complaint text,
  service_type text,
  quote_kobo bigint,
  parts_used jsonb not null default '[]'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index job_cards_stage_idx on job_cards(stage);

-- ── notifications (whatsapp/sms/email log) ─────────────────────────────
create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references users(id),
  recipient_phone text,
  channel text not null check (channel in ('whatsapp','sms','email')),
  template text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued','sent','delivered','failed')),
  sent_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_recipient_idx on notifications(recipient_id);

-- ── audit_log ───────────────────────────────────────────────────────────
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  action text not null,
  table_name text not null,
  record_id uuid,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_table_record_idx on audit_log(table_name, record_id);

-- ── platform_config (singleton rows, admin-configurable settings) ──────
create table platform_config (
  key text primary key,
  value jsonb not null,
  updated_by uuid references users(id),
  updated_at timestamptz not null default now()
);

-- seed the settings the ops mockup already exposes as editable
insert into platform_config (key, value) values
  ('ngn_usd_rate', '1580'),
  ('dmech_service_fee_pct', '8'),
  ('default_deposit_pct', '40'),
  ('default_tenor_months', '6'),
  ('reservation_hold_hours', '48'),
  ('max_self_finance_kobo', '1500000000'),
  ('parts_credit_limits', '{"retail": 50000000, "wholesale_auto": 200000000, "wholesale_manual": 500000000}'),
  ('reminder_days', '[1,3,7]'),
  -- admin-editable "typical market price" benchmark per make/model/year, used
  -- instead of the calculator's old hardcoded 12%/20-25% markup guess so the
  -- "you save X%" claim on the marketing site is backed by a real number
  -- DMECH staff maintain, not an invented multiplier.
  ('market_price_benchmarks', '{}'),
  -- Nigerian-Used/Certified program: % of a certified sale's price accrued
  -- into warranty_reserve_ledger on sale. Admin-adjustable rather than
  -- hardcoded in the Phase 2B route handler that writes the accrual entry.
  ('warranty_reserve_contribution_pct', '5')
on conflict (key) do nothing;
