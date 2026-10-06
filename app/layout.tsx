import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SITE_NAME, SITE_ORIGIN } from "@/lib/seo";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const HOME_DESCRIPTION =
  "The International Society of Automation student chapter at Ramrao Adik Institute of Technology, Navi Mumbai: workshops, projects, and the ISAAC magazine.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  // `default` is the home page's title; every other page sets a bare title and
  // the template adds the suffix.
  title: { default: SITE_NAME, template: "%s | ISA RAIT" },
  description: HOME_DESCRIPTION,
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    locale: "en_IN",
    title: SITE_NAME,
    description: HOME_DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
  // The circular ISA mark, in both inks. Declared here rather than via the
  // app/icon.png file convention because only the metadata form supports
  // `media` — the mark is a knockout, so the black one vanishes on a dark tab
  // strip and the white one on a light one.
  //
  // NOTE: these follow the OS/browser colour scheme, not the site's own theme
  // toggle. A favicon cannot see the `.dark` class on <html>, so someone
  // browsing the site in light mode on a dark OS still gets the white mark.
  //
  // The .ico deliberately lives in public/, not app/. The app/favicon.ico file
  // convention auto-emits an unconditional <link rel="icon">, and Chrome picks
  // that over both media-scoped PNGs — verified: it was the only icon fetched in
  // either scheme. From public/ it still answers bare /favicon.ico requests from
  // crawlers without competing in the tag list.
  icons: {
    icon: [
      {
        url: "/icon-light.png",
        type: "image/png",
        sizes: "64x64",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark.png",
        type: "image/png",
        sizes: "64x64",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: { url: "/apple-icon.png", type: "image/png", sizes: "180x180" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased min-h-screen relative dark:bg-grid-dark bg-grid-light`}
      >
        {/* With scripting off the Read more button can never fire, so drop the
            clamp wholesale rather than strand the rest of a paragraph behind a
            dead control. See components/ui/ClampedText.tsx. */}
        <noscript>
          <style>{`[data-clamp-body]{max-height:none!important;-webkit-mask-image:none!important;mask-image:none!important}[data-clamp-toggle]{display:none!important}`}</style>
        </noscript>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {/* Site chrome lives in app/(site)/layout.tsx, so the admin area
              doesn't inherit the public navbar and footer. */}
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
