import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CookieNotice } from "@/components/layout/CookieNotice";
import { GlobalBackground } from "@/components/layout/GlobalBackground";
import { SmoothScroll } from "@/components/providers/SmoothScroll";

/** Chrome for the public site. The admin area (app/admin) has its own. */
export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SmoothScroll />
      {/* z-0 backdrop. The z-10 below is required — a fixed z-0 element
          paints over non-positioned in-flow content. Navbar is already z-50. */}
      <GlobalBackground />
      <Navbar />
      <div className="relative z-10">{children}</div>
      <Footer />
      <CookieNotice />
    </>
  );
}
