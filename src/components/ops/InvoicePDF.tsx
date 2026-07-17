import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { fromKobo } from "@/lib/money";
import type { BusinessProfile, Invoice } from "@/types";

// Adapted from JUSTRA's InvoicePDF.tsx (a sibling project with a proven,
// real-world invoice/receipt PDF renderer) — dropped WHT (withholding tax
// applies to professional-services-style payments, not a standard retail
// vehicle sale) and trade-specific job details, kept the honest "not yet
// live" NRS e-invoicing note. See migration 007's comment: Nigeria's NRS
// e-invoicing (MBS) mandate isn't enforced until July 2027, so there is
// nothing to submit to yet — this generates a correctly-formatted document,
// not a fiscalized one.

// NOT lib/money.ts's formatNaira() — @react-pdf/renderer's built-in
// Helvetica font has no glyph for ₦, so it silently renders as a broken
// character in the PDF (confirmed by actually rendering one; nothing about
// this shows up from lint or a type check). JUSTRA hit the identical
// problem and settled on the same fix: spell out "NGN" instead of the
// symbol, PDF output only — every other formatNaira() call site in this
// app (web pages) keeps the real ₦ symbol, which renders fine in a browser.
function fmt(kobo: number): string {
  return `NGN ${Math.round(fromKobo(kobo)).toLocaleString("en-NG")}`;
}

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, color: "#111111", padding: 40, backgroundColor: "#ffffff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#0B2038",
  },
  headerLeft: { flex: 1 },
  headerRight: { textAlign: "right" },
  bizName: { fontSize: 15, fontFamily: "Helvetica-Bold", color: "#0B2038", marginBottom: 3 },
  bizMeta: { fontSize: 9, color: "#666666", marginTop: 2 },
  docType: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#1899E7" },
  docNumber: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#0B2038", marginTop: 3 },
  docMeta: { fontSize: 9, color: "#666666", marginTop: 3 },
  billRow: { flexDirection: "row", marginBottom: 20 },
  billCol: { flex: 1, marginRight: 20 },
  sectionLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 1, color: "#999999", marginBottom: 5 },
  clientName: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#111111", marginBottom: 2 },
  clientMeta: { fontSize: 9, color: "#555555", marginTop: 2 },
  tableHeader: { flexDirection: "row", backgroundColor: "#0B2038", paddingVertical: 7, paddingHorizontal: 10 },
  tableHeaderText: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  tableRow: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  colDesc: { flex: 4 },
  colHsn: { flex: 1, textAlign: "right", color: "#999999" },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 2, textAlign: "right" },
  colAmount: { flex: 2, textAlign: "right" },
  totalsWrap: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  totalsBox: { width: 250 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  totalsLabel: { color: "#666666" },
  totalsValue: { fontFamily: "Helvetica-Bold" },
  netRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, marginTop: 4, borderTopWidth: 2, borderTopColor: "#0B2038" },
  netLabel: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#0B2038" },
  netValue: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#1899E7" },
  notes: { marginTop: 20, padding: 10, backgroundColor: "#fafaf8", borderWidth: 1, borderColor: "#e8e8e0" },
  notesLabel: { fontFamily: "Helvetica-Bold", color: "#111111", marginBottom: 3 },
  mbsNote: { marginTop: 12, padding: 8, borderWidth: 1, borderStyle: "dashed", borderColor: "#cccccc", borderRadius: 4, backgroundColor: "#f8f8f5" },
  mbsNoteTitle: { fontSize: 7, color: "#aaaaaa", fontFamily: "Helvetica-Bold", marginBottom: 2 },
  mbsNoteBody: { fontSize: 7, color: "#bbbbbb" },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, textAlign: "center", fontSize: 8, color: "#bbbbbb", borderTopWidth: 1, borderTopColor: "#e8e8e0", paddingTop: 7 },
});

interface Props {
  invoice: Invoice;
  business: BusinessProfile;
  customerName: string | null;
}

export function InvoicePDF({ invoice, business, customerName }: Props) {
  const isReceipt = invoice.doc_type === "receipt";

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.bizName}>{business.legal_name || "DMECH Value Auto Services"}</Text>
            {business.tin && <Text style={s.bizMeta}>TIN: {business.tin}</Text>}
            {business.rc_number && <Text style={s.bizMeta}>RC: {business.rc_number}</Text>}
            {business.address && <Text style={s.bizMeta}>{business.address}</Text>}
            {business.bank_name && (
              <Text style={s.bizMeta}>
                {business.bank_name} · {business.bank_account_number} · {business.bank_account_name}
              </Text>
            )}
          </View>
          <View style={s.headerRight}>
            <Text style={s.docType}>{isReceipt ? "RECEIPT" : "INVOICE"}</Text>
            <Text style={s.docNumber}>{invoice.invoice_number}</Text>
            <Text style={s.docMeta}>Issue Date: {invoice.issue_date}</Text>
          </View>
        </View>

        <View style={s.billRow}>
          <View style={s.billCol}>
            <Text style={s.sectionLabel}>Bill To</Text>
            <Text style={s.clientName}>{customerName ?? "—"}</Text>
            {invoice.customer_tin && <Text style={s.clientMeta}>TIN: {invoice.customer_tin}</Text>}
          </View>
          <View style={s.billCol}>
            <Text style={s.sectionLabel}>Payment Details</Text>
            {business.bank_name && <Text style={s.clientName}>{business.bank_name}</Text>}
            {business.bank_account_number && <Text style={s.clientMeta}>Acc: {business.bank_account_number}</Text>}
            {business.bank_account_name && <Text style={s.clientMeta}>{business.bank_account_name}</Text>}
          </View>
        </View>

        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderText, s.colDesc]}>Description</Text>
          <Text style={[s.tableHeaderText, s.colHsn]}>HSN</Text>
          <Text style={[s.tableHeaderText, s.colQty]}>Qty</Text>
          <Text style={[s.tableHeaderText, s.colPrice]}>Unit Price</Text>
          <Text style={[s.tableHeaderText, s.colAmount]}>Amount</Text>
        </View>
        {invoice.line_items.map((item, i) => (
          <View key={i} style={s.tableRow}>
            <Text style={s.colDesc}>{item.description}</Text>
            <Text style={s.colHsn}>{item.hsn_code || "—"}</Text>
            <Text style={s.colQty}>{item.quantity}</Text>
            <Text style={s.colPrice}>{fmt(item.unit_price_kobo)}</Text>
            <Text style={s.colAmount}>{fmt(item.amount_kobo)}</Text>
          </View>
        ))}

        <View style={s.totalsWrap}>
          <View style={s.totalsBox}>
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>Subtotal</Text>
              <Text style={s.totalsValue}>{fmt(invoice.subtotal_kobo)}</Text>
            </View>
            <View style={s.totalsRow}>
              <Text style={s.totalsLabel}>
                VAT ({invoice.vat_rate}%){invoice.vat_exempt ? " — Exempt" : ""}
              </Text>
              <Text style={s.totalsValue}>{invoice.vat_exempt ? "NGN 0" : `+ ${fmt(invoice.vat_amount_kobo)}`}</Text>
            </View>
            <View style={s.netRow}>
              <Text style={s.netLabel}>Total</Text>
              <Text style={s.netValue}>{fmt(invoice.total_kobo)}</Text>
            </View>
          </View>
        </View>

        {invoice.notes && (
          <View style={s.notes}>
            <Text style={s.notesLabel}>Notes</Text>
            <Text>{invoice.notes}</Text>
          </View>
        )}

        {!isReceipt && (
          <View style={s.mbsNote}>
            {invoice.fetch_transmission_status === "Sent" && invoice.fetch_irn ? (
              <>
                <Text style={s.mbsNoteTitle}>NRS e-Invoice (MBS) — Transmitted</Text>
                <Text style={s.mbsNoteBody}>
                  IRN: {invoice.fetch_irn}   Type: {invoice.invoice_type_code ?? "—"}
                </Text>
              </>
            ) : (
              <>
                <Text style={s.mbsNoteTitle}>NRS e-Invoice (MBS) — Active July 2027</Text>
                <Text style={s.mbsNoteBody}>
                  IRN: —   CSID: —   QR: —   Auto-generated once NRS MBS transmission is enabled.
                </Text>
              </>
            )}
          </View>
        )}

        <Text style={s.footer} fixed>
          {business.legal_name || "DMECH Value Auto Services"} · Generated {new Date().toISOString().slice(0, 10)}
        </Text>
      </Page>
    </Document>
  );
}
