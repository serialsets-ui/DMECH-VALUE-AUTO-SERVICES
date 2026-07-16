import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { roleGuard } from "@/lib/guards";
import { logAudit } from "@/lib/audit";

// Every other platform_config key besides business_profile — simple scalar
// settings each stored as their own row, updated one at a time here. See
// migration 001's seed list for what these actually mean.
const SIMPLE_KEYS = [
  "ngn_usd_rate",
  "dmech_service_fee_pct",
  "default_deposit_pct",
  "default_tenor_months",
  "reservation_hold_hours",
  "max_self_finance_kobo",
  "warranty_reserve_contribution_pct",
] as const;

export async function PATCH(request: Request) {
  const staff = await roleGuard(["super_admin", "managing_partner"]);
  if (!staff) {
    return NextResponse.json({ error: "Not permitted to edit platform settings." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const service = createServiceClient();
  // PromiseLike, not Promise — the Supabase query builder is thenable but
  // doesn't structurally satisfy the full Promise interface (no
  // catch/finally), which is all Promise.all actually needs.
  const updates: PromiseLike<unknown>[] = [];

  for (const key of SIMPLE_KEYS) {
    if (key in body) {
      updates.push(
        service.from("platform_config").update({ value: Number(body[key]), updated_by: staff.id, updated_at: new Date().toISOString() }).eq("key", key),
      );
    }
  }

  if (body.approval_tier_thresholds_kobo) {
    updates.push(
      service
        .from("platform_config")
        .update({ value: body.approval_tier_thresholds_kobo, updated_by: staff.id, updated_at: new Date().toISOString() })
        .eq("key", "approval_tier_thresholds_kobo"),
    );
  }

  if (body.parts_credit_limits) {
    updates.push(
      service
        .from("platform_config")
        .update({ value: body.parts_credit_limits, updated_by: staff.id, updated_at: new Date().toISOString() })
        .eq("key", "parts_credit_limits"),
    );
  }

  if (Array.isArray(body.reminder_days)) {
    updates.push(
      service
        .from("platform_config")
        .update({ value: body.reminder_days, updated_by: staff.id, updated_at: new Date().toISOString() })
        .eq("key", "reminder_days"),
    );
  }

  const results = await Promise.all(updates);
  const failed = results.find((r) => (r as { error: unknown }).error);
  if (failed) {
    return NextResponse.json({ error: "Some settings failed to save." }, { status: 500 });
  }

  await logAudit({ userId: staff.id, action: "update", tableName: "platform_config", recordId: null, newValue: body });

  return NextResponse.json({ ok: true });
}
