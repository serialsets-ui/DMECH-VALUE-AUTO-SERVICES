import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { roleGuard } from "@/lib/guards";
import { getConfigValue } from "@/lib/platform-config";
import { computeApprovalTier, DEFAULT_TIER_THRESHOLDS, type ApprovalTierThresholds } from "@/lib/approval";
import { logAudit } from "@/lib/audit";
import { toKobo } from "@/lib/money";
import { FINANCING_CUSTOMER_TYPES } from "@/types";
import type { CustomerType, StaffRole } from "@/types";

const VALID_TYPES: CustomerType[] = [
  "instalment_buyer",
  "cash_buyer",
  "workshop_walkin",
  "corporate",
  "parts_retail",
  "parts_wholesale",
];

const EDIT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "sales_manager", "sales_rep", "accountant"];

// Staff-assisted intake — for walk-ins, phone/WhatsApp inquiries, or anyone
// who'd rather not do the self-service /register flow. No auth account is
// created here (user_id stays null): the record is purely internal until
// the customer separately verifies via /verify and links a portal login —
// this route doesn't build that linking step, only the record itself.
// Same approval_tier/pending logic as self-service registration on purpose:
// a staff member entering the form is exactly the scenario the tier/
// multi-approver system exists to check, not a reason to bypass it.
export async function POST(request: Request) {
  const staff = await roleGuard(EDIT_ROLES);
  if (!staff) {
    return NextResponse.json({ error: "Not permitted to register customers." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.full_name || !body.phone || !VALID_TYPES.includes(body.type)) {
    return NextResponse.json({ error: "Name, phone, and customer type are required." }, { status: 400 });
  }
  const type: CustomerType = body.type;

  let creditLimitKobo: number | null = null;
  let approvalTier: 1 | 2 | 3 | 4 | null = null;
  if (FINANCING_CUSTOMER_TYPES.includes(type) && body.credit_limit_naira) {
    creditLimitKobo = toKobo(parseFloat(body.credit_limit_naira));
    const thresholds = await getConfigValue<ApprovalTierThresholds>("approval_tier_thresholds_kobo", DEFAULT_TIER_THRESHOLDS);
    approvalTier = computeApprovalTier(creditLimitKobo, thresholds);
  }

  const service = createServiceClient();
  const { data: customer, error } = await service
    .from("customers")
    .insert({
      user_id: null,
      type,
      full_name: body.full_name,
      phone: body.phone,
      email: body.email || null,
      address: body.address || null,
      bvn: type === "instalment_buyer" ? body.bvn || null : null,
      employer: type === "instalment_buyer" ? body.employer || null : null,
      monthly_income_kobo: type === "instalment_buyer" && body.monthly_income_naira ? toKobo(parseFloat(body.monthly_income_naira)) : null,
      guarantor: type === "instalment_buyer" && body.guarantor_name ? { name: body.guarantor_name, phone: body.guarantor_phone || "", relationship: body.guarantor_relationship || "" } : null,
      company_details: type === "corporate" && body.company_name ? { company_name: body.company_name, rc_number: body.company_rc_number || "", contact_person: body.company_contact_person || "" } : null,
      credit_limit_kobo: creditLimitKobo,
      approval_tier: approvalTier,
      approval_status: "pending",
    })
    .select()
    .single();

  if (error || !customer) {
    return NextResponse.json({ error: "Could not register this customer." }, { status: 500 });
  }

  await logAudit({
    userId: staff.id,
    action: "create",
    tableName: "customers",
    recordId: customer.id,
    newValue: { type, full_name: body.full_name, registered_by_staff: true },
  });

  return NextResponse.json({ customer });
}
