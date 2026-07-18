import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { MarkInvoicePaidAction } from "@/components/ops/MarkInvoicePaidAction";
import { VoidInvoiceAction } from "@/components/ops/VoidInvoiceAction";
import { InstalmentEditForm } from "@/components/ops/InstalmentEditForm";
import { PaymentSchedule } from "@/components/ops/PaymentSchedule";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/money";
import type { Instalment, Invoice, Payment, PaymentMethod, StaffRole } from "@/types";

const EDIT_ROLES: StaffRole[] = [
  "super_admin",
  "managing_partner",
  "sales_manager",
  "sales_rep",
  "ops_manager",
  "workshop_lead",
  "accountant",
];

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
  created_at: string;
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  const { id } = await params;
  const supabase = await createClient();

  const { data: invoiceData } = await supabase
    .from("invoices")
    .select("*, customers(full_name, phone), vehicles(make, model, year)")
    .eq("id", id)
    .maybeSingle();

  if (!invoiceData) notFound();
  const invoice = invoiceData as Invoice & {
    customers: { full_name: string; phone: string } | null;
    vehicles: { make: string; model: string; year: number } | null;
  };

  const canManage = EDIT_ROLES.includes(staff.role as StaffRole);
  const isEditable = invoice.doc_type === "invoice" && !invoice.voided_at && invoice.fetch_transmission_status !== "Sent";

  // Every receipt issued against this invoice -- an instalment-linked
  // invoice's receipts (deposit + each monthly payment) all share its
  // instalment_id; anything else (a cash sale, a manual invoice) links back
  // via related_invoice_id from the Mark Paid flow instead.
  const receiptsQuery = invoice.instalment_id
    ? supabase
        .from("invoices")
        .select("id, invoice_number, total_kobo, payment_method, paid_date, created_at")
        .eq("instalment_id", invoice.instalment_id)
        .eq("doc_type", "receipt")
        .order("created_at", { ascending: true })
    : supabase
        .from("invoices")
        .select("id, invoice_number, total_kobo, payment_method, paid_date, created_at")
        .eq("related_invoice_id", id)
        .eq("doc_type", "receipt")
        .order("created_at", { ascending: true });

  const [receiptsRes, instalmentRes] = await Promise.all([
    receiptsQuery,
    invoice.instalment_id
      ? supabase.from("instalments").select("*").eq("id", invoice.instalment_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const receipts = (receiptsRes.data as ReceiptRow[] | null) ?? [];
  const instalment = instalmentRes.data as Instalment | null;

  let payments: Payment[] = [];
  if (invoice.instalment_id) {
    const { data } = await supabase.from("payments").select("*").eq("instalment_id", invoice.instalment_id).order("payment_number");
    payments = (data as Payment[] | null) ?? [];
  }

  return (
    <>
      <TopBar
        title={invoice.invoice_number}
        actions={
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer" className="ops-btn" style={{ textDecoration: "none" }}>
              View PDF
            </a>
            {canManage && isEditable && (
              <>
                <Link href={`/ops/invoices/${invoice.id}/edit`} className="ops-btn" style={{ background: "var(--card2)", color: "var(--text)", textDecoration: "none" }}>
                  Edit
                </Link>
                <VoidInvoiceAction invoiceId={invoice.id} />
              </>
            )}
          </span>
        }
      />
      <div className="ops-content">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="ops-panel">
            <div className="ops-panel-title">Details</div>
            <div className="ops-info-row">
              <span className="ops-info-label">Customer</span>
              <span className="ops-info-value">{invoice.customers?.full_name ?? "—"}</span>
            </div>
            <div className="ops-info-row">
              <span className="ops-info-label">Vehicle</span>
              <span className="ops-info-value">
                {invoice.vehicles ? `${invoice.vehicles.year} ${invoice.vehicles.make} ${invoice.vehicles.model}` : "—"}
              </span>
            </div>
            <div className="ops-info-row">
              <span className="ops-info-label">Total</span>
              <span className="ops-info-value">{formatNaira(invoice.total_kobo)}</span>
            </div>
            <div className="ops-info-row">
              <span className="ops-info-label">Issue Date</span>
              <span className="ops-info-value">
                {new Date(invoice.issue_date).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
            <div className="ops-info-row">
              <span className="ops-info-label">Status</span>
              <span className="ops-info-value">
                {invoice.voided_at ? (
                  <span className="ops-badge ops-badge-muted">Voided</span>
                ) : invoice.instalment_id ? (
                  <span className="ops-badge ops-badge-blue">Financed</span>
                ) : receipts.length > 0 ? (
                  <span className="ops-badge ops-badge-green">
                    Paid{receipts[0].payment_method ? ` — ${PAYMENT_METHOD_LABEL[receipts[0].payment_method]}` : ""}
                  </span>
                ) : canManage ? (
                  <MarkInvoicePaidAction invoiceId={invoice.id} />
                ) : (
                  <span className="ops-badge ops-badge-amber">Unpaid</span>
                )}
              </span>
            </div>
          </div>

          {instalment && (
            <div className="ops-panel">
              <div className="ops-panel-title">Instalment Plan</div>
              <div className="ops-info-row">
                <span className="ops-info-label">Plan Type</span>
                <span className="ops-info-value">
                  {instalment.plan_type === "dmech_direct" ? "DMECH Direct" : "Partner Finance (Autochek)"}
                </span>
              </div>
              <div className="ops-info-row">
                <span className="ops-info-label">Deposit</span>
                <span className="ops-info-value">
                  {instalment.deposit_pct ? `${instalment.deposit_pct}%` : "—"}
                  {instalment.deposit_amount_kobo ? ` (${formatNaira(instalment.deposit_amount_kobo)})` : ""}
                </span>
              </div>
              <div className="ops-info-row">
                <span className="ops-info-label">Tenor</span>
                <span className="ops-info-value">{instalment.tenor_months} months</span>
              </div>
              <div className="ops-info-row">
                <span className="ops-info-label">Monthly</span>
                <span className="ops-info-value">
                  {instalment.monthly_amount_kobo ? formatNaira(instalment.monthly_amount_kobo) : "—"}
                </span>
              </div>
              <div className="ops-info-row">
                <span className="ops-info-label">Guarantor Notified</span>
                <span className="ops-info-value">{instalment.guarantor_notified ? "Yes" : "No"}</span>
              </div>
            </div>
          )}
        </div>

        {instalment && (
          <div className="ops-panel" style={{ marginTop: 16 }}>
            <div className="ops-panel-title">Payment Schedule</div>
            <PaymentSchedule payments={payments} canEdit={canManage} />
          </div>
        )}

        {instalment && canManage && (
          <InstalmentEditForm instalmentId={instalment.id} status={instalment.status} depositPaid={instalment.deposit_paid} />
        )}

        <div className="ops-panel" style={{ marginTop: 16 }}>
          <div className="ops-panel-title">Receipts ({receipts.length})</div>
          {receipts.length === 0 ? (
            <div style={{ color: "var(--muted)", fontSize: 13 }}>No payments received against this invoice yet.</div>
          ) : (
            receipts.map((r) => (
              <div className="ops-info-row" key={r.id}>
                <span className="ops-info-label">
                  {r.invoice_number}
                  {r.paid_date ? ` · ${new Date(r.paid_date).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}` : ""}
                  {r.payment_method ? ` · ${PAYMENT_METHOD_LABEL[r.payment_method]}` : ""}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="ops-info-value">{formatNaira(r.total_kobo)}</span>
                  <a href={`/api/invoices/${r.id}/pdf`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--blue)", fontSize: 12 }}>
                    View PDF →
                  </a>
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
