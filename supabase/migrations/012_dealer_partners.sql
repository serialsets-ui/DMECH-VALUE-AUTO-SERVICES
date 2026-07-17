-- User action needed: run this in the Supabase SQL editor, same as 004–011.

-- Dealer Partners — other dealerships DMECH sources vehicles from. Modeled
-- as a `customers` row (type='dealer_partner') rather than a new table:
-- vehicles.consignor_customer_id, consignment_commission_pct, and
-- consignment_payout_kobo already do exactly the accounting this
-- relationship needs, and a dealer partner needs no auth account either
-- (customers.user_id is already nullable) -- reusing this table means the
-- entire existing intake -> inspection -> certify -> sell pipeline applies
-- unchanged. DMECH still inspects and certifies every vehicle before it's
-- published regardless of source, which is the actual point: trust stays
-- with DMECH, not whichever dealer supplied the car.
--
-- customers_type_check is Postgres's default auto-generated name for the
-- unnamed inline CHECK on customers.type from 001_schema.sql. If this DROP
-- errors because the real name differs, look it up (\d customers in the SQL
-- editor) and adjust -- don't guess further.
alter table customers drop constraint if exists customers_type_check;
alter table customers add constraint customers_type_check check (type in (
  'instalment_buyer','cash_buyer','workshop_walkin','corporate',
  'parts_retail','parts_wholesale','dealer_partner'
));
