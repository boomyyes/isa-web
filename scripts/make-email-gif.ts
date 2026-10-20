/**
 * Draws the animated ASCII header every email carries: public/email/isa-header.gif.
 *
 *   npx tsx scripts/make-email-gif.ts
 *
 * Three acts on a character grid, then a loop: a terminal line types itself out,
 * scattered characters settle into the ISA logo, and an ASCII gear turns beside
 * it. Frame 0 is the finished picture, because Outlook on Windows only ever shows
 * the first frame. Re-run after changing the art; the GIF is committed.
 *
 * Kept small (the emails load it on every open): 4 colours, and every frame after
 * the first stores only the pixels that changed, the rest transparent.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { applyPalette, GIFEncoder } from "gifenc";

const W = 1200; // drawn at 2x, shown at 600x180
const H = 360;
const CELL_W = 12;
const CELL_H = 20;
const COLS = W / CELL_W; // 100
const ROWS = H / CELL_H; // 18

const BLACK: [number, number, number] = [13, 13, 13];
const CYAN: [number, number, number] = [0, 229, 255];
const ORANGE: [number, number, number] = [255, 90, 0];
const WHITE: [number, number, number] = [235, 235, 235];
// Index 4 never appears in a drawn frame: it marks "unchanged since the last frame".
const PALETTE = [BLACK, CYAN, ORANGE, WHITE, [255, 0, 255] as [number, number, number]];
const KEEP = 4;

const RAMP = " .:-=+*#%@";
const TERMINAL = "> ISA-RAIT // initialising";
const CAPTION = "INTERNATIONAL SOCIETY OF AUTOMATION // RAIT";

type Cell = { ch: string; color: [number, number, number] };
type Grid = (Cell | null)[][];

const blank = (): Grid => Array.from({ length: ROWS }, () => Array<Cell | null>(COLS).fill(null));
const put = (g: Grid, row: number, col: number, cell: Cell) => {
  if (row >= 0 && row < ROWS && col >= 0 && col < COLS) g[row][col] = cell;
};
const text = (g: Grid, row: number, col: number, s: string, color: Cell["color"]) =>
  [...s].forEach((ch, i) => put(g, row, col + i, { ch, color }));

/** Density 0..1 to a character. */
const shade = (d: number, color: Cell["color"]): Cell | null => {
  if (d < 0.08) return null;
  return { ch: RAMP[Math.min(RAMP.length - 1, Math.round(d * (RAMP.length - 1)))], color };
};

// Logo and gear each fill rows 0..16 (17 rows x 31 cols, about square in 12x20 cells);
// the caption takes the last row.
const ART_TOP = 0;
const ART_ROWS = 17;
const ART_COLS = 31;
const LOGO_LEFT = 8;
const GEAR_LEFT = 61;

// "ISA" in a 5-row block face, set over the logo's centre: at this size the
// logo's own lettering is too small to read.
const BLOCK: Record<string, string[]> = {
  I: ["###", " # ", " # ", " # ", "###"],
  S: ["####", "#   ", "####", "   #", "####"],
  A: [" ## ", "#  #", "####", "#  #", "#  #"],
};

async function logoCells(): Promise<[number, number, Cell][]> {
  const img = await loadImage(resolve(process.cwd(), "public/isa-logo-white.png"));
  const c = createCanvas(ART_COLS, ART_ROWS);
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0, ART_COLS, ART_ROWS);
  const { data } = ctx.getImageData(0, 0, ART_COLS, ART_ROWS);
  const out: [number, number, Cell][] = [];
  // The word's box, kept clear of ring characters.
  const word = ["I", "S", "A"];
  const wordCols = word.reduce((n, l) => n + BLOCK[l][0].length + 1, -1);
  const wordLeft = Math.floor((ART_COLS - wordCols) / 2);
  const wordTop = Math.floor((ART_ROWS - 5) / 2);
  for (let r = 0; r < ART_ROWS; r++) {
    for (let col = 0; col < ART_COLS; col++) {
      if (r >= wordTop - 1 && r <= wordTop + 5 && col >= wordLeft - 1 && col <= wordLeft + wordCols) continue;
      const p = (r * ART_COLS + col) * 4;
      const d = ((data[p] + data[p + 1] + data[p + 2]) / 765) * (data[p + 3] / 255);
      const cell = shade(d, CYAN);
      if (cell) out.push([ART_TOP + r, LOGO_LEFT + col, cell]);
    }
  }
  let x = wordLeft;
  for (const letter of word) {
    BLOCK[letter].forEach((line, r) =>
      [...line].forEach((ch, i) => {
        if (ch !== " ") out.push([ART_TOP + wordTop + r, LOGO_LEFT + x + i, { ch: "#", color: WHITE }]);
      })
    );
    x += BLOCK[letter][0].length + 1;
  }
  return out;
}

const TEETH = 8;
/** The gear at rotation `turn` (radians), as density per cell. */
function gearCells(turn: number): [number, number, Cell][] {
  const out: [number, number, Cell][] = [];
  for (let r = 0; r < ART_ROWS; r++) {
    for (let col = 0; col < ART_COLS; col++) {
      // Centre and correct for the 12x20 cell aspect, so the gear is round.
      const x = ((col + 0.5) / ART_COLS - 0.5) * 2 * ((ART_COLS * CELL_W) / (ART_ROWS * CELL_H));
      const y = ((r + 0.5) / ART_ROWS - 0.5) * 2;
      const rad = Math.hypot(x, y);
      const ang = Math.atan2(y, x) + turn;
      const onTooth = Math.cos(ang * TEETH) > 0.35;
      const outer = onTooth ? 0.95 : 0.7;
      if (rad > outer || rad < 0.18) continue;
      // Hub, a lighter web, a solid rim, and the teeth in orange.
      if (rad > 0.7) {
        out.push([ART_TOP + r, GEAR_LEFT + col, { ch: "@", color: ORANGE }]);
        continue;
      }
      const d = rad < 0.32 ? 0.85 : rad < 0.55 ? 0.3 : 0.75;
      const cell = shade(d, WHITE);
      if (cell) out.push([ART_TOP + r, GEAR_LEFT + col, cell]);
    }
  }
  return out;
}

function finalGrid(logo: [number, number, Cell][], turn: number): Grid {
  const g = blank();
  for (const [r, c, cell] of logo) put(g, r, c, cell);
  for (const [r, c, cell] of gearCells(turn)) put(g, r, c, cell);
  text(g, ROWS - 1, Math.floor((COLS - CAPTION.length) / 2), CAPTION, WHITE);
  return g;
}

// A seeded generator, so re-running produces the same GIF.
let seed = 7;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);

function frames(logo: [number, number, Cell][]): { grid: Grid; delay: number }[] {
  const list: { grid: Grid; delay: number }[] = [];
  const step = (2 * Math.PI) / TEETH / 6; // six frames per tooth, so the turn loops seamlessly

  // Frame 0: the finished picture (Outlook's only frame), held.
  list.push({ grid: finalGrid(logo, 0), delay: 1600 });

  // Act 1: the terminal line types out, cursor blinking.
  for (let n = 0; n <= TERMINAL.length; n += 2) {
    const g = blank();
    text(g, 8, 4, TERMINAL.slice(0, n) + (n % 4 === 0 ? "_" : " "), CYAN);
    list.push({ grid: g, delay: 70 });
  }
  for (let blink = 0; blink < 4; blink++) {
    const g = blank();
    text(g, 8, 4, TERMINAL + (blink % 2 ? " " : "_"), CYAN);
    list.push({ grid: g, delay: 160 });
  }

  // Act 2: characters scatter in and settle into the logo.
  const starts = logo.map(() => [rand() * ROWS, rand() * COLS] as const);
  const STEPS = 14;
  for (let s = 1; s <= STEPS; s++) {
    const t = s / STEPS;
    const ease = 1 - (1 - t) ** 3;
    const g = blank();
    logo.forEach(([r, c, cell], i) => {
      const [sr, sc] = starts[i];
      const ch = t > 0.75 ? cell.ch : RAMP[1 + Math.floor(rand() * (RAMP.length - 1))];
      put(g, Math.round(sr + (r - sr) * ease), Math.round(sc + (c - sc) * ease), { ch, color: t > 0.75 ? cell.color : CYAN });
    });
    list.push({ grid: g, delay: 70 });
  }

  // Act 3: the gear turns two teeth. A tooth repeats every 6 steps, so the last
  // frame matches frame 0 and the loop has no jump.
  for (let f = 1; f <= 12; f++) list.push({ grid: finalGrid(logo, f * step), delay: 90 });
  return list;
}

function draw(grid: Grid) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = `rgb(${BLACK.join(",")})`;
  ctx.fillRect(0, 0, W, H);
  // Consolas ships with Windows, where this script is run; Courier New elsewhere.
  ctx.font = `bold 18px Consolas, "Courier New", monospace`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = grid[r][c];
      if (!cell || cell.ch === " ") continue;
      ctx.fillStyle = `rgb(${cell.color.join(",")})`;
      ctx.fillText(cell.ch, c * CELL_W + CELL_W / 2, r * CELL_H + CELL_H / 2);
    }
  }
  return canvas;
}

/** Snaps anti-aliased edges to the four real colours (never the KEEP slot). */
const indexed = (canvas: ReturnType<typeof draw>) =>
  applyPalette(canvas.getContext("2d").getImageData(0, 0, W, H).data, PALETTE.slice(0, KEEP));

async function main() {
  const logo = await logoCells();
  const list = frames(logo);
  const gif = GIFEncoder();
  // --frames also writes each frame as a PNG to .email-preview/frames/, to check the art.
  const framesDir = process.argv.includes("--frames") ? resolve(process.cwd(), ".email-preview/frames") : null;
  if (framesDir) mkdirSync(framesDir, { recursive: true });
  let previous: Uint8Array | null = null;
  for (const [i, { grid, delay }] of list.entries()) {
    const canvas = draw(grid);
    if (framesDir) writeFileSync(resolve(framesDir, `${String(i).padStart(2, "0")}.png`), canvas.toBuffer("image/png"));
    const index = indexed(canvas);
    if (previous) {
      // Only what changed is stored; the rest shows the frame underneath.
      const diff = new Uint8Array(index.length);
      for (let p = 0; p < index.length; p++) diff[p] = index[p] === previous[p] ? KEEP : index[p];
      gif.writeFrame(diff, W, H, { delay, transparent: true, transparentIndex: KEEP, dispose: 1 });
    } else {
      gif.writeFrame(index, W, H, { palette: PALETTE, delay, repeat: 0 });
    }
    previous = index;
  }
  gif.finish();
  const dir = resolve(process.cwd(), "public/email");
  mkdirSync(dir, { recursive: true });
  const bytes = gif.bytes();
  writeFileSync(resolve(dir, "isa-header.gif"), bytes);
  const total = list.reduce((s, f) => s + f.delay, 0);
  console.log(`public/email/isa-header.gif: ${list.length} frames, ${(total / 1000).toFixed(1)}s loop, ${Math.round(bytes.length / 1024)} KB`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
