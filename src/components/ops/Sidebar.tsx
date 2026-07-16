"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Car,
  Users,
  Package,
  Wrench,
  HardHat,
  Wallet,
  Ship,
  FileCheck,
  UserCog,
  ShieldCheck,
  PiggyBank,
  Receipt,
  CircleDollarSign,
  Building2,
  Settings,
  History,
  BarChart3,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";
import type { DmechUser, StaffRole } from "@/types";

type NavItem = { href: string; label: string; icon: LucideIcon; roles: StaffRole[] };

const ALL_ROLES: StaffRole[] = [
  "super_admin",
  "managing_partner",
  "sales_manager",
  "ops_manager",
  "workshop_lead",
  "sales_rep",
  "accountant",
];

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Overview",
    items: [{ href: "/ops/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ALL_ROLES }],
  },
  {
    section: "Customers",
    items: [{ href: "/ops/customers", label: "Customers", icon: Users, roles: ALL_ROLES }],
  },
  {
    section: "Inventory",
    items: [
      { href: "/ops/vehicles", label: "Vehicles", icon: Car, roles: ALL_ROLES },
      { href: "/ops/parts", label: "Parts", icon: Package, roles: ALL_ROLES },
    ],
  },
  {
    section: "Operations",
    items: [
      { href: "/ops/workshop", label: "Workshop", icon: Wrench, roles: ALL_ROLES },
      { href: "/ops/specialists", label: "Specialists", icon: HardHat, roles: ALL_ROLES },
    ],
  },
  {
    section: "Finance",
    items: [
      { href: "/ops/instalments", label: "Instalments", icon: Wallet, roles: ALL_ROLES },
      { href: "/ops/payments", label: "Payments", icon: CircleDollarSign, roles: ALL_ROLES },
      { href: "/ops/invoices", label: "Invoices", icon: Receipt, roles: ALL_ROLES },
    ],
  },
  {
    section: "Logistics",
    items: [
      { href: "/ops/shipments", label: "Shipments", icon: Ship, roles: ALL_ROLES },
      { href: "/ops/customs", label: "Customs", icon: FileCheck, roles: ALL_ROLES },
    ],
  },
  {
    section: "Certified Program",
    items: [
      {
        href: "/ops/warranty-claims",
        label: "Warranty Claims",
        icon: ShieldCheck,
        roles: ["super_admin", "managing_partner", "accountant"],
      },
      {
        href: "/ops/reports/reserve-fund",
        label: "Reserve Fund",
        icon: PiggyBank,
        roles: ["super_admin", "managing_partner", "accountant"],
      },
    ],
  },
  {
    section: "Reports",
    items: [
      {
        href: "/ops/reports",
        label: "Business Reports",
        icon: BarChart3,
        roles: ["super_admin", "managing_partner", "accountant"],
      },
    ],
  },
  {
    section: "Settings",
    items: [
      { href: "/ops/settings/staff", label: "Staff", icon: UserCog, roles: ["super_admin"] },
      {
        href: "/ops/settings/business",
        label: "Business",
        icon: Building2,
        roles: ["super_admin", "managing_partner"],
      },
      {
        href: "/ops/settings/platform",
        label: "Platform",
        icon: Settings,
        roles: ["super_admin", "managing_partner"],
      },
      {
        href: "/ops/settings/audit-log",
        label: "Audit Log",
        icon: History,
        roles: ["super_admin", "managing_partner"],
      },
    ],
  },
];

const ROLE_LABEL: Record<StaffRole, string> = {
  super_admin: "Super Admin",
  managing_partner: "Managing Partner",
  sales_manager: "Sales Manager",
  ops_manager: "Ops Manager",
  workshop_lead: "Workshop Lead",
  sales_rep: "Sales Rep",
  accountant: "Accountant",
};

export function Sidebar({ staff }: { staff: DmechUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const role = staff.role as StaffRole;

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = staff.full_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="ops-sidebar">
      {/* Plain <a>, not <Link> — a real navigation so the splash (OpsShell,
          gated by client useState that only resets on a fresh mount)
          actually replays instead of silently no-op'ing on a client-side
          route that doesn't remount the layout. */}
      <a href="/ops/dashboard" className="ops-sidebar-logo">
        <Logo variant="sidebar" />
      </a>

      <nav className="ops-nav">
        {NAV.map((group) => {
          const visible = group.items.filter((item) => item.roles.includes(role));
          if (visible.length === 0) return null;
          return (
            <div key={group.section} className="ops-nav-section">
              <div className="ops-nav-section-label">{group.section}</div>
              {visible.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`ops-nav-item${isActive ? " active" : ""}`}
                  >
                    <item.icon size={16} strokeWidth={2} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="ops-sidebar-footer">
        <div className="ops-user-block">
          <div className="ops-user-avatar">{initials}</div>
          <div className="ops-user-info">
            <div className="ops-user-name">{staff.full_name}</div>
            <div className="ops-user-role">{ROLE_LABEL[role]}</div>
          </div>
          <button type="button" className="ops-logout-btn" onClick={logout} title="Sign out">
            <LogOut size={15} strokeWidth={2} />
          </button>
        </div>
      </div>
    </aside>
  );
}
