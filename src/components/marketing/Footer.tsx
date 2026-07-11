import Link from "next/link";
import { Logo } from "@/components/marketing/Logo";

export function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <div>
          <Logo variant="footer" />
          <div className="footer-about">
            DMECH Value Services — Nigeria&apos;s trusted vehicle import, sales,
            financing, and automotive service hub. Import. Drive. Thrive.
          </div>
        </div>
        <div className="footer-col">
          <h4>Services</h4>
          <Link href="/#vehicles">Vehicle Import</Link>
          <Link href="/certified">Certified Nigerian-Used</Link>
          <Link href="/#instalment">Instalment Plans</Link>
          <Link href="/#calculator">Cost Calculator</Link>
          <Link href="/service">Vehicle Service</Link>
        </div>
        <div className="footer-col">
          <h4>Company</h4>
          <Link href="/#why">Why DMECH</Link>
          <Link href="/#how">How It Works</Link>
          <Link href="/#testimonials">Reviews</Link>
          <Link href="/#faq">FAQ</Link>
          <Link href="/#contact">Contact Us</Link>
        </div>
        <div className="footer-col">
          <h4>Get In Touch</h4>
          <div className="footer-contact-item">
            <span className="fc-icon">📍</span>
            <span>
              Sangotedo, Ajah Axis,
              <br />
              Lagos, Nigeria
            </span>
          </div>
          <div className="footer-contact-item">
            <span className="fc-icon">📞</span>
            <span>0800-DMECH-00</span>
          </div>
          <div className="footer-contact-item">
            <span className="fc-icon">💬</span>
            <span>WhatsApp: 0800 000 0000</span>
          </div>
          <div className="footer-contact-item">
            <span className="fc-icon">🕒</span>
            <span>Mon–Sat: 8am – 6pm</span>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div>&copy; {new Date().getFullYear()} DMECH Value Services. All rights reserved.</div>
        <div>
          Technology by <a href="https://serialsets.com">SERIALSETS LIMITED</a>
        </div>
      </div>
    </footer>
  );
}
