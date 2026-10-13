"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * The site-wide animated background: a slowly flowing, domain-warped noise
 * field in the site's colours that leans toward the pointer.
 *
 * Raw WebGL, one full-screen triangle and one fragment shader, no library.
 * What keeps it cheap:
 * - drawn at a fraction of the screen's resolution and stretched (it is a soft
 *   blur by design, so nothing is lost), which keeps the GPU work tiny;
 * - the loop stops whenever the tab is hidden, and never runs on pages that
 *   paint their own sky (Artemis);
 * - it starts after the page has loaded, and fades in, so it never competes
 *   with the first paint;
 * - with reduced motion it draws one still frame and stops.
 * If WebGL is unavailable the canvas never appears and the CSS wash behind it
 * (GlobalBackground) is what people see.
 */

/** Fraction of the CSS size the canvas is rendered at. */
const RENDER_SCALE = 0.35;

type Palette = { bg: number[]; a: number[]; b: number[]; c: number[]; strength: number };

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

/** The site's own tokens (globals.css): background, cyan, orange, and the nebula violet. */
const PALETTES: Record<"dark" | "light", Palette> = {
  dark: { bg: hex("#0D0D0D"), a: hex("#00E5FF"), b: hex("#FF5A00"), c: hex("#4B1982"), strength: 0.55 },
  // Light mode uses pastel tints of the same three hues at full strength, rather
  // than the saturated tokens faded down: faded cyan and orange go muddy grey on
  // a pale ground, tints stay clean and bright.
  light: { bg: hex("#F4F7FA"), a: hex("#7FD9EC"), b: hex("#FFB48A"), c: hex("#B9A8F2"), strength: 0.62 },
};

/** Pages with their own full-bleed background. */
const SKIP = ["/artemis"];

const VERTEX = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAGMENT = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform vec3 uBg;
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uC;
uniform float uStrength;

// 2D simplex noise (Ashima Arts / Stefan Gustavson, MIT).
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  // Three soft octaves: broad ribbons, not marbling.
  for (int i = 0; i < 3; i++) {
    v += a * snoise(p);
    p = p * 1.7 + vec2(1.7, 9.2);
    a *= 0.4;
  }
  return v * 0.5 + 0.5;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * aspect, uv.y) * 0.55;
  float t = uTime * 0.03;

  // The pointer pulls the field toward itself, strongest close by.
  vec2 toMouse = (uMouse - uv) * vec2(aspect, 1.0);
  float pull = exp(-dot(toMouse, toMouse) * 4.0);
  p += toMouse * pull * 0.9;

  // Domain warping: noise sampled through noise, which is what makes ribbons.
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 1.8 * q + vec2(1.7, 9.2) + t * 1.3), fbm(p + 1.8 * q + vec2(8.3, 2.8) - t * 1.1));
  float f = fbm(p + 1.6 * r);

  vec3 col = uBg;
  col = mix(col, uC, smoothstep(0.35, 0.80, q.x) * uStrength * 0.9);
  col = mix(col, uA, smoothstep(0.45, 0.80, f) * uStrength);
  col = mix(col, uB, smoothstep(0.52, 0.82, r.y) * uStrength * 0.85);
  // A soft glow where the pointer is.
  col = mix(col, uA, pull * uStrength * 0.18);

  // Vignette keeps the edges calm and text-friendly.
  vec2 c = uv - 0.5;
  col = mix(col, uBg, smoothstep(0.35, 0.95, length(c * vec2(aspect * 0.8, 1.0))) * 0.6);

  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? "shader");
  return shader;
}

export function FlowGradient() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pathname = usePathname();
  const skip = SKIP.some((path) => pathname.startsWith(path));

  useEffect(() => {
    const el = canvas.current;
    if (!el || skip) return;
    const gl = el.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl || gl.isContextLost()) return;

    let program: WebGLProgram;
    try {
      program = gl.createProgram()!;
      gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
      gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    } catch {
      return;
    }
    gl.useProgram(program);

    // One triangle that covers the screen.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(program, name);
    const uRes = u("uRes"), uTime = u("uTime"), uMouse = u("uMouse");
    const uBg = u("uBg"), uA = u("uA"), uB = u("uB"), uC = u("uC"), uStrength = u("uStrength");

    const applyTheme = () => {
      const palette = PALETTES[document.documentElement.classList.contains("dark") ? "dark" : "light"];
      gl.uniform3fv(uBg, palette.bg);
      gl.uniform3fv(uA, palette.a);
      gl.uniform3fv(uB, palette.b);
      gl.uniform3fv(uC, palette.c);
      gl.uniform1f(uStrength, palette.strength);
    };
    applyTheme();

    const resize = () => {
      el.width = Math.max(1, Math.round(window.innerWidth * RENDER_SCALE));
      el.height = Math.max(1, Math.round(window.innerHeight * RENDER_SCALE));
      gl.viewport(0, 0, el.width, el.height);
      gl.uniform2f(uRes, el.width, el.height);
    };
    resize();

    // Pointer, in 0..1 with y up (GL's convention). Eased toward, so it trails
    // like something with weight. With no pointer (phones) it drifts on its own.
    const target = { x: 0.5, y: 0.5 };
    const mouse = { x: 0.5, y: 0.5 };
    let lastPointer = -Infinity;
    const onPointer = (e: PointerEvent) => {
      target.x = e.clientX / window.innerWidth;
      target.y = 1 - e.clientY / window.innerHeight;
      lastPointer = performance.now();
    };

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let frame = 0;

    const draw = (now: number) => {
      const seconds = (now - start) / 1000;
      if (now - lastPointer > 4000) {
        target.x = 0.5 + Math.cos(seconds * 0.13) * 0.28;
        target.y = 0.5 + Math.sin(seconds * 0.17) * 0.22;
      }
      mouse.x += (target.x - mouse.x) * 0.045;
      mouse.y += (target.y - mouse.y) * 0.045;
      gl.uniform1f(uTime, still ? 12 : seconds + 12);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = (now: number) => {
      if (disposed) return;
      draw(now);
      frame = requestAnimationFrame(loop);
    };
    const play = () => {
      cancelAnimationFrame(frame);
      if (still) draw(performance.now());
      else if (document.visibilityState === "visible") frame = requestAnimationFrame(loop);
    };

    const themeWatch = new MutationObserver(() => {
      applyTheme();
      if (still) draw(performance.now());
    });
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const onResize = () => {
      resize();
      if (still) draw(performance.now());
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", play);

    // After load, so it never competes with the first paint.
    let started = false;
    let disposed = false;
    let beginFrame = 0;
    const begin = () => {
      if (started || disposed) return;
      started = true;
      play();
      el.style.opacity = "1";
    };
    if (document.readyState === "complete") beginFrame = requestAnimationFrame(begin);
    else window.addEventListener("load", begin, { once: true });

    return () => {
      disposed = true;
      cancelAnimationFrame(beginFrame);
      cancelAnimationFrame(frame);
      themeWatch.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("load", begin);
      document.removeEventListener("visibilitychange", play);
      // The context is left alive on purpose. React's dev mode runs this effect,
      // cleans it up and runs it again on the same canvas, and getContext hands
      // back the same context: losing it here left the canvas blank and opaque
      // over the whole background. Deleting the program and buffer is enough.
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
    };
  }, [skip]);

  if (skip) return null;
  return (
    <canvas
      ref={canvas}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-0 transition-opacity duration-1000"
    />
  );
}
