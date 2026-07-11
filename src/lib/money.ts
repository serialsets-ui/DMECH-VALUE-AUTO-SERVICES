// Every money column in the DB is a BIGINT storing kobo (naira * 100). This
// is the only module that should convert between kobo and a display value —
// review flagged mixing raw-naira math (as both HTML mockups did) with a
// kobo-based schema as the most likely source of a silent off-by-100 bug
// once real Supabase reads/writes replace the mockup's hardcoded numbers.

/** Naira (float, may have kobo fraction) -> integer kobo for storage. */
export function toKobo(naira: number): number {
  return Math.round(naira * 100);
}

/** Integer kobo from storage -> naira (float). */
export function fromKobo(kobo: number): number {
  return kobo / 100;
}

/** Format a kobo amount as a naira display string, e.g. "₦18,500,000". */
export function formatNaira(kobo: number): string {
  return `₦${Math.round(fromKobo(kobo)).toLocaleString("en-NG")}`;
}

/** Format a USD amount (whole dollars, not cents) for display, e.g. "$18,500". */
export function formatUsd(dollars: number): string {
  return `$${Math.round(dollars).toLocaleString("en-US")}`;
}

/** USD cents (as stored on vehicles.purchase_price_usd_cents) -> whole dollars. */
export function usdCentsToDollars(cents: number): number {
  return cents / 100;
}
