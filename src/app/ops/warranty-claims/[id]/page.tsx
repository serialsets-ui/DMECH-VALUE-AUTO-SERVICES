import { redirect, notFound } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { WarrantyClaimForm } from "@/components/ops/WarrantyClaimForm";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import type { WarrantyClaim, StaffRole } from "@/types";

const EDIT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "accountant"];

interface ClaimWithJoins extends WarrantyClaim {
  customers: { full_name: string; phone: string } | null;
  warranty_policies: {
    coverage_tier: string;
    vehicles: { make: string; model: string; year: number } | null;
  } | null;
}

export default async function WarrantyClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("warranty_claims")
    .select("*, customers(full_name,phone), warranty_policies(coverage_tier, vehicles(make,model,year))")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const claim = data as ClaimWithJoins;
  const canEdit = EDIT_ROLES.includes(staff.role as StaffRole);

  return (
    <>
      <TopBar
        title={
          claim.warranty_policies?.vehicles
            ? `${claim.warranty_policies.vehicles.make} ${claim.warranty_policies.vehicles.model} ${claim.warranty_policies.vehicles.year}`
            : "Warranty Claim"
        }
      />
      <div className="ops-content">
        <div className="ops-panel" style={{ maxWidth: 520 }}>
          <div className="ops-panel-title">Details</div>
          <div className="ops-info-row">
            <span className="ops-info-label">Customer</span>
            <span className="ops-info-value">{claim.customers?.full_name ?? "—"}</span>
          </div>
          <div className="ops-info-row">
            <span className="ops-info-label">Phone</span>
            <span className="ops-info-value">{claim.customers?.phone ?? "—"}</span>
          </div>
          <div className="ops-info-row">
            <span className="ops-info-label">Coverage Tier</span>
            <span className="ops-info-value">{claim.warranty_policies?.coverage_tier ?? "—"}</span>
          </div>
          <div className="ops-info-row">
            <span className="ops-info-label">Reported</span>
            <span className="ops-info-value">
              {new Date(claim.reported_at).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
          <div className="ops-info-row">
            <span className="ops-info-label">Issue</span>
            <span className="ops-info-value">{claim.issue_description}</span>
          </div>
        </div>

        {canEdit && (
          <WarrantyClaimForm
            claimId={claim.id}
            status={claim.status}
            assessedCostKobo={claim.assessed_cost_kobo}
            approvedKobo={claim.approved_kobo}
          />
        )}
      </div>
    </>
  );
}
