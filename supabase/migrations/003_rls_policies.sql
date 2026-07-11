-- RLS on every table (spec section 10). Baseline shape for Phase 0/2:
--   * staff (any role except 'customer', is_active) get full read access to
--     internal operational tables via dmech_is_staff().
--   * customers can only read rows that trace back to their own
--     `customers` row via dmech_customer_id().
--   * writes from authenticated sessions are deliberately narrow — most
--     mutations (registration approval, payment recording, admin config)
--     go through route handlers using the service-role client, matching the
--     "API routes for mutations, explicit ALLOWED-field allowlist" pattern
--     from oro-energy-management-hub.
-- Per-role write granularity (e.g. "Sales Rep: Customer Hub — create only"
-- from spec 7.2) is intentionally not fully modeled yet — that needs
-- deliberate per-action policies, flagged as a Phase 2 follow-up rather than
-- guessed at here.

alter table users enable row level security;
alter table leads enable row level security;
alter table customers enable row level security;
alter table vehicles enable row level security;
alter table shipments enable row level security;
alter table instalments enable row level security;
alter table payments enable row level security;
alter table customs_entries enable row level security;
alter table parts enable row level security;
alter table specialists enable row level security;
alter table job_cards enable row level security;
alter table notifications enable row level security;
alter table audit_log enable row level security;
alter table platform_config enable row level security;
alter table warranty_policies enable row level security;
alter table warranty_claims enable row level security;
alter table warranty_reserve_ledger enable row level security;

-- users
create policy "staff read all users" on users for select using (dmech_is_staff());
create policy "self read own user row" on users for select using (auth_user_id = auth.uid());
create policy "self update own user row" on users for update using (auth_user_id = auth.uid());

-- leads — public calculator capture, no auth required to insert
create policy "anyone can create a lead" on leads
  for insert to anon, authenticated with check (true);
create policy "staff read leads" on leads for select using (dmech_is_staff());

-- customers
create policy "staff full read customers" on customers for select using (dmech_is_staff());
create policy "customer read own record" on customers for select using (id = dmech_customer_id());
create policy "customer update own record" on customers for update using (id = dmech_customer_id());

-- vehicles
create policy "staff full read vehicles" on vehicles for select using (dmech_is_staff());
-- Public visibility is intentionally broader than "purchasable right now":
-- the marketing site shows in-transit/at-port vehicles too (mirrors the
-- original mockup's In Transit/At Port filters) for pipeline-activity
-- marketing value — "look how much is actively moving", not just what's
-- sitting ready. It stops short of 'sold'/'delivered' though: once a
-- vehicle belongs to a customer, it's their private property, not DMECH's
-- marketing inventory, which is a small deliberate improvement over the
-- original mockup (which kept showing "Sold" cards).
create policy "public read pipeline vehicles" on vehicles
  for select to anon, authenticated
  using (
    lifecycle_stage in ('shipped', 'in_transit', 'at_port', 'customs', 'cleared', 'available', 'reserved')
    and deleted_at is null
  );
create policy "customer read own vehicles" on vehicles
  for select using (buyer_id = dmech_customer_id());

-- shipments — internal only, no customer-facing shipment records yet
create policy "staff full read shipments" on shipments for select using (dmech_is_staff());

-- instalments
create policy "staff full read instalments" on instalments for select using (dmech_is_staff());
create policy "customer read own instalments" on instalments
  for select using (customer_id = dmech_customer_id());

-- payments
create policy "staff full read payments" on payments for select using (dmech_is_staff());
create policy "customer read own payments" on payments
  for select using (customer_id = dmech_customer_id());

-- customs_entries — internal only
create policy "staff full read customs" on customs_entries for select using (dmech_is_staff());

-- parts — internal only for now (no e-commerce module yet, per spec Phase 2)
create policy "staff full read parts" on parts for select using (dmech_is_staff());

-- specialists — internal only
create policy "staff full read specialists" on specialists for select using (dmech_is_staff());

-- job_cards
create policy "staff full read job cards" on job_cards for select using (dmech_is_staff());
create policy "customer read own job cards" on job_cards
  for select using (customer_id = dmech_customer_id());
create policy "customer create own job card" on job_cards
  for insert with check (customer_id = dmech_customer_id());

-- notifications — internal only, nothing customer-facing reads this table directly
create policy "staff full read notifications" on notifications for select using (dmech_is_staff());

-- audit_log — read-only for staff, no client-side insert path at all (writes
-- happen exclusively through the service-role client alongside the mutation
-- being audited)
create policy "staff read audit log" on audit_log for select using (dmech_is_staff());

-- platform_config — every staff role can read it (Settings page); only
-- managing_partner can write client-side, everything else goes through the
-- service-role client from an admin-only route handler
create policy "staff read platform config" on platform_config for select using (dmech_is_staff());
create policy "managing partner writes platform config" on platform_config
  for update using (dmech_user_role() = 'managing_partner');

-- warranty_policies — public visibility is deliberately narrow: only the
-- terms of an ACTIVE policy on a vehicle that's already publicly visible
-- (available/reserved), so the marketing site's certified badge can show
-- real warranty terms to anonymous visitors without exposing anything else.
create policy "staff full read warranty policies" on warranty_policies
  for select using (dmech_is_staff());
create policy "public read active warranty terms" on warranty_policies
  for select to anon, authenticated
  using (
    status = 'active'
    and exists (
      select 1 from vehicles v
      where v.id = warranty_policies.vehicle_id
        and v.lifecycle_stage in ('available', 'reserved')
        and v.deleted_at is null
    )
  );
create policy "customer read own warranty policies" on warranty_policies
  for select using (
    exists (
      select 1 from vehicles v
      where v.id = warranty_policies.vehicle_id and v.buyer_id = dmech_customer_id()
    )
  );

-- warranty_claims — staff manage everything; a customer can see and file
-- claims against their own vehicle's policy (portal "Book a Service"-style
-- flow, Phase 3), but not see or create claims on anyone else's.
create policy "staff full read warranty claims" on warranty_claims
  for select using (dmech_is_staff());
create policy "customer read own warranty claims" on warranty_claims
  for select using (customer_id = dmech_customer_id());
create policy "customer create own warranty claim" on warranty_claims
  for insert with check (customer_id = dmech_customer_id());

-- warranty_reserve_ledger — staff-read-only financial ledger. No
-- customer-facing access at all, and no client-side insert path — accrual
-- and claim-payout entries are written exclusively by service-role route
-- handlers alongside the sale/claim-approval action they record.
create policy "staff read warranty reserve ledger" on warranty_reserve_ledger
  for select using (dmech_is_staff());
