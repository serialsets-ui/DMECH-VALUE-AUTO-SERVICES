import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { roleGuard } from "@/lib/guards";
import type { BusinessProfile } from "@/types";

const ALLOWED: (keyof BusinessProfile)[] = [
  "legal_name",
  "tin",
  "rc_number",
  "vat_number",
  "address",
  "bank_name",
  "bank_account_number",
  "bank_account_name",
];

// Real business/tax details for invoice headers — see migration 007's
// comment. service-role: platform_config's client-side write policy only
// covers managing_partner, not super_admin, and this route needs both.
export async function PATCH(request: Request) {
  const staff = await roleGuard(["super_admin", "managing_partner"]);
  if (!staff) {
    return NextResponse.json({ error: "Not permitted to edit business settings." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const profile: BusinessProfile = {};
  for (const key of ALLOWED) {
    if (key in body) profile[key] = body[key];
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("platform_config")
    .update({ value: profile, updated_by: staff.id, updated_at: new Date().toISOString() })
    .eq("key", "business_profile");

  if (error) {
    return NextResponse.json({ error: "Could not save business settings." }, { status: 500 });
  }

  return NextResponse.json({ profile });
}
