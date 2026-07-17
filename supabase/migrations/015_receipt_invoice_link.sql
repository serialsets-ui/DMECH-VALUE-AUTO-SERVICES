-- User action needed: run this in the Supabase SQL editor, same as 004–014.

-- Lets a manually-created invoice's "Mark Paid" action generate a matching
-- receipt row that points back at the invoice it settles -- the same
-- pattern instalment payments already use (payment_id/instalment_id), just
-- for the manual-invoice path, which has no payments table row to link to.
alter table invoices add column related_invoice_id uuid references invoices(id);
create index invoices_related_invoice_idx on invoices(related_invoice_id);
