-- User action needed: run this in the Supabase SQL editor, same as 004–007.

-- payments.amount_kobo is the amount DUE for that instalment payment;
-- nothing previously recorded the amount actually RECEIVED, which matters
-- once partial payments and receipts are real (a receipt has to say how
-- much was paid, not just how much was owed).
alter table payments add column amount_paid_kobo bigint;

-- Receipts need to trace back to the specific payment they're for (to avoid
-- double-issuing one, and to reach the vehicle via
-- payments -> instalments -> vehicles for the line item description).
alter table invoices add column instalment_id uuid references instalments(id);
alter table invoices add column payment_id uuid references payments(id);
create index invoices_payment_idx on invoices(payment_id);
