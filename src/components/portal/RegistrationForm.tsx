"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DocumentUploadManager } from "@/components/ops/DocumentUploadManager";
import { CUSTOMER_TYPE_LABELS, FINANCING_CUSTOMER_TYPES, REGISTRABLE_CUSTOMER_TYPES } from "@/types";
import type { CustomerType } from "@/types";

type Step = 1 | 2 | 3 | 4;

const TYPE_OPTIONS = REGISTRABLE_CUSTOMER_TYPES.map((value) => [value, CUSTOMER_TYPE_LABELS[value]] as [CustomerType, string]);

export function RegistrationForm({ email }: { email: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);

  const [type, setType] = useState<CustomerType>("instalment_buyer");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
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
    // Types with no extra fields (cash/walk-in/parts) skip straight to review.
    setStep((s) => (s === 1 && !isFinancing ? 3 : ((Math.min(s + 1, 4)) as Step)));
  }
  function back() {
    setStep((s) => (s === 3 && !isFinancing ? 1 : ((Math.max(s - 1, 1)) as Step)));
  }

  async function submit() {
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/customers/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          full_name: fullName,
          phone,
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
    { step: 1, label: "About You" },
    ...(isFinancing ? ([{ step: 2, label: "Financing Details" }] as { step: Step; label: string }[]) : []),
    { step: 3, label: "Review" },
    { step: 4, label: "Documents" },
  ];

  return (
    <div className="ops-panel" style={{ maxWidth: 560, margin: "0 auto" }}>
      <div className="ops-stage-bar">
        {STEPS.map((s) => (
          <span key={s.step} className={`ops-stage-dot ${step === s.step ? "active" : step > s.step ? "done" : ""}`}>
            {s.label}
          </span>
        ))}
      </div>

      {step === 1 && (
        <div>
          <div className="ops-panel-title">About You</div>
          <div style={{ fontSize: 12, color: "var(--subtle)", marginBottom: 14 }}>Signed in as {email}</div>

          <label className="ops-field-label" htmlFor="reg-type">I am a...</label>
          <select id="reg-type" className="ops-input" value={type} onChange={(e) => setType(e.target.value as CustomerType)}>
            {TYPE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <label className="ops-field-label" htmlFor="reg-name">Full Name</label>
          <input id="reg-name" className="ops-input" value={fullName} onChange={(e) => setFullName(e.target.value)} />

          <label className="ops-field-label" htmlFor="reg-phone">Phone</label>
          <input id="reg-phone" className="ops-input" value={phone} onChange={(e) => setPhone(e.target.value)} />

          <label className="ops-field-label" htmlFor="reg-address">Address (optional)</label>
          <input id="reg-address" className="ops-input" value={address} onChange={(e) => setAddress(e.target.value)} />

          <button className="ops-btn" onClick={next} disabled={!fullName || !phone}>
            Next
          </button>
        </div>
      )}

      {step === 2 && isFinancing && (
        <div>
          <div className="ops-panel-title">Financing Details</div>

          <label className="ops-field-label" htmlFor="reg-credit">Desired Credit Limit (₦)</label>
          <input id="reg-credit" className="ops-input" type="number" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} />

          {type === "instalment_buyer" && (
            <>
              <label className="ops-field-label" htmlFor="reg-bvn">BVN</label>
              <input id="reg-bvn" className="ops-input" value={bvn} onChange={(e) => setBvn(e.target.value)} />

              <label className="ops-field-label" htmlFor="reg-employer">Employer</label>
              <input id="reg-employer" className="ops-input" value={employer} onChange={(e) => setEmployer(e.target.value)} />

              <label className="ops-field-label" htmlFor="reg-income">Monthly Income (₦)</label>
              <input id="reg-income" className="ops-input" type="number" value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} />

              <div className="ops-form-grid">
                <div>
                  <label className="ops-field-label" htmlFor="reg-guarantor-name">Guarantor Name</label>
                  <input id="reg-guarantor-name" className="ops-input" value={guarantorName} onChange={(e) => setGuarantorName(e.target.value)} />
                </div>
                <div>
                  <label className="ops-field-label" htmlFor="reg-guarantor-phone">Guarantor Phone</label>
                  <input id="reg-guarantor-phone" className="ops-input" value={guarantorPhone} onChange={(e) => setGuarantorPhone(e.target.value)} />
                </div>
              </div>
              <label className="ops-field-label" htmlFor="reg-guarantor-rel">Guarantor Relationship</label>
              <input id="reg-guarantor-rel" className="ops-input" value={guarantorRelationship} onChange={(e) => setGuarantorRelationship(e.target.value)} />
            </>
          )}

          {type === "corporate" && (
            <>
              <label className="ops-field-label" htmlFor="reg-company">Company Name</label>
              <input id="reg-company" className="ops-input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />

              <label className="ops-field-label" htmlFor="reg-rc">RC Number</label>
              <input id="reg-rc" className="ops-input" value={companyRcNumber} onChange={(e) => setCompanyRcNumber(e.target.value)} />

              <label className="ops-field-label" htmlFor="reg-contact">Contact Person</label>
              <input id="reg-contact" className="ops-input" value={companyContactPerson} onChange={(e) => setCompanyContactPerson(e.target.value)} />
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
            {isFinancing
              ? "Financing applications go through a staff approval review — you'll be notified once a decision is made."
              : "You can start browsing and requesting service right away."}
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="ops-btn" style={{ background: "var(--card2)", color: "var(--text)" }} onClick={back}>← Back</button>
            <button className="ops-btn" onClick={submit} disabled={status === "saving"}>
              {status === "saving" ? "Submitting..." : "Submit Registration"}
            </button>
          </div>
          {error && <div style={{ color: "var(--red)", fontSize: 12, marginTop: 8 }}>{error}</div>}
        </div>
      )}

      {step === 4 && customerId && (
        <div>
          <div className="ops-panel-title">Documents</div>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 16px" }}>
            {isFinancing
              ? "Upload a government ID and proof of income to speed up your approval."
              : "Upload a government ID if you have one handy, or skip for now."}
          </p>
          <DocumentUploadManager customerId={customerId} canUpload />
          <button className="ops-btn" style={{ marginTop: 14 }} onClick={() => router.push("/portal/dashboard")}>
            Finish → Go to Portal
          </button>
        </div>
      )}
    </div>
  );
}
