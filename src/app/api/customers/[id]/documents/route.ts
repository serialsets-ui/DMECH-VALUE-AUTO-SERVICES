import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { staffGuard, customerGuard } from "@/lib/guards";
import type { CustomerDocument } from "@/types";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

// Private bucket (see migration 009) — `documents[].url` stores the storage
// PATH, not a public URL; GET below signs it on demand. Either the customer
// themselves or any staff member can upload (staff sometimes scan/attach a
// document on a customer's behalf during in-person registration).
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [staff, customer] = await Promise.all([staffGuard(), customerGuard()]);
  const isSelf = customer?.id === id;
  if (!staff && !isSelf) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const docType = typeof formData?.get("type") === "string" ? String(formData.get("type")) : "Document";
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, WebP, or PDF files are allowed." }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File must be under 10MB." }, { status: 400 });
  }

  const service = createServiceClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || (file.type === "application/pdf" ? "pdf" : "jpg");
  const path = `${id}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await service.storage
    .from("customer-documents")
    .upload(path, buffer, { contentType: file.type, upsert: false });
  if (uploadError) {
    return NextResponse.json({ error: "Could not upload the document." }, { status: 500 });
  }

  const { data: customerRow } = await service.from("customers").select("documents").eq("id", id).maybeSingle();
  const documents: CustomerDocument[] = [
    ...((customerRow?.documents as CustomerDocument[] | undefined) ?? []),
    { type: docType, url: path, uploaded_at: new Date().toISOString(), verified: false },
  ];

  const { error: updateError } = await service.from("customers").update({ documents }).eq("id", id);
  if (updateError) {
    return NextResponse.json({ error: "Document uploaded, but the record failed to save." }, { status: 500 });
  }

  return NextResponse.json({ documents });
}

// Signs every document's storage path so the caller (portal or Ops) can
// actually display/download them — the bucket is private, so a raw path is
// useless to the browser.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [staff, customer] = await Promise.all([staffGuard(), customerGuard()]);
  const isSelf = customer?.id === id;
  if (!staff && !isSelf) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const service = createServiceClient();
  const { data: customerRow } = await service.from("customers").select("documents").eq("id", id).maybeSingle();
  const documents = (customerRow?.documents as CustomerDocument[] | undefined) ?? [];

  const signed = await Promise.all(
    documents.map(async (doc) => {
      const { data } = await service.storage.from("customer-documents").createSignedUrl(doc.url, 3600);
      return { ...doc, signedUrl: data?.signedUrl ?? null };
    }),
  );

  return NextResponse.json({ documents: signed });
}
