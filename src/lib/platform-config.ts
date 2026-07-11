import { createServiceClient } from "@/lib/supabase/server";

// platform_config is staff-only under RLS (it holds business-sensitive
// settings like max_self_finance_kobo, credit limits, etc.) — deliberately
// not opened up with a public policy. The marketing site still needs a
// handful of these values (ngn_usd_rate, default_deposit_pct,
// market_price_benchmarks) for the calculator and vehicle financing tab, so
// Server Components read them via the service-role client, which runs on
// the server and never reaches the browser, instead of loosening RLS.
//
// Always falls back to the given default rather than throwing — this is
// what lets the marketing site build and run before a Supabase project even
// exists (Phase 0/1 sequencing), and keeps it resilient if Supabase has a
// hiccup in production later.
export async function getConfigValue<T>(key: string, fallback: T): Promise<T> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("platform_config")
      .select("value")
      .eq("key", key)
      .single();

    if (error || !data) return fallback;
    return data.value as T;
  } catch {
    return fallback;
  }
}
