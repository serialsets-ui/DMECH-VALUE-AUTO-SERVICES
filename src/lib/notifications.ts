import { createServiceClient } from "@/lib/supabase/server";

// Writes a real row with status='queued' at the actual trigger point — the
// data model and every place a notification SHOULD fire are correct, but
// nothing sends yet: no Termii/Zeptomail/WhatsApp Cloud API credentials
// exist anywhere in this project. A worker reading queued rows and actually
// sending them is future work once a provider is connected; this is
// deliberately not that. Never throws — a queueing failure shouldn't block
// the real mutation it's attached to.
export async function queueNotification(entry: {
  recipientId?: string | null;
  recipientPhone?: string | null;
  channel: "whatsapp" | "sms" | "email";
  template: string;
  payload: Record<string, unknown>;
}) {
  try {
    const service = createServiceClient();
    await service.from("notifications").insert({
      recipient_id: entry.recipientId ?? null,
      recipient_phone: entry.recipientPhone ?? null,
      channel: entry.channel,
      template: entry.template,
      payload: entry.payload,
      status: "queued",
    });
  } catch {
    // Deliberately swallowed — see the comment above.
  }
}
