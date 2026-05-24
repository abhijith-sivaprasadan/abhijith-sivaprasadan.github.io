const PLACES = [
  { key: "siemens", label: "Siemens Energy", place: "Finspang", x: 48, y: 42 },
  { key: "alleima", label: "Alleima", place: "Sandviken", x: 45, y: 28 },
  { key: "qburst", label: "QBurst", place: "Kerala", x: 68, y: 78 },
  { key: "kth", label: "KTH", place: "Stockholm", x: 50, y: 34 },
];

function keyFromText(text) {
  const value = text.toLowerCase();
  if (value.includes("siemens")) return "siemens";
  if (value.includes("alleima")) return "alleima";
  if (value.includes("qburst")) return "qburst";
  if (value.includes("kth")) return "kth";
  return "other";
}

function buildMap() {
  return `
    <div class="experience-map" data-experience-map>
      <div class="experience-map-grid" aria-hidden="true"></div>
      <svg viewBox="0 0 100 100" role="img" aria-label="Experience locations">
        <polyline points="50,34 48,42 45,28 68,78" />
        ${PLACES.map((place) => `
          <circle class="map-dot" cx="${place.x}" cy="${place.y}" r="1.6"></circle>`).join("")}
      </svg>
      <div class="map-pin-layer">
        ${PLACES.map((place) => `
          <button class="map-pin" data-place="${place.key}" type="button" style="--x:${place.x};--y:${place.y}">
            <span>${place.label}</span>
            <small>${place.place}</small>
          </button>`).join("")}
      </div>
    </div>`;
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
  return items;
}

function setActive(items, index) {
  items.forEach((item, itemIndex) => item.classList.toggle("is-active", itemIndex === index));
}

export async function init(ctx) {
  const timeline = document.querySelector("#experience .timeline");
  if (!timeline || timeline.classList.contains("cinematic-timeline")) return null;
  timeline.classList.add("cinematic-timeline");
  const items = markItems(timeline);
  timeline.insertAdjacentHTML("beforebegin", buildMap());
  const map = document.querySelector("[data-experience-map]");
  setActive(items, 0);

  map.addEventListener("click", (event) => {
    const pin = event.target.closest("[data-place]");
    if (!pin) return;
    const target = items.find((item) => item.dataset.placeKey === pin.dataset.place);
    target?.scrollIntoView({ behavior: ctx.reducedMotion ? "auto" : "smooth", block: "center", inline: "center" });
  });

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    setActive(items, Number(visible.target.dataset.timelineIndex || 0));
  }, { threshold: [0.35, 0.55, 0.75] });
  items.forEach((item) => observer.observe(item));

  return {
    destroy() {
      observer.disconnect();
      map.remove();
      timeline.classList.remove("cinematic-timeline");
      items.forEach((item) => item.classList.remove("cinematic-role-card", "is-primary-role", "is-active"));
    },
  };
}

export function destroy(instance) {
  instance?.destroy?.();
}
