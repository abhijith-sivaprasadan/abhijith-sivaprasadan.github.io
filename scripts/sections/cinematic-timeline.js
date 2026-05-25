/**
 * Compact chronological experience rail for the homepage.
 *
 * The previous geographic panel consumed a large viewport area without adding
 * evidence. This rail keeps chronology, location and role selection visible
 * while the full role cards carry the engineering detail.
 */

const MILESTONES = [
  { key: "qburst", years: "2021-23", label: "QBurst", place: "Kerala", discipline: "Software delivery" },
  { key: "kth", years: "2024", label: "KTH", place: "Stockholm", discipline: "Pyrolysis research" },
  { key: "alleima", years: "2024-25", label: "Alleima", place: "Sandviken", discipline: "Energy performance" },
  { key: "siemens", years: "2025", label: "Siemens Energy", place: "Finsp&aring;ng", discipline: "CFD / CHT thesis" },
];

function keyFromText(text) {
  const value = text.toLowerCase();
  if (value.includes("siemens")) return "siemens";
  if (value.includes("alleima")) return "alleima";
  if (value.includes("qburst")) return "qburst";
  if (value.includes("kth")) return "kth";
  return "other";
}

function buildRail() {
  return `
    <nav class="experience-rail" data-experience-rail aria-label="Experience chronology">
      ${MILESTONES.map((item) => `
        <button class="experience-stop experience-stop-${item.key}" data-place="${item.key}" type="button">
          <time>${item.years}</time>
          <strong>${item.label}</strong>
          <span>${item.place}</span>
          <small>${item.discipline}</small>
        </button>`).join("")}
    </nav>`;
}

function markItems(timeline) {
  const items = Array.from(timeline.querySelectorAll(".timeline-item"));
  items.forEach((item, index) => {
    const key = keyFromText(item.textContent);
    item.dataset.timelineIndex = String(index);
    item.dataset.placeKey = key;
    item.classList.add("cinematic-role-card");
    if (key === "siemens") item.classList.add("is-primary-role");
  });
  const byKey = new Map(items.map((item) => [item.dataset.placeKey, item]));
  const ordered = MILESTONES.map((milestone) => byKey.get(milestone.key)).filter(Boolean);
  ordered.forEach((item) => timeline.appendChild(item));
  return ordered;
}

function setActive(items, index, rail) {
  const key = items[index]?.dataset.placeKey;
  items.forEach((item, itemIndex) => item.classList.toggle("is-active", itemIndex === index));
  rail?.querySelectorAll("[data-place]").forEach((button) => {
    const current = button.dataset.place === key;
    button.classList.toggle("is-active", current);
    if (current) button.setAttribute("aria-current", "true");
    else button.removeAttribute("aria-current");
  });
}

export async function init(ctx) {
  const timeline = document.querySelector("#experience .timeline");
  if (!timeline || timeline.classList.contains("cinematic-timeline")) return null;
  timeline.classList.add("cinematic-timeline");
  const items = markItems(timeline);
  timeline.insertAdjacentHTML("beforebegin", buildRail());
  const rail = document.querySelector("[data-experience-rail]");
  const primaryIndex = items.findIndex((item) => item.dataset.placeKey === "siemens");
  setActive(items, primaryIndex >= 0 ? primaryIndex : 0, rail);

  const selectRole = (event) => {
    const stop = event.target.closest("[data-place]");
    if (!stop) return;
    const target = items.find((item) => item.dataset.placeKey === stop.dataset.place);
    if (!target) return;
    setActive(items, Number(target.dataset.timelineIndex), rail);
    target.scrollIntoView({ behavior: ctx.reducedMotion ? "auto" : "smooth", block: "nearest", inline: "center" });
  };
  rail?.addEventListener("click", selectRole);

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    setActive(items, Number(visible.target.dataset.timelineIndex || 0), rail);
  }, { threshold: [0.35, 0.55, 0.75] });
  items.forEach((item) => observer.observe(item));

  return {
    destroy() {
      observer.disconnect();
      rail?.removeEventListener("click", selectRole);
      rail?.remove();
      timeline.classList.remove("cinematic-timeline");
      items.forEach((item) => item.classList.remove("cinematic-role-card", "is-primary-role", "is-active"));
    },
  };
}

export function destroy(instance) {
  instance?.destroy?.();
}
