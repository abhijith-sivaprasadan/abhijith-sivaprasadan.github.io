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
    stylesheet.href = new URL("styles/unified.css?v=20261006-notebook", siteRoot).href;
    stylesheet.dataset.unifiedStyle = "";
    document.head.insertBefore(stylesheet, document.querySelector('link[href*="styles/portfolio.css"]'));
  }
  if (!document.querySelector('script[data-unified-shell]')) {
    const shell = document.createElement("script");
    shell.src = new URL("scripts/unified-shell.js?v=20261006-notebook", siteRoot).href;
    shell.async = false;
    shell.dataset.unifiedShell = "";
    document.head.appendChild(shell);
  }
  try {
    const saved = localStorage.getItem("portfolioTheme");
    document.documentElement.dataset.theme = saved || "light";
    if (!saved) localStorage.setItem("portfolioTheme", "light");
  } catch {
    document.documentElement.dataset.theme = "light";
  }
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
