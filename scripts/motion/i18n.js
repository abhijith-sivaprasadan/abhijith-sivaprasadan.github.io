/**
 * Minimal i18n — Swedish toggle (sv) for nav, hero, CTAs.
 *
 * Strategy: data-attribute driven, no string concatenation in JS.
 *   - Mark any element with `data-i18n="key"`.
 *   - Add `data-i18n-sv="Swedish translation"` to that same element.
 *   - The toggle reads the active locale from <html lang> + localStorage
 *     and swaps innerText.
 *
 * Persistence: localStorage key `portfolioLocale` = "en" | "sv".
 * Default: en. If browser language starts with "sv", default to sv but
 * still let the user override.
 *
 * Toggle UI: injected as a small "EN | SV" pill in the nav.
 */

const STORAGE_KEY = "portfolioLocale";
const SUPPORTED = ["en", "sv"];

// Phrase dictionary for static page elements that don't have inline data-i18n
// (used as a fallback when an element only has data-i18n key but no per-attribute
// translation embedded inline)
const DICT = {
  en: {
    "nav.research": "Research",
    "nav.energy":   "Energy Systems",
    "nav.industrial": "Industrial R&D",
    "nav.projects": "Projects",
    "nav.experience": "Experience",
    "nav.cv":       "CVs",
    "nav.about":    "About",
    "nav.contact":  "Contact",
    "cta.thesis":   "Open Siemens Thesis",
    "cta.cv":       "Download CV",
    "cta.contact":  "Get in touch",
    "hero.kicker":  "M.Sc. Sustainable Energy Engineering · KTH 2026",
    "contact.target": "Currently targeting doctoral research in high-temperature thermal-fluid systems and industrial R&D roles in decarbonization and electrification in Sweden.",
  },
  sv: {
    "nav.research":   "Forskning",
    "nav.energy":     "Energisystem",
    "nav.industrial": "Industriell FoU",
    "nav.projects":   "Projekt",
    "nav.experience": "Erfarenhet",
    "nav.cv":         "CV",
    "nav.about":      "Om",
    "nav.contact":    "Kontakt",
    "cta.thesis":     "Öppna Siemens-examensarbete",
    "cta.cv":         "Ladda ner CV",
    "cta.contact":    "Ta kontakt",
    "hero.kicker":    "Civilingenjör · Hållbar energiteknik · KTH 2026",
    "contact.target": "Söker doktorandforskning inom högtempererade termik- och strömningssystem samt industriella FoU-roller inom avkarbonisering och elektrifiering i Sverige.",
  },
};

let current = "en";

function getStored() {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

function setStored(v) {
  try { localStorage.setItem(STORAGE_KEY, v); } catch {}
}

function resolveInitial() {
  const stored = getStored();
  if (stored && SUPPORTED.includes(stored)) return stored;
  // Default to sv if browser preference is Swedish
  const browser = (navigator.language || "en").toLowerCase();
  if (browser.startsWith("sv")) return "sv";
  return "en";
}

function apply(locale) {
  current = locale;
  document.documentElement.lang = locale;
  document.documentElement.dataset.locale = locale;

  // 1. Elements with per-attribute translation (data-i18n-sv="…")
  document.querySelectorAll("[data-i18n-sv], [data-i18n-en]").forEach((el) => {
    if (!el.dataset.i18nDefault) {
      el.dataset.i18nDefault = el.textContent.trim();
    }
    let nextText = el.dataset.i18nDefault;
    if (locale === "sv" && el.dataset.i18nSv) {
      nextText = el.dataset.i18nSv;
    } else if (locale === "en" && el.dataset.i18nEn) {
      nextText = el.dataset.i18nEn;
    }
    if (el.textContent !== nextText) el.textContent = nextText;
  });

  // 2. Elements with a key, resolved from DICT
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (!key) return;
    const translation = DICT[locale]?.[key] || DICT.en?.[key];
    if (translation && el.textContent !== translation) el.textContent = translation;
  });
}

function buildToggle(ctx) {
  const nav = document.querySelector(".nav");
  if (!nav || document.querySelector("[data-i18n-toggle]")) return null;

  const toggle = document.createElement("div");
  toggle.className = "i18n-toggle";
  toggle.setAttribute("data-i18n-toggle", "");
  toggle.setAttribute("role", "group");
  toggle.setAttribute("aria-label", "Language toggle");
  toggle.innerHTML = `
    <button type="button" data-locale="en" aria-pressed="${current === "en"}">EN</button>
    <button type="button" data-locale="sv" aria-pressed="${current === "sv"}">SV</button>
  `;
  nav.appendChild(toggle);

  toggle.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-locale]");
    if (!btn) return;
    const next = btn.dataset.locale;
    if (!SUPPORTED.includes(next) || next === current) return;
    setStored(next);
    apply(next);
    ctx?.bus?.emit?.("motion:locale-change", { locale: next });
    toggle.querySelectorAll("[data-locale]").forEach((b) =>
      b.setAttribute("aria-pressed", b.dataset.locale === next ? "true" : "false")
    );
  });

  return toggle;
}

export async function init(ctx) {
  current = resolveInitial();
  buildToggle(ctx);
  apply(current);

  // Re-apply when new content is added (CMS-driven mounts)
  const obs = new MutationObserver(() => apply(current));
  obs.observe(document.body, { childList: true, subtree: true });

  // Broadcast for other systems (audio, analytics)
  ctx?.bus?.emit?.("motion:locale-change", { locale: current });

  return { destroy() { obs.disconnect(); } };
}

export function destroy(inst) { inst?.destroy?.(); }
