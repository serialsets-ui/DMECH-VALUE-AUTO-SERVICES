import { redirect } from "next/navigation";
import { TopBar } from "@/components/ops/TopBar";
import { roleGuard } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";

interface AuditRow {
  id: string;
  action: string;
  table_name: string;
  record_id: string | null;
  created_at: string;
  users: { full_name: string } | null;
}

export default async function AuditLogPage() {
  const staff = await roleGuard(["super_admin", "managing_partner"]);
  if (!staff) redirect("/ops/dashboard");

  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_log")
    .select("id, action, table_name, record_id, created_at, users(full_name)")
    .order("created_at", { ascending: false })
    .limit(200);

  // Supabase's generic types infer every embed as an array regardless of
  // cardinality — user_id -> users.id is many-to-one, so cast to the real shape.
  const entries = (data ?? []) as unknown as AuditRow[];

  return (
    <>
      <TopBar title="Audit Log" />
      <div className="ops-content">
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
          Not every mutation in the app writes here yet — currently covers customer approvals,
          staff role/access changes, business/platform settings edits, vehicle certification, and
          vehicle publish toggles. Most recent 200 entries.
        </p>
        {entries.length === 0 ? (
          <div className="ops-panel" style={{ color: "var(--muted)", fontSize: 14 }}>
            No audited actions yet.
          </div>
        ) : (
          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Staff</th>
                  <th>Action</th>
                  <th>Table</th>
                  <th>Record</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td>{new Date(e.created_at).toLocaleString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                    <td>{e.users?.full_name ?? "System"}</td>
                    <td style={{ textTransform: "capitalize" }}>{e.action}</td>
                    <td>{e.table_name}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 11 }}>{e.record_id ? e.record_id.slice(0, 8) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
