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

export async function init(ctx) {
  if (!ctx?.gsap) return null;
  const { gsap } = ctx;
  const firstVisit = !sessionStorage.getItem(SESSION_KEY);
  sessionStorage.setItem(SESSION_KEY, "1");

  // Only run the choreography on the first visit per session.
  // We deliberately don't fade the body — the risk of a stuck-blank page
  // outweighs the benefit. Hero elements stagger instead.
  if (!firstVisit || ctx.reducedMotion) return null;

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

  if (!heroTargets.length) return null;

  const tl = gsap.timeline();
  gsap.set(heroTargets, { y: 14, opacity: 0 });
  tl.to(heroTargets, {
    y: 0,
    opacity: 1,
    duration: 0.55,
    ease: "power3.out",
    stagger: 0.06,
  });

  // Skip with Esc
  const skip = (e) => {
    if (e.key !== "Escape") return;
    tl.progress(1);
  };
  document.addEventListener("keydown", skip, { once: true });

  return { timeline: tl };
}

export function destroy() {}
