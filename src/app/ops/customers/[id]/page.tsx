import { redirect, notFound } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { DocumentUploadManager } from "@/components/ops/DocumentUploadManager";
import { CustomerApprovalPanel } from "@/components/ops/CustomerApprovalPanel";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/money";
import { CUSTOMER_TYPE_LABELS, FINANCING_CUSTOMER_TYPES } from "@/types";
import type { Customer } from "@/types";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const customer = data as Customer;

  return (
    <>
      <TopBar title={customer.full_name} />
      <div className="ops-content">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="ops-panel">
            <div className="ops-panel-title">Profile</div>
            <div className="ops-info-row">
              <span className="ops-info-label">Type</span>
              <span className="ops-info-value">{CUSTOMER_TYPE_LABELS[customer.type]}</span>
            </div>
            <div className="ops-info-row">
              <span className="ops-info-label">Phone</span>
              <span className="ops-info-value">{customer.phone}</span>
            </div>
            <div className="ops-info-row">
              <span className="ops-info-label">Email</span>
              <span className="ops-info-value">{customer.email ?? "—"}</span>
            </div>
            <div className="ops-info-row">
              <span className="ops-info-label">Address</span>
              <span className="ops-info-value">{customer.address ?? "—"}</span>
            </div>
            <div className="ops-info-row">
              <span className="ops-info-label">LTV Tier</span>
              <span className="ops-info-value" style={{ textTransform: "capitalize" }}>{customer.ltv_tier}</span>
            </div>
          </div>

          {FINANCING_CUSTOMER_TYPES.includes(customer.type) && (
            <div className="ops-panel">
              <div className="ops-panel-title">Financing</div>
              <div className="ops-info-row">
                <span className="ops-info-label">Requested Credit</span>
                <span className="ops-info-value">{customer.credit_limit_kobo ? formatNaira(customer.credit_limit_kobo) : "—"}</span>
              </div>
              <div className="ops-info-row">
                <span className="ops-info-label">Approval Tier</span>
                <span className="ops-info-value">{customer.approval_tier ?? "—"}</span>
              </div>
              {customer.type === "instalment_buyer" && (
                <>
                  <div className="ops-info-row">
                    <span className="ops-info-label">BVN</span>
                    <span className="ops-info-value">{customer.bvn ?? "—"}</span>
                  </div>
                  <div className="ops-info-row">
                    <span className="ops-info-label">Employer</span>
                    <span className="ops-info-value">{customer.employer ?? "—"}</span>
                  </div>
                  <div className="ops-info-row">
                    <span className="ops-info-label">Monthly Income</span>
                    <span className="ops-info-value">{customer.monthly_income_kobo ? formatNaira(customer.monthly_income_kobo) : "—"}</span>
                  </div>
                  {customer.guarantor && (
                    <div className="ops-info-row">
                      <span className="ops-info-label">Guarantor</span>
                      <span className="ops-info-value">
                        {customer.guarantor.name} · {customer.guarantor.phone} ({customer.guarantor.relationship})
                      </span>
                    </div>
                  )}
                </>
              )}
              {customer.type === "corporate" && customer.company_details && (
                <>
                  <div className="ops-info-row">
                    <span className="ops-info-label">Company</span>
                    <span className="ops-info-value">{customer.company_details.company_name}</span>
                  </div>
                  <div className="ops-info-row">
                    <span className="ops-info-label">RC Number</span>
                    <span className="ops-info-value">{customer.company_details.rc_number}</span>
                  </div>
                  <div className="ops-info-row">
                    <span className="ops-info-label">Contact Person</span>
                    <span className="ops-info-value">{customer.company_details.contact_person}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <DocumentUploadManager customerId={customer.id} canUpload />

        <CustomerApprovalPanel
          customerId={customer.id}
          approvalStatus={customer.approval_status}
          approvalTier={customer.approval_tier}
          approvedByCount={customer.approved_by.length}
          alreadyApprovedByMe={customer.approved_by.includes(staff.id)}
        />
      </div>
    </>
  );
}
