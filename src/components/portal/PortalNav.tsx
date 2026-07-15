"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Wallet, FileText, LogOut } from "lucide-react";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";
import type { Customer } from "@/types";

const NAV = [
  { href: "/portal/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/payments", label: "Payments", icon: Wallet },
  { href: "/portal/documents", label: "Documents", icon: FileText },
];

// Deliberately much shorter than the Ops Sidebar — a customer only ever
// sees their own status, payments, and documents, not a role-filtered
// module list.
export function PortalNav({ customer }: { customer: Customer }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/verify");
    router.refresh();
  }

  const initials = customer.full_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="ops-sidebar">
      <a href="/portal/dashboard" className="ops-sidebar-logo">
        <Logo variant="sidebar" />
      </a>

      <nav className="ops-nav">
        <div className="ops-nav-section">
          {NAV.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} className={`ops-nav-item${isActive ? " active" : ""}`}>
                <item.icon size={16} strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="ops-sidebar-footer">
        <div className="ops-user-block">
          <div className="ops-user-avatar">{initials}</div>
          <div className="ops-user-info">
            <div className="ops-user-name">{customer.full_name}</div>
            <div className="ops-user-role">Customer Portal</div>
          </div>
          <button type="button" className="ops-logout-btn" onClick={logout} title="Sign out">
            <LogOut size={15} strokeWidth={2} />
          </button>
        </div>
      </div>
    </aside>
  );
}
