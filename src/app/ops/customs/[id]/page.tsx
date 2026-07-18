import { redirect, notFound } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { CustomsEditForm } from "@/components/ops/CustomsEditForm";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/money";
import { customsStatusBadgeClass } from "@/lib/ops/customs-status";
import type { CustomsEntry, StaffRole } from "@/types";

const EDIT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "ops_manager"];

interface CustomsWithJoins extends CustomsEntry {
  vehicles: { make: string; model: string; year: number } | null;
}

export default async function CustomsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("customs_entries")
    .select("*, vehicles(make,model,year)")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const entry = data as CustomsWithJoins;
  const canEdit = EDIT_ROLES.includes(staff.role as StaffRole);

  return (
    <>
      <TopBar
        title={entry.vehicles ? `${entry.vehicles.make} ${entry.vehicles.model} ${entry.vehicles.year}` : "Customs Entry"}
      />
      <div className="ops-content">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="ops-panel">
            <div className="ops-panel-title">Details</div>
            <div className="ops-info-row">
              <span className="ops-info-label">Agent</span>
              <span className="ops-info-value">{entry.agent ?? "—"}</span>
            </div>
            <div className="ops-info-row">
              <span className="ops-info-label">Status</span>
              <span className={`ops-badge ${customsStatusBadgeClass(entry.status)}`}>{entry.status}</span>
            </div>
            <div className="ops-info-row">
              <span className="ops-info-label">Duty Estimated</span>
              <span className="ops-info-value">
                {entry.duty_estimated_kobo ? formatNaira(entry.duty_estimated_kobo) : "—"}
              </span>
            </div>
            <div className="ops-info-row">
              <span className="ops-info-label">Duty Paid</span>
              <span className="ops-info-value">{entry.duty_paid_kobo ? formatNaira(entry.duty_paid_kobo) : "—"}</span>
            </div>
            <div className="ops-info-row">
              <span className="ops-info-label">Cleared</span>
              <span className="ops-info-value">
                {entry.cleared_at
                  ? new Date(entry.cleared_at).toLocaleDateString("en-NG", { month: "short", day: "numeric" })
                  : "Not yet"}
              </span>
            </div>
          </div>

          <div className="ops-panel">
            <div className="ops-panel-title">Documents Checklist</div>
            {entry.documents_checklist.length === 0 ? (
              <div style={{ color: "var(--muted)", fontSize: 13 }}>No checklist recorded.</div>
            ) : (
              entry.documents_checklist.map((doc) => (
                <div className="ops-info-row" key={doc.label}>
                  <span className="ops-info-label">{doc.label}</span>
                  <span className={`ops-badge ${doc.done ? "ops-badge-green" : "ops-badge-muted"}`}>
                    {doc.done ? "Done" : "Pending"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {canEdit && (
          <CustomsEditForm
            customsId={entry.id}
            status={entry.status}
            agent={entry.agent}
            dutyPaidKobo={entry.duty_paid_kobo}
            clearedAt={entry.cleared_at}
          />
        )}
      </div>
    </>
  );
}
