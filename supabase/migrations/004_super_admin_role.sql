-- Adds a super_admin role, above managing_partner, whose only exclusive
-- privilege is staff management (add staff accounts, set roles) — see
-- src/app/ops/settings/staff/page.tsx and src/app/api/admin/staff/*.
-- No RLS policy changes needed: dmech_is_staff() already treats any
-- non-'customer' role as staff (full read access), and staff
-- creation/role changes go through service-role route handlers, matching
-- 003's existing "mutations go through route handlers" convention.

-- users_role_check is Postgres's default auto-generated name for the
-- unnamed inline CHECK on users.role from 001_schema.sql. If this DROP
-- errors because the real name differs, look it up (\d users in the SQL
-- editor) and adjust — don't guess further.
alter table users drop constraint if exists users_role_check;
alter table users add constraint users_role_check check (role in (
  'super_admin','managing_partner','sales_manager','ops_manager','workshop_lead',
  'sales_rep','accountant','customer'
));

-- Promote the seeded account — this feature exists for them specifically.
update users set role = 'super_admin' where email = 'echeolisenye@gmail.com';
