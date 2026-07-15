import Link from "next/link";
import { Mail } from "lucide-react";
import { GithubIcon, InstagramIcon, LinkedinIcon } from "@/components/ui/BrandIcons";
import { Logo } from "@/components/ui/Logo";

const QUICK_LINKS = [
  { href: "/", label: "Home" },
  { href: "/initiatives", label: "Initiatives" },
  { href: "/community", label: "Community" },
  { href: "/membership", label: "Membership" },
  { href: "/help", label: "Support" },
];

// Swap the hrefs for real profiles later — all use real brand marks.
const SOCIALS = [
  { label: "LinkedIn", icon: LinkedinIcon, href: "#" },
  { label: "Instagram", icon: InstagramIcon, href: "#" },
  { label: "GitHub", icon: GithubIcon, href: "#" },
];

export function Footer() {
  return (
    <footer className="border-t border-[var(--border-color)]/60 bg-[var(--bg-color)]/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <Link
              href="/"
              className="flex items-center gap-2 font-jetbrains font-bold tracking-tight text-[var(--text-primary)]"
            >
              <Logo className="h-7" />
              <span>[ISA Logo]</span>
            </Link>
            <p className="text-sm text-[var(--text-secondary)]">
              [ Short chapter tagline placeholder ]
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-jetbrains text-xs uppercase tracking-widest text-[var(--text-secondary)]">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-jetbrains text-xs uppercase tracking-widest text-[var(--text-secondary)]">
              Contact
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                <span>[email@placeholder.com]</span>
              </li>
              <li>[ Address / Room No. Placeholder ]</li>
            </ul>
          </div>

          {/* Socials */}
          <div>
            <h3 className="font-jetbrains text-xs uppercase tracking-widest text-[var(--text-secondary)]">
              Socials
            </h3>
            <div className="mt-4 flex items-center gap-3">
              {SOCIALS.map(({ label, icon: Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={`[${label} Placeholder]`}
                  className="p-2 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]/60 hover:border-[var(--accent-color)] transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--border-color)]/60 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-jetbrains text-xs text-[var(--text-secondary)]">
            © 2026 ISA RAIT Student Chapter. All rights reserved.
          </p>
          <p className="font-jetbrains text-xs opacity-50 text-[var(--text-secondary)]">
            [ SYS_HALT ]
          </p>
        </div>
      </div>
    </footer>
  );
}
