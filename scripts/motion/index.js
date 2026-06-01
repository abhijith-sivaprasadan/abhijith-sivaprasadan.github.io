/**
 * Motion bootstrap module (ES module).
 *
 * Load via: <script type="module" src="scripts/motion/index.js" defer></script>
 * GSAP must be loaded BEFORE this module via CDN <script> tags.
 *
 * This file:
 *   - Detects prefers-reduced-motion, touch-only, low-power.
 *   - Registers GSAP plugins.
 *   - Lazy-loads motion subsystems on demand (dynamic import).
 *   - Exposes window.Motion for site.js / other code to subscribe to.
 *
 * Subsystem files live in this same directory (./fluid-sim.js, ./cursor.js, …).
 * Each subsystem exports { init(ctx), destroy?() }.
 */

// ── Resolve base URL for subsystem loading ─────────────────────────────────
const BASE = new URL(".", import.meta.url).href;
const VERSION = new URL(import.meta.url).search || "";

// ── Capability detection ───────────────────────────────────────────────────
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const touchOnly = window.matchMedia("(hover: none)").matches;
const lowPower = (navigator.hardwareConcurrency || 4) <= 2;
const supportsWorkers = typeof Worker !== "undefined";
const supportsViewTransitions = typeof document.startViewTransition === "function";
const supportsWebAudio = typeof window.AudioContext !== "undefined" ||
                        typeof window.webkitAudioContext !== "undefined";

// ── Tiny event bus ─────────────────────────────────────────────────────────
const bus = (() => {
  const listeners = new Map();
  return {
    on(event, fn) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(fn);
      return () => listeners.get(event)?.delete(fn);
    },
    emit(event, payload) {
      listeners.get(event)?.forEach((fn) => {
        try { fn(payload); } catch (e) { console.error("[motion bus]", event, e); }
      });
    },
  };
})();

// ── GSAP plugin registration (one-time, idempotent) ───────────────────────
function ensureGSAP() {
  const gsap = window.gsap;
  if (!gsap) {
    console.warn("[motion] GSAP not loaded — animations will degrade to CSS.");
    return null;
  }
  const { ScrollTrigger, Flip } = window;
  const registered = gsap.core?.globals?.() || {};
  if (ScrollTrigger && !registered.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  if (Flip && !registered.Flip) gsap.registerPlugin(Flip);

  if (reducedMotion) {
    gsap.defaults({ duration: 0 });
    gsap.globalTimeline.timeScale(100);
  }
  return { gsap, ScrollTrigger: ScrollTrigger || null, Flip: Flip || null };
}

// ── Subsystem loader ───────────────────────────────────────────────────────
const subsystems = new Map();
const pendingSubsystems = new Map();

async function load(name, path) {
  if (subsystems.has(name)) return subsystems.get(name).instance;
  if (pendingSubsystems.has(name)) return pendingSubsystems.get(name);

  const pending = (async () => {
    try {
      const mod = await import(`${path || `${BASE}${name}.js`}${VERSION}`);
      const instance = mod.init ? await mod.init(Motion.ctx) : null;
      subsystems.set(name, { module: mod, instance });
      bus.emit("motion:subsystem-loaded", { name, instance });
      return instance;
    } catch (err) {
      console.warn(`[motion] failed to load subsystem '${name}':`, err);
      return null;
    } finally {
      pendingSubsystems.delete(name);
    }
  })();
  pendingSubsystems.set(name, pending);
  return pending;
}

function unload(name) {
  const entry = subsystems.get(name);
  if (entry?.module?.destroy) {
    try { entry.module.destroy(entry.instance); } catch (e) { console.error(e); }
  }
  subsystems.delete(name);
}

// ── Bridge existing site systems (home-mode, theme) to the motion bus ─────
function bridgeExistingSystems() {
  const body = document.body;
  if (body?.dataset?.homeMode) {
    bus.emit("motion:mode-change", { mode: body.dataset.homeMode });
  }
  new MutationObserver(() => {
    bus.emit("motion:mode-change", { mode: document.body.dataset.homeMode });
  }).observe(document.body, { attributes: true, attributeFilter: ["data-home-mode"] });

  new MutationObserver(() => {
    bus.emit("motion:theme-change", { theme: document.documentElement.dataset.theme || "dark" });
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
}

// ── Public namespace ───────────────────────────────────────────────────────
const Motion = {
  ctx: null,
  bus,
  capability: {
    reducedMotion,
    touchOnly,
    lowPower,
    supportsWorkers,
    supportsViewTransitions,
    supportsWebAudio,
  },
  load,
  unload,
  isLoaded(name) { return subsystems.has(name); },
};

window.Motion = Motion;

// ── Boot ───────────────────────────────────────────────────────────────────
function boot() {
  const g = ensureGSAP();
  Motion.ctx = {
    gsap: g?.gsap || null,
    ScrollTrigger: g?.ScrollTrigger || null,
    Flip: g?.Flip || null,
    reducedMotion,
    touchOnly,
    lowPower,
    supportsWorkers,
    supportsViewTransitions,
    supportsWebAudio,
    bus,
    root: document.documentElement,
  };
  document.documentElement.classList.add("motion-ready");
  document.body?.classList.add("signal-rebuild");
  if (reducedMotion) document.documentElement.classList.add("motion-reduced");
  if (touchOnly) document.documentElement.classList.add("motion-touch");
  if (supportsViewTransitions) document.documentElement.classList.add("motion-vt");

  bridgeExistingSystems();

  // Auto-load subsystems present on the page
  const autoload = [
    // Eulerian Stable Fluids — preferred on capable devices. The homepage
    // enables Live Lens by default; when a visitor explicitly turns it off,
    // keep the solver off and leave the authored hero content in place.
    { name: "fluid-sim-eulerian", selector: "[data-motion-fluid-sim]", skip: () => !supportsWorkers || !document.body.classList.contains("lens-dev") },
    // Legacy canvas fallback remains only for browsers without Worker support.
    { name: "fluid-sim",     selector: "[data-motion-fluid-sim]", skip: () => reducedMotion || supportsWorkers || !document.body.classList.contains("lens-dev") },
    { name: "cursor",        selector: "[data-motion-cursor]",        skip: () => touchOnly || reducedMotion },
    { name: "springs",       selector: "[data-motion-spring], .button.primary, [data-home-mode-button], .signal-routes a", skip: () => reducedMotion || touchOnly },
    { name: "scrollytelling",selector: "[data-motion-scrollyt]" },
    { name: "scroll-rail",   selector: "[data-motion-scroll-rail]" },
    { name: "transitions",   selector: "[data-motion-page-transition], a[data-page-transition]" },
    { name: "entrance",      selector: "[data-motion-entrance]",      skip: () => reducedMotion },
    { name: "chips",         selector: ".tag-row span, .audience-chip-row span, .skill-pill, .chip, .pill" },
    { name: "signal-page-art", selector: "[data-signal-page-art]", path: `${BASE}../sections/signal-page-art.js` },
    { name: "bento-projects", selector: "[data-bento-projects]", path: `${BASE}../sections/bento-projects.js` },
    { name: "featured-project-filters", selector: "[data-featured-project-filters]", path: `${BASE}../sections/featured-project-filters.js` },
    { name: "evidence-graph", selector: ".evidence-lanes", path: `${BASE}../sections/evidence-graph.js` },
    { name: "skill-radar", selector: "[data-skill-radar]", path: `${BASE}../sections/skill-radar.js` },
    { name: "cinematic-timeline", selector: "#experience .timeline", path: `${BASE}../sections/cinematic-timeline.js` },
    { name: "research-mindmap", selector: "[data-research-mindmap-source]", path: `${BASE}../sections/research-mindmap.js` },
    { name: "letter-viewer", selector: ".testimonial-card", path: `${BASE}../sections/letter-viewer.js` },
    { name: "step-form", selector: "[data-contact-form]", path: `${BASE}../sections/step-form.js` },
    { name: "theme-wipe",    selector: "[data-theme-toggle]",         skip: () => reducedMotion },
    { name: "audio",         selector: "body",  skip: () => !supportsWebAudio },
    { name: "reading-progress", selector: '.case-hero, .case-panel, [data-page-key="case-study"]' },
    { name: "looking-for",      selector: "body" },
    { name: "katex",            selector: ".math, [data-math]" },
    { name: "biot-calculator",  selector: "[data-biot-calculator]", path: `${BASE}../sections/biot-calculator.js` },
    { name: "i18n",             selector: "[data-i18n-sv], [data-i18n]" },
    { name: "cms-hydrate",      selector: "body", path: `${BASE}../cms/hydrate.js` },
    { name: "bento-previews",   selector: "[data-bento-previews]", path: `${BASE}../sections/bento-previews.js`, skip: () => reducedMotion },
    { name: "reducer-3d-viewer", selector: "[data-reducer-3d-viewer]", path: `${BASE}../sections/reducer-3d-viewer.js`, skip: () => reducedMotion },
  ];
  function loadPresentSubsystems() {
    for (const entry of autoload) {
      if (subsystems.has(entry.name) || (entry.skip && entry.skip())) continue;
      if (document.querySelector(entry.selector)) load(entry.name, entry.path);
    }
  }

  loadPresentSubsystems();

  // Some legacy site controls (including the theme button) are mounted after
  // this module starts. Detect those mounts once they appear so v4 behavior
  // is not dependent on script execution order.
  const mountObserver = new MutationObserver(() => loadPresentSubsystems());
  mountObserver.observe(document.body, { childList: true, subtree: true });

  // The fluid-sim is gated on body.lens-dev (see autoload). Opening the Live
  // Lens flips that class — an attribute change, not a DOM insertion — so watch
  // the body's own class to load the subsystem on demand.
  const bodyClassObserver = new MutationObserver(() => loadPresentSubsystems());
  bodyClassObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });

  // ScrollTrigger can alter document geometry after the browser has already
  // attempted an initial hash jump. Reapply deep links after motion settles.
  const restoreAnchor = () => {
    const id = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    if (target.hasAttribute("data-motion-scrollyt")) return;
    Motion.ctx.ScrollTrigger?.refresh();
    requestAnimationFrame(() => target.scrollIntoView({ block: "start", behavior: "auto" }));
  };
  if (window.location.hash) {
    [220, 720, 1320, 2800].forEach((delay) => window.setTimeout(restoreAnchor, delay));
    window.addEventListener("load", () => window.setTimeout(restoreAnchor, 240), { once: true });
  }
  window.addEventListener("hashchange", () => window.setTimeout(restoreAnchor, 0));

  bus.emit("motion:ready", Motion.ctx);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}

export default Motion;
