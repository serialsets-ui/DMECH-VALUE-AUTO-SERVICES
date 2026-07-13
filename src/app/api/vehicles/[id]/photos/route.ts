import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { staffGuard } from "@/lib/guards";
import type { StaffRole, VehiclePhoto } from "@/types";

const EDIT_ROLES: StaffRole[] = ["super_admin", "managing_partner", "ops_manager", "sales_manager"];
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILES = 100;

// Upload always goes through this service-role route handler, never a
// direct client-side supabase.storage call — matches the sibling repos'
// convention (justra-web/oro-energy). Unlike those, vehicle-photos is a
// public bucket (see 005's migration comment), so reads just use
// getPublicUrl(), no signed URLs.
//
// Files arrive already processed (resized, WebP-encoded, optionally
// watermarked/cropped) by lib/image-pipeline.ts running in the staff
// member's browser — never on this server. That's deliberate: this machine
// (and Netlify's function runtime) has a real memory ceiling, and a
// server-side sharp/libvips pipeline would be a reliability risk a
// browser-side Canvas pipeline avoids entirely.
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
  const files = (formData?.getAll("files") ?? []).filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided." }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `Upload at most ${MAX_FILES} photos at a time.` }, { status: 400 });
  }

  const service = createServiceClient();
  // service-role: vehicles has no staff UPDATE RLS policy (only SELECT).
  const { data: vehicle } = await service.from("vehicles").select("photos").eq("id", id).maybeSingle();
  const existing = (vehicle?.photos as VehiclePhoto[] | undefined) ?? [];
  let nextSortOrder = existing.reduce((max, p) => Math.max(max, p.sort_order + 1), 0);

  const uploaded: VehiclePhoto[] = [];
  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type) || file.size > 5 * 1024 * 1024) continue;

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${id}/${crypto.randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await service.storage
      .from("vehicle-photos")
      .upload(path, buffer, { contentType: file.type, upsert: false });
    if (uploadError) continue;

    const { data: publicUrlData } = service.storage.from("vehicle-photos").getPublicUrl(path);
    uploaded.push({
      id: crypto.randomUUID(),
      url: publicUrlData.publicUrl,
      tag: null,
      is_internal: false,
      sort_order: nextSortOrder++,
    });
  }

  if (uploaded.length === 0) {
    return NextResponse.json(
      { error: "No photos could be uploaded — check file type and size (max 5MB, JPEG/PNG/WebP after processing)." },
      { status: 400 },
    );
  }

  const photos = [...existing, ...uploaded];
  const { error: updateError } = await service.from("vehicles").update({ photos }).eq("id", id);
  if (updateError) {
    return NextResponse.json({ error: "Photos uploaded, but the vehicle record failed to save." }, { status: 500 });
  }

  return NextResponse.json({ photos });
}

// Staff-edited tag/internal-flag/reorder changes are saved as one full
// replacement array (this is a staff-only route on a short per-vehicle
// list, not worth a field-level diff endpoint).
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await staffGuard();
  if (!staff) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!EDIT_ROLES.includes(staff.role as StaffRole)) {
    return NextResponse.json({ error: "Not permitted to edit photos." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!Array.isArray(body?.photos)) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const service = createServiceClient();
  const { error } = await service.from("vehicles").update({ photos: body.photos }).eq("id", id);
  if (error) {
    return NextResponse.json({ error: "Could not save photo changes." }, { status: 500 });
  }
  return NextResponse.json({ photos: body.photos });
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
  const photoId = typeof body?.id === "string" ? body.id : "";
  if (!photoId) {
    return NextResponse.json({ error: "No photo id provided." }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: vehicle } = await service.from("vehicles").select("photos").eq("id", id).maybeSingle();
  const existing = (vehicle?.photos as VehiclePhoto[] | undefined) ?? [];
  const target = existing.find((p) => p.id === photoId);
  const photos = existing.filter((p) => p.id !== photoId);

  const { error: updateError } = await service.from("vehicles").update({ photos }).eq("id", id);
  if (updateError) {
    return NextResponse.json({ error: "Could not remove the photo." }, { status: 500 });
  }

  if (target) {
    const marker = "/vehicle-photos/";
    const idx = target.url.indexOf(marker);
    if (idx !== -1) {
      const path = target.url.slice(idx + marker.length);
      await service.storage.from("vehicle-photos").remove([path]);
    }
  }

  return NextResponse.json({ photos });
}
