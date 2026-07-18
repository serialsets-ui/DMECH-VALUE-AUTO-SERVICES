// customs_entries.status is free text (no CHECK constraint), so this is a
// best-effort badge, not an exhaustive enum map. Shared so the list and
// detail pages never disagree on how a given status is coloured.
export function customsStatusBadgeClass(status: string): string {
  return status === "cleared" ? "ops-badge-green" : "ops-badge-blue";
}
