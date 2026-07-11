import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Replaces the old mockup's captureCalcLead() alert() — writes a real row
// instead of pretending to. Uses the cookie-bound (anon) client, not
// service-role: the "anyone can create a lead" RLS policy already permits
// this insert, so there's no reason to bypass RLS for a public form.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";

  if (phone.length < 10) {
    return NextResponse.json({ error: "A valid phone number is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("leads").insert({
    phone,
    source: "calculator",
    payload: body?.calculatorInputs ?? {},
  });

  if (error) {
    return NextResponse.json({ error: "Could not save your request." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
