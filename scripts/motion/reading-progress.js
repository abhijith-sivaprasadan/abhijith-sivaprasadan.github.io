/**
 * Article-scoped reading progress + reading-time pill.
 *
 * On case-study pages (body[data-page-key="case-study"]), the existing
 * .scroll-progress bar is repurposed to show *article* progress, not
 * whole-page progress. A reading-time pill is appended to the eyebrow.
 *
 * Reading time = words / 220 wpm, rounded up to the nearest minute.
 */

const WPM = 220;

function findArticle() {
  return (
    document.querySelector("article.case-panel") ||
    document.querySelector(".case-hero ~ .section .container") ||
    document.querySelector("main article") ||
    document.querySelector("main")
  );
}

function findEyebrow() {
  return document.querySelector(".case-hero .eyebrow");
}

function wordCount(article) {
  return (article?.textContent || "").trim().split(/\s+/).length;
}

function clockSVG() {
  return `<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 4v4l3 2"/></svg>`;
}

function injectPill(eyebrow, minutes) {
  if (!eyebrow || eyebrow.querySelector(".reading-time-pill")) return;
  const pill = document.createElement("span");
  pill.className = "reading-time-pill";
  pill.innerHTML = `${clockSVG()}<span>${minutes} min read</span>`;
  eyebrow.appendChild(pill);
}

function attachProgress(article) {
  const bar = document.querySelector(".scroll-progress");
  if (!bar || !article) return;
  // Mark the body so the CSS scoped rule activates
  document.body.dataset.pageKey = document.body.dataset.pageKey || "case-study";

  const update = () => {
    const rect = article.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    if (total <= 0) {
      bar.style.setProperty("--reading-progress", "1");
      return;
    }
    const scrolled = -rect.top;
    const pct = Math.max(0, Math.min(1, scrolled / total));
    bar.style.setProperty("--reading-progress", String(pct));
  };
  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
}

export async function init() {
  // Only run on case-study pages
  const isCaseStudy =
    document.body?.dataset?.pageKey === "case-study" ||
    document.querySelector(".case-hero, .case-panel");
  if (!isCaseStudy) return null;

  const article = findArticle();
  if (!article) return null;
  const eyebrow = findEyebrow();
  const words = wordCount(article);
  const minutes = Math.max(1, Math.ceil(words / WPM));
  injectPill(eyebrow, minutes);
  attachProgress(article);

  return { minutes, words };
}

export function destroy() {}
