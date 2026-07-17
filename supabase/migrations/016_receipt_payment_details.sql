-- User action needed: run this in the Supabase SQL editor, same as 004–015.

-- Every receipt (instalment payment, deposit, cash sale paid in full, or a
-- manually-marked-paid invoice) records how and when the money actually
-- came in -- not just DMECH's own bank details (relevant on an unpaid
-- invoice as "where to send money", not on a receipt confirming money
-- already received). Denormalized onto invoices directly rather than only
-- derivable from the `payments` table, since deposits/cash sales/manual
-- invoices have no `payments` row to read this from.
alter table invoices add column payment_method text check (payment_method in ('bank_transfer', 'paystack', 'pos', 'cash'));
alter table invoices add column paid_date date;
