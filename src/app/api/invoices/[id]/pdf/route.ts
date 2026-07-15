import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createServiceClient } from "@/lib/supabase/server";
import { staffGuard } from "@/lib/guards";
import { InvoicePDF } from "@/components/ops/InvoicePDF";
import type { BusinessProfile, Invoice } from "@/types";

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

  const [businessRes, customerRes] = await Promise.all([
    service.from("platform_config").select("value").eq("key", "business_profile").maybeSingle(),
    invoice.customer_id
      ? service.from("customers").select("full_name").eq("id", invoice.customer_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const business = (businessRes.data?.value as BusinessProfile | null) ?? {};
  const customerName = (customerRes.data as { full_name: string } | null)?.full_name ?? null;

  const pdfBuffer = await renderToBuffer(InvoicePDF({ invoice, business, customerName }));

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.invoice_number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
