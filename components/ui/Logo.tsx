import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  /** Height utility for the mark, e.g. "h-6". Width tracks the aspect ratio. */
  className?: string;
}

/**
 * Theme-aware ISA logo.
 *
 * Both marks are rendered and shown/hidden purely with Tailwind `dark:` variants
 * (next-themes applies the theme as a class on <html>), so there is no `useTheme`,
 * no hydration flash, and this works in server components (the Footer) as well as
 * client ones (the Navbar). width/height are the PNGs' intrinsic sizes — they set
 * the aspect ratio and avoid layout shift; `w-auto` keeps the ratio while the
 * caller's className controls the rendered height.
 */
export function Logo({ className }: LogoProps) {
  return (
    <>
      {/* Light mode → dark mark */}
      <Image
        src="/isa-logo-black.png"
        alt="ISA-RAIT"
        width={245}
        height={211}
        priority
        className={cn("w-auto dark:hidden", className)}
      />
      {/* Dark mode → white mark (decorative duplicate of the above) */}
      <Image
        src="/isa-logo-white.png"
        alt=""
        aria-hidden
        width={254}
        height={209}
        priority
        className={cn("hidden w-auto dark:block", className)}
      />
    </>
  );
}
