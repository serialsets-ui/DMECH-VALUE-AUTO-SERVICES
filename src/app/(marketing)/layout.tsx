import "@/styles/marketing.css";
import { Nav } from "@/components/marketing/Nav";
import { Ticker } from "@/components/marketing/Ticker";
import { Footer } from "@/components/marketing/Footer";
import { MarketingSplash } from "@/components/marketing/MarketingSplash";

// Runs synchronously before the browser paints anything else — checks
// sessionStorage and, if the splash already played this session, adds a
// class that hides it via CSS before it's ever visible. This has to be a
// blocking inline script rather than a React effect: by the time an effect
// runs (post-hydration), a content-heavy page like Home has already
// painted, so the splash would show up after the real content instead of
// before it.
const SKIP_SPLASH_SCRIPT = `(function(){try{var k='dmech-marketing-splash-shown';if(sessionStorage.getItem(k)==='1'){document.documentElement.classList.add('msplash-skip')}else{sessionStorage.setItem(k,'1')}}catch(e){}})();`;

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: SKIP_SPLASH_SCRIPT }} />
      <MarketingSplash />
      <Nav />
      <Ticker />
      {children}
      <Footer />
    </>
  );
}
