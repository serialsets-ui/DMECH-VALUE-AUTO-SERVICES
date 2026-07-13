import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { staffGuard } from "@/lib/guards";
import type { StaffRole } from "@/types";

const EDIT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "ops_manager", "sales_manager"];

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await staffGuard();
  if (!staff) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!EDIT_ROLES.includes(staff.role as StaffRole)) {
    return NextResponse.json({ error: "Not permitted to apply trade-in credit." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const instalmentId = typeof body?.instalment_id === "string" ? body.instalment_id : "";
  if (!instalmentId) {
    return NextResponse.json({ error: "An instalment must be selected." }, { status: 400 });
  }

  const supabase = createServiceClient();

  const [{ data: vehicle }, { data: instalment }] = await Promise.all([
    supabase.from("vehicles").select("trade_in_credit_kobo").eq("id", id).maybeSingle(),
    supabase.from("instalments").select("deposit_amount_kobo").eq("id", instalmentId).maybeSingle(),
  ]);

  if (!vehicle || !instalment) {
    return NextResponse.json({ error: "Vehicle or instalment not found." }, { status: 404 });
  }

  const credit = vehicle.trade_in_credit_kobo ?? 0;
  const remainingDeposit = Math.max((instalment.deposit_amount_kobo ?? 0) - credit, 0);

  const [vehicleUpdate, instalmentUpdate] = await Promise.all([
    supabase.from("vehicles").update({ trade_in_applied_to_instalment_id: instalmentId }).eq("id", id),
    supabase
      .from("instalments")
      .update({ deposit_amount_kobo: remainingDeposit, deposit_paid: remainingDeposit === 0 })
      .eq("id", instalmentId),
  ]);

  if (vehicleUpdate.error || instalmentUpdate.error) {
    return NextResponse.json({ error: "Could not apply the trade-in credit." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, remainingDepositKobo: remainingDeposit });
}
