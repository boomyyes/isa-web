import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * True when an image field holds a real asset rather than a "[placeholder]"
 * label. Event thumbnails and member headshots both use that convention, so the
 * caller can render the empty box for anything that is not a usable src.
 */
export function isRealImage(src: string | undefined): src is string {
  return !!src && (src.startsWith("/") || src.startsWith("http"));
}
