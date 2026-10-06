import { Cinzel, Cormorant_Garamond } from "next/font/google";

/**
 * Route layout for /artemis.
 *
 * Two jobs, both of which have to happen above the page rather than inside it:
 *
 * 1. The Greek faces. next/font scopes a face to the component that calls it,
 *    so declaring them here instead of in the root layout keeps them off every
 *    other route — no one loading /community pays for Cinzel.
 *
 * 2. The theme scope. `.artemis` redefines the site's semantic colour vars
 *    (--accent-color, --text-primary, --card-color …) for this subtree, which
 *    is what locks the page to its own palette: the vars are inherited from
 *    this wrapper rather than from the .dark class next-themes puts on <html>,
 *    so the navbar toggle has no visible effect here. See app/globals.css.
 *
 * Nested layouts must not render <html> or <body> — the root layout owns those.
 */

const cinzel = Cinzel({
  variable: "--font-cinzel-src",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant-src",
  subsets: ["latin"],
  // Cormorant Garamond is not a variable font on Google Fonts, so the weights
  // and styles used on the page have to be listed explicitly.
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export default function ArtemisLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={cinzel.variable + " " + cormorant.variable + " artemis"}>
      {children}
    </div>
  );
}
