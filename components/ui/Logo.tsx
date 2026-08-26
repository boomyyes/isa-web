import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The PNGs in /public, keyed by variant and by the theme they are drawn FOR
 * (the black artwork is the light-mode mark, and vice versa).
 *
 * width/height are each file's intrinsic pixel size. They set the aspect ratio
 * and reserve space so the mark does not shift as it loads; the rendered height
 * comes from the caller's className, and `w-auto` derives the width from this
 * ratio. IMPORTANT: if you replace a PNG, update its numbers here — a stale
 * value silently stretches or squashes the mark rather than erroring.
 */
const SOURCES = {
  /** Circular ISA badge on its own. For tight spaces. */
  mark: {
    light: { src: "/isa-logo-black.png", width: 205, height: 211 },
    dark: { src: "/isa-logo-white.png", width: 215, height: 209 },
  },
  /** Badge stacked over the full "International Society of Automation" wordmark. */
  lockup: {
    light: { src: "/isa-lockup-black.png", width: 1057, height: 414 },
    dark: { src: "/isa-lockup-white.png", width: 1057, height: 414 },
  },
} as const;

interface LogoProps {
  /** Which artwork to render. The lockup already contains the wordmark, so
   *  callers should not sit a text label next to it. */
  variant?: keyof typeof SOURCES;
  /** Height utility for the mark, e.g. "h-7". Width tracks the aspect ratio. */
  className?: string;
  /** Load immediately instead of lazily — for above-the-fold use (the navbar). */
  eager?: boolean;
  /** Rendered CSS width, e.g. "112px", matching the height set in className.
   *  Required in practice: the height utilities size these images with CSS, and
   *  without `sizes` the browser assumes 100vw and pulls a 1080px-wide file for a
   *  ~112px logo. Roughly height x 2.55 for the lockup, height x 1 for the mark. */
  sizes?: string;
}

/**
 * Theme-aware ISA logo.
 *
 * Both marks are rendered and shown/hidden purely with Tailwind `dark:` variants
 * (next-themes applies the theme as a class on <html>), so there is no `useTheme`,
 * no hydration flash, and this works in server components (the Footer) as well as
 * client ones (the Navbar).
 */
export function Logo({ variant = "lockup", className, eager = false, sizes }: LogoProps) {
  const { light, dark } = SOURCES[variant];
  // `loading` rather than `preload`: next/image deprecated `priority` in v16, and
  // preloading is the wrong tool here because both marks are in the DOM while only
  // one is ever visible — it would always fetch an image the viewer never sees.
  const loading = eager ? "eager" : "lazy";

  return (
    <>
      {/* Light mode → dark artwork */}
      <Image
        src={light.src}
        alt="ISA RAIT Student Section"
        width={light.width}
        height={light.height}
        sizes={sizes}
        loading={loading}
        className={cn("w-auto dark:hidden", className)}
      />
      {/* Dark mode → white artwork (decorative duplicate of the above) */}
      <Image
        src={dark.src}
        alt=""
        aria-hidden
        width={dark.width}
        height={dark.height}
        sizes={sizes}
        loading={loading}
        className={cn("hidden w-auto dark:block", className)}
      />
    </>
  );
}
