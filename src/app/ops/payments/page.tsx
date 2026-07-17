import { redirect } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { PaymentsTable, type PaymentTableRow } from "@/components/ops/PaymentsTable";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import type { PaymentMethod, PaymentStatus, StaffRole } from "@/types";

const EDIT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "accountant", "sales_manager"];

interface PaymentRow {
  id: string;
  instalment_id: string;
  payment_number: number | null;
  amount_kobo: number;
  amount_paid_kobo: number | null;
  due_date: string;
  status: PaymentStatus;
  payment_method: PaymentMethod | null;
  customers: { full_name: string } | null;
  instalments: { vehicles: { make: string; model: string; year: number } | null } | null;
}

export default async function OpsPaymentsPage() {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  const supabase = await createClient();
  // vehicles!vehicle_id — instalments has two FK paths to vehicles (this
  // one, plus vehicles.trade_in_applied_to_instalment_id pointing back), so
  // an unqualified embed returns PostgREST 300 Multiple Choices. Confirmed
  // live: the unqualified version of this query genuinely failed this way —
  // silently too, since a discarded `data: null` on error just rendered
  // this whole list as empty rather than erroring visibly.
  const { data } = await supabase
    .from("payments")
    .select(
      "id, instalment_id, payment_number, amount_kobo, amount_paid_kobo, due_date, status, payment_method, customers(full_name), instalments(vehicles!vehicle_id(make,model,year))",
    )
    .order("due_date", { ascending: true });

  // Supabase's generic types infer every embed as an array regardless of
  // cardinality — both FKs here are many-to-one, so cast to the real shape.
  const payments = (data ?? []) as unknown as PaymentRow[];

  // Every receipt already generated against these payments, so the list can
  // show a "Receipt →" link without staff needing to record it again to see
  // one appear.
  const paymentIds = payments.map((p) => p.id);
  const receiptIdByPaymentId: Record<string, string> = {};
  if (paymentIds.length > 0) {
    const { data: receipts } = await supabase
      .from("invoices")
      .select("id, payment_id")
      .in("payment_id", paymentIds);
    for (const r of receipts ?? []) {
      if (r.payment_id) receiptIdByPaymentId[r.payment_id] = r.id;
    }
  }

  const tableRows: PaymentTableRow[] = payments.map((p) => ({
    id: p.id,
    instalment_id: p.instalment_id,
    payment_number: p.payment_number,
    amount_kobo: p.amount_kobo,
    amount_paid_kobo: p.amount_paid_kobo,
    due_date: p.due_date,
    status: p.status,
    payment_method: p.payment_method,
    customerName: p.customers?.full_name ?? "—",
    vehicleLabel: p.instalments?.vehicles
      ? `${p.instalments.vehicles.year} ${p.instalments.vehicles.make} ${p.instalments.vehicles.model}`
      : "—",
  }));

  return (
    <>
      <TopBar title="Payments" />
      <div className="ops-content">
        {tableRows.length === 0 ? (
          <div className="ops-panel" style={{ color: "var(--muted)", fontSize: 14 }}>
            No scheduled payments yet — these are generated when an instalment plan is created.
          </div>
        ) : (
          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>#</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <PaymentsTable
                  payments={tableRows}
                  canEdit={EDIT_ROLES.includes(staff.role as StaffRole)}
                  receiptIdByPaymentId={receiptIdByPaymentId}
                />
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
