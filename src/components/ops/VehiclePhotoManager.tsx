"use client";

import { useRef, useState } from "react";
import { X, Upload, GripVertical } from "lucide-react";
import { processImage, type CropRect } from "@/lib/image-pipeline";
import { ImageCropModal } from "@/components/ops/ImageCropModal";
import { PHOTO_TAGS, type VehiclePhoto } from "@/types";

type Status = "idle" | "processing" | "uploading" | "saving" | "error";

export function VehiclePhotoManager({
  vehicleId,
  initialPhotos,
}: {
  vehicleId: string;
  initialPhotos: VehiclePhoto[];
}) {
  const [photos, setPhotos] = useState<VehiclePhoto[]>(initialPhotos);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [progressLabel, setProgressLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [watermark, setWatermark] = useState(true);
  const [cropEnabled, setCropEnabled] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dragIndex = useRef<number | null>(null);
  const cropResolver = useRef<((rect: CropRect | null) => void) | null>(null);

  function askForCrop(file: File): Promise<CropRect | null> {
    return new Promise((resolve) => {
      cropResolver.current = resolve;
      setCropFile(file);
    });
  }

  function resolveCrop(rect: CropRect | null) {
    cropResolver.current?.(rect);
    cropResolver.current = null;
    setCropFile(null);
  }

  async function handleFiles(files: File[]) {
    if (files.length === 0) return;
    setError(null);
    setStatus("processing");

    // Processed client-side (resize/compress/watermark/optional crop) before
    // upload — see lib/image-pipeline.ts for why this never runs server-side.
    const outFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      setProgressLabel(`Processing photo ${i + 1} of ${files.length}`);
      const file = files[i];
      try {
        const cropRect = cropEnabled ? await askForCrop(file) : null;
        const blob = await processImage(file, { cropRect: cropRect ?? undefined, watermark });
        const ext = blob.type === "image/webp" ? "webp" : "jpg";
        outFiles.push(new File([blob], `photo-${Date.now()}-${i}.${ext}`, { type: blob.type }));
      } catch {
        // A file that fails to process (e.g. an unrecognized HEIC variant)
        // still gets uploaded untouched rather than dropped from the batch.
        outFiles.push(file);
      }
    }

    setStatus("uploading");
    setProgressLabel(`Uploading ${outFiles.length} photo${outFiles.length === 1 ? "" : "s"}...`);
    try {
      const formData = new FormData();
      outFiles.forEach((f) => formData.append("files", f));
      const res = await fetch(`/api/vehicles/${vehicleId}/photos`, { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Upload failed.");
        setStatus("error");
        return;
      }
      setPhotos(json.photos);
      setStatus("idle");
    } catch {
      setError("Upload failed.");
      setStatus("error");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFiles(Array.from(e.target.files ?? []));
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith("image/") || /\.hei[cf]$/i.test(f.name),
    );
    handleFiles(files);
  }

  function updatePhoto(id: string, patch: Partial<VehiclePhoto>) {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    setDirty(true);
  }

  async function removePhoto(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/vehicles/${vehicleId}/photos`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  function onThumbDragStart(index: number) {
    return () => {
      dragIndex.current = index;
    };
  }
  function onThumbDragOver(index: number) {
    return (e: React.DragEvent) => {
      e.preventDefault();
      const from = dragIndex.current;
      if (from === null || from === index) return;
      setPhotos((prev) => {
        const next = [...prev];
        const [moved] = next.splice(from, 1);
        next.splice(index, 0, moved);
        return next;
      });
      dragIndex.current = index;
      setDirty(true);
    };
  }

  async function saveMetadata() {
    setStatus("saving");
    const normalized = photos.map((p, i) => ({ ...p, sort_order: i }));
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/photos`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos: normalized }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setPhotos(normalized);
      setDirty(false);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  const busy = status === "processing" || status === "uploading";

  return (
    <div className="ops-panel">
      <div className="ops-panel-title">Photos</div>

      {photos.length > 0 && (
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10, marginBottom: 14 }}
        >
          {photos.map((photo, i) => (
            <div
              key={photo.id}
              className="photo-thumb"
              draggable
              onDragStart={onThumbDragStart(i)}
              onDragOver={onThumbDragOver(i)}
            >
              <div style={{ position: "relative" }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, not a local /public asset */}
                <img src={photo.url} alt="Vehicle" style={{ width: "100%", height: 90, objectFit: "cover", display: "block" }} />
                <span style={{ position: "absolute", top: 4, left: 4, color: "#fff", opacity: 0.8 }}>
                  <GripVertical size={14} strokeWidth={2} />
                </span>
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  aria-label="Remove photo"
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    background: "rgba(12,16,23,.75)",
                    border: "none",
                    borderRadius: "50%",
                    width: 22,
                    height: 22,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              </div>
              <select
                className="photo-thumb-tag"
                value={photo.tag ?? ""}
                onChange={(e) => updatePhoto(photo.id, { tag: (e.target.value || null) as VehiclePhoto["tag"] })}
              >
                <option value="">No tag</option>
                {PHOTO_TAGS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <label className="photo-thumb-internal">
                <input
                  type="checkbox"
                  checked={photo.is_internal}
                  onChange={(e) => updatePhoto(photo.id, { is_internal: e.target.checked })}
                />
                Internal only
              </label>
            </div>
          ))}
        </div>
      )}

      {dirty && (
        <div style={{ marginBottom: 14 }}>
          <button className="ops-btn" onClick={saveMetadata} disabled={status === "saving"}>
            {status === "saving" ? "Saving..." : "Save Photo Changes"}
          </button>
        </div>
      )}

      <div
        className={`ops-dropzone ${dragOver ? "drag-over" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
          <Upload size={20} strokeWidth={1.75} />
        </div>
        Drag photos here, or click to select (bulk upload supported — JPEG, PNG, WebP, HEIC)
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
        onChange={onFileInputChange}
        disabled={busy}
        style={{ display: "none" }}
      />

      <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 12, color: "var(--muted)" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="checkbox" checked={watermark} onChange={(e) => setWatermark(e.target.checked)} />
          Watermark
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="checkbox" checked={cropEnabled} onChange={(e) => setCropEnabled(e.target.checked)} />
          Crop each photo before upload
        </label>
      </div>

      {busy && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>{progressLabel}</div>}
      {error && <div style={{ fontSize: 12, color: "var(--red)", marginTop: 8 }}>{error}</div>}

      {cropFile && (
        <ImageCropModal
          file={cropFile}
          onConfirm={resolveCrop}
          onCancel={() => resolveCrop(null)}
        />
      )}
    </div>
  );
}
