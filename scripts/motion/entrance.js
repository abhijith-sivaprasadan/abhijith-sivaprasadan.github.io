/**
 * Page entrance choreography.
 *
 * IMPORTANT (perf): above-the-fold hero content must be PAINTED at first paint.
 * It must never be hidden (opacity:0) behind a JS-driven reveal — on a slow
 * mobile the main thread can delay that reveal past 10s, and the hidden hero
 * text then becomes the Largest Contentful Paint (it measured a ~13s render
 * delay before this fix). So the entrance animates TRANSFORM ONLY: every
 * element is opaque from the start and merely lifts a few px into place once
 * GSAP runs.
 *
 * (This replaces an earlier first-visit full-screen "firmware bootup" overlay
 * that occluded the hero and gated its reveal — the cause of the slow-mobile
 * LCP. If a richer intro is wanted later, do it with a CSS-driven, non-occluding
 * effect so it can't block the hero's paint.)
 */

const SESSION_KEY = "portfolioEntered";

export async function init(ctx) {
  if (!ctx?.gsap) return null;
  const { gsap } = ctx;
  sessionStorage.setItem(SESSION_KEY, "1");

  if (ctx.reducedMotion) return null;

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

  // Transform-only lift-in. No opacity change → the text is painted from the
  // first frame and never delays LCP. `from` plays the element from y:12 to its
  // natural position; clearProps removes the inline transform afterwards.
  const tl = gsap.from(heroTargets, {
    y: 12,
    duration: 0.5,
    ease: "power3.out",
    stagger: 0.05,
    clearProps: "transform",
  });
  return { timeline: tl };
}

export function destroy() {}
