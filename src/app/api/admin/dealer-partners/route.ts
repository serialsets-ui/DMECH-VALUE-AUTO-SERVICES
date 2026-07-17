import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { roleGuard } from "@/lib/guards";
import { logAudit } from "@/lib/audit";
import type { StaffRole } from "@/types";

const EDIT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "sales_manager", "ops_manager"];

// A dealer partner is a `customers` row (type='dealer_partner') — see
// migration 012's comment for why: it reuses vehicles.consignor_customer_id/
// consignment_commission_pct/consignment_payout_kobo unchanged, and needs
// no auth account (user_id stays null), matching the "don't create logins
// for them" requirement exactly. approval_status is set straight to
// 'approved' — that field/tier system exists to gate extending DMECH's own
// credit to a buyer, which doesn't apply to a supplier relationship.
export async function POST(request: Request) {
  const staff = await roleGuard(EDIT_ROLES);
  if (!staff) {
    return NextResponse.json({ error: "Not permitted to add dealer partners." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.business_name || !body.phone) {
    return NextResponse.json({ error: "Business name and phone are required." }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: dealerPartner, error } = await service
    .from("customers")
    .insert({
      user_id: null,
      type: "dealer_partner",
      full_name: body.business_name,
      phone: body.phone,
      email: body.email || null,
      address: body.address || null,
      company_details: {
        company_name: body.business_name,
        rc_number: body.rc_number || "",
        contact_person: body.contact_person || "",
      },
      approval_status: "approved",
    })
    .select()
    .single();

  if (error || !dealerPartner) {
    return NextResponse.json({ error: "Could not add this dealer partner." }, { status: 500 });
  }

  await logAudit({
    userId: staff.id,
    action: "create",
    tableName: "customers",
    recordId: dealerPartner.id,
    newValue: { type: "dealer_partner", business_name: body.business_name },
  });

  return NextResponse.json({ dealerPartner });
}
