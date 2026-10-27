// Remote content API. Disabled because the free-tier Render service cold-starts
// (>30s) and times out on first hit, which logged console errors and sat in the
// LCP critical path. The site reads the committed api/*.json files instead. To
// re-enable a live backend, restore the URL below (and keep it warm):
//   globalThis.PORTFOLIO_API_BASE_URL = "https://abhijith-portfolio-api.onrender.com";
globalThis.PORTFOLIO_API_BASE_URL = "";

// Apply the modern homepage shell to legacy public endpoints from one shared
// location. Detail pages can retain their specialist content and scripts while
// navigation, theme, typography and layout remain consistent across the site.
(() => {
  if (typeof document === "undefined" || !document.currentScript) return;
  const scriptBase = new URL(".", document.currentScript.src);
  const siteRoot = new URL("../", scriptBase);
  if (!document.querySelector('link[data-unified-style]')) {
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = new URL("styles/unified.css?v=20261007-engineering-index", siteRoot).href;
    stylesheet.dataset.unifiedStyle = "";
    document.head.insertBefore(stylesheet, document.querySelector('link[href*="styles/portfolio.css"]'));
  }
  if (!document.querySelector('script[data-unified-shell]')) {
    const shell = document.createElement("script");
    shell.src = new URL("scripts/unified-shell.js?v=20261007-engineering-index", siteRoot).href;
    shell.async = false;
    shell.dataset.unifiedShell = "";
    document.head.appendChild(shell);
  }
  // Control volume theme and runtime, applied to every legacy endpoint from here.
  // The site is dark by design; the runtime's cold/hot control replaces the old switch.
  document.documentElement.dataset.theme = "dark";
  try { localStorage.setItem("portfolioTheme", "dark"); } catch { /* storage is optional */ }
  const cvAssets = [];
  const addStyle = (href, key) => {
    if (document.querySelector(`link[data-cv="${key}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.cv = key;
    document.head.appendChild(link);
    cvAssets.push(link);
  };
  addStyle("https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=JetBrains+Mono:wght@400..600&display=swap", "fonts");
  addStyle(new URL("styles/control-volume.css?v=20261027-control-volume", siteRoot).href, "motion");
  addStyle(new URL("styles/cv-site.css?v=20261027-control-volume", siteRoot).href, "theme");
  if (!document.querySelector("script[data-cv-runtime]")) {
    const runtime = document.createElement("script");
    runtime.src = new URL("scripts/control-volume.js?v=20261027-control-volume", siteRoot).href;
    runtime.async = false;
    runtime.dataset.cvRuntime = "";
    document.head.appendChild(runtime);
  }
  // Mark the body the moment it exists, so the first paint is already in theme.
  const markBody = () => { if (!document.body) return false; document.body.classList.add("cv"); return true; };
  if (!markBody()) {
    const watcher = new MutationObserver(() => { if (markBody()) watcher.disconnect(); });
    watcher.observe(document.documentElement, { childList: true });
  }
  // Keep the theme sheets last, after any page-specific stylesheet declared later in <head>.
  document.addEventListener("DOMContentLoaded", () => cvAssets.forEach((link) => document.head.appendChild(link)), { once: true });
})();

globalThis.PORTFOLIO_AUTH_CONFIG = {
  apiKey: "AIzaSyBLveudYPaz16Bq1mYdhC11a2uNG1BaX5s",
  authDomain: "abhijith-sivaprasadan.firebaseapp.com",
  projectId: "abhijith-sivaprasadan",
  storageBucket: "abhijith-sivaprasadan.firebasestorage.app",
  messagingSenderId: "648789054481",
  appId: "1:648789054481:web:e6201023e676771bcc4db0",
  measurementId: "G-JKQSTSE35W",
};
globalThis.PORTFOLIO_CONTACT_FORM_ACTION = "https://formspree.io/f/mgoqzpla";

// Sanity CMS config. Sign up at https://sanity.io (free tier), create a project,
// and paste the project ID below to activate CMS-driven content (Looking-for
// banner, ideas, research status, testimonials). Leave projectId as the
// placeholder to keep the static fallback content.
// Sanity CMS. Disabled because this origin is not in the Sanity project's CORS
// allow-list, so every query failed with a CORS error in the console (the
// browser logs those regardless of try/catch). The site uses its static content.
// To re-enable: add https://abhijith-sivaprasadan.github.io under
// Sanity → API → CORS Origins, then restore projectId to "4lmq2x2j".
globalThis.PORTFOLIO_CMS_CONFIG = {
  projectId: "REPLACE_WITH_SANITY_PROJECT_ID",
  dataset: "production",
};
