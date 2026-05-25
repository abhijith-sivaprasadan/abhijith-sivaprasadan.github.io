/**
 * Magnetic + spring physics on primary interactions.
 *
 * Targets: every element with class `.button.primary`, `[data-home-mode-button]`,
 * `.signal-routes a`, or `[data-motion-spring]`.
 *
 * Effects:
 *   - Magnetic pull: cursor within 64px pulls the button up to 10px in cursor
 *     direction, with spring easing.
 *   - Click physics: spring scale-down 0.96 then release.
 *   - Radial highlight: a soft CSS radial-gradient that tracks the cursor across
 *     the button (uses CSS custom props --mx, --my updated by JS).
 */

const PULL_RADIUS = 64;
const PULL_MAX = 10;

let ctx = null;
let observer = null;
const tracked = new WeakMap();

function bindElement(el) {
  if (tracked.has(el)) return;
  el.classList.add("motion-spring");

  const { gsap } = ctx;
  const qx = gsap.quickTo(el, "x", { duration: 0.5, ease: "elastic.out(1, 0.6)" });
  const qy = gsap.quickTo(el, "y", { duration: 0.5, ease: "elastic.out(1, 0.6)" });
  const qs = gsap.quickTo(el, "scale", { duration: 0.25, ease: "power3.out" });

  const onMove = (e) => {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);

    // Update local cursor coords for the CSS radial highlight
    const mx = ((e.clientX - r.left) / r.width) * 100;
    const my = ((e.clientY - r.top) / r.height) * 100;
    el.style.setProperty("--mx", `${mx}%`);
    el.style.setProperty("--my", `${my}%`);

    if (dist < PULL_RADIUS) {
      const k = (1 - dist / PULL_RADIUS) * PULL_MAX;
      qx((dx / dist || 0) * k);
      qy((dy / dist || 0) * k);
    }
  };

  const onLeave = () => {
    qx(0); qy(0); qs(1);
    el.style.removeProperty("--mx");
    el.style.removeProperty("--my");
  };

  const onDown = () => { qs(0.96); };
  const onUp = () => { qs(1); };

  // We attach mousemove to the document but only react when cursor is near el
  const onDocMove = (e) => {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    if (Math.hypot(e.clientX - cx, e.clientY - cy) < PULL_RADIUS) onMove(e);
  };

  document.addEventListener("mousemove", onDocMove, { passive: true });
  el.addEventListener("mouseleave", onLeave);
  el.addEventListener("mousedown", onDown);
  el.addEventListener("mouseup", onUp);

  tracked.set(el, () => {
    document.removeEventListener("mousemove", onDocMove);
    el.removeEventListener("mouseleave", onLeave);
    el.removeEventListener("mousedown", onDown);
    el.removeEventListener("mouseup", onUp);
    el.classList.remove("motion-spring");
  });
}

function scan(root = document) {
  const sel = ".button.primary, [data-home-mode-button], .signal-routes a, [data-motion-spring]";
  root.querySelectorAll(sel).forEach(bindElement);
}

export async function init(c) {
  ctx = c;
  if (!ctx?.gsap) return null;
  scan();

  // Observe future additions (dynamic project cards, mode-mode swaps)
  observer = new MutationObserver((muts) => {
    for (const m of muts) {
      m.addedNodes.forEach((n) => {
        if (n.nodeType === 1) scan(n);
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return { scan };
}

export function destroy() {
  observer?.disconnect();
}
