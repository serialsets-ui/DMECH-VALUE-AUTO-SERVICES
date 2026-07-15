-- User action needed: run this in the Supabase SQL editor, same as 004–008.

-- ── Customer documents — private bucket, unlike vehicle-photos ────────────
-- These are ID scans, proof of income, etc. — sensitive, never public. All
-- access (upload, staff review, portal viewing) goes through service-role
-- route handlers that generate signed URLs, matching justra-web/oro's
-- private-bucket convention (the opposite choice from vehicle-photos, which
-- is deliberately public — see 005's comment for why that one differs). No
-- client-side storage.objects policies are needed as a result: nothing ever
-- talks to this bucket directly from the browser.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('customer-documents', 'customer-documents', false, 10485760,
        array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

-- ── Approval tier thresholds (Naira, stored as kobo) ───────────────────────
-- Tier is set by requested credit_limit_kobo at registration. Thresholds are
-- a reasonable starting default, not a verified underwriting policy —
-- adjustable later the same way other platform_config values are (currently
-- direct DB edit; no dedicated Settings UI for this key yet, matching every
-- platform_config key except business_profile).
insert into platform_config (key, value) values
  ('approval_tier_thresholds_kobo', '{"tier1_max": 500000000, "tier2_max": 1500000000, "tier3_max": 3000000000}')
on conflict (key) do nothing;

-- ── Invoices: customers can read their own ─────────────────────────────────
-- Needed for the portal to show/link a customer's own invoices/receipts —
-- missed when 007_invoices.sql only added a staff-read policy.
create policy "customer read own invoices" on invoices
  for select using (customer_id = dmech_customer_id());
