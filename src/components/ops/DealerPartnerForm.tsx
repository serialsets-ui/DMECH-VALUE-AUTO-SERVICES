"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DealerPartnerForm() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [rcNumber, setRcNumber] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/admin/dealer-partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: businessName,
          rc_number: rcNumber,
          contact_person: contactPerson,
          phone,
          email,
          address,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Something went wrong.");
        setStatus("error");
        return;
      }
      router.push(`/ops/dealer-partners/${json.dealerPartner.id}`);
    } catch {
      setError("Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <div className="ops-panel" style={{ maxWidth: 480 }}>
      <div className="ops-panel-title">Add Dealer Partner</div>
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
        No login is created — this is an internal record only. Vehicles sourced from this dealer
        still go through DMECH&apos;s own inspection and certification before they&apos;re
        published, same as any other consignment.
      </p>

      <label className="ops-field-label" htmlFor="dp-name">Business Name</label>
      <input id="dp-name" className="ops-input" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />

      <div className="ops-form-grid">
        <div>
          <label className="ops-field-label" htmlFor="dp-rc">RC Number (optional)</label>
          <input id="dp-rc" className="ops-input" value={rcNumber} onChange={(e) => setRcNumber(e.target.value)} />
        </div>
        <div>
          <label className="ops-field-label" htmlFor="dp-contact">Contact Person (optional)</label>
          <input id="dp-contact" className="ops-input" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
        </div>
      </div>

      <div className="ops-form-grid">
        <div>
          <label className="ops-field-label" htmlFor="dp-phone">Phone</label>
          <input id="dp-phone" className="ops-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="ops-field-label" htmlFor="dp-email">Email (optional)</label>
          <input id="dp-email" type="email" className="ops-input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>

      <label className="ops-field-label" htmlFor="dp-address">Address (optional)</label>
      <input id="dp-address" className="ops-input" value={address} onChange={(e) => setAddress(e.target.value)} />

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button className="ops-btn" onClick={submit} disabled={status === "saving" || !businessName || !phone}>
          {status === "saving" ? "Saving..." : "Add Dealer Partner"}
        </button>
        {error && <span style={{ color: "var(--red)", fontSize: 12 }}>{error}</span>}
      </div>
    </div>
  );
}
