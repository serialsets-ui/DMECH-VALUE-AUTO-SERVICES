import { createClient } from "@/lib/supabase/server";
import type { PublicVehicle } from "@/lib/vehicle-display";

// Server-only data fetching. Pure display helpers (isCertified,
// displayStatus, activeWarranty) and the PublicVehicle type live in
// lib/vehicle-display.ts, which has no Supabase import — client components
// must import from there, not from this file (see that file's comment for
// why: bundling this file's next/headers dependency into the client breaks
// the build).
export type { PublicVehicle } from "@/lib/vehicle-display";
export {
  isCertified,
  activeWarranty,
  displayStatus,
  publicPhotos,
  conditionCategory,
  conditionLabel,
} from "@/lib/vehicle-display";

// Mirrors the "public read pipeline vehicles" RLS policy — shown all the
// way from 'shipped' (pipeline-activity marketing value, like the original
// mockup's In Transit/At Port cards) through 'reserved', but stops short of
// 'sold'/'delivered' since those belong to a customer now, not DMECH's
// marketing inventory.
const PUBLIC_LIFECYCLE_STAGES = [
  "shipped",
  "in_transit",
  "at_port",
  "customs",
  "cleared",
  "available",
  "reserved",
] as const;

/**
 * Vehicles visible to an anonymous marketing-site visitor. RLS is the real
 * source of truth (see "public read pipeline vehicles" policy); the filter
 * here is a backstop, not a substitute for it.
 *
 * Returns an empty array — never throws — if Supabase isn't configured yet
 * or a query fails. That's a deliberate choice, not just error-handling
 * hygiene: an empty list renders the marketplace's honest "no vehicles yet"
 * state, which is the correct thing to show whether the reason is "no
 * Supabase project exists yet" or "one exists but nothing's been listed" —
 * either way, showing fabricated placeholder cars would be the one wrong
 * answer.
 */
export async function getPublicVehicles(): Promise<PublicVehicle[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("vehicles")
      .select("*, warranty_policies(*)")
      .in("lifecycle_stage", [...PUBLIC_LIFECYCLE_STAGES])
      .eq("is_published", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as PublicVehicle[];
  } catch {
    return [];
  }
}
