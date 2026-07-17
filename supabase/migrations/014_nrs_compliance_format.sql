-- User action needed: run this in the Supabase SQL editor, same as 004–013.

-- NRS (Nigeria Revenue Service) e-invoicing compliant document format --
-- same shape as the sibling JUSTRA project: capture the customer's TIN,
-- tag invoices B2B/B2C, and add the transmission-tracking columns an
-- Access Point Provider integration (e.g. MAXFRONT's FETCH) would fill in
-- once DMECH has one. That integration itself is NOT built here -- these
-- columns just sit ready, same as JUSTRA's, until real AP credentials
-- exist. DMECH's own TIN already lives in platform_config.business_profile
-- (migration 007); this is the customer's TIN on the other side of the
-- invoice.

alter table customers add column tin text;

alter table invoices add column customer_tin text;
-- 'B2B' | 'B2C', computed automatically at invoice creation from whether
-- customer_tin is set -- not a user-facing choice.
alter table invoices add column invoice_type_code text;
-- UN/EDIFACT payment means code; 'ZZZ' (mutually defined) until DMECH
-- actually captures a specific payment instrument per invoice.
alter table invoices add column payment_means_code text;

alter table invoices add column fetch_invoice_id text;
alter table invoices add column fetch_irn text;
alter table invoices add column fetch_transmission_status text not null default 'NotSent';
alter table invoices add constraint invoices_fetch_transmission_status_check
  check (fetch_transmission_status in ('NotSent', 'Pending', 'Sent', 'Failed', 'Cancelled'));
alter table invoices add column fetch_transmitted_at timestamptz;

create index invoices_fetch_irn_idx on invoices(fetch_irn);
create index invoices_fetch_transmission_status_idx on invoices(fetch_transmission_status);
