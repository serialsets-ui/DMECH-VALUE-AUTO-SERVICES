import type { InvoiceLineItem } from "@/types";

// Shared between invoice create and edit routes -- validates and
// normalizes freeform line-item input from the client into the shape
// stored in invoices.line_items.
export function parseLineItems(rawItems: unknown): InvoiceLineItem[] {
  if (!Array.isArray(rawItems)) return [];
  return rawItems
    .map((item: unknown) => {
      const i = item as Record<string, unknown>;
      const description = typeof i.description === "string" ? i.description.trim() : "";
      const quantity = Number(i.quantity);
      const unitPriceKobo = Number(i.unit_price_kobo);
      const hsnCode = typeof i.hsn_code === "string" && i.hsn_code.trim() ? i.hsn_code.trim() : null;
      if (!description || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPriceKobo) || unitPriceKobo < 0) {
        return null;
      }
      return { description, quantity, unit_price_kobo: unitPriceKobo, amount_kobo: Math.round(quantity * unitPriceKobo), hsn_code: hsnCode } as InvoiceLineItem;
    })
    .filter((item: InvoiceLineItem | null): item is InvoiceLineItem => item !== null);
}
