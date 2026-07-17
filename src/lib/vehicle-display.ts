import type { Vehicle, VehiclePhoto, WarrantyPolicy } from "@/types";

// Client-safe vehicle helpers — pure functions and types only, no Supabase
// import. Split out from lib/vehicles.ts because that file's
// getPublicVehicles() pulls in the server-only Supabase client
// (next/headers), which Next.js correctly refuses to bundle into a
// "use client" component. Client components (VehicleMarketplace,
// VehicleDetailModal) must import from here, not from lib/vehicles.ts.

export type PublicVehicle = Vehicle & { warranty_policies: WarrantyPolicy[] };

export type PublicDisplayStatus = "In Transit" | "At Port" | "Available" | "Reserved";

// The public marketing site shows a simplified 4-state status rather than
// the full 13-stage internal lifecycle_stage — matches the original
// mockup's In Transit/At Port/Available vocabulary, plus Reserved (which the
// mockup's simplified model didn't have, since the DB now models it).
export function displayStatus(vehicle: PublicVehicle): PublicDisplayStatus {
  switch (vehicle.lifecycle_stage) {
    case "shipped":
    case "in_transit":
      return "In Transit";
    case "at_port":
    case "customs":
      return "At Port";
    case "reserved":
      return "Reserved";
    default:
      return "Available";
  }
}

export function isCertified(vehicle: PublicVehicle): boolean {
  return (
    vehicle.certification_status === "certified" &&
    vehicle.warranty_policies.some((w) => w.status === "active")
  );
}

export function activeWarranty(vehicle: PublicVehicle): WarrantyPolicy | null {
  return vehicle.warranty_policies.find((w) => w.status === "active") ?? null;
}

// Damage photos and internal reference shots are staff-only — never show
// them to a marketing-site visitor. Sorted by the staff-chosen display order.
export function publicPhotos(vehicle: Vehicle): VehiclePhoto[] {
  return vehicle.photos
    .filter((p) => !p.is_internal)
    .sort((a, b) => a.sort_order - b.sort_order);
}


export type ConditionCategory = "brand_new" | "foreign_used" | "nigerian_used";

export function conditionCategory(vehicle: Pick<Vehicle, "condition" | "source_region">): ConditionCategory {
  if (vehicle.condition === "new") return "brand_new";
  return vehicle.source_region === "nigeria" ? "nigerian_used" : "foreign_used";
}

// "Tokunbo" specifically means foreign-used in Nigerian usage — showing it
// for a Nigerian-sourced vehicle would misdescribe it. Derive the label from
// source_region rather than hardcoding "Used (Tokunbo)" for every used car.
export function conditionLabel(vehicle: Pick<Vehicle, "condition" | "source_region">): string {
  switch (conditionCategory(vehicle)) {
    case "brand_new":
      return "Brand New";
    case "nigerian_used":
      return "Nigerian Used";
    case "foreign_used":
      return "Foreign Used (Tokunbo)";
  }
}
