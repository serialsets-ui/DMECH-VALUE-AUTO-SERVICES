import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { staffGuard } from "@/lib/guards";
import type { StaffRole } from "@/types";

const ALLOWED = ["name", "specialty", "share_pct", "status"] as const;
const EDIT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "ops_manager", "workshop_lead"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await staffGuard();
  if (!staff) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!EDIT_ROLES.includes(staff.role as StaffRole)) {
    return NextResponse.json({ error: "Not permitted to edit specialists." }, { status: 403 });
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

  const supabase = createServiceClient();
  const { data, error } = await supabase.from("specialists").update(updates).eq("id", id).select().single();

  if (error) {
    return NextResponse.json({ error: "Could not update the specialist." }, { status: 500 });
  }

  return NextResponse.json({ specialist: data });
}
