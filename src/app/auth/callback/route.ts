import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Lands here from the magic-link email (see /verify's emailRedirectTo). Must
// be a route handler, not a page — exchanging the code sets a session
// cookie, which a Server Component can't do.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/portal/dashboard";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
