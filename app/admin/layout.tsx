import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/** No site navbar or footer here; see app/(site)/layout.tsx. */
export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <main className="min-h-screen bg-[var(--bg-color)]">{children}</main>;
}
