"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Car, LogOut, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";
import type { DmechUser, StaffRole } from "@/types";

type NavItem = { href: string; label: string; icon: LucideIcon; roles: StaffRole[] };

const ALL_ROLES: StaffRole[] = [
  "managing_partner",
  "sales_manager",
  "ops_manager",
  "workshop_lead",
  "sales_rep",
  "accountant",
];

// Only Dashboard + Vehicles exist so far — add the rest (Instalments, Parts,
// Workshop, Shipments, Customs) here as each module ships, one line each.
const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Overview",
    items: [{ href: "/ops/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ALL_ROLES }],
  },
  {
    section: "Inventory",
    items: [{ href: "/ops/vehicles", label: "Vehicles", icon: Car, roles: ALL_ROLES }],
  },
];

const ROLE_LABEL: Record<StaffRole, string> = {
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
      <div className="ops-sidebar-logo">
        <Logo variant="sidebar" />
      </div>

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
