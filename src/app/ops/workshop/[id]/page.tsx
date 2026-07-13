import { redirect, notFound } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { JobCardEditForm } from "@/components/ops/JobCardEditForm";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/money";
import type { JobCard, StaffRole } from "@/types";

const EDIT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "ops_manager", "workshop_lead"];

interface JobCardWithJoins extends JobCard {
  customers: { full_name: string; phone: string } | null;
  specialists: { name: string } | null;
}

export default async function JobCardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  const { id } = await params;
  const supabase = await createClient();
  const [jobCardRes, specialistsRes] = await Promise.all([
    supabase
      .from("job_cards")
      .select("*, customers(full_name,phone), specialists(name)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("specialists").select("id,name").eq("status", "active").order("name"),
  ]);

  if (!jobCardRes.data) notFound();
  const jobCard = jobCardRes.data as JobCardWithJoins;
  const specialists = (specialistsRes.data as { id: string; name: string }[] | null) ?? [];
  const canEdit = EDIT_ROLES.includes(staff.role as StaffRole);

  return (
    <>
      <TopBar title={jobCard.reference} />
      <div className="ops-content">
        <div className="ops-panel" style={{ maxWidth: 520 }}>
          <div className="ops-panel-title">Details</div>
          <div className="ops-info-row">
            <span className="ops-info-label">Vehicle</span>
            <span className="ops-info-value">{jobCard.vehicle_desc}</span>
          </div>
          <div className="ops-info-row">
            <span className="ops-info-label">Customer</span>
            <span className="ops-info-value">{jobCard.customers?.full_name ?? "—"}</span>
          </div>
          <div className="ops-info-row">
            <span className="ops-info-label">Specialist</span>
            <span className="ops-info-value">{jobCard.specialists?.name ?? "Unassigned"}</span>
          </div>
          <div className="ops-info-row">
            <span className="ops-info-label">Service Type</span>
            <span className="ops-info-value">{jobCard.service_type ?? "—"}</span>
          </div>
          <div className="ops-info-row">
            <span className="ops-info-label">Complaint</span>
            <span className="ops-info-value">{jobCard.complaint ?? "—"}</span>
          </div>
          <div className="ops-info-row">
            <span className="ops-info-label">Quote</span>
            <span className="ops-info-value">{jobCard.quote_kobo ? formatNaira(jobCard.quote_kobo) : "—"}</span>
          </div>
          <div className="ops-info-row">
            <span className="ops-info-label">Completed</span>
            <span className="ops-info-value">
              {jobCard.completed_at
                ? new Date(jobCard.completed_at).toLocaleDateString("en-NG", { month: "short", day: "numeric" })
                : "Not yet"}
            </span>
          </div>
        </div>

        {canEdit && (
          <JobCardEditForm
            jobCardId={jobCard.id}
            stage={jobCard.stage}
            priority={jobCard.priority}
            quoteKobo={jobCard.quote_kobo}
            specialistId={jobCard.specialist_id}
            specialists={specialists}
          />
        )}
      </div>
    </>
  );
}
