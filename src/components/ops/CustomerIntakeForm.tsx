"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DocumentUploadManager } from "@/components/ops/DocumentUploadManager";
import { CUSTOMER_TYPE_LABELS, FINANCING_CUSTOMER_TYPES } from "@/types";
import type { CustomerType } from "@/types";

type Step = 1 | 2 | 3 | 4;

const TYPE_OPTIONS = Object.entries(CUSTOMER_TYPE_LABELS) as [CustomerType, string][];

// Staff-assisted version of RegistrationForm.tsx (portal self-service) —
// same shape, same fields, submits to /api/admin/customers instead (no
// auth account required/created), and lands on the Ops customer detail
// page instead of the portal.
export function CustomerIntakeForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);

  const [type, setType] = useState<CustomerType>("instalment_buyer");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const [bvn, setBvn] = useState("");
  const [employer, setEmployer] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [guarantorName, setGuarantorName] = useState("");
  const [guarantorPhone, setGuarantorPhone] = useState("");
  const [guarantorRelationship, setGuarantorRelationship] = useState("");
  const [creditLimit, setCreditLimit] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [companyRcNumber, setCompanyRcNumber] = useState("");
  const [companyContactPerson, setCompanyContactPerson] = useState("");

  const isFinancing = FINANCING_CUSTOMER_TYPES.includes(type);

  function next() {
    setStep((s) => (s === 1 && !isFinancing ? 3 : ((Math.min(s + 1, 4)) as Step)));
  }
  function back() {
    setStep((s) => (s === 3 && !isFinancing ? 1 : ((Math.max(s - 1, 1)) as Step)));
  }

  async function submit() {
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          full_name: fullName,
          phone,
          email,
          address,
          bvn,
          employer,
          monthly_income_naira: monthlyIncome,
          guarantor_name: guarantorName,
          guarantor_phone: guarantorPhone,
          guarantor_relationship: guarantorRelationship,
          credit_limit_naira: creditLimit,
          company_name: companyName,
          company_rc_number: companyRcNumber,
          company_contact_person: companyContactPerson,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Something went wrong.");
        setStatus("error");
        return;
      }
      setCustomerId(json.customer.id);
      setStatus("idle");
      setStep(4);
    } catch {
      setError("Something went wrong.");
      setStatus("error");
    }
  }

  const STEPS: { step: Step; label: string }[] = [
    { step: 1, label: "Details" },
    ...(isFinancing ? ([{ step: 2, label: "Financing" }] as { step: Step; label: string }[]) : []),
    { step: 3, label: "Review" },
    { step: 4, label: "Documents" },
  ];

  return (
    <div className="ops-panel" style={{ maxWidth: 560 }}>
      <div className="ops-stage-bar">
        {STEPS.map((s) => (
          <span key={s.step} className={`ops-stage-dot ${step === s.step ? "active" : step > s.step ? "done" : ""}`}>
            {s.label}
          </span>
        ))}
      </div>

      {step === 1 && (
        <div>
          <div className="ops-panel-title">Customer Details</div>

          <label className="ops-field-label" htmlFor="in-type">Customer Type</label>
          <select id="in-type" className="ops-input" value={type} onChange={(e) => setType(e.target.value as CustomerType)}>
            {TYPE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <label className="ops-field-label" htmlFor="in-name">Full Name</label>
          <input id="in-name" className="ops-input" value={fullName} onChange={(e) => setFullName(e.target.value)} />

          <div className="ops-form-grid">
            <div>
              <label className="ops-field-label" htmlFor="in-phone">Phone</label>
              <input id="in-phone" className="ops-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="ops-field-label" htmlFor="in-email">Email (optional)</label>
              <input id="in-email" type="email" className="ops-input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <label className="ops-field-label" htmlFor="in-address">Address (optional)</label>
          <input id="in-address" className="ops-input" value={address} onChange={(e) => setAddress(e.target.value)} />

          <button className="ops-btn" onClick={next} disabled={!fullName || !phone}>
            Next
          </button>
        </div>
      )}

      {step === 2 && isFinancing && (
        <div>
          <div className="ops-panel-title">Financing Details</div>

          <label className="ops-field-label" htmlFor="in-credit">Requested Credit Limit (₦)</label>
          <input id="in-credit" className="ops-input" type="number" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} />

          {type === "instalment_buyer" && (
            <>
              <label className="ops-field-label" htmlFor="in-bvn">BVN</label>
              <input id="in-bvn" className="ops-input" value={bvn} onChange={(e) => setBvn(e.target.value)} />

              <label className="ops-field-label" htmlFor="in-employer">Employer</label>
              <input id="in-employer" className="ops-input" value={employer} onChange={(e) => setEmployer(e.target.value)} />

              <label className="ops-field-label" htmlFor="in-income">Monthly Income (₦)</label>
              <input id="in-income" className="ops-input" type="number" value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} />

              <div className="ops-form-grid">
                <div>
                  <label className="ops-field-label" htmlFor="in-guarantor-name">Guarantor Name</label>
                  <input id="in-guarantor-name" className="ops-input" value={guarantorName} onChange={(e) => setGuarantorName(e.target.value)} />
                </div>
                <div>
                  <label className="ops-field-label" htmlFor="in-guarantor-phone">Guarantor Phone</label>
                  <input id="in-guarantor-phone" className="ops-input" value={guarantorPhone} onChange={(e) => setGuarantorPhone(e.target.value)} />
                </div>
              </div>
              <label className="ops-field-label" htmlFor="in-guarantor-rel">Guarantor Relationship</label>
              <input id="in-guarantor-rel" className="ops-input" value={guarantorRelationship} onChange={(e) => setGuarantorRelationship(e.target.value)} />
            </>
          )}

          {type === "corporate" && (
            <>
              <label className="ops-field-label" htmlFor="in-company">Company Name</label>
              <input id="in-company" className="ops-input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />

              <label className="ops-field-label" htmlFor="in-rc">RC Number</label>
              <input id="in-rc" className="ops-input" value={companyRcNumber} onChange={(e) => setCompanyRcNumber(e.target.value)} />

              <label className="ops-field-label" htmlFor="in-contact">Contact Person</label>
              <input id="in-contact" className="ops-input" value={companyContactPerson} onChange={(e) => setCompanyContactPerson(e.target.value)} />
            </>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button className="ops-btn" style={{ background: "var(--card2)", color: "var(--text)" }} onClick={back}>← Back</button>
            <button className="ops-btn" onClick={next}>Next: Review</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="ops-panel-title">Review &amp; Submit</div>
          <div className="ops-info-row"><span className="ops-info-label">Type</span><span className="ops-info-value">{CUSTOMER_TYPE_LABELS[type]}</span></div>
          <div className="ops-info-row"><span className="ops-info-label">Name</span><span className="ops-info-value">{fullName}</span></div>
          <div className="ops-info-row"><span className="ops-info-label">Phone</span><span className="ops-info-value">{phone}</span></div>
          {isFinancing && creditLimit && (
            <div className="ops-info-row"><span className="ops-info-label">Requested Credit</span><span className="ops-info-value">₦{Number(creditLimit).toLocaleString("en-NG")}</span></div>
          )}
          <p style={{ fontSize: 12, color: "var(--muted)", margin: "14px 0" }}>
            This creates the customer record only — no portal login. If they want online access
            later, they can verify their email themselves from the site.
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="ops-btn" style={{ background: "var(--card2)", color: "var(--text)" }} onClick={back}>← Back</button>
            <button className="ops-btn" onClick={submit} disabled={status === "saving"}>
              {status === "saving" ? "Saving..." : "Register Customer"}
            </button>
          </div>
          {error && <div style={{ color: "var(--red)", fontSize: 12, marginTop: 8 }}>{error}</div>}
        </div>
      )}

      {step === 4 && customerId && (
        <div>
          <div className="ops-panel-title">Documents</div>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 16px" }}>
            Upload a government ID or any other documents on file, or skip and add them later.
          </p>
          <DocumentUploadManager customerId={customerId} canUpload />
          <button className="ops-btn" style={{ marginTop: 14 }} onClick={() => router.push(`/ops/customers/${customerId}`)}>
            Finish → Go to Customer
          </button>
        </div>
      )}
    </div>
  );
}
