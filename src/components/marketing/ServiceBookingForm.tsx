"use client";

import { Fragment, useState } from "react";
import { CheckCircle2, Check } from "lucide-react";

const SERVICES = [
  "Diagnostics",
  "Engine",
  "Electrical",
  "A/C",
  "Suspension",
  "Brakes",
  "Body/Paint",
  "EV Service",
  "Routine Maintenance",
];

const MAKES = ["Toyota", "Honda", "Lexus", "Hyundai", "Mercedes-Benz", "BMW", "Nissan", "Kia", "Other"];

type Step = 1 | 2 | 3;
type Status = "idle" | "submitting" | "sent" | "error";

export function ServiceBookingForm() {
  const [step, setStep] = useState<Step>(1);
  const [status, setStatus] = useState<Status>("idle");

  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [plateNumber, setPlateNumber] = useState("");

  const [services, setServices] = useState<string[]>([]);
  const [complaint, setComplaint] = useState("");
  const [urgency, setUrgency] = useState<"Today" | "This Week" | "Flexible">("This Week");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");

  function toggleService(s: string) {
    setServices((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function submit() {
    if (phone.trim().length < 10 || !name.trim()) {
      alert("Please enter your name and a valid phone number");
      return;
    }
    setStatus("submitting");
    try {
      const res = await fetch("/api/service/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          vehicleMake,
          vehicleModel,
          vehicleYear,
          plateNumber,
          services,
          complaint,
          urgency,
          preferredDate,
          preferredTime,
        }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="booking-card" style={{ textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", color: "var(--green)", marginBottom: 12 }}>
          <CheckCircle2 size={40} strokeWidth={1.5} />
        </div>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          Request Received
        </div>
        <p style={{ color: "var(--muted)" }}>
          Thank you, {name}. A DMECH workshop manager will reach out on WhatsApp within 30
          minutes to confirm your booking.
        </p>
      </div>
    );
  }

  return (
    <div className="booking-card">
      <div className="step-indicator">
        {[1, 2, 3].map((s, i) => (
          <Fragment key={s}>
            <div className={`step-dot ${step === s ? "active" : step > s ? "done" : ""}`}>
              {step > s ? <Check size={14} strokeWidth={2.5} /> : s}
            </div>
            {i < 2 && <div className="step-line" />}
          </Fragment>
        ))}
      </div>

      {step === 1 && (
        <div>
          <div style={{ fontWeight: 700, marginBottom: 16 }}>Vehicle Details</div>
          <label className="field-label" htmlFor="svc-make">Make</label>
          <select id="svc-make" className="field-input" value={vehicleMake} onChange={(e) => setVehicleMake(e.target.value)}>
            <option value="">Select make</option>
            {MAKES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <label className="field-label" htmlFor="svc-model">Model</label>
          <input
            id="svc-model"
            className="field-input"
            placeholder="e.g. Camry, Accord, RX350"
            value={vehicleModel}
            onChange={(e) => setVehicleModel(e.target.value)}
          />
          <label className="field-label" htmlFor="svc-year">Year</label>
          <input
            id="svc-year"
            className="field-input"
            type="number"
            placeholder="e.g. 2019"
            value={vehicleYear}
            onChange={(e) => setVehicleYear(e.target.value)}
          />
          <label className="field-label" htmlFor="svc-plate">Plate Number (optional)</label>
          <input
            id="svc-plate"
            className="field-input"
            placeholder="e.g. LSD 123 AA"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
          />
          <button className="calc-btn" style={{ background: "var(--blue)" }} onClick={() => setStep(2)}>
            Next: Service Details
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <div style={{ fontWeight: 700, marginBottom: 16 }}>Service Needed</div>
          <label className="field-label">What does your vehicle need?</label>
          <div className="chip-row" style={{ marginBottom: 16 }}>
            {SERVICES.map((s) => (
              <button
                key={s}
                type="button"
                className={`chip ${services.includes(s) ? "active" : ""}`}
                onClick={() => toggleService(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <label className="field-label" htmlFor="svc-complaint">Describe the issue</label>
          <textarea
            id="svc-complaint"
            className="field-input"
            rows={3}
            style={{ resize: "none" }}
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            placeholder="Tell us what's going on with the vehicle..."
          />
          <label className="field-label">Urgency</label>
          <div className="chip-row" style={{ marginBottom: 16 }}>
            {(["Today", "This Week", "Flexible"] as const).map((u) => (
              <button
                key={u}
                type="button"
                className={`chip ${urgency === u ? "active" : ""}`}
                onClick={() => setUrgency(u)}
              >
                {u}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="v-card-btn btn-outline" onClick={() => setStep(1)}>
              ← Back
            </button>
            <button className="v-card-btn btn-primary" onClick={() => setStep(3)}>
              Next: Contact &amp; Confirm
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div style={{ fontWeight: 700, marginBottom: 16 }}>Contact &amp; Confirm</div>
          <label className="field-label" htmlFor="svc-name">Your Name</label>
          <input id="svc-name" className="field-input" value={name} onChange={(e) => setName(e.target.value)} />
          <label className="field-label" htmlFor="svc-phone">WhatsApp Phone Number</label>
          <input
            id="svc-phone"
            className="field-input"
            type="tel"
            placeholder="e.g. 0803 456 7890"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="field-label" htmlFor="svc-date">Preferred Date</label>
              <input
                id="svc-date"
                className="field-input"
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="svc-time">Preferred Time</label>
              <input
                id="svc-time"
                className="field-input"
                type="time"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
              />
            </div>
          </div>

          <div
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: 14,
              margin: "8px 0 16px",
              fontSize: 13,
              color: "var(--muted)",
            }}
          >
            <strong style={{ color: "var(--text)" }}>Summary:</strong> {vehicleYear} {vehicleMake}{" "}
            {vehicleModel} · {services.join(", ") || "General service"} · {urgency}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button className="v-card-btn btn-outline" onClick={() => setStep(2)}>
              ← Back
            </button>
            <button
              className="v-card-btn btn-primary"
              onClick={submit}
              disabled={status === "submitting"}
            >
              {status === "submitting" ? "Submitting..." : "Confirm Booking"}
            </button>
          </div>
          {status === "error" && (
            <p style={{ color: "var(--red)", fontSize: 12, marginTop: 8 }}>
              Something went wrong — please try again or WhatsApp us directly.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
