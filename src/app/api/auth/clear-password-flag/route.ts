import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// Called right after supabase.auth.updateUser({ password }) succeeds on
// /change-password. Scoped to the caller's own auth_user_id — self-service,
// no role check needed, since it can only ever clear the flag on the
// account making the request. service-role for the write itself: users has
// no client-side UPDATE policy (matches every other mutation in this app).
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const service = createServiceClient();
  const { error } = await service
    .from("users")
    .update({ must_change_password: false })
    .eq("auth_user_id", authUser.id);

  if (error) {
    return NextResponse.json({ error: "Could not update account." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
