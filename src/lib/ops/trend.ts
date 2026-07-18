// Shared bucketing for Dashboard hero stat cards -- every card's sparkline
// and %-change pill is computed the same way, from real created_at rows,
// never invented.

/** Buckets rows into `weeks` trailing 7-day windows, oldest first, summing
 * `value` per row into whichever bucket its `created_at` falls in. */
export function weeklyBuckets(rows: { created_at: string; value: number }[], weeks = 8): number[] {
  const buckets = new Array(weeks).fill(0) as number[];
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  for (const row of rows) {
    const age = now - new Date(row.created_at).getTime();
    const bucketFromEnd = Math.floor(age / weekMs);
    const idx = weeks - 1 - bucketFromEnd;
    if (idx >= 0 && idx < weeks) buckets[idx] += row.value;
  }
  return buckets;
}

/** % change comparing the second half of the buckets against the first half.
 * Returns null (render no pill) when there's no prior-period baseline to
 * compare against, rather than showing a misleading infinite/zero change. */
export function bucketPctChange(buckets: number[]): number | null {
  const half = Math.floor(buckets.length / 2);
  const recent = buckets.slice(half).reduce((a, b) => a + b, 0);
  const prior = buckets.slice(0, half).reduce((a, b) => a + b, 0);
  if (prior === 0) return null;
  return ((recent - prior) / prior) * 100;
}
