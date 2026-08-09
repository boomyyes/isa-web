import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GlobalBackground } from "@/components/layout/GlobalBackground";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RAIT",
  description: "INTERNATIONAL SOCIETY OF AUTOMATION, RAIT.",
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
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {/* z-0 backdrop. The z-10 below is required — a fixed z-0 element
              paints over non-positioned in-flow content. Navbar is already z-50. */}
          <GlobalBackground />
          <Navbar />
          <div className="relative z-10">{children}</div>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
