-- On Supabase Cloud, pg_cron must be turned on once via
-- Dashboard -> Database -> Extensions before this migration's cron.schedule()
-- calls will succeed — this create extension call alone isn't always
-- sufficient depending on project plan/permissions, so if this migration
-- fails on the cron.schedule() calls below, enable the extension there first
-- and re-run just those two statements.
create extension if not exists pg_cron;

-- Helper functions used by RLS policies (003) and by cron jobs. Defined
-- before the policies migration since policies reference these by name —
-- note this file runs before 003_rls_policies.sql, the reverse of the
-- "policies then functions" order sketched in the build plan, corrected here
-- because Postgres would otherwise fail to find these functions mid-policy.

create or replace function dmech_current_user_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select id from users where auth_user_id = auth.uid();
$$;

create or replace function dmech_user_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from users where auth_user_id = auth.uid();
$$;

create or replace function dmech_is_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from users
    where auth_user_id = auth.uid()
      and role <> 'customer'
      and is_active = true
  );
$$;

create or replace function dmech_customer_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select c.id from customers c
  join users u on u.id = c.user_id
  where u.auth_user_id = auth.uid()
  limit 1;
$$;

-- ── cron-callable maintenance functions (scheduled via pg_cron, run as the
-- database owner so they bypass RLS like the service-role client does) ────

-- Missing from the original spec's cron list: nothing auto-released a
-- vehicle's 48-hour reservation hold back to 'available'. This closes that
-- gap flagged in review.
create or replace function dmech_release_expired_reservations()
returns void
language sql
as $$
  update vehicles
  set lifecycle_stage = 'available', reserved_until = null
  where lifecycle_stage = 'reserved'
    and reserved_until is not null
    and reserved_until < now();
$$;

create or replace function dmech_mark_overdue_payments()
returns void
language sql
as $$
  update payments
  set status = 'overdue',
      days_overdue = (current_date - due_date)
  where status in ('pending', 'partial')
    and due_date < current_date;
$$;

select cron.schedule(
  'dmech-release-expired-reservations',
  '*/15 * * * *',
  $$select dmech_release_expired_reservations();$$
);

select cron.schedule(
  'dmech-mark-overdue-payments',
  '0 1 * * *',
  $$select dmech_mark_overdue_payments();$$
);
