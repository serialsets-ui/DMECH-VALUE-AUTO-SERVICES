-- User action needed: run this in the Supabase SQL editor, same as 004–009.

-- ── Use-case categories ──────────────────────────────────────────────────
-- Buyer-persona tags (Corporate/Family/Construction/Catering/Logistics) —
-- orthogonal to acquisition_channel/source_region (how/where DMECH got the
-- vehicle) and to condition/fuel_type (what it is). A single vehicle can
-- genuinely serve more than one market (a pickup is both Construction and
-- Logistics), so this is an array, not a single category column.
alter table vehicles add column use_categories text[] not null default '{}';
create index vehicles_use_categories_idx on vehicles using gin (use_categories);
