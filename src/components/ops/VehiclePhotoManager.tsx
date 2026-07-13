"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";

export function VehiclePhotoManager({
  vehicleId,
  initialPhotos,
}: {
  vehicleId: string;
  initialPhotos: string[];
}) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("uploading");
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
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

  async function removePhoto(url: string) {
    setPhotos((prev) => prev.filter((p) => p !== url));
    await fetch(`/api/vehicles/${vehicleId}/photos`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
  }

  return (
    <div className="ops-panel">
      <div className="ops-panel-title">Photos</div>

      {photos.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10, marginBottom: 14 }}>
          {photos.map((url) => (
            <div key={url} style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, not a local /public asset */}
              <img src={url} alt="Vehicle" style={{ width: "100%", height: 90, objectFit: "cover", display: "block" }} />
              <button
                type="button"
                onClick={() => removePhoto(url)}
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
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={status === "uploading"}
        style={{ fontSize: 13, color: "var(--muted)" }}
      />
      {status === "uploading" && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>Uploading...</div>}
      {error && <div style={{ fontSize: 12, color: "var(--red)", marginTop: 8 }}>{error}</div>}
    </div>
  );
}
