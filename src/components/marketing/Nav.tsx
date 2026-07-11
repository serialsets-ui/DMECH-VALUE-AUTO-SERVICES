"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/marketing/Logo";

const LINKS = [
  { href: "/#calculator", label: "Cost Calculator" },
  { href: "/#ev", label: "⚡ EVs" },
  { href: "/#vehicles", label: "Vehicles" },
  { href: "/certified", label: "Certified" },
  { href: "/#how", label: "How It Works" },
  { href: "/#why", label: "Why DMECH" },
  { href: "/#faq", label: "FAQ" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
            <Link href="/#contact" className="nav-cta">
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
          <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
            {link.label}
          </Link>
        ))}
        <Link href="/service" onClick={() => setMenuOpen(false)}>
          Book a Service
        </Link>
        <Link href="/#contact" onClick={() => setMenuOpen(false)}>
          Get Started
        </Link>
      </div>
    </>
  );
}
