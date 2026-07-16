-- User action needed: run this in the Supabase SQL editor, same as 004–010.

-- Set true whenever a staff account is created with a staff-chosen initial
-- password (new hires via Ops > Settings > Staff, or manually seeded
-- accounts like this one) — ops/layout.tsx redirects to /change-password
-- until it's cleared. Defaults false so it doesn't retroactively force
-- existing staff (who already know their own password) to change it.
alter table users add column must_change_password boolean not null default false;
