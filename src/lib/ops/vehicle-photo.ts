import type { VehiclePhoto } from "@/types";

// Same selection rule as the invoice PDF's getVehiclePhotoDataUri (src/app/
// api/invoices/[id]/pdf/route.ts) -- the first non-internal photo by
// sort_order -- kept in sync so a vehicle's "primary" photo means the same
// thing everywhere it's shown.
export function getPrimaryPhotoUrl(photos: VehiclePhoto[]): string | null {
  const publicPhoto = photos.filter((p) => !p.is_internal).sort((a, b) => a.sort_order - b.sort_order)[0];
  return publicPhoto?.url ?? null;
}
