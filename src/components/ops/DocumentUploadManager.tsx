"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, CheckCircle2 } from "lucide-react";
import type { CustomerDocument } from "@/types";

const DOC_TYPES = ["Government ID", "Proof of Income", "Utility Bill", "Bank Statement", "Other"];

interface SignedDocument extends CustomerDocument {
  signedUrl: string | null;
}

// Shared between /register (customer uploading their own documents) and
// /ops/customers/[id] + /portal/documents (viewing/adding later) — the
// private bucket means every read needs a signed URL, fetched fresh here
// rather than trusting a stored public URL (see api/customers/[id]/documents
// GET).
export function DocumentUploadManager({ customerId, canUpload }: { customerId: string; canUpload: boolean }) {
  const [documents, setDocuments] = useState<SignedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Doesn't set loading=true itself — `loading` already starts true (see
  // useState below) for the initial mount fetch, and a silent refresh after
  // upload doesn't need to flip the loading state at all. Keeps this safe to
  // call directly from the effect body without a synchronous setState there.
  async function loadDocuments() {
    try {
      const res = await fetch(`/api/customers/${customerId}/documents`);
      const json = await res.json();
      if (res.ok) setDocuments(json.documents ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("uploading");
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", docType);
      const res = await fetch(`/api/customers/${customerId}/documents`, { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Upload failed.");
        setStatus("error");
        return;
      }
      setStatus("idle");
      await loadDocuments();
    } catch {
      setError("Upload failed.");
      setStatus("error");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="ops-panel">
      <div className="ops-panel-title">Documents</div>

      {loading ? (
        <div style={{ fontSize: 13, color: "var(--muted)" }}>Loading...</div>
      ) : documents.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>No documents uploaded yet.</div>
      ) : (
        <div style={{ marginBottom: 14 }}>
          {documents.map((doc, i) => (
            <div key={i} className="ops-info-row">
              <span className="ops-info-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <FileText size={14} strokeWidth={2} />
                {doc.type}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {doc.verified && (
                  <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--green)", fontSize: 11 }}>
                    <CheckCircle2 size={13} strokeWidth={2} /> Verified
                  </span>
                )}
                {doc.signedUrl && (
                  <a href={doc.signedUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--blue)", fontSize: 12 }}>
                    View →
                  </a>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      {canUpload && (
        <>
          <label className="ops-field-label" htmlFor="doc-type">Document Type</label>
          <select id="doc-type" className="ops-input" value={docType} onChange={(e) => setDocType(e.target.value)}>
            {DOC_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFileChange}
            disabled={status === "uploading"}
            style={{ fontSize: 13, color: "var(--muted)" }}
          />
          {status === "uploading" && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>Uploading...</div>}
          {error && <div style={{ fontSize: 12, color: "var(--red)", marginTop: 8 }}>{error}</div>}
        </>
      )}
    </div>
  );
}
