import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/ops", "/portal"];

// Session refresh + coarse route gating, mirroring justra-web's middleware:
// redirect unauthenticated visitors away from /ops and /portal before the
// request reaches a Server Component. Fine-grained role checks (which staff
// role can see which module) happen per-page via src/lib/guards.ts — this
// only answers "is there a session at all".
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix));

  // Public routes (the marketing site, above all) never touch Supabase here.
  // This matters in practice, not just for perf: Phase 1's whole point is
  // shipping the marketing site before Supabase/Paystack credentials exist,
  // so gating every request — including public ones — on a configured
  // Supabase client would block local dev and the first deploy on
  // credentials the public site doesn't need yet.
  if (!isProtected) {
    return NextResponse.next();
  }

  const redirectToAuth = () => {
    const redirectPath = path.startsWith("/ops") ? "/login" : "/verify";
    const url = request.nextUrl.clone();
    url.pathname = redirectPath;
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  };

  // Without Supabase configured, production still fails closed (redirect to
  // login — there's no real auth to enforce, so there's nothing to gain from
  // letting the request through, and it's the safe default if this somehow
  // ships misconfigured). Local dev fails open instead: no real user data
  // exists behind /ops or /portal yet anyway before Phase 2's auth lands,
  // and failing closed here would block previewing UI-only work (like the
  // ops splash screen) with nothing more than a crash to show for it.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return process.env.NODE_ENV === "development" ? NextResponse.next() : redirectToAuth();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectToAuth();
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
