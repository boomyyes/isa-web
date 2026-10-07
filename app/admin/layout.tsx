import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/**
 * No site navbar or footer here; see app/(site)/layout.tsx.
 *
 * Always dark. The .dark class on this wrapper switches every token and dark:
 * variant inside it, whatever the visitor's theme. It's a class rather than an
 * entry in lib/themeLock.ts because on admin.isarait.in the browser path has no
 * /admin prefix for a pathname lock to match. color-scheme keeps native
 * controls (date pickers, scrollbars) dark too.
 */
export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="dark min-h-screen bg-[var(--bg-color)] text-[var(--text-primary)] [color-scheme:dark]">
      {children}
    </div>
  );
}
