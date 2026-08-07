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
