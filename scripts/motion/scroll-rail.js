/**
 * Sticky right-side scroll rail.
 *
 * Renders a vertical column of small dot buttons, one per top-level
 * <section id="…"> in the page. The active section's dot is highlighted;
 * dots fill progressively as the user scrolls past them. Click jumps.
 *
 * Touch / small screens: rail is hidden via CSS.
 */

let ctx = null;
let rail = null;
let sections = [];
let buttons = [];
let observer = null;

function build() {
  rail = document.createElement("nav");
  rail.className = "motion-scroll-rail";
  rail.setAttribute("aria-label", "Section progress");

  sections = Array.from(document.querySelectorAll("main > section[id], section.section[id]"))
    .filter((s) => s.offsetHeight > 100);

  buttons = sections.map((s) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.target = s.id;
    btn.setAttribute("aria-label", `Jump to ${s.getAttribute("aria-label") || s.id}`);
    btn.addEventListener("click", () => {
      s.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    rail.appendChild(btn);
    return btn;
  });

  document.body.appendChild(rail);
  requestAnimationFrame(() => rail.classList.add("is-ready"));
}

function watch() {
  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const idx = sections.indexOf(entry.target);
      if (idx < 0) return;
      const btn = buttons[idx];
      if (!btn) return;
      if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
        // Mark this as current
        buttons.forEach((b) => b.removeAttribute("aria-current"));
        btn.setAttribute("aria-current", "true");
      }
      // Mark "passed" sections as progress=true (have been scrolled past)
      const rect = entry.target.getBoundingClientRect();
      if (rect.bottom < window.innerHeight * 0.4) {
        btn.dataset.passed = "true";
      } else {
        delete btn.dataset.passed;
      }
    });
  }, { threshold: [0, 0.5, 1] });

  sections.forEach((s) => observer.observe(s));
}

export async function init(c) {
  ctx = c;
  if (window.innerWidth < 980) return null; // skip on mobile
  build();
  if (sections.length < 2) {
    rail.remove();
    return null;
  }
  watch();

  return {
    destroy() {
      observer?.disconnect();
      rail?.remove();
    },
  };
}

export function destroy(inst) { inst?.destroy?.(); }
