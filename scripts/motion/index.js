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

async function load(name, path) {
  if (subsystems.has(name)) return subsystems.get(name).instance;
  try {
    const mod = await import(`${path || `${BASE}${name}.js`}${VERSION}`);
    const instance = mod.init ? await mod.init(Motion.ctx) : null;
    subsystems.set(name, { module: mod, instance });
    bus.emit("motion:subsystem-loaded", { name, instance });
    return instance;
  } catch (err) {
    console.warn(`[motion] failed to load subsystem '${name}':`, err);
    return null;
  }
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
  if (reducedMotion) document.documentElement.classList.add("motion-reduced");
  if (touchOnly) document.documentElement.classList.add("motion-touch");
  if (supportsViewTransitions) document.documentElement.classList.add("motion-vt");

  bridgeExistingSystems();

  // Auto-load subsystems present on the page
  const autoload = [
    { name: "fluid-sim",     selector: "[data-motion-fluid-sim]",     skip: () => reducedMotion },
    { name: "cursor",        selector: "[data-motion-cursor]",        skip: () => touchOnly || reducedMotion },
    { name: "springs",       selector: "[data-motion-spring], .button.primary, [data-home-mode-button], .signal-routes a", skip: () => reducedMotion || touchOnly },
    { name: "scrollytelling",selector: "[data-motion-scrollyt]" },
    { name: "scroll-rail",   selector: "[data-motion-scroll-rail]" },
    { name: "transitions",   selector: "[data-motion-page-transition], a[data-page-transition]" },
    { name: "entrance",      selector: "[data-motion-entrance]",      skip: () => reducedMotion },
    { name: "chips",         selector: ".tag-row span, .audience-chip-row span, .skill-pill, .chip, .pill" },
    { name: "bento-projects", selector: "[data-featured-projects]", path: `${BASE}../sections/bento-projects.js` },
    { name: "evidence-graph", selector: ".evidence-lanes", path: `${BASE}../sections/evidence-graph.js` },
    { name: "skill-radar", selector: "[data-dynamic-skills]", path: `${BASE}../sections/skill-radar.js` },
    { name: "cinematic-timeline", selector: "#experience .timeline", path: `${BASE}../sections/cinematic-timeline.js` },
    { name: "research-mindmap", selector: ".scene-skills + .section, [data-research-mindmap-source]", path: `${BASE}../sections/research-mindmap.js` },
    { name: "letter-viewer", selector: ".testimonial-card", path: `${BASE}../sections/letter-viewer.js` },
    { name: "step-form", selector: "[data-contact-form]", path: `${BASE}../sections/step-form.js` },
    { name: "theme-wipe",    selector: "[data-theme-toggle]",         skip: () => reducedMotion },
    { name: "audio",         selector: "body",  skip: () => !supportsWebAudio },
    { name: "reading-progress", selector: '.case-hero, .case-panel, [data-page-key="case-study"]' },
    { name: "looking-for",      selector: "body" },
    { name: "katex",            selector: ".math, [data-math]" },
    { name: "biot-calculator",  selector: "[data-biot-calculator]", path: `${BASE}../sections/biot-calculator.js` },
    { name: "i18n",             selector: "body" },
    { name: "cms-hydrate",      selector: "body", path: `${BASE}../cms/hydrate.js` },
  ];
  for (const entry of autoload) {
    if (entry.skip && entry.skip()) continue;
    if (document.querySelector(entry.selector)) load(entry.name, entry.path);
  }

  bus.emit("motion:ready", Motion.ctx);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}

export default Motion;
