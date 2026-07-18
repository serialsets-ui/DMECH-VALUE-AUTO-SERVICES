import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createServiceClient } from "@/lib/supabase/server";
import { staffGuard } from "@/lib/guards";
import { InvoicePDF } from "@/components/ops/InvoicePDF";
import type { BusinessProfile, Invoice, VehiclePhoto } from "@/types";

// Read once per server instance rather than per request -- the logo file
// never changes at runtime, and re-reading + re-encoding it on every PDF
// would be pure waste.
let logoDataUri: string | null = null;
async function getLogoDataUri(): Promise<string | null> {
  if (logoDataUri) return logoDataUri;
  try {
    const buffer = await readFile(path.join(process.cwd(), "public", "logo.png"));
    logoDataUri = `data:image/png;base64,${buffer.toString("base64")}`;
    return logoDataUri;
  } catch {
    return null;
  }
}

// The vehicle's own first public photo, not a stock image -- more
// relevant on its invoice than a generic car, and honestly reflects
// whether one's actually been uploaded rather than faking one. Fetched
// fresh per request (unlike the logo) since it's different per vehicle.
async function getVehiclePhotoDataUri(vehicleId: string | null): Promise<string | null> {
  if (!vehicleId) return null;
  try {
    const service = createServiceClient();
    const { data: vehicle } = await service.from("vehicles").select("photos").eq("id", vehicleId).maybeSingle();
    const photos = (vehicle?.photos as VehiclePhoto[] | undefined) ?? [];
    const publicPhoto = photos.filter((p) => !p.is_internal).sort((a, b) => a.sort_order - b.sort_order)[0];
    if (!publicPhoto) return null;
    const res = await fetch(publicPhoto.url);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "image/webp";
    const buffer = Buffer.from(await res.arrayBuffer());
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

// Server-side render pattern confirmed working in justra-web's own
// api/invoices/[id]/pdf/route.ts — renderToBuffer(...) then wrap the buffer
// in a NextResponse with the right content-type/disposition headers.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await staffGuard();
  if (!staff) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id } = await params;
  const service = createServiceClient();

  const { data: invoiceRow } = await service.from("invoices").select("*").eq("id", id).maybeSingle();
  if (!invoiceRow) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }
  const invoice = invoiceRow as Invoice;

  const [businessRes, customerRes, logo, vehiclePhoto] = await Promise.all([
    service.from("platform_config").select("value").eq("key", "business_profile").maybeSingle(),
    invoice.customer_id
      ? service.from("customers").select("full_name, phone, email, address").eq("id", invoice.customer_id).maybeSingle()
      : Promise.resolve({ data: null }),
    getLogoDataUri(),
    getVehiclePhotoDataUri(invoice.vehicle_id),
  ]);

  const business = (businessRes.data?.value as BusinessProfile | null) ?? {};
  const customer = customerRes.data as { full_name: string; phone: string | null; email: string | null; address: string | null } | null;

  const pdfBuffer = await renderToBuffer(InvoicePDF({ invoice, business, customer, logoDataUri: logo, vehiclePhotoDataUri: vehiclePhoto }));

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.invoice_number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
