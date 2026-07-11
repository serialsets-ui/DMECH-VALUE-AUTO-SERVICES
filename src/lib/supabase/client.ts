import { createBrowserClient } from "@supabase/ssr";

// Types are hand-written in src/types/index.ts (see oro-energy-management-hub
// convention) rather than generated — cast query results to those interfaces
// at the call site instead of threading a generic Database type through here.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
