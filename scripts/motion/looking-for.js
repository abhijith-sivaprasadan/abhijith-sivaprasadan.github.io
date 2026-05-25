/**
 * "Looking for…" status banner.
 *
 * Reads:
 *   1. `window.PORTFOLIO_LOOKING_FOR` (set by CMS-driven script, optional)
 *   2. <meta name="looking-for" content="…"> (static fallback)
 *   3. Default copy keyed to current date / KTH PhD season
 *
 * Renders the banner just inside <body>, above the site header, persists
 * dismissal in localStorage (per session-ish — TTL 24h).
 */

const KEY = "portfolioLookingForDismissed";
const TTL_MS = 24 * 60 * 60 * 1000;

function isDismissed() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const { at } = JSON.parse(raw);
    return Date.now() - at < TTL_MS;
  } catch { return false; }
}

function markDismissed() {
  try { localStorage.setItem(KEY, JSON.stringify({ at: Date.now() })); } catch {}
}

function resolveContent(locale = document.documentElement.dataset.locale || "en") {
  if (typeof window.PORTFOLIO_LOOKING_FOR === "string" && window.PORTFOLIO_LOOKING_FOR.trim()) {
    return window.PORTFOLIO_LOOKING_FOR.trim();
  }
  const meta = document.querySelector('meta[name="looking-for"]');
  if (meta?.content?.trim()) return meta.content.trim();
  if (locale === "sv") {
    return `Söker <a href="research.html">doktorandtjänster</a> och <a href="industrial-rd.html">industriella FoU-roller</a> i Sverige och EU.`;
  }
  return `Currently targeting <a href="research.html">PhD positions</a> and <a href="industrial-rd.html">industrial R&amp;D roles</a> in Sweden and the EU.`;
}

function build(htmlText) {
  const banner = document.createElement("div");
  banner.className = "looking-for-banner";
  banner.setAttribute("role", "status");
  banner.innerHTML = `
    <span class="status-dot" aria-hidden="true"></span>
    <span class="status-text">${htmlText}</span>
    <button class="dismiss" type="button" aria-label="Dismiss status banner">&times;</button>
  `;
  return banner;
}

export async function init(ctx) {
  if (isDismissed()) return null;
  const banner = build(resolveContent());
  document.body.insertBefore(banner, document.body.firstChild);
  banner.querySelector(".dismiss").addEventListener("click", () => {
    banner.remove();
    markDismissed();
  });
  const off = ctx?.bus?.on?.("motion:locale-change", ({ locale }) => {
    const text = banner.querySelector(".status-text");
    if (text) text.innerHTML = resolveContent(locale);
  });
  return { banner, destroy() { off?.(); banner.remove(); } };
}

export function destroy(instance) {
  instance?.destroy?.();
}
