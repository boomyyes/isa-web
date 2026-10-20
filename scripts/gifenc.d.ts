// gifenc ships no types; just what scripts/make-email-gif.ts uses.
declare module "gifenc" {
  type Palette = number[][];
  export function applyPalette(rgba: Uint8Array | Uint8ClampedArray, palette: Palette, format?: string): Uint8Array;
  export function GIFEncoder(opts?: { auto?: boolean }): {
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      opts?: {
        palette?: Palette;
        delay?: number;
        repeat?: number;
        transparent?: boolean;
        transparentIndex?: number;
        dispose?: number;
      }
    ): void;
    finish(): void;
    bytes(): Uint8Array;
  };
}
