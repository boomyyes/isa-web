/**
 * Turn the Artemis logo animation into something that can sit on the night sky.
 *
 *   npx tsx scripts/artemis-logo.ts "public/artemis/<source>.gif"
 *
 * Writes public/artemis/logo.webp (animated, alpha) and logo-still.png (frame
 * one, shown under prefers-reduced-motion). Both are committed; this script
 * exists so a revised logo can be put through the same treatment rather than
 * reverse-engineered.
 *
 * The problem it solves: GIF carries one bit of transparency, so a soft-edged
 * monogram has to ship on an opaque field, and the field here is black. Over
 * --artemis-void that is a visible box — the exact fault the old JPEG lockup
 * had. But a black field is also premultiplication: every pixel is already
 * colour x coverage, so alpha is recoverable exactly as max(r,g,b), and
 * dividing it back out restores straight colour with the soft edges intact.
 * Composited over any near-black ground the result is indistinguishable from
 * the source, minus the box.
 *
 * Two economies, both measured against this artwork rather than assumed:
 *
 * - The source is dithered, leaving a haze of luminance 1-3 across the whole
 *   1200x1200 field. Kept, it widened the crop by 40% and gave the encoder
 *   noise to spend bits on. FLOOR discards it; the art itself runs to 253.
 * - The animation moves ~0.3% of its pixels between adjacent frames, so half
 *   the frames at twice the dwell is not a visible change and halves the file.
 *
 * sharp is not a declared dependency — it arrives with Next, which is why this
 * is a script you run rather than part of the build.
 */

import sharp from "sharp";

const OUT_ANIM = "public/artemis/logo.webp";
const OUT_STILL = "public/artemis/logo-still.png";

/** Below this is dither haze, not artwork. */
const FLOOR = 14;
/** Keep every Nth frame, summing the delays of those dropped. */
const STRIDE = 2;
const QUALITY = 72;
const ALPHA_QUALITY = 80;

async function main() {
  const src = process.argv[2];
  if (!src) {
    console.error("✗ usage: npx tsx scripts/artemis-logo.ts <source.gif>");
    process.exit(1);
  }

  const meta = await sharp(src, { animated: true }).metadata();
  const W = meta.width;
  const PH = meta.pageHeight ?? meta.height;
  const pages = meta.pages ?? 1;
  const delays = meta.delay ?? [];

  const strip = await sharp(src, { animated: true })
    .ensureAlpha()
    .raw()
    .toBuffer();

  // One bounding box across every frame, so the loop does not jitter in place.
  let minX = W,
    minY = PH,
    maxX = -1,
    maxY = -1;
  for (let p = 0; p < pages; p++) {
    for (let y = 0; y < PH; y++) {
      for (let x = 0; x < W; x++) {
        const i = ((p * PH + y) * W + x) * 4;
        if (Math.max(strip[i], strip[i + 1], strip[i + 2]) > FLOOR) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
  }

  const CW = maxX - minX + 1;
  const CH = maxY - minY + 1;

  const keep: number[] = [];
  for (let p = 0; p < pages; p += STRIDE) keep.push(p);
  const delay = keep.map((p) => {
    let d = 0;
    for (let k = p; k < Math.min(p + STRIDE, pages); k++) d += delays[k] ?? 0;
    return d;
  });

  const out = Buffer.alloc(CW * CH * keep.length * 4);
  keep.forEach((p, f) => {
    for (let y = 0; y < CH; y++) {
      for (let x = 0; x < CW; x++) {
        const s = ((p * PH + minY + y) * W + (minX + x)) * 4;
        const d = ((f * CH + y) * CW + x) * 4;
        const r = strip[s],
          g = strip[s + 1],
          b = strip[s + 2];
        const a = Math.max(r, g, b);
        if (a <= FLOOR) continue; // leaves 0,0,0,0
        out[d] = Math.min(255, Math.round((r * 255) / a));
        out[d + 1] = Math.min(255, Math.round((g * 255) / a));
        out[d + 2] = Math.min(255, Math.round((b * 255) / a));
        out[d + 3] = a;
      }
    }
  });

  await sharp(out, {
    raw: { width: CW, height: CH * keep.length, channels: 4, pageHeight: CH },
  })
    .webp({
      quality: QUALITY,
      alphaQuality: ALPHA_QUALITY,
      effort: 6,
      loop: meta.loop ?? 0,
      delay,
    })
    .toFile(OUT_ANIM);

  await sharp(out.subarray(0, CW * CH * 4), {
    raw: { width: CW, height: CH, channels: 4 },
  })
    .png({ compressionLevel: 9, palette: true })
    .toFile(OUT_STILL);

  const loopMs = delay.reduce((a, b) => a + b, 0);
  console.log(
    `✓ ${W}x${PH} x${pages} -> ${CW}x${CH} x${keep.length}, ${loopMs}ms loop`
  );
  console.log(`  ${OUT_ANIM}`);
  console.log(`  ${OUT_STILL}`);
  console.log("  Update the width/height in ArtemisHero if the crop changed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
