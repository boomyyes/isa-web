/**
 * Flickering dot grid under a nebula wash, at z-0. After Magic UI's Flickering
 * Grid (MIT), rebuilt in CSS (see .fx-flicker-grid in globals.css).
 *
 * This replaced a full-screen canvas starfield redrawn every frame on every
 * page. Under 4x CPU throttling that loop, composited through SvgPipelines'
 * blend mode, cost over a second of main-thread time on the home page. Here
 * three offset dot layers animate opacity only, which the compositor runs off
 * the main thread. No JavaScript, so this is a server component.
 *
 * The z-10 wrappers in app/(site)/layout.tsx are load-bearing: a fixed z-0
 * element paints above non-positioned in-flow content, so without them this
 * would cover the footer and every page body.
 */
export function GlobalBackground() {
  return (
    <>
      <div aria-hidden="true" className="fx-flicker-grid pointer-events-none fixed inset-0 z-0">
        <span />
        <span />
        <span />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-45 dark:opacity-55"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(75, 25, 130, 0.5) 0%, transparent 40%), radial-gradient(circle at 85% 70%, rgba(10, 60, 120, 0.4) 0%, transparent 45%), radial-gradient(circle at 50% 50%, rgba(0, 229, 255, 0.05) 0%, transparent 60%)",
        }}
      />
    </>
  );
}
