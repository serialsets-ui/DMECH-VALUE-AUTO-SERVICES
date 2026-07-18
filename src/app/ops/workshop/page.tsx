import { redirect } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { ClickableRow } from "@/components/ops/ClickableRow";
import { staffGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/money";
import { PRIORITY_CLASS, PRIORITY_LABEL } from "@/lib/ops/job-card";
import type { JobCard, JobCardStage } from "@/types";

interface JobCardRow extends JobCard {
  customers: { full_name: string } | null;
  specialists: { name: string } | null;
}

const STAGE_CLASS: Record<JobCardStage, string> = {
  reception: "ops-badge-muted",
  diagnostics: "ops-badge-blue",
  planning: "ops-badge-blue",
  execution: "ops-badge-amber",
  qa: "ops-badge-amber",
  released: "ops-badge-green",
};

const STAGE_LABEL: Record<JobCardStage, string> = {
  reception: "Reception",
  diagnostics: "Diagnostics",
  planning: "Planning",
  execution: "Execution",
  qa: "QA",
  released: "Released",
};

export default async function OpsWorkshopPage() {
  const staff = await staffGuard();
  if (!staff) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("job_cards")
    .select("*, customers(full_name), specialists(name)")
    .order("created_at", { ascending: false });

  const jobCards = (data as JobCardRow[] | null) ?? [];

  return (
    <>
      <TopBar title="Workshop" />
      <div className="ops-content">
        {jobCards.length === 0 ? (
          <div className="ops-panel" style={{ color: "var(--muted)", fontSize: 14 }}>
            No job cards yet.
          </div>
        ) : (
          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Vehicle</th>
                  <th>Stage</th>
                  <th>Priority</th>
                  <th>Customer</th>
                  <th>Quote</th>
                </tr>
              </thead>
              <tbody>
                {jobCards.map((j) => (
                  <ClickableRow key={j.id} href={`/ops/workshop/${j.id}`}>
                    <td>{j.reference}</td>
                    <td>{j.vehicle_desc}</td>
                    <td>
                      <span className={`ops-badge ${STAGE_CLASS[j.stage]}`}>{STAGE_LABEL[j.stage]}</span>
                    </td>
                    <td>
                      <span className={`ops-badge ${PRIORITY_CLASS[j.priority]}`}>{PRIORITY_LABEL[j.priority]}</span>
                    </td>
                    <td>{j.customers?.full_name ?? "—"}</td>
                    <td>{j.quote_kobo ? formatNaira(j.quote_kobo) : "—"}</td>
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
