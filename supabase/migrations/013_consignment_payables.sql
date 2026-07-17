-- User action needed: run this in the Supabase SQL editor, same as 004–012.

-- consignment_payout_kobo was already computed correctly at Record Sale
-- (sale_price_kobo * (1 - commission_pct/100)) but nothing tracked whether
-- DMECH had actually paid it -- the value just sat on the row, never
-- displayed anywhere again. This is the field that closes that gap: null
-- means outstanding, a timestamp means paid.
alter table vehicles add column consignment_payout_paid_at timestamptz;
