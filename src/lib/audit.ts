import { createServiceClient } from "@/lib/supabase/server";

// Writes go through the service-role client alongside the mutation being
// audited (003_rls_policies.sql's own stated convention for this table —
// nothing previously actually did it). Never throws: a logging failure
// should never block the real mutation it's describing.
export async function logAudit(entry: {
  userId: string | null;
  action: string;
  tableName: string;
  recordId: string | null;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
}) {
  try {
    const service = createServiceClient();
    await service.from("audit_log").insert({
      user_id: entry.userId,
      action: entry.action,
      table_name: entry.tableName,
      record_id: entry.recordId,
      old_value: entry.oldValue ?? null,
      new_value: entry.newValue ?? null,
    });
  } catch {
    // Deliberately swallowed — see the comment above.
  }
}
