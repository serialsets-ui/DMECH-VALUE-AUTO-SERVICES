import { redirect } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { ClickableRow } from "@/components/ops/ClickableRow";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/money";
import type { PaymentStatus } from "@/types";

interface PaymentRow {
  id: string;
  instalment_id: string;
  payment_number: number | null;
  amount_kobo: number;
  due_date: string;
  status: PaymentStatus;
  payment_method: string | null;
  customers: { full_name: string } | null;
  instalments: { vehicles: { make: string; model: string; year: number } | null } | null;
}

const STATUS_CLASS: Record<PaymentStatus, string> = {
  paid: "ops-badge-green",
  pending: "ops-badge-blue",
  overdue: "ops-badge-amber",
  partial: "ops-badge-muted",
};

export default async function OpsPaymentsPage() {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("id, instalment_id, payment_number, amount_kobo, due_date, status, payment_method, customers(full_name), instalments(vehicles(make,model,year))")
    .order("due_date", { ascending: true });

  // Supabase's generic types infer every embed as an array regardless of
  // cardinality — both FKs here are many-to-one, so cast to the real shape.
  const payments = (data ?? []) as unknown as PaymentRow[];

  return (
    <>
      <TopBar title="Payments" />
      <div className="ops-content">
        {payments.length === 0 ? (
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
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <ClickableRow key={p.id} href={`/ops/instalments/${p.instalment_id}`}>
                    <td>{p.customers?.full_name ?? "—"}</td>
                    <td>
                      {p.instalments?.vehicles
                        ? `${p.instalments.vehicles.year} ${p.instalments.vehicles.make} ${p.instalments.vehicles.model}`
                        : "—"}
                    </td>
                    <td>{p.payment_number ?? "—"}</td>
                    <td>{formatNaira(p.amount_kobo)}</td>
                    <td>{new Date(p.due_date).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td style={{ textTransform: "capitalize" }}>{p.payment_method?.replace("_", " ") ?? "—"}</td>
                    <td>
                      <span className={`ops-badge ${STATUS_CLASS[p.status] ?? "ops-badge-muted"}`}>{p.status}</span>
                    </td>
                  </ClickableRow>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
