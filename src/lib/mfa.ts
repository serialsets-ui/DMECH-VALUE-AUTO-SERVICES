import { createClient } from "@/lib/supabase/server";

export type MfaStatus = "satisfied" | "needs_enroll" | "needs_challenge";

// TOTP 2FA is mandatory for every Ops account, any role — checked here on
// every /ops request (see ops/layout.tsx). currentLevel/nextLevel come
// straight off the session JWT (no network call); listFactors() is the one
// call that actually hits the network, only needed to tell "never enrolled"
// apart from "enrolled, but this session hasn't done the challenge yet"
// (e.g. a fresh login that only completed the password step so far).
export async function getMfaStatus(): Promise<MfaStatus> {
  const supabase = await createClient();
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (!aal) return "needs_enroll";
  if (aal.currentLevel === "aal2") return "satisfied";

  // The `.totp` array only ever contains verified factors by type (per-type
  // arrays exclude unverified ones — those only show up in `.all`).
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const hasVerifiedFactor = (factors?.totp.length ?? 0) > 0;
  return hasVerifiedFactor ? "needs_challenge" : "needs_enroll";
}
