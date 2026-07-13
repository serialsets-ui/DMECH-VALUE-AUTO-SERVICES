import Link from "next/link";
import { Zap, Car, CheckCircle2 } from "lucide-react";
import { formatNaira } from "@/lib/money";
import { isCertified, displayStatus, publicPhotos, type PublicVehicle } from "@/lib/vehicle-display";
import { Reveal } from "@/components/marketing/Reveal";

// Condensed Home-page version of the full /vehicles marketplace — top few
// vehicles, no filters/modal, just a taste plus a link to the real page.
export function VehicleTeaser({ vehicles }: { vehicles: PublicVehicle[] }) {
  const top = vehicles.slice(0, 4);

  return (
    <section className="section" style={{ background: "#fff" }}>
      <div className="section-inner">
        <Reveal>
          <div className="section-eyebrow">Vehicle Marketplace</div>
          <div className="section-title">Available Now &amp; In Transit</div>
          <div className="section-subtitle">
            Verified vehicles with full history reports — imports and DMECH Certified
            Nigerian-used, side by side.
          </div>
        </Reveal>

        {top.length === 0 ? (
          <Reveal>
            <div className="vehicle-empty">
              <div style={{ display: "flex", justifyContent: "center", color: "var(--subtle)", marginBottom: 12 }}>
                <Car size={32} strokeWidth={1.5} />
              </div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>New inventory added regularly</div>
              <div style={{ fontSize: 14 }}>
                We&apos;re onboarding our first verified vehicles now. WhatsApp us for current
                stock and to be notified the moment new vehicles go live.
              </div>
            </div>
          </Reveal>
        ) : (
          <div className="vehicle-grid">
            {top.map((v, i) => {
              const status = displayStatus(v);
              const certified = isCertified(v);
              const heroPhoto = publicPhotos(v)[0]?.url;
              return (
                <Reveal key={v.id} delayMs={i * 80}>
                  <Link href="/vehicles" className="v-card" style={{ display: "block" }}>
                    <div
                      className="v-card-img"
                      style={
                        heroPhoto
                          ? { backgroundImage: `url(${heroPhoto})`, backgroundSize: "cover", backgroundPosition: "center" }
                          : undefined
                      }
                    >
                      {!heroPhoto &&
                        (v.fuel_type === "electric" ? (
                          <Zap size={56} strokeWidth={1.25} />
                        ) : (
                          <Car size={56} strokeWidth={1.25} />
                        ))}
                      <div
                        className={`v-card-status ${
                          status === "In Transit"
                            ? "status-transit"
                            : status === "At Port"
                              ? "status-port"
                              : "status-available"
                        }`}
                      >
                        {status}
                      </div>
                      {certified && (
                        <div className="v-card-cert" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <CheckCircle2 size={13} strokeWidth={2} /> Certified
                        </div>
                      )}
                    </div>
                    <div className="v-card-body">
                      <div className="v-card-name">
                        {v.make} {v.model} {v.year}
                      </div>
                      <div className="v-card-meta">
                        {v.colour} ·{" "}
                        {v.source_region === "nigeria" ? "Nigerian-used" : v.source_region}
                      </div>
                      <div className="v-card-price-row">
                        <div className="v-card-price">
                          {v.sale_price_kobo ? formatNaira(v.sale_price_kobo) : "Price on request"}
                        </div>
                      </div>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 28 }}>
          <Link href="/vehicles" className="teaser-link" style={{ fontSize: 15 }}>
            Browse All Vehicles →
          </Link>
        </div>
      </div>
    </section>
  );
}
