import Link from "next/link";
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

// Every distinct action string any logAudit() call site actually uses today
// (grepped, not guessed) -- keeps the filter dropdown from offering options
// that would silently return zero rows.
const ACTIONS = ["create", "update", "approve", "decline", "certify", "void"];
const TABLES = ["vehicles", "invoices", "customers", "users", "platform_config"];

const ACTION_BADGE: Record<string, string> = {
  create: "ops-badge-green",
  approve: "ops-badge-green",
  certify: "ops-badge-blue",
  update: "ops-badge-muted",
  decline: "ops-badge-red",
  void: "ops-badge-red",
};

interface PageProps {
  searchParams: Promise<{ action?: string; table?: string; staff?: string; from?: string; to?: string }>;
}

export default async function AuditLogPage({ searchParams }: PageProps) {
  const staff = await roleGuard(["super_admin", "managing_partner"]);
  if (!staff) redirect("/ops/dashboard");

  const { action, table, staff: staffId, from, to } = await searchParams;
  const hasFilters = Boolean(action || table || staffId || from || to);

  const supabase = await createClient();

  let query = supabase
    .from("audit_log")
    .select("id, action, table_name, record_id, created_at, users(full_name)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (action) query = query.eq("action", action);
  if (table) query = query.eq("table_name", table);
  if (staffId) query = query.eq("user_id", staffId);
  if (from) query = query.gte("created_at", `${from}T00:00:00.000Z`);
  if (to) query = query.lte("created_at", `${to}T23:59:59.999Z`);

  const [{ data }, { data: staffList }] = await Promise.all([
    query,
    supabase.from("users").select("id, full_name").neq("role", "customer").order("full_name"),
  ]);

  // Supabase's generic types infer every embed as an array regardless of
  // cardinality — user_id -> users.id is many-to-one, so cast to the real shape.
  const entries = (data ?? []) as unknown as AuditRow[];

  return (
    <>
      <TopBar title="Audit Log" />
      <div className="ops-content">
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
          Not every mutation in the app writes here yet — currently covers customer approvals,
          staff role/access changes, business/platform settings edits, vehicle creation,
          certification, and publish toggles. Most recent 200 entries{hasFilters ? " matching these filters" : ""}.
        </p>

        <form className="ops-filter-bar" method="get">
          <div className="ops-filter-field">
            <label className="ops-field-label" htmlFor="al-action">Action</label>
            <select id="al-action" name="action" className="ops-input" defaultValue={action ?? ""}>
              <option value="">All Actions</option>
              {ACTIONS.map((a) => (
                <option key={a} value={a} style={{ textTransform: "capitalize" }}>
                  {a[0].toUpperCase() + a.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="ops-filter-field">
            <label className="ops-field-label" htmlFor="al-table">Table</label>
            <select id="al-table" name="table" className="ops-input" defaultValue={table ?? ""}>
              <option value="">All Tables</option>
              {TABLES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="ops-filter-field">
            <label className="ops-field-label" htmlFor="al-staff">Staff</label>
            <select id="al-staff" name="staff" className="ops-input" defaultValue={staffId ?? ""}>
              <option value="">All Staff</option>
              {(staffList ?? []).map((s) => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
          </div>
          <div className="ops-filter-field">
            <label className="ops-field-label" htmlFor="al-from">From</label>
            <input id="al-from" name="from" type="date" className="ops-input" defaultValue={from ?? ""} />
          </div>
          <div className="ops-filter-field">
            <label className="ops-field-label" htmlFor="al-to">To</label>
            <input id="al-to" name="to" type="date" className="ops-input" defaultValue={to ?? ""} />
          </div>
          <button type="submit" className="ops-btn">Filter</button>
          {hasFilters && (
            <Link href="/ops/settings/audit-log" className="ops-btn-ghost">Clear</Link>
          )}
        </form>

        {entries.length === 0 ? (
          <div className="ops-panel" style={{ color: "var(--muted)", fontSize: 14 }}>
            {hasFilters ? "No entries match these filters." : "No audited actions yet."}
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
                    <td>
                      <span className={`ops-badge ${ACTION_BADGE[e.action] ?? "ops-badge-muted"}`}>{e.action}</span>
                    </td>
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
