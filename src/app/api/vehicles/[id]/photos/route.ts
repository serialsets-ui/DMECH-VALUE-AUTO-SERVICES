import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { staffGuard } from "@/lib/guards";
import type { StaffRole } from "@/types";

const EDIT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "ops_manager", "sales_manager"];
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Upload always goes through this service-role route handler, never a
// direct client-side supabase.storage call — matches the sibling repos'
// convention (justra-web/oro-energy). Unlike those, vehicle-photos is a
// public bucket (see 005's migration comment), so reads just use
// getPublicUrl(), no signed URLs.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await staffGuard();
  if (!staff) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!EDIT_ROLES.includes(staff.role as StaffRole)) {
    return NextResponse.json({ error: "Not permitted to upload photos." }, { status: 403 });
  }

  const { id } = await params;
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, or WebP images are allowed." }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be under 5MB." }, { status: 400 });
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${id}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const service = createServiceClient();
  const { error: uploadError } = await service.storage
    .from("vehicle-photos")
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: "Could not upload the photo." }, { status: 500 });
  }

  const { data: publicUrlData } = service.storage.from("vehicle-photos").getPublicUrl(path);

  // service-role: vehicles has no staff UPDATE RLS policy.
  const { data: vehicle } = await service.from("vehicles").select("photos").eq("id", id).maybeSingle();
  const photos = [...((vehicle?.photos as string[] | undefined) ?? []), publicUrlData.publicUrl];

  const { error: updateError } = await service.from("vehicles").update({ photos }).eq("id", id);
  if (updateError) {
    return NextResponse.json({ error: "Photo uploaded, but the vehicle record failed to save." }, { status: 500 });
  }

  return NextResponse.json({ photos });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await staffGuard();
  if (!staff) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!EDIT_ROLES.includes(staff.role as StaffRole)) {
    return NextResponse.json({ error: "Not permitted to delete photos." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url : "";
  if (!url) {
    return NextResponse.json({ error: "No photo URL provided." }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: vehicle } = await service.from("vehicles").select("photos").eq("id", id).maybeSingle();
  const photos = ((vehicle?.photos as string[] | undefined) ?? []).filter((p) => p !== url);

  const { error: updateError } = await service.from("vehicles").update({ photos }).eq("id", id);
  if (updateError) {
    return NextResponse.json({ error: "Could not remove the photo." }, { status: 500 });
  }

  const marker = "/vehicle-photos/";
  const idx = url.indexOf(marker);
  if (idx !== -1) {
    const path = url.slice(idx + marker.length);
    await service.storage.from("vehicle-photos").remove([path]);
  }

  return NextResponse.json({ photos });
}
