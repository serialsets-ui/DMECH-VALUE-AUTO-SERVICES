import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getConfigValue } from "@/lib/platform-config";
import { computeApprovalTier, DEFAULT_TIER_THRESHOLDS, type ApprovalTierThresholds } from "@/lib/approval";
import { toKobo } from "@/lib/money";
import { FINANCING_CUSTOMER_TYPES } from "@/types";
import type { CustomerType } from "@/types";

const VALID_TYPES: CustomerType[] = [
  "instalment_buyer",
  "cash_buyer",
  "workshop_walkin",
  "corporate",
  "parts_retail",
  "parts_wholesale",
];

// Requires a verified magic-link session (see /verify + /auth/callback) —
// this is deliberately not a fully public/anonymous insert like the
// calculator's lead capture, since a customer record carries real personal/
// financial data. Creates both the users row (role='customer') AND the
// customers row: dmech_customer_id() (002_functions.sql) joins through
// users.auth_user_id, so a customer without a users row would be invisible
// to every "customer read own X" RLS policy in the app.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Please verify your email first." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.full_name || !body.phone || !VALID_TYPES.includes(body.type)) {
    return NextResponse.json({ error: "Name, phone, and customer type are required." }, { status: 400 });
  }
  const type: CustomerType = body.type;

  const service = createServiceClient();

  let userId: string;
  const { data: existingUser } = await service.from("users").select("id").eq("auth_user_id", authUser.id).maybeSingle();
  if (existingUser) {
    userId = existingUser.id;
  } else {
    const { data: newUser, error: userError } = await service
      .from("users")
      .insert({
        auth_user_id: authUser.id,
        email: authUser.email ?? "",
        phone: body.phone,
        full_name: body.full_name,
        role: "customer",
        is_active: true,
      })
      .select("id")
      .single();
    if (userError || !newUser) {
      return NextResponse.json({ error: "Could not create your account." }, { status: 500 });
    }
    userId = newUser.id;
  }

  const { data: existingCustomer } = await service
    .from("customers")
    .select("id")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();
  if (existingCustomer) {
    return NextResponse.json({ customer: existingCustomer, alreadyRegistered: true });
  }

  let creditLimitKobo: number | null = null;
  let approvalTier: 1 | 2 | 3 | 4 | null = null;
  if (FINANCING_CUSTOMER_TYPES.includes(type) && body.credit_limit_naira) {
    creditLimitKobo = toKobo(parseFloat(body.credit_limit_naira));
    const thresholds = await getConfigValue<ApprovalTierThresholds>("approval_tier_thresholds_kobo", DEFAULT_TIER_THRESHOLDS);
    approvalTier = computeApprovalTier(creditLimitKobo, thresholds);
  }

  const { data: customer, error: customerError } = await service
    .from("customers")
    .insert({
      user_id: userId,
      type,
      full_name: body.full_name,
      phone: body.phone,
      email: authUser.email ?? null,
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
    .select("id")
    .single();

  if (customerError || !customer) {
    return NextResponse.json({ error: "Could not submit your registration." }, { status: 500 });
  }

  return NextResponse.json({ customer });
}
