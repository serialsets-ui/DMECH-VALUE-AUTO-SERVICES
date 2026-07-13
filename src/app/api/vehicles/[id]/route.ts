import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { staffGuard } from "@/lib/guards";
import type { StaffRole } from "@/types";

// Mirrors oro-energy-management-hub's equipment PATCH route: role check,
// then build `updates` only from this explicit allowlist of writable
// columns — never spread the raw request body into the update.
// certification_status is deliberately NOT here — it only changes via
// POST /api/vehicles/[id]/certify, which also creates the matching
// warranty_policies row in the same step (see VehicleEditForm's comment).
const ALLOWED = [
  "lifecycle_stage",
  "sale_price_kobo",
  "condition",
  "colour",
  "video_url",
  "is_published",
  "lot_number",
  "seo_title",
  "seo_description",
] as const;

const EDIT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "ops_manager", "sales_manager"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await staffGuard();
  if (!staff) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!EDIT_ROLES.includes(staff.role as StaffRole)) {
    return NextResponse.json({ error: "Not permitted to edit vehicles." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  for (const key of ALLOWED) {
    if (key in body) updates[key] = body[key];
  }

  // service-role: vehicles has no staff UPDATE RLS policy (only SELECT) —
  // the RLS-respecting client would silently update 0 rows here.
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("vehicles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Could not update vehicle." }, { status: 500 });
  }

  return NextResponse.json({ vehicle: data });
}
