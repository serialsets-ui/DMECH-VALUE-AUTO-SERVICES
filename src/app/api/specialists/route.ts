import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { staffGuard } from "@/lib/guards";
import type { StaffRole } from "@/types";

const EDIT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "ops_manager", "workshop_lead"];

// specialists has no staff INSERT RLS policy (staff-read only, same as every
// other internal-only table) — service-role, matching the project's own
// convention.
export async function POST(request: Request) {
  const staff = await staffGuard();
  if (!staff) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!EDIT_ROLES.includes(staff.role as StaffRole)) {
    return NextResponse.json({ error: "Not permitted to add specialists." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("specialists")
    .insert({
      name: body.name,
      specialty: body.specialty || null,
      share_pct: body.share_pct ? Number(body.share_pct) : 40,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Could not add the specialist." }, { status: 500 });
  }

  return NextResponse.json({ specialist: data });
}
