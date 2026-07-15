import { redirect, notFound } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { InstalmentEditForm } from "@/components/ops/InstalmentEditForm";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/money";
import type { Instalment, Payment, StaffRole } from "@/types";

const EDIT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "accountant", "sales_manager"];

interface InstalmentWithJoins extends Instalment {
  customers: { full_name: string; phone: string } | null;
  vehicles: { make: string; model: string; year: number } | null;
}

const PAYMENT_STATUS_CLASS: Record<string, string> = {
  paid: "ops-badge-green",
  pending: "ops-badge-blue",
  overdue: "ops-badge-amber",
  partial: "ops-badge-muted",
};

export default async function InstalmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  const { id } = await params;
  const supabase = await createClient();
  const [instalmentRes, paymentsRes] = await Promise.all([
    supabase
      .from("instalments")
      // vehicles!vehicle_id — see the list page's comment on the same join.
      .select("*, customers(full_name,phone), vehicles!vehicle_id(make,model,year)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("payments").select("*").eq("instalment_id", id).order("payment_number"),
  ]);

  if (!instalmentRes.data) notFound();
  const instalment = instalmentRes.data as InstalmentWithJoins;
  const payments = (paymentsRes.data as Payment[] | null) ?? [];
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

          <div className="ops-panel">
            <div className="ops-panel-title">Payment Schedule</div>
            {payments.length === 0 ? (
              <div style={{ color: "var(--muted)", fontSize: 13 }}>No payments recorded yet.</div>
            ) : (
              payments.map((p) => (
                <div className="ops-info-row" key={p.id}>
                  <span className="ops-info-label">
                    #{p.payment_number ?? "—"} · Due {new Date(p.due_date).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="ops-info-value">{formatNaira(p.amount_kobo)}</span>
                    <span className={`ops-badge ${PAYMENT_STATUS_CLASS[p.status] ?? "ops-badge-muted"}`}>
                      {p.status}
                    </span>
                  </span>
                </div>
              ))
            )}
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
