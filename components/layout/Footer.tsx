import Link from "next/link";
import { Mail } from "lucide-react";
import { FaceBookIcon, InstagramIcon, LinkedinIcon } from "@/components/ui/BrandIcons";
import { Logo } from "@/components/ui/Logo";

const QUICK_LINKS = [
  { href: "/", label: "Home" },
  { href: "/initiatives", label: "Initiatives" },
  { href: "/community", label: "Community" },
  { href: "/artemis", label: "Artemis" },
  { href: "/membership", label: "Membership" },
  { href: "/certificates", label: "Certificates" },
  { href: "/help", label: "Support" },
];

const SOCIALS = [
  { label: "LinkedIn", icon: LinkedinIcon, href: "https://www.linkedin.com/in/isa-rait-student-chapter-3a99451b6/" },
  { label: "Instagram", icon: InstagramIcon, href: "https://www.instagram.com/isa_rait/" },
  { label: "Facebook", icon: FaceBookIcon, href: "https://www.facebook.com/isarait2k18/" },
];

export function Footer() {
  return (
    // relative z-10 keeps GlobalBackground from painting over the footer.
    <footer className="relative z-10 border-t border-[var(--border-color)]/60 bg-[var(--bg-color)]/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="inline-block" aria-label="ISA RAIT — home">
              {/* The lockup already reads "International Society of Automation,
                  Ramrao Adik Institute of Technology", so no text label beside it. */}
              <Logo className="h-16 lg:h-20" sizes="204px" />
            </Link>
            <p className="text-sm text-[var(--text-secondary)]">
              Setting the standard of Automation. For the students, by the students.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-jetbrains text-xs uppercase tracking-widest text-[var(--text-secondary)]">
              Quick Links
            </h3>
            {/* -my-1.5 keeps the visual rhythm while the padding lifts each
                row to a 44px touch target. */}
            <ul className="mt-4 space-y-2">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="-my-1.5 flex min-h-11 items-center py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
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
                <span>isa.rait@rait.ac.in</span>
              </li>
              <li>Ramrao Adik Institute of Technology, DY Patil University Sector 7. Nerul, Navi Mumbai 400706.</li>
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
                  className="inline-flex h-11 w-11 items-center justify-center rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]/60 hover:border-[var(--accent-color)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-active)]"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Three columns so the copyright sits in the true centre of the footer:
            with justify-between it was only centred when SYS_HALT happened to
            match the empty space opposite it. The leading spacer balances that
            column. Stacks to a single centred column below sm. */}
        <div className="mt-10 grid grid-cols-1 gap-2 border-t border-[var(--border-color)]/60 pt-6 text-center sm:grid-cols-3 sm:items-center">
          <span aria-hidden className="hidden sm:block" />
          <p className="font-jetbrains text-xs text-[var(--text-secondary)]">
            © 2026 ISA RAIT Student Chapter. All rights reserved.
          </p>
          <p className="font-jetbrains text-xs opacity-50 text-[var(--text-secondary)] sm:text-right">
            [ SYS_HALT ]
          </p>
        </div>
      </div>
    </footer>
  );
}
