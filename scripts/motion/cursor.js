/**
 * Custom technical cursor.
 *
 * Replaces the OS cursor with an SVG instrument reticle. Context changes
 * based on what the cursor hovers:
 *   - default       → small crosshair / reticle
 *   - .button, a    → filled dot
 *   - input/text    → I-beam
 *   - .img-compare  → drag handle (E-W arrows)
 *   - canvas chart  → caliper (showing tick + value)
 *
 * Touch devices and reduced-motion users get no cursor at all (gated in
 * motion/index.js auto-load).
 */

let ctx = null;
let el = null;
let pos = { x: 0, y: 0 };
let target = { x: 0, y: 0 };
let state = "default";
let rafId = null;

const SVG = {
  default: `
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true">
      <circle cx="12" cy="12" r="3.5" />
      <line x1="12" y1="0.5" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="23.5" />
      <line x1="0.5" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="23.5" y2="12" />
    </svg>`,
  pointer: `
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <circle cx="12" cy="12" r="6" fill="currentColor" />
    </svg>`,
  text: `
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="9" y1="2" x2="15" y2="2" />
      <line x1="9" y1="22" x2="15" y2="22" />
    </svg>`,
  drag: `
    <svg viewBox="0 0 32 24" width="34" height="20" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">
      <polyline points="6,12 2,12 2,8 2,16 2,12" />
      <polyline points="26,12 30,12 30,8 30,16 30,12" />
      <line x1="2" y1="12" x2="30" y2="12" stroke-dasharray="2 3" />
    </svg>`,
  caliper: `
    <svg viewBox="0 0 30 24" width="32" height="22" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true">
      <line x1="2" y1="12" x2="28" y2="12" />
      <line x1="2" y1="6" x2="2" y2="18" />
      <line x1="15" y1="9" x2="15" y2="15" />
      <line x1="28" y1="6" x2="28" y2="18" />
    </svg>`,
};

function setState(next) {
  if (state === next) return;
  state = next;
  el.dataset.state = next;
  el.innerHTML = SVG[next] || SVG.default;
}

function detect(node) {
  if (!node) return "default";
  if (node.closest && node.closest(".img-compare-range, .img-compare-handle, [data-img-compare]")) return "drag";
  if (node.closest && node.closest("canvas[data-evidence-chart], .thesis-chart-card canvas, .chart-canvas")) return "caliper";
  if (node.closest && node.closest("a, button, [role='button'], .button, [data-motion-spring], [data-home-mode-button], .signal-routes a, label")) return "pointer";
  if (node.closest && node.closest("input, textarea, [contenteditable='true']")) return "text";
  return "default";
}

function loop() {
  // Spring towards target
  pos.x += (target.x - pos.x) * 0.28;
  pos.y += (target.y - pos.y) * 0.28;
  el.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`;
  rafId = requestAnimationFrame(loop);
}

function onMove(e) {
  target.x = e.clientX;
  target.y = e.clientY;
  setState(detect(e.target));
}

function onDown() { el.classList.add("is-press"); }
function onUp()   { el.classList.remove("is-press"); }
function onLeaveWin() { el.style.opacity = "0"; }
function onEnterWin() { el.style.opacity = "1"; }

export async function init(c) {
  ctx = c;
  if (ctx.touchOnly) return null;

  el = document.createElement("div");
  el.className = "motion-cursor";
  el.dataset.state = "default";
  el.innerHTML = SVG.default;
  document.body.appendChild(el);

  document.documentElement.classList.add("motion-cursor-active");

  document.addEventListener("mousemove", onMove, { passive: true });
  document.addEventListener("mousedown", onDown);
  document.addEventListener("mouseup", onUp);
  document.addEventListener("mouseleave", onLeaveWin);
  document.addEventListener("mouseenter", onEnterWin);

  loop();

  return {
    setState,
    destroy() {
      cancelAnimationFrame(rafId);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("mouseleave", onLeaveWin);
      document.removeEventListener("mouseenter", onEnterWin);
      document.documentElement.classList.remove("motion-cursor-active");
      el.remove();
    },
  };
}

export function destroy(inst) { inst?.destroy?.(); }
