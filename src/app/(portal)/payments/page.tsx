import { redirect } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { customerGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { getConfigValue } from "@/lib/platform-config";
import { formatNaira } from "@/lib/money";
import type { BusinessProfile, Payment, PaymentStatus } from "@/types";

const STATUS_CLASS: Record<PaymentStatus, string> = {
  paid: "ops-badge-green",
  pending: "ops-badge-blue",
  overdue: "ops-badge-amber",
  partial: "ops-badge-muted",
};

interface PaymentRow extends Payment {
  instalments: { vehicles: { make: string; model: string; year: number } | null } | null;
}

export default async function PortalPaymentsPage() {
  const customer = await customerGuard();
  if (!customer) redirect("/verify");

  const supabase = await createClient();
  const [paymentsRes, business] = await Promise.all([
    supabase
      // vehicles!vehicle_id disambiguates the same two FK paths noted on the
      // instalments list page's own query.
      .from("payments")
      .select("*, instalments(vehicles!vehicle_id(make,model,year))")
      .eq("customer_id", customer.id)
      .order("due_date", { ascending: true }),
    getConfigValue<BusinessProfile>("business_profile", {}),
  ]);

  // Supabase's generic types infer every embed as an array regardless of
  // cardinality — this FK is many-to-one, so cast to the real shape.
  const payments = (paymentsRes.data ?? []) as unknown as PaymentRow[];
  const nextDue = payments.find((p) => p.status === "pending" || p.status === "overdue" || p.status === "partial");

  return (
    <>
      <TopBar title="Payments" />
      <div className="ops-content">
        {nextDue && (
          <div className="ops-panel">
            <div className="ops-panel-title">Payment Instructions</div>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>
              DMECH collects payments by bank transfer. Use your full name and payment number as
              the transfer reference so it&apos;s matched to your account quickly.
            </p>
            {business.bank_name ? (
              <>
                <div className="ops-info-row"><span className="ops-info-label">Bank</span><span className="ops-info-value">{business.bank_name}</span></div>
                <div className="ops-info-row"><span className="ops-info-label">Account Number</span><span className="ops-info-value">{business.bank_account_number}</span></div>
                <div className="ops-info-row"><span className="ops-info-label">Account Name</span><span className="ops-info-value">{business.bank_account_name}</span></div>
                <div className="ops-info-row"><span className="ops-info-label">Amount Due Now</span><span className="ops-info-value">{formatNaira(nextDue.amount_kobo)}</span></div>
                <div className="ops-info-row"><span className="ops-info-label">Reference</span><span className="ops-info-value">{customer.full_name} — Payment #{nextDue.payment_number}</span></div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: "var(--amber)" }}>
                Bank details aren&apos;t set up yet — contact DMECH directly to pay.
              </div>
            )}
          </div>
        )}

        <div className="ops-panel">
          <div className="ops-panel-title">Payment History</div>
          {payments.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--muted)" }}>No payments on your account yet.</div>
          ) : (
            payments.map((p) => (
              <div className="ops-info-row" key={p.id}>
                <span className="ops-info-label">
                  #{p.payment_number ?? "—"}
                  {p.instalments?.vehicles ? ` · ${p.instalments.vehicles.year} ${p.instalments.vehicles.make} ${p.instalments.vehicles.model}` : ""}
                  {" · Due "}
                  {new Date(p.due_date).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="ops-info-value">{formatNaira(p.amount_kobo)}</span>
                  <span className={`ops-badge ${STATUS_CLASS[p.status]}`}>{p.status}</span>
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
