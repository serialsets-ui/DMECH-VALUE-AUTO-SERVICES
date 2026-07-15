"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BusinessProfile } from "@/types";

type Status = "idle" | "saving" | "saved" | "error";

// These fields are what appears on every generated invoice/receipt header —
// legal_name/tin/rc_number/vat_number/address for the seller block, bank
// details for payment instructions. Left blank until filled in here; never
// fabricated on the PDF (see InvoicePDF.tsx and migration 007's comment).
export function BusinessProfileForm({ profile }: { profile: BusinessProfile }) {
  const router = useRouter();
  const [legalName, setLegalName] = useState(profile.legal_name ?? "");
  const [tin, setTin] = useState(profile.tin ?? "");
  const [rcNumber, setRcNumber] = useState(profile.rc_number ?? "");
  const [vatNumber, setVatNumber] = useState(profile.vat_number ?? "");
  const [address, setAddress] = useState(profile.address ?? "");
  const [bankName, setBankName] = useState(profile.bank_name ?? "");
  const [bankAccountNumber, setBankAccountNumber] = useState(profile.bank_account_number ?? "");
  const [bankAccountName, setBankAccountName] = useState(profile.bank_account_name ?? "");
  const [status, setStatus] = useState<Status>("idle");

  async function save() {
    setStatus("saving");
    try {
      const res = await fetch("/api/admin/settings/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legal_name: legalName || undefined,
          tin: tin || undefined,
          rc_number: rcNumber || undefined,
          vat_number: vatNumber || undefined,
          address: address || undefined,
          bank_name: bankName || undefined,
          bank_account_number: bankAccountNumber || undefined,
          bank_account_name: bankAccountName || undefined,
        }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setStatus("saved");
      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="ops-panel" style={{ maxWidth: 560 }}>
      <div className="ops-panel-title">Business &amp; Tax Details</div>
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
        Shown on every generated invoice and receipt. Nigeria&apos;s NRS e-invoicing mandate (MBS)
        isn&apos;t enforced until July 2027 — until then, these fields keep documents correctly
        formatted with real TIN/VAT details, not submitted anywhere automatically.
      </p>

      <label className="ops-field-label" htmlFor="biz-legal-name">Registered Legal Name</label>
      <input id="biz-legal-name" className="ops-input" value={legalName} onChange={(e) => setLegalName(e.target.value)} />

      <label className="ops-field-label" htmlFor="biz-tin">TIN (Tax Identification Number)</label>
      <input id="biz-tin" className="ops-input" value={tin} onChange={(e) => setTin(e.target.value)} />

      <label className="ops-field-label" htmlFor="biz-rc">CAC / RC Number</label>
      <input id="biz-rc" className="ops-input" value={rcNumber} onChange={(e) => setRcNumber(e.target.value)} />

      <label className="ops-field-label" htmlFor="biz-vat">VAT Registration Number (optional)</label>
      <input id="biz-vat" className="ops-input" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} />

      <label className="ops-field-label" htmlFor="biz-address">Registered Address</label>
      <textarea id="biz-address" className="ops-input" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />

      <label className="ops-field-label" htmlFor="biz-bank-name">Bank Name</label>
      <input id="biz-bank-name" className="ops-input" value={bankName} onChange={(e) => setBankName(e.target.value)} />

      <label className="ops-field-label" htmlFor="biz-bank-acct">Bank Account Number</label>
      <input id="biz-bank-acct" className="ops-input" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} />

      <label className="ops-field-label" htmlFor="biz-bank-acct-name">Bank Account Name</label>
      <input id="biz-bank-acct-name" className="ops-input" value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} />

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
        <button className="ops-btn" onClick={save} disabled={status === "saving"}>
          {status === "saving" ? "Saving..." : "Save Changes"}
        </button>
        {status === "saved" && <span style={{ color: "var(--green)", fontSize: 12 }}>Saved</span>}
        {status === "error" && <span style={{ color: "var(--red)", fontSize: 12 }}>Something went wrong</span>}
      </div>
    </div>
  );
}
