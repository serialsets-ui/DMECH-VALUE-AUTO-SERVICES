import { createClient } from "@/lib/supabase/server";
import type { Customer, DmechUser, StaffRole } from "@/types";

/**
 * Resolve the current session to a `users` row and confirm it's staff (any
 * role except "customer"). Returns null if unauthenticated or not staff —
 * callers decide whether that means redirect() or a 403 JSON response.
 * Pattern mirrors oro-energy-management-hub's per-page guard functions
 * rather than centralizing everything in middleware, since middleware only
 * needs to do the coarse "is there a session at all" check.
 */
export async function staffGuard(): Promise<DmechUser | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("auth_user_id", authUser.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!profile || profile.role === "customer") return null;
  return profile as DmechUser;
}

/** Like staffGuard(), but also requires the profile's role to be in `allowed`. */
export async function roleGuard(allowed: StaffRole[]): Promise<DmechUser | null> {
  const profile = await staffGuard();
  if (!profile || !allowed.includes(profile.role as StaffRole)) return null;
  return profile;
}

/**
 * Resolve the current session to a `customers` row via users.auth_user_id ->
 * users.id -> customers.user_id — the same join dmech_customer_id() does in
 * SQL (002_functions.sql), just run client-side here since Server
 * Components/route handlers need the full row, not just the id.
 */
export async function customerGuard(): Promise<Customer | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data: userRow } = await supabase
    .from("users")
    .select("id")
    .eq("auth_user_id", authUser.id)
    .maybeSingle();
  if (!userRow) return null;

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("user_id", userRow.id)
    .is("deleted_at", null)
    .maybeSingle();

  return customer as Customer | null;
}
