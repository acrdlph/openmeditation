/* ============================================================================
   Shared scroll-scrubbed scene engine.

   Reproduces a Figma prototype flow (smart-animate / matched layers) as a
   scroll-driven timeline: every layer carries its exact x/y/w/h/opacity in each
   state, and the engine interpolates between consecutive states as the user
   scrolls. Supports:
     - any number of states (segments = states - 1)
     - per-mode (desktop/mobile) frame size, easing, and per-segment durations
       (so a Figma step of 1.5s occupies proportionally more scroll than a 1.0s
       step), exactly matching the prototype's timing weights
     - viewport-aspect mode switching (desktop vs mobile layout)

   Used by both the Dolomites and Whales pages.
   ============================================================================ */

export const s = (x, y, w, h, o = 1) => ({ x, y, w, h, o });

// CSS-equivalent cubic-bezier easing solver.
export function cubicBezier(p1x, p1y, p2x, p2y) {
  const cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx;
  const cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;
  const fx = (t) => ((ax * t + bx) * t + cx) * t;
  const fy = (t) => ((ay * t + by) * t + cy) * t;
  const dfx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return function (x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const xe = fx(t) - x;
      if (Math.abs(xe) < 1e-5) break;
      const d = dfx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= xe / d;
    }
    return fy(t);
  };
}

export const EASE_IN = cubicBezier(0.42, 0, 1, 1);
export const EASE_OUT = cubicBezier(0, 0, 0.58, 1);

const lerp = (a, b, t) => a + (b - a) * t;

/* config = {
     driverId,
     pickMode: () => "d" | "m",
     modes: {
       d: { stageId, frameW, frameH, kf, easing, durations:[...], fontRatio:{id:ratio} },
       m: { ... }
     }
   }
   kf: { layerId: [stateGeom, ...] }  (one entry per state)
*/
export function initScene(config) {
  const { driverId, pickMode, modes } = config;
  const driver = document.getElementById(driverId);

  // resolve element refs + per-mode geometry once
  for (const m of Object.values(modes)) {
    m.stage = document.getElementById(m.stageId);
    m.els = {};
    for (const id of Object.keys(m.kf)) m.els[id] = document.getElementById(id);
    m.steps = Object.values(m.kf)[0].length - 1;          // states - 1
    if (!m.durations) m.durations = Array(m.steps).fill(1); // default equal weights
    m.total = m.durations.reduce((a, b) => a + b, 0);
    // cumulative thresholds in "time" units
    m.cum = [0];
    for (const d of m.durations) m.cum.push(m.cum[m.cum.length - 1] + d);
  }

  let mode = pickMode();

  function setActive() {
    for (const key of Object.keys(modes)) modes[key].stage.hidden = key !== mode;
  }

  function apply(scrollY, vh) {
    const m = modes[mode];
    const time = Math.max(0, Math.min(m.total, scrollY / vh)); // duration units
    // find segment
    let seg = 0;
    while (seg < m.steps - 1 && time >= m.cum[seg + 1]) seg++;
    const local = (time - m.cum[seg]) / m.durations[seg];
    const t = m.easing(Math.max(0, Math.min(1, local)));
    const fr = m.fontRatio || {};
    for (const id in m.kf) {
      const el = m.els[id];
      if (!el) continue;
      const a = m.kf[id][seg];
      const b = m.kf[id][seg + 1];
      const w = lerp(a.w, b.w, t);
      const h = lerp(a.h, b.h, t);
      const x = lerp(a.x, b.x, t);
      const y = lerp(a.y, b.y, t);
      el.style.left = x + "px";
      el.style.top = y + "px";
      el.style.opacity = lerp(a.o, b.o, t);
      if (el.dataset.scaleref) {
        // Text group: laid out at a fixed reference width, scaled by w/refW so
        // the whole block (headline + button) scales as one unit.
        el.style.transform = "scale(" + (w / Number(el.dataset.scaleref)) + ")";
      } else {
        el.style.width = w + "px";
        el.style.height = h + "px";
        if (el.dataset.text !== undefined && fr[id]) el.style.fontSize = h * fr[id] + "px";
      }
    }
  }

  function fit() {
    const next = pickMode();
    if (next !== mode) { mode = next; setActive(); }
    const m = modes[mode];
    // "contain" (default) letterboxes; "cover" fills the viewport (overflow clipped).
    const fn = m.fit === "cover" ? Math.max : Math.min;
    const scale = fn(window.innerWidth / m.frameW, window.innerHeight / m.frameH);
    m.stage.style.setProperty("--scale", String(scale));
    driver.style.height = (modes[mode].total + 1) * window.innerHeight + "px";
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { apply(window.scrollY, window.innerHeight); ticking = false; });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => { fit(); onScroll(); }, { passive: true });
  window.addEventListener("orientationchange", () => { fit(); onScroll(); }, { passive: true });

  function boot() { mode = pickMode(); setActive(); fit(); apply(window.scrollY, window.innerHeight); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot);
  boot();
}

export const pickByAspect = (threshold = 0.85) => () =>
  window.innerWidth / window.innerHeight < threshold ? "m" : "d";
