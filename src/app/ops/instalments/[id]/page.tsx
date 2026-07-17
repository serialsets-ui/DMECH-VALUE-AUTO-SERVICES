import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { InstalmentEditForm } from "@/components/ops/InstalmentEditForm";
import { PaymentSchedule } from "@/components/ops/PaymentSchedule";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/money";
import type { Instalment, Payment, StaffRole } from "@/types";

const EDIT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "accountant", "sales_manager"];

interface InstalmentWithJoins extends Instalment {
  customers: { full_name: string; phone: string } | null;
  vehicles: { make: string; model: string; year: number } | null;
}

export default async function InstalmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  const { id } = await params;
  const supabase = await createClient();
  const [instalmentRes, paymentsRes, depositReceiptRes] = await Promise.all([
    supabase
      .from("instalments")
      // vehicles!vehicle_id — see the list page's comment on the same join.
      .select("*, customers(full_name,phone), vehicles!vehicle_id(make,model,year)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("payments").select("*").eq("instalment_id", id).order("payment_number"),
    // payment_id null distinguishes the deposit receipt from a regular
    // instalment-payment receipt, which always has payment_id set.
    supabase.from("invoices").select("id").eq("instalment_id", id).is("payment_id", null).eq("doc_type", "receipt").maybeSingle(),
  ]);

  if (!instalmentRes.data) notFound();
  const instalment = instalmentRes.data as InstalmentWithJoins;
  const payments = (paymentsRes.data as Payment[] | null) ?? [];
  const depositReceiptId = depositReceiptRes.data?.id ?? null;
  const canEdit = EDIT_ROLES.includes(staff.role as StaffRole);

  return (
    <>
      <TopBar
        title={
          instalment.vehicles
            ? `${instalment.vehicles.make} ${instalment.vehicles.model} ${instalment.vehicles.year}`
            : "Instalment"
        }
      />
      <div className="ops-content">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="ops-panel">
            <div className="ops-panel-title">Details</div>
            <div className="ops-info-row">
              <span className="ops-info-label">Customer</span>
              <span className="ops-info-value">{instalment.customers?.full_name ?? "—"}</span>
            </div>
            <div className="ops-info-row">
              <span className="ops-info-label">Phone</span>
              <span className="ops-info-value">{instalment.customers?.phone ?? "—"}</span>
            </div>
            <div className="ops-info-row">
              <span className="ops-info-label">Plan Type</span>
              <span className="ops-info-value">
                {instalment.plan_type === "dmech_direct" ? "DMECH Direct" : "Partner Finance (Autochek)"}
              </span>
            </div>
            <div className="ops-info-row">
              <span className="ops-info-label">Total Price</span>
              <span className="ops-info-value">{formatNaira(instalment.total_price_kobo)}</span>
            </div>
            <div className="ops-info-row">
              <span className="ops-info-label">Deposit</span>
              <span className="ops-info-value" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {instalment.deposit_pct ? `${instalment.deposit_pct}%` : "—"}
                {instalment.deposit_amount_kobo ? ` (${formatNaira(instalment.deposit_amount_kobo)})` : ""}
                {depositReceiptId && (
                  <Link href={`/api/invoices/${depositReceiptId}/pdf`} target="_blank" style={{ color: "var(--blue)", fontSize: 12 }}>
                    Receipt →
                  </Link>
                )}
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

          <div className="ops-panel">
            <div className="ops-panel-title">Payment Schedule</div>
            <PaymentSchedule payments={payments} canEdit={canEdit} />
          </div>
        </div>

        {canEdit && (
          <InstalmentEditForm
            instalmentId={instalment.id}
            status={instalment.status}
            depositPaid={instalment.deposit_paid}
          />
        )}
      </div>
    </>
  );
}
