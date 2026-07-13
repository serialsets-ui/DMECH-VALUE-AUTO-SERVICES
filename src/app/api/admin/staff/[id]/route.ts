import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { roleGuard } from "@/lib/guards";
import type { StaffRole } from "@/types";

const ALLOWED = ["role", "is_active"] as const;

const VALID_ROLES: StaffRole[] = [
  "super_admin",
  "managing_partner",
  "sales_manager",
  "ops_manager",
  "workshop_lead",
  "sales_rep",
  "accountant",
];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await roleGuard(["super_admin"]);
  if (!staff) {
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if ("role" in body && !VALID_ROLES.includes(body.role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  for (const key of ALLOWED) {
    if (key in body) updates[key] = body[key];
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Could not update staff record." }, { status: 500 });
  }

  return NextResponse.json({ staff: data });
}
