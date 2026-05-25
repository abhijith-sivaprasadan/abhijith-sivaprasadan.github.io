/**
 * Page entrance choreography.
 *
 * Plays a 1.2s reveal on first visit per session (cached in sessionStorage).
 * On subsequent visits in the same session, just fades in.
 *
 * Choreography:
 *   1. Body fades up (opacity 0 → 1, 280ms).
 *   2. Hero text + signal-routes stagger in from below (y 16 → 0, 400ms,
 *      staggered 80ms).
 *   3. Fluid sim canvas fades in (handled by fluid-sim init).
 *
 * Skippable via Esc or any click.
 */

const SESSION_KEY = "portfolioEntered";

// Instrument-bootup choreography — a 1.2s sequence styled like scientific
// instrument firmware initialisation, then the hero elements stagger in.
//
// Sequence:
//   t=0     : a thin progress line appears at the very top of the screen
//   t=0.05  : "Initialising thermal-fluid signal…" type-fades in
//   t=0.45  : "Loading evidence rail…"             type-fades in
//   t=0.80  : "Online."                            quick blink
//   t=0.95  : overlay slides up off-screen, hero elements lift in (stagger)
//   t=1.40  : overlay removed from DOM
//
// All gated by sessionStorage (one bootup per session) and reduced-motion.
// Skippable with Esc or click.

function buildBootupOverlay() {
  const overlay = document.createElement("div");
  overlay.className = "motion-bootup-overlay";
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `
    <div class="motion-bootup-bar" aria-hidden="true"></div>
    <div class="motion-bootup-readout">
      <span class="readout-line" data-readout="1"></span>
      <span class="readout-line" data-readout="2"></span>
      <span class="readout-line" data-readout="3"></span>
    </div>
  `;
  document.body.appendChild(overlay);
  return overlay;
}

function typeLine(el, text, durationMs) {
  return new Promise((resolve) => {
    el.classList.add("is-active");
    const chars = text.split("");
    const step = Math.max(8, durationMs / chars.length);
    let i = 0;
    const tick = () => {
      el.textContent = text.slice(0, i);
      i++;
      if (i > chars.length) return resolve();
      setTimeout(tick, step);
    };
    tick();
  });
}

export async function init(ctx) {
  if (!ctx?.gsap) return null;
  const { gsap } = ctx;
  const firstVisit = !sessionStorage.getItem(SESSION_KEY);
  sessionStorage.setItem(SESSION_KEY, "1");

  // Skip everything on reduced motion; on repeat visits, only stagger the hero.
  const heroTargets = document.querySelectorAll([
    "[data-motion-entrance] .eyebrow",
    "[data-motion-entrance] .hero-kicker",
    "[data-motion-entrance] h1",
    "[data-motion-entrance] .signal-claim",
    "[data-motion-entrance] .hero-text",
    "[data-motion-entrance] .button-row",
    "[data-motion-entrance] .home-mode-toggle",
    "[data-motion-entrance] .signal-rail",
    "[data-motion-entrance] .signal-routes",
  ].join(","));

  if (ctx.reducedMotion || !heroTargets.length) return null;

  // Repeat-visit fast path: just stagger the hero, skip the bootup overlay.
  if (!firstVisit) {
    const tl = gsap.timeline();
    gsap.set(heroTargets, { y: 14, opacity: 0 });
    tl.to(heroTargets, { y: 0, opacity: 1, duration: 0.55, ease: "power3.out", stagger: 0.06 });
    return { timeline: tl };
  }

  // ── First-visit bootup ──────────────────────────────────────────────────
  const overlay = buildBootupOverlay();
  const bar = overlay.querySelector(".motion-bootup-bar");
  const lines = overlay.querySelectorAll(".readout-line");
  gsap.set(heroTargets, { y: 14, opacity: 0 });

  // Allow user to skip the whole sequence
  let skipped = false;
  const skip = () => {
    if (skipped) return;
    skipped = true;
    overlay.remove();
    gsap.to(heroTargets, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out", stagger: 0.04 });
  };
  const onKey = (e) => { if (e.key === "Escape") skip(); };
  const onClick = () => skip();
  document.addEventListener("keydown", onKey);
  overlay.addEventListener("click", onClick);

  // 1. Progress line wipes from left to right
  gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 1.05, ease: "power2.inOut" });

  // 2. Three readout lines type in sequentially
  await new Promise((r) => setTimeout(r, 50));
  if (skipped) return null;
  await typeLine(lines[0], "› Initialising thermal-fluid signal…", 360);
  await new Promise((r) => setTimeout(r, 80));
  if (skipped) return null;
  await typeLine(lines[1], "› Loading evidence rail…", 320);
  await new Promise((r) => setTimeout(r, 70));
  if (skipped) return null;
  await typeLine(lines[2], "› Online.", 180);
  await new Promise((r) => setTimeout(r, 120));
  if (skipped) return null;

  // 3. Overlay sweeps up
  await gsap.to(overlay, { y: "-100%", duration: 0.55, ease: "power3.inOut" });
  overlay.remove();
  document.removeEventListener("keydown", onKey);

  // 4. Hero elements lift in (stagger)
  await gsap.to(heroTargets, { y: 0, opacity: 1, duration: 0.55, ease: "power3.out", stagger: 0.06 });

  return { skipped };
}

export function destroy() {}
