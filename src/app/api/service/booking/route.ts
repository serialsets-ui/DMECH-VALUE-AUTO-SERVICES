import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { queueNotification } from "@/lib/notifications";

// Workshop Service Booking (spec 4.5) — the mockup never implemented this at
// all. Lands in `leads` (source: 'workshop_booking'), same as the calculator
// capture, since a booking request needs staff follow-up before it becomes a
// real job_card (Ops Customer Hub's Workshop Walk-in flow, Phase 3) — it
// isn't a confirmed appointment yet, matching the "workshop manager will
// WhatsApp within 30 minutes" copy from the spec.
//
// Don't chain .select() onto this insert — see the same note in
// api/calculator/lead/route.ts: anon has no SELECT policy on `leads`, so
// requesting the row back (.select()'s return=representation) fails even
// though the insert itself succeeds.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (phone.length < 10 || !name) {
    return NextResponse.json(
      { error: "Name and a valid phone number are required." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.from("leads").insert({
    phone,
    source: "workshop_booking",
    payload: {
      name,
      vehicleMake: body?.vehicleMake ?? null,
      vehicleModel: body?.vehicleModel ?? null,
      vehicleYear: body?.vehicleYear ?? null,
      plateNumber: body?.plateNumber ?? null,
      services: Array.isArray(body?.services) ? body.services : [],
      complaint: body?.complaint ?? null,
      urgency: body?.urgency ?? null,
      preferredDate: body?.preferredDate ?? null,
      preferredTime: body?.preferredTime ?? null,
    },
  });

  if (error) {
    return NextResponse.json({ error: "Could not save your booking." }, { status: 500 });
  }

  await queueNotification({
    recipientPhone: phone,
    channel: "sms",
    template: "booking_received",
    payload: { name, preferredDate: body?.preferredDate ?? null },
  });

  return NextResponse.json({ ok: true });
}
