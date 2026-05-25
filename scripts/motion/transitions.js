/**
 * Page transitions — View Transitions API + GSAP Flip fallback.
 *
 * Marks key elements (avatar, hero background, project thumbnails) with
 * `view-transition-name` so the browser can morph them across navigation.
 *
 * For browsers without cross-document VT (currently most), we add a
 * subtle fade-out → navigate → fade-in interstitial via GSAP.
 *
 * Activated by [data-motion-page-transition] anywhere on the page.
 */

let ctx = null;

export async function init(context) {
  ctx = context;

  // Mark common cross-page anchors with view-transition-name.
  // Browser handles the morph automatically when both pages share the name
  // AND cross-document view transitions are supported (Chrome 126+ via meta
  // `view-transition` element + same-origin nav).
  tagCommonElements();
  wireTransitionSignal();

  // The JS fade fallback intercepts all link clicks; we keep it opt-in for now
  // via the [data-motion-page-fade] attribute on body to avoid surprising
  // interactions with the existing site.js navigation logic.
  if (!ctx.supportsViewTransitions && document.body.hasAttribute("data-motion-page-fade")) {
    wireFallback();
  }

  // Add the @view-transition meta so cross-document VT can negotiate
  ensureViewTransitionMeta();

  return { tagCommonElements };
}

function ensureViewTransitionMeta() {
  if (document.querySelector('meta[name="view-transition"]')) return;
  // CSS @view-transition rule (newer spec) is the proper way; we inject
  // a tiny stylesheet so cross-document VT can be enabled on supporting browsers.
  const style = document.createElement("style");
  style.textContent = `@view-transition { navigation: auto; }`;
  document.head.appendChild(style);
}

function tagCommonElements() {
  // Avatar — persists across most pages (about, experience, projects index)
  const avatar = document.querySelector(".avatar");
  if (avatar) avatar.style.viewTransitionName = "portfolio-avatar";

  // Logo
  const logo = document.querySelector(".logo");
  if (logo) logo.style.viewTransitionName = "portfolio-logo";

  // Hero of case studies — wide visual that morphs into project thumbnails on the index
  const caseHero = document.querySelector(".case-hero .case-visual, .case-hero .thesis-photo");
  if (caseHero) caseHero.style.viewTransitionName = "case-hero";

  // Project thumbnails — give each a unique name based on its data-project-id
  document.querySelectorAll("[data-project-id]").forEach((el) => {
    const id = el.dataset.projectId;
    const thumb = el.querySelector(".project-thumb, .project-thumb-svg, img");
    if (id && thumb) thumb.style.viewTransitionName = `project-${id}`;
  });
}

function linkTarget(event) {
  const a = event.target.closest("a[href]");
  if (!a) return null;
  const href = a.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return null;
  const url = new URL(href, location.href);
  if (url.origin !== location.origin) return null;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  if (a.target === "_blank" || a.hasAttribute("download") || a.hasAttribute("data-no-transition")) return null;
  return { a, url };
}

function wireTransitionSignal() {
  document.addEventListener("click", (event) => {
    const target = linkTarget(event);
    if (target) ctx.bus.emit("motion:page-transition", { href: target.url.href });
  }, true);
}

function wireFallback() {
  if (!ctx.gsap) return; // need GSAP for the fade
  const { gsap } = ctx;

  document.addEventListener("click", (e) => {
    const target = linkTarget(e);
    if (!target) return;

    e.preventDefault();
    gsap.to("body", {
      opacity: 0,
      duration: 0.18,
      ease: "power2.in",
      onComplete: () => { location.href = target.url.href; },
    });
  });

  // Fade in on page load
  gsap.set("body", { opacity: 0 });
  gsap.to("body", { opacity: 1, duration: 0.32, ease: "power2.out", delay: 0.05 });
}

export function destroy() { /* no-op */ }
