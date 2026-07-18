import { redirect } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { ClickableRow } from "@/components/ops/ClickableRow";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/money";
import type { PaymentMethod } from "@/types";

const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  bank_transfer: "Bank Transfer",
  paystack: "Paystack",
  pos: "POS",
  cash: "Cash",
};

interface ReceiptRow {
  id: string;
  invoice_number: string;
  total_kobo: number;
  payment_method: PaymentMethod | null;
  paid_date: string | null;
  related_invoice_id: string | null;
  instalment_id: string | null;
  vehicles: { make: string; model: string; year: number } | null;
  customers: { full_name: string } | null;
}

export default async function OpsReceiptsPage() {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("id, invoice_number, total_kobo, payment_method, paid_date, related_invoice_id, instalment_id, vehicles(make,model,year), customers(full_name)")
    .eq("doc_type", "receipt")
    .order("created_at", { ascending: false });

  // Supabase's generic types infer every embed as an array regardless of
  // cardinality — both FKs here are many-to-one, so cast to the real shape.
  const receipts = (data ?? []) as unknown as ReceiptRow[];

  // A receipt tied to an instalment (a deposit or monthly payment) links
  // back to that instalment's master invoice, not itself -- look up the
  // one invoice per instalment_id in a single query rather than per-row.
  const instalmentIds = receipts.filter((r) => r.instalment_id && !r.related_invoice_id).map((r) => r.instalment_id as string);
  const invoiceIdByInstalmentId = new Map<string, string>();
  if (instalmentIds.length > 0) {
    const { data: masterInvoices } = await supabase
      .from("invoices")
      .select("id, instalment_id")
      .eq("doc_type", "invoice")
      .in("instalment_id", instalmentIds);
    for (const inv of masterInvoices ?? []) {
      if (inv.instalment_id) invoiceIdByInstalmentId.set(inv.instalment_id, inv.id);
    }
  }

  return (
    <>
      <TopBar title="Receipts" />
      <div className="ops-content">
        {receipts.length === 0 ? (
          <div className="ops-panel" style={{ color: "var(--muted)", fontSize: 14 }}>
            No payments received yet — a receipt is generated automatically every time a payment,
            deposit, or invoice is marked paid.
          </div>
        ) : (
          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Vehicle</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Paid Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((r) => {
                  const parentInvoiceId = r.related_invoice_id ?? (r.instalment_id ? invoiceIdByInstalmentId.get(r.instalment_id) : null);
                  const row = (
                    <>
                      <td>{r.invoice_number}</td>
                      <td>{r.vehicles ? `${r.vehicles.year} ${r.vehicles.make} ${r.vehicles.model}` : "—"}</td>
                      <td>{r.customers?.full_name ?? "—"}</td>
                      <td>{formatNaira(r.total_kobo)}</td>
                      <td style={{ textTransform: "capitalize" }}>{r.payment_method ? PAYMENT_METHOD_LABEL[r.payment_method] : "—"}</td>
                      <td>
                        {r.paid_date
                          ? new Date(r.paid_date).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })
                          : "—"}
                      </td>
                      <td>
                        <a href={`/api/invoices/${r.id}/pdf`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--blue)" }}>
                          View PDF →
                        </a>
                      </td>
                    </>
                  );
                  return parentInvoiceId ? (
                    <ClickableRow key={r.id} href={`/ops/invoices/${parentInvoiceId}`}>
                      {row}
                    </ClickableRow>
                  ) : (
                    <tr key={r.id}>{row}</tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
