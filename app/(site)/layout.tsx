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
      {/* First stop for keyboard users: past the navbar to the page's <main id="main">. */}
      <a
        href="#main"
        className="sr-only rounded-md bg-[var(--card-color)] text-sm font-semibold text-[var(--text-primary)] shadow-lg focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:px-4 focus:py-2 focus:outline-none focus:ring-2 focus:ring-[var(--border-active)]"
      >
        Skip to content
      </a>
      <Navbar />
      <div className="relative z-10">{children}</div>
      <Footer />
      <CookieNotice />
    </>
  );
}
