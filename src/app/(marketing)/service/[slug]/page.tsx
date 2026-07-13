import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServicePage, SERVICE_PAGES, WHAT_TO_EXPECT } from "@/lib/service-pages";
import { Reveal } from "@/components/marketing/Reveal";

export function generateStaticParams() {
  return SERVICE_PAGES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getServicePage(slug);
  if (!page) return {};
  return { title: page.seoTitle, description: page.seoDescription };
}

export default async function ServiceCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getServicePage(slug);
  if (!page) notFound();

  return (
    <div className="page-fade">
      <section className="section" style={{ background: "#fff", paddingBottom: 0 }}>
        <div className="section-inner">
          <Link href="/service" className="teaser-link" style={{ fontSize: 13 }}>
            ← All Services
          </Link>
        </div>
      </section>

      <section className="section" style={{ background: "#fff" }}>
        <div className="section-inner center">
          <div style={{ fontSize: 40, marginBottom: 8 }}>{page.icon}</div>
          <div className="section-eyebrow">Workshop · Lagos</div>
          <div className="section-title">{page.name}</div>
          <div className="section-subtitle" style={{ maxWidth: 620, margin: "0 auto" }}>
            {page.intro}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <div className="section-title" style={{ fontSize: 22, textAlign: "center" }}>
            What&apos;s Covered
          </div>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              maxWidth: 560,
              margin: "24px auto 0",
            }}
          >
            {page.covers.map((item) => (
              <li
                key={item}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  padding: "12px 0",
                  borderBottom: "1px solid var(--border)",
                  fontSize: 14,
                  color: "var(--text)",
                }}
              >
                <span style={{ color: "var(--green)", flexShrink: 0 }}>✓</span>
                {item}
              </li>
            ))}
          </ul>
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <Link href="/service" className="cta-main">
              Book This Service →
            </Link>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: "#fff" }}>
        <div className="section-inner">
          <div className="section-eyebrow" style={{ textAlign: "center" }}>
            What To Expect
          </div>
          <div className="section-title" style={{ textAlign: "center", fontSize: 26 }}>
            After You Book
          </div>
          <div className="trust-grid contact-grid" style={{ marginTop: 24 }}>
            {WHAT_TO_EXPECT.map((item, i) => (
              <Reveal key={item.title} delayMs={i * 80}>
                <div className="trust-card">
                  <div className="trust-icon">{item.icon}</div>
                  <div className="trust-title">{item.title}</div>
                  <div className="trust-desc">{item.desc}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
