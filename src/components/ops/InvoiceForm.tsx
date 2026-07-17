"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatNaira, toKobo } from "@/lib/money";
import type { InvoiceDocType } from "@/types";

interface LineItemDraft {
  description: string;
  quantity: string;
  unitPriceNaira: string;
  hsnCode: string;
}

interface VehicleOption {
  id: string;
  make: string;
  model: string;
  year: number;
  sale_price_kobo: number | null;
}

interface CustomerOption {
  id: string;
  full_name: string;
  tin: string | null;
}

export interface EditingInvoice {
  id: string;
  customerId: string;
  customerTin: string;
  vehicleId: string;
  vatExempt: boolean;
  notes: string;
  items: LineItemDraft[];
}

interface Props {
  customers: CustomerOption[];
  vehicles: VehicleOption[];
  // Present only when editing an already-created invoice -- switches the
  // form to PATCH mode, hides the Document Type selector (only invoices,
  // never receipts, are ever editable -- see api/invoices/[id]/route.ts).
  editing?: EditingInvoice;
}

function emptyItem(): LineItemDraft {
  return { description: "", quantity: "1", unitPriceNaira: "", hsnCode: "" };
}

export function InvoiceForm({ customers, vehicles, editing }: Props) {
  const router = useRouter();
  const [docType, setDocType] = useState<InvoiceDocType>("invoice");
  const [customerId, setCustomerId] = useState(editing?.customerId ?? "");
  const [customerTin, setCustomerTin] = useState(editing?.customerTin ?? "");
  const [vehicleId, setVehicleId] = useState(editing?.vehicleId ?? "");
  const [vatExempt, setVatExempt] = useState(editing?.vatExempt ?? true);
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [items, setItems] = useState<LineItemDraft[]>(editing?.items?.length ? editing.items : [emptyItem()]);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function updateItem(i: number, field: keyof LineItemDraft, value: string) {
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));
  }
  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }
  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  // Switching customer refreshes the TIN field from whatever's already on
  // file for them -- staff can still type/correct it, which (if new)
  // persists back to the customer record on submit.
  function selectCustomer(id: string) {
    setCustomerId(id);
    setCustomerTin(customers.find((c) => c.id === id)?.tin ?? "");
  }

  // The first line item is reserved for whichever vehicle is selected here
  // (or freeform text if none is) -- any items after it are extras the
  // staff member adds by hand (documentation fee, accessories, etc).
  function applyVehicle(id: string) {
    setVehicleId(id);
    if (!id) return;
    const vehicle = vehicles.find((v) => v.id === id);
    if (!vehicle) return;
    const description = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
    const priceNaira = vehicle.sale_price_kobo ? String(vehicle.sale_price_kobo / 100) : "";
    // 8703 — Harmonized System code for motor cars/passenger vehicles.
    setItems((prev) => [{ description, quantity: "1", unitPriceNaira: priceNaira, hsnCode: "8703" }, ...prev.slice(1)]);
  }

  const subtotalKobo = useMemo(
    () =>
      items.reduce((sum, item) => {
        const qty = Number(item.quantity);
        const price = Number(item.unitPriceNaira);
        if (!Number.isFinite(qty) || !Number.isFinite(price)) return sum;
        return sum + toKobo(qty * price);
      }, 0),
    [items],
  );
  const vatAmountKobo = vatExempt ? 0 : Math.round(subtotalKobo * 0.075);
  const totalKobo = subtotalKobo + vatAmountKobo;

  async function submit() {
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch(editing ? `/api/invoices/${editing.id}` : "/api/invoices", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doc_type: docType,
          customer_id: customerId,
          customer_tin: customerTin || null,
          vehicle_id: vehicleId || null,
          vat_exempt: vatExempt,
          notes: notes || null,
          line_items: items
            .filter((item) => item.description.trim())
            .map((item) => ({
              description: item.description.trim(),
              quantity: Number(item.quantity) || 0,
              unit_price_kobo: toKobo(Number(item.unitPriceNaira) || 0),
              hsn_code: item.hsnCode.trim() || null,
            })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Something went wrong.");
        setStatus("error");
        return;
      }
      router.push("/ops/invoices");
      router.refresh();
    } catch {
      setError("Something went wrong.");
      setStatus("error");
    }
  }

  const canSubmit = customerId && items.some((item) => item.description.trim() && Number(item.unitPriceNaira) >= 0 && Number(item.quantity) > 0);

  return (
    <div className="ops-panel" style={{ maxWidth: 720 }}>
      <div className="ops-panel-title">{editing ? "Edit Invoice" : `New ${docType === "receipt" ? "Receipt" : "Invoice"}`}</div>

      <div className="ops-form-grid">
        {!editing && (
          <div>
            <label className="ops-field-label" htmlFor="inv-type">Document Type</label>
            <select id="inv-type" className="ops-input" value={docType} onChange={(e) => setDocType(e.target.value as InvoiceDocType)}>
              <option value="invoice">Invoice (bill for payment)</option>
              <option value="receipt">Receipt (payment already received)</option>
            </select>
          </div>
        )}
        <div>
          <label className="ops-field-label" htmlFor="inv-customer">Customer</label>
          <select id="inv-customer" className="ops-input" value={customerId} onChange={(e) => selectCustomer(e.target.value)}>
            <option value="">Select customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </select>
        </div>
      </div>

      <label className="ops-field-label" htmlFor="inv-tin">Customer TIN (optional — makes this a B2B invoice)</label>
      <input
        id="inv-tin"
        className="ops-input"
        placeholder="e.g. 12345678-0001"
        value={customerTin}
        onChange={(e) => setCustomerTin(e.target.value)}
      />

      <label className="ops-field-label" htmlFor="inv-vehicle">Vehicle (optional — for a car sale)</label>
      <select id="inv-vehicle" className="ops-input" value={vehicleId} onChange={(e) => applyVehicle(e.target.value)}>
        <option value="">Not tied to a vehicle</option>
        {vehicles.map((v) => (
          <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}{v.sale_price_kobo ? ` — ${formatNaira(v.sale_price_kobo)}` : ""}</option>
        ))}
      </select>
      {vehicleId && (
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: -8, marginBottom: 16 }}>
          Added the vehicle as a line item below, pre-filled from its sale price — edit it if the agreed price differs.
        </p>
      )}

      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginBottom: 8, marginTop: 8 }}>
        Line Items
      </div>
      {items.map((item, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 90px 70px 120px 120px auto", gap: 8, marginBottom: 8, alignItems: "center" }}>
          <input
            className="ops-input"
            style={{ marginBottom: 0 }}
            placeholder="Description"
            value={item.description}
            onChange={(e) => updateItem(i, "description", e.target.value)}
          />
          <input
            className="ops-input"
            style={{ marginBottom: 0 }}
            placeholder="HSN code"
            value={item.hsnCode}
            onChange={(e) => updateItem(i, "hsnCode", e.target.value)}
          />
          <input
            className="ops-input"
            style={{ marginBottom: 0 }}
            type="number"
            min="1"
            placeholder="Qty"
            value={item.quantity}
            onChange={(e) => updateItem(i, "quantity", e.target.value)}
          />
          <input
            className="ops-input"
            style={{ marginBottom: 0 }}
            type="number"
            min="0"
            placeholder="Unit Price (₦)"
            value={item.unitPriceNaira}
            onChange={(e) => updateItem(i, "unitPriceNaira", e.target.value)}
          />
          <span style={{ fontSize: 13, color: "var(--muted)", textAlign: "right" }}>
            {formatNaira(toKobo((Number(item.quantity) || 0) * (Number(item.unitPriceNaira) || 0)))}
          </span>
          <button type="button" className="ops-logout-btn" onClick={() => removeItem(i)} disabled={items.length === 1}>✕</button>
        </div>
      ))}
      <p style={{ fontSize: 11, color: "var(--muted)", marginTop: -4, marginBottom: 16 }}>
        HSN code is optional — common ones: 8703 (motor vehicles), 8708 (vehicle parts). Leave
        blank for workshop labor or anything without a goods classification.
      </p>
      <button type="button" className="ops-btn" style={{ background: "var(--card2)", color: "var(--text)", marginBottom: 20 }} onClick={addItem}>
        + Add Line Item
      </button>

      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: 13, color: "var(--text)" }}>
        <input type="checkbox" checked={vatExempt} onChange={(e) => setVatExempt(e.target.checked)} />
        VAT exempt
      </label>

      <label className="ops-field-label" htmlFor="inv-notes">Notes (optional)</label>
      <textarea id="inv-notes" className="ops-input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />

      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 8, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>
          <span>Subtotal</span>
          <span>{formatNaira(subtotalKobo)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>
          <span>VAT (7.5%){vatExempt ? " — Exempt" : ""}</span>
          <span>{vatExempt ? formatNaira(0) : `+ ${formatNaira(vatAmountKobo)}`}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
          <span>Total</span>
          <span>{formatNaira(totalKobo)}</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button className="ops-btn" onClick={submit} disabled={status === "saving" || !canSubmit}>
          {status === "saving" ? "Saving..." : editing ? "Save Changes" : `Create ${docType === "receipt" ? "Receipt" : "Invoice"}`}
        </button>
        {error && <span style={{ color: "var(--red)", fontSize: 12 }}>{error}</span>}
      </div>
    </div>
  );
}
