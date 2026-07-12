import "@/styles/marketing.css";
import { Nav } from "@/components/marketing/Nav";
import { Ticker } from "@/components/marketing/Ticker";
import { Footer } from "@/components/marketing/Footer";
import { MarketingShell } from "@/components/marketing/MarketingShell";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <MarketingShell>
      <Nav />
      <Ticker />
      {children}
      <Footer />
    </MarketingShell>
  );
}
