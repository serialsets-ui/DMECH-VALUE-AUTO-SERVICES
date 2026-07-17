-- User action needed: run this in the Supabase SQL editor, same as 004–016.

-- Invoices/receipts are sequentially numbered financial documents (the
-- invoice_number sequence) -- hard-deleting one would leave a numbering
-- gap that reads as a hidden transaction on audit, and could orphan a
-- receipt that already references it. Same soft-delete shape already used
-- for vehicles/customers (deleted_at), named voided_at here since "void"
-- is the correct accounting term for cancelling an issued invoice.
-- Only ever set on an invoice with no receipt issued against it yet --
-- once paid, it's settled history, not something to cancel.
alter table invoices add column voided_at timestamptz;
