// Hand-written types matching supabase/migrations/001_schema.sql.
// Not generated — cast Supabase query results to these at the call site
// (see oro-energy-management-hub convention). Keep in sync with the schema
// by hand; there is no `supabase gen types` step in this project.

export type StaffRole =
  | "super_admin"
  | "managing_partner"
  | "sales_manager"
  | "ops_manager"
  | "workshop_lead"
  | "sales_rep"
  | "accountant";

export type UserRole = StaffRole | "customer";

export interface DmechUser {
  id: string;
  auth_user_id: string | null;
  email: string;
  phone: string | null;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  avatar_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  phone: string;
  source: "calculator" | "workshop_booking" | string;
  payload: Record<string, unknown>;
  converted_customer_id: string | null;
  created_at: string;
}

export type CustomerType =
  | "instalment_buyer"
  | "cash_buyer"
  | "workshop_walkin"
  | "corporate"
  | "parts_retail"
  | "parts_wholesale";

export type ApprovalStatus = "pending" | "stage2_docs" | "approved" | "declined";

export interface Customer {
  id: string;
  user_id: string | null;
  type: CustomerType;
  full_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  bvn: string | null;
  employer: string | null;
  monthly_income_kobo: number | null;
  guarantor: Record<string, unknown> | null;
  company_details: Record<string, unknown> | null;
  approval_status: ApprovalStatus;
  approval_tier: 1 | 2 | 3 | 4 | null;
  approved_by: string[];
  credit_limit_kobo: number | null;
  ltv_tier: "new" | "medium" | "high" | "vip";
  documents: Array<{ type: string; url: string; uploaded_at: string; verified: boolean }>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type LifecycleStage =
  | "intake"
  | "inspection"
  | "sourced"
  | "purchased"
  | "shipped"
  | "in_transit"
  | "at_port"
  | "customs"
  | "cleared"
  | "available"
  | "reserved"
  | "sold"
  | "delivered";

// Order matters — this is what drives the Vehicles lifecycle bar. Keep it in
// sync with the schema's CHECK constraint; the old ops mockup's UI array
// dropped "reserved", which is the bug this list exists to prevent repeating.
// "intake"/"inspection" were added for the Nigerian-Used/Certified program —
// non-import channels enter there and skip the shipping-specific stages;
// render a channel-appropriate subset (see LIFECYCLE_STAGES_BY_CHANNEL)
// rather than forcing every vehicle through all 13 stages.
export const LIFECYCLE_STAGES: LifecycleStage[] = [
  "intake",
  "inspection",
  "sourced",
  "purchased",
  "shipped",
  "in_transit",
  "at_port",
  "customs",
  "cleared",
  "available",
  "reserved",
  "sold",
  "delivered",
];

export type AcquisitionChannel = "import" | "local_outright" | "consignment" | "trade_in";

// Which lifecycle stages are relevant per acquisition channel, for the
// Vehicles page lifecycle bar. Import keeps the full shipping pipeline;
// local-sourced channels skip straight from inspection to available.
export const LIFECYCLE_STAGES_BY_CHANNEL: Record<AcquisitionChannel, LifecycleStage[]> = {
  import: [
    "sourced",
    "purchased",
    "shipped",
    "in_transit",
    "at_port",
    "customs",
    "cleared",
    "available",
    "reserved",
    "sold",
    "delivered",
  ],
  local_outright: ["intake", "inspection", "available", "reserved", "sold", "delivered"],
  consignment: ["intake", "inspection", "available", "reserved", "sold", "delivered"],
  trade_in: ["intake", "inspection", "available", "reserved", "sold", "delivered"],
};

export type CertificationStatus = "uncertified" | "pending_inspection" | "certified";

export interface TitleVerificationCheck {
  check: string;
  status: "pass" | "fail" | "pending";
  verified_by: string | null;
  verified_at: string | null;
  notes: string | null;
}

export type FuelType = "petrol" | "diesel" | "hybrid" | "electric";
export type SourceRegion = "usa" | "europe" | "china" | "nigeria";
export type VehicleCondition = "used" | "new";

export type PhotoTag =
  | "hero"
  | "front"
  | "rear"
  | "left_side"
  | "right_side"
  | "interior_front"
  | "dashboard"
  | "steering"
  | "seats"
  | "engine_bay"
  | "boot"
  | "wheels"
  | "chassis"
  | "vin_plate"
  | "damage";

export const PHOTO_TAGS: { value: PhotoTag; label: string }[] = [
  { value: "hero", label: "Hero / Featured" },
  { value: "front", label: "Front View" },
  { value: "rear", label: "Rear View" },
  { value: "left_side", label: "Left Side" },
  { value: "right_side", label: "Right Side" },
  { value: "interior_front", label: "Interior Front" },
  { value: "dashboard", label: "Dashboard" },
  { value: "steering", label: "Steering" },
  { value: "seats", label: "Seats" },
  { value: "engine_bay", label: "Engine Bay" },
  { value: "boot", label: "Boot" },
  { value: "wheels", label: "Wheels" },
  { value: "chassis", label: "Chassis" },
  { value: "vin_plate", label: "VIN Plate" },
  { value: "damage", label: "Damage (internal only)" },
];

export interface VehiclePhoto {
  id: string;
  url: string;
  tag: PhotoTag | null;
  is_internal: boolean;
  sort_order: number;
}

// A vehicle can't be Published or Certified until its photo set is complete
// — at least this many photos, covering every tag below. Chosen to be
// exactly the 10-photo minimum: covering all of these tags on distinct
// photos satisfies the count on its own. "hero"/"boot"/"chassis"/"steering"/
// "damage" stay optional extras, not required.
export const MIN_PUBLISH_PHOTOS = 10;
export const REQUIRED_PHOTO_TAGS: PhotoTag[] = [
  "front",
  "rear",
  "left_side",
  "right_side",
  "engine_bay",
  "dashboard",
  "interior_front",
  "seats",
  "wheels",
  "vin_plate",
];

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string | null;
  colour: string | null;
  engine_cc: number | null;
  fuel_type: FuelType | null;
  battery_range_km: number | null;
  source_region: SourceRegion | null;
  source_detail: string | null;
  condition: VehicleCondition | null;
  purchase_price_usd_cents: number | null;
  shipping_cost_usd_cents: number | null;
  customs_duty_kobo: number | null;
  sale_price_kobo: number | null;
  cost_basis_kobo: number | null;
  margin_pct: number | null;
  lifecycle_stage: LifecycleStage;
  reserved_until: string | null;
  buyer_id: string | null;
  shipment_id: string | null;
  condition_report: Array<{ area: string; score: string; notes: string; photo_urls: string[] }>;
  photos: VehiclePhoto[];
  video_url: string | null;
  inspection_score: number | null;

  // Nigerian-Used/Certified program
  acquisition_channel: AcquisitionChannel;
  certification_status: CertificationStatus;
  consignor_customer_id: string | null;
  consignment_commission_pct: number | null;
  consignment_payout_kobo: number | null;
  trade_in_credit_kobo: number | null;
  trade_in_applied_to_instalment_id: string | null;
  title_verification: TitleVerificationCheck[];

  // Publish gate + catalog metadata (see migration 006)
  is_published: boolean;
  lot_number: string | null;
  // Inert until a public /vehicles/[id] page exists — see migration 006's comment.
  seo_title: string | null;
  seo_description: string | null;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type WarrantyCoverageTier = "basic" | "extended";
export type WarrantyPolicyStatus = "active" | "expired" | "void" | "claimed_out";

export interface WarrantyPolicy {
  id: string;
  vehicle_id: string;
  coverage_tier: WarrantyCoverageTier;
  duration_days: number;
  mileage_limit_km: number | null;
  covered_components: string[];
  excluded_items: string[];
  price_kobo: number;
  reserve_contribution_pct: number;
  reserve_contribution_kobo: number;
  status: WarrantyPolicyStatus;
  starts_at: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export type WarrantyClaimStatus = "submitted" | "assessed" | "approved" | "denied" | "paid";

export interface WarrantyClaim {
  id: string;
  warranty_policy_id: string;
  customer_id: string;
  reported_at: string;
  issue_description: string;
  assessed_cost_kobo: number | null;
  approved_kobo: number | null;
  status: WarrantyClaimStatus;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WarrantyReserveLedgerEntry {
  id: string;
  entry_type: "accrual" | "claim_payout" | "adjustment";
  amount_kobo: number;
  related_policy_id: string | null;
  related_claim_id: string | null;
  note: string | null;
  created_at: string;
}

export interface Shipment {
  id: string;
  reference: string;
  cargo_type: string;
  origin: string;
  destination: string;
  departed_at: string | null;
  eta: string | null;
  progress_pct: number;
  vessel_name: string | null;
  tracking_url: string | null;
  container_number: string | null;
  bill_of_lading: string | null;
  created_at: string;
  updated_at: string;
}

export type InstalmentPlanType = "dmech_direct" | "partner_finance";
export type InstalmentStatus = "active" | "completed" | "defaulted" | "cancelled";

export interface Instalment {
  id: string;
  customer_id: string;
  vehicle_id: string;
  plan_type: InstalmentPlanType | null;
  total_price_kobo: number;
  deposit_pct: number | null;
  deposit_amount_kobo: number | null;
  deposit_paid: boolean;
  deposit_paid_at: string | null;
  tenor_months: number;
  monthly_amount_kobo: number | null;
  admin_fee_pct: number | null;
  status: InstalmentStatus;
  guarantor_notified: boolean;
  created_at: string;
  updated_at: string;
}

export type PaymentStatus = "pending" | "paid" | "overdue" | "partial";
export type PaymentMethod = "bank_transfer" | "paystack" | "pos" | "cash";

export interface Payment {
  id: string;
  instalment_id: string;
  customer_id: string;
  amount_kobo: number;
  payment_number: number | null;
  due_date: string;
  paid_date: string | null;
  status: PaymentStatus;
  days_overdue: number;
  paystack_ref: string | null;
  payment_method: PaymentMethod | null;
  receipt_url: string | null;
  reminder_sent: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface CustomsEntry {
  id: string;
  vehicle_id: string;
  agent: string | null;
  status: string;
  documents_checklist: Array<{ label: string; done: boolean }>;
  duty_estimated_kobo: number | null;
  duty_paid_kobo: number | null;
  cleared_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Part {
  id: string;
  name: string;
  compatibility: string | null;
  qty: number;
  cost_price_kobo: number;
  sale_price_kobo: number;
  source: string | null;
  condition: "tested" | "good" | "excellent" | null;
  vin_trace: string | null;
  reorder_threshold: number;
  units_sold: number;
  created_at: string;
  updated_at: string;
}

export interface Specialist {
  id: string;
  user_id: string | null;
  name: string;
  specialty: string | null;
  rating: number | null;
  jobs_completed: number;
  revenue_generated_kobo: number;
  share_pct: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export type JobCardStage = "reception" | "diagnostics" | "planning" | "execution" | "qa" | "released";

export interface JobCard {
  id: string;
  reference: string;
  customer_id: string | null;
  vehicle_desc: string;
  specialist_id: string | null;
  stage: JobCardStage;
  priority: "low" | "medium" | "high";
  complaint: string | null;
  service_type: string | null;
  quote_kobo: number | null;
  parts_used: Array<{ part_id: string; qty: number }>;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DmechNotification {
  id: string;
  recipient_id: string | null;
  recipient_phone: string | null;
  channel: "whatsapp" | "sms" | "email";
  template: string;
  payload: Record<string, unknown>;
  status: "queued" | "sent" | "delivered" | "failed";
  sent_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
}

export interface PlatformConfigRow<T = unknown> {
  key: string;
  value: T;
  updated_by: string | null;
  updated_at: string;
}
