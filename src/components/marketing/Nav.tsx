"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";

// "Certified" is deliberately not a flat top-level link — DMECH Certified
// Nigerian-Used vehicles are still vehicles (lives at /vehicles/certified),
// not a separate destination competing with "Vehicles" in the nav. It's
// surfaced instead via a banner on the Vehicles page itself.
const LINKS = [
  { href: "/vehicles", label: "Vehicles" },
  { href: "/financing", label: "Financing" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/service", label: "Book a Service" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav className={scrolled ? "scrolled" : ""}>
        <div className="nav-inner">
          <Link href="/">
            <Logo variant="nav" />
          </Link>
          <div className="nav-links">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={isActive(pathname, link.href) ? "active" : ""}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/contact" className="nav-cta">
              Get Started
            </Link>
          </div>
          <button
            className="nav-toggle"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={pathname === link.href ? "active" : ""}
            onClick={() => setMenuOpen(false)}
          >
            {link.label}
          </Link>
        ))}
        <Link href="/contact" onClick={() => setMenuOpen(false)}>
          Get Started
        </Link>
      </div>
    </>
  );
}
