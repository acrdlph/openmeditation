import "@fontsource/inika/400.css";
import "@fontsource/inika/700.css";
import "./styles.css";

/* ============================================================================
   Discover Dolomites — scroll-scrubbed reproduction of the Figma prototypes
   "Flow Dolomites Desktop" and "Flow Dolomites Mobile".

   Prototype spec pulled from Figma (node reactions), identical timing on both:
     trigger    ON_DRAG               → mapped to scroll progress
     transition MOVE_IN/TOP (desktop) · SLIDE_IN/TOP (mobile)
     matchLayers true (smart animate) → every same-named layer tweens between
                                        its geometry in each state
     easing     EASE_OUT  (cubic-bezier(0, 0, 0.58, 1))
     duration   1s per step           → one viewport of scroll per step

   Two fixed design frames (desktop 1571×1049, mobile 393×852); each layer
   carries its exact x/y/w/h per state. The narrower viewport aspect selects the
   mobile frame. Mountain ridges are positioned relative to the cave mask.
   ============================================================================ */

const STEPS = 3;
const easeOut = cubicBezier(0, 0, 0.58, 1);
const s = (x, y, w, h, o = 1) => ({ x, y, w, h, o });

/* ---- DESKTOP keyframes (frame 1571×1049) --------------------------------- */
const KF_D = {
  discover: [s(0, 446, 818, 119), s(-3980, 118.5, 4908, 714), s(-3980, -1091.5, 4908, 714), s(-3980, -1091.5, 4908, 714)],
  dolomites: [s(774, 446, 818, 119), s(664, 118.5, 4908, 714), s(664, -1091.5, 4908, 714), s(664, -1091.5, 4908, 714)],
  atnight: [s(377, 1515, 818, 119), s(377, 1515, 818, 119), s(377, 1515, 818, 119), s(377, 705, 818, 119)],
  mask: [s(672, 437, 218, 149), s(111, 89.5, 1308, 894), s(111, -1120.5, 1308, 894), s(111, -1120.5, 1308, 894)],
  "m-sky": [s(-1, 4, 236, 157), s(-6, 24, 1416, 942), s(-6, 24, 1416, 942), s(-6, 24, 1416, 942)],
  "m-5": [s(-7, 105, 236, 157), s(-42, -379, 1416, 942), s(-42, -379, 1416, 942), s(-42, -379, 1416, 942)],
  "m-4": [s(-7, 75, 236, 157), s(-42, -260, 1416, 942), s(-42, -260, 1416, 942), s(-42, -260, 1416, 942)],
  "m-3": [s(-6, 37, 236, 157), s(-36, -136, 1416, 942), s(-36, -136, 1416, 942), s(-36, -136, 1416, 942)],
  "m-2": [s(-6, -3, 236, 158), s(-36, -18, 1416, 948), s(-36, -18, 1416, 948), s(-36, -18, 1416, 948)],
  "m-1": [s(-7, 2, 236, 157), s(-42, 12, 1416, 942), s(-42, 12, 1416, 942), s(-42, 12, 1416, 942)],
  s1: [s(-14, 1047, 1600, 2400), s(-14, 1047, 1600, 2400), s(-14, -403, 1600, 2400), s(-14, -403, 1600, 2400)],
  s2: [s(-14, 1017, 1600, 2400), s(-14, 1017, 1600, 2400), s(-14, -443, 1600, 2400), s(-14, -833, 1600, 2400)],
  s3: [s(-14, 1381, 1600, 2400), s(-14, 1381, 1600, 2400), s(-14, -669, 1600, 2400), s(-14, -839, 1600, 2400)],
  s4: [s(-14, -369, 1600, 2400), s(-14, -369, 1600, 2400), s(-14, -1099, 1600, 2400), s(-14, -859, 1600, 2400)],
};

/* ---- MOBILE keyframes (frame 393×852) ------------------------------------ */
const KF_M = {
  m_discover: [s(-25, 277, 443, 65), s(-623.05, -193, 1639.1, 240.5), s(-623.05, -163, 1639.1, 240.5), s(-623.05, -163, 1639.1, 240.5)],
  m_dolomites: [s(-58, 546, 509, 75), s(-745.15, 832.3, 1883.3, 277.5), s(-745.15, 832.3, 1883.3, 277.5), s(-745.15, 832.3, 1883.3, 277.5)],
  m_atnight: [s(24, 1635, 345, 119), s(24, 1635, 345, 119), s(24, 1039, 345, 119), s(24, 606, 345, 119)],
  m_mask: [s(82, 351, 218, 149), s(-227.15, 120.8, 806.6, 551.3), s(-227.15, -605.2, 806.6, 551.3), s(-227.15, -605.2, 806.6, 551.3)],
  "mm-sky": [s(-1, 4, 236, 157), s(-3.7, 14.8, 873.2, 580.9), s(-3.7, 14.8, 873.2, 580.9), s(-3.7, 14.8, 873.2, 580.9)],
  "mm-5": [s(-7, 105, 236, 157), s(-25.9, -241.5, 873.2, 580.9), s(-25.9, -241.5, 873.2, 580.9), s(-25.9, -241.5, 873.2, 580.9)],
  "mm-4": [s(-7, 75, 236, 157), s(-25.9, -167.5, 873.2, 580.9), s(-25.9, -167.5, 873.2, 580.9), s(-25.9, -167.5, 873.2, 580.9)],
  "mm-3": [s(-6, 37, 236, 157), s(-22.2, -84.1, 873.2, 580.9), s(-22.2, -84.1, 873.2, 580.9), s(-22.2, -84.1, 873.2, 580.9)],
  "mm-2": [s(-7, -3, 236, 158), s(-26.2, -11.1, 873.2, 584.6), s(-26.2, -11.1, 873.2, 584.6), s(-26.2, -11.1, 873.2, 584.6)],
  "mm-1": [s(-7, 2, 236, 157), s(-25.9, 7.4, 873.2, 580.9), s(-25.9, 7.4, 873.2, 580.9), s(-25.9, 7.4, 873.2, 580.9)],
  ms1: [s(-384.99, 850.44, 1164.34, 1746.5), s(-384.99, 670.44, 1164.34, 1746.5), s(-384.99, -55.56, 1164.34, 1746.5), s(-384.99, -525.56, 1164.34, 1746.5)],
  ms2: [s(-384.99, 1008.61, 1164.34, 1746.5), s(-384.99, 828.61, 1164.34, 1746.5), s(-384.99, 102.61, 1164.34, 1746.5), s(-384.99, -567.39, 1164.34, 1746.5)],
  ms3: [s(-384.99, 1273.49, 1164.34, 1746.5), s(-384.99, 1093.49, 1164.34, 1746.5), s(-384.99, 427.49, 1164.34, 1746.5), s(-384.99, -582.51, 1164.34, 1746.5)],
  ms4: [s(-384.99, 0, 1164.34, 1746.5), s(-384.99, -180, 1164.34, 1746.5), s(-384.99, -826, 1164.34, 1746.5), s(-384.99, -605, 1164.34, 1746.5)],
};

// Per-text font ratio = Figma fontSize / base box height (so font scales with the box).
const FONT_RATIO = {
  discover: 100 / 119, dolomites: 100 / 119, atnight: 100 / 119,
  m_discover: 42 / 65, m_dolomites: 42 / 75, m_atnight: 56 / 119,
};

const MODES = {
  d: { kf: KF_D, stage: document.getElementById("stage"), w: 1571, h: 1049 },
  m: { kf: KF_M, stage: document.getElementById("stage-m"), w: 393, h: 852 },
};
// Cache element refs per mode.
for (const m of Object.values(MODES)) {
  m.els = {};
  for (const id of Object.keys(m.kf)) m.els[id] = document.getElementById(id);
}

const driver = document.getElementById("driver");
let mode = "d";

const lerp = (a, b, t) => a + (b - a) * t;

function applyProgress(p) {
  p = Math.max(0, Math.min(STEPS, p));
  const seg = Math.min(Math.floor(p), STEPS - 1);
  const t = easeOut(p - seg);
  const { kf, els } = MODES[mode];
  for (const id in kf) {
    const el = els[id];
    if (!el) continue;
    const a = kf[id][seg];
    const b = kf[id][seg + 1];
    const w = lerp(a.w, b.w, t);
    const h = lerp(a.h, b.h, t);
    el.style.left = lerp(a.x, b.x, t) + "px";
    el.style.top = lerp(a.y, b.y, t) + "px";
    el.style.width = w + "px";
    el.style.height = h + "px";
    el.style.opacity = lerp(a.o, b.o, t);
    if (el.dataset.text !== undefined) {
      // Font scales with the box; line-height stays natural so the glyphs sit at
      // the TOP of the box (Figma textAlignVertical: TOP), not centered in it.
      el.style.fontSize = h * (FONT_RATIO[id] || 100 / 119) + "px";
    }
  }
}

/* ---- Choose desktop vs mobile by viewport aspect ------------------------- */
function pickMode() {
  return window.innerWidth / window.innerHeight < 0.85 ? "m" : "d";
}

function fitStage() {
  const next = pickMode();
  if (next !== mode) {
    mode = next;
    MODES.d.stage.hidden = mode !== "d";
    MODES.m.stage.hidden = mode !== "m";
  }
  const f = MODES[mode];
  const scale = Math.min(window.innerWidth / f.w, window.innerHeight / f.h);
  f.stage.style.setProperty("--scale", String(scale));
  driver.style.height = (STEPS + 1) * window.innerHeight + "px";
}

/* ---- Scroll → progress (rAF-throttled) ----------------------------------- */
let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    applyProgress(window.scrollY / window.innerHeight);
    ticking = false;
  });
}

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", () => { fitStage(); onScroll(); }, { passive: true });
window.addEventListener("orientationchange", () => { fitStage(); onScroll(); }, { passive: true });

function boot() {
  mode = pickMode();
  MODES.d.stage.hidden = mode !== "d";
  MODES.m.stage.hidden = mode !== "m";
  fitStage();
  applyProgress(window.scrollY / window.innerHeight);
}
if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot);
boot();

/* ---- Cubic-bezier easing solver (CSS-equivalent) ------------------------- */
function cubicBezier(p1x, p1y, p2x, p2y) {
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
