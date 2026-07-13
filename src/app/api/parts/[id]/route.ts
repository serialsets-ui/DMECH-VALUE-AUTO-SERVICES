import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { staffGuard } from "@/lib/guards";
import type { StaffRole } from "@/types";

const ALLOWED = ["qty", "cost_price_kobo", "sale_price_kobo", "reorder_threshold", "condition"] as const;

const EDIT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "ops_manager", "workshop_lead"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await staffGuard();
  if (!staff) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!EDIT_ROLES.includes(staff.role as StaffRole)) {
    return NextResponse.json({ error: "Not permitted to edit parts." }, { status: 403 });
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

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("parts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Could not update part." }, { status: 500 });
  }

  return NextResponse.json({ part: data });
}
