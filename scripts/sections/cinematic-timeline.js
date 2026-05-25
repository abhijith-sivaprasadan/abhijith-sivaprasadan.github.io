/**
 * Cinematic timeline + geo-map on #experience.
 *
 * w16: better SVG silhouettes (Sweden outline + Kerala/India inset), tighter
 * pin placement matching real geography, narrower viewBox for legibility at
 * homepage scale.
 *
 * Pin positions (viewBox 100 × 100):
 *   - Stockholm:  47, 45  (KTH)
 *   - Finspång:   46, 47  (Siemens — slightly south of Stockholm)
 *   - Sandviken:  44, 39  (Alleima — north-west of Stockholm)
 *   - Kerala:     80, 80  (QBurst — in the India inset)
 */

const PLACES = [
  { key: "kth",     label: "KTH",     place: "Stockholm",  x: 47, y: 45 },
  { key: "siemens", label: "Siemens", place: "Finspång",   x: 46, y: 47 },
  { key: "alleima", label: "Alleima", place: "Sandviken",  x: 44, y: 39 },
  { key: "qburst",  label: "QBurst",  place: "Kerala",     x: 80, y: 80 },
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
  // Sweden outline — stylised but recognisably proportioned (long-thin shape
  // with the southern bulge at Skåne).
  const swedenPath = `
    M 41 8
    Q 44 10 45 14
    Q 47 18 47 22
    Q 47 25 45 28
    Q 47 30 49 34
    Q 50 38 49 42
    Q 49 46 47 50
    Q 47 54 49 58
    Q 49 61 47 63
    Q 44 64 43 62
    Q 40 60 38 58
    Q 36 54 36 50
    Q 38 47 38 43
    Q 37 39 36 36
    Q 38 32 39 28
    Q 38 24 38 21
    Q 39 16 41 12 Z
  `.replace(/\s+/g, " ").trim();

  // Norway shadow on the west side (decorative — lighter stroke, no fill)
  const norwayPath = `
    M 37 8 Q 35 12 33 18 Q 31 24 30 30 Q 28 36 29 42 Q 31 48 34 52 Q 36 56 38 58
  `.replace(/\s+/g, " ").trim();

  // India outline (in the inset box on the right). Stylised triangular shape.
  const indiaPath = `
    M 78 62
    Q 82 64 84 68
    Q 86 72 85 76
    Q 84 80 80 84
    Q 77 86 75 84
    Q 73 80 73 76
    Q 73 71 75 67
    Q 76 64 78 62 Z
  `.replace(/\s+/g, " ").trim();

  // Connecting polyline through the three Swedish cities
  const swedenRoute = "44,39 47,45 46,47";

  return `
    <div class="experience-map" data-experience-map>
      <div class="experience-map-grid" aria-hidden="true"></div>
      <svg viewBox="0 0 100 100" role="img" aria-label="Experience locations: Sweden + Kerala">
        <g class="map-silhouette" aria-hidden="true">
          <path class="sweden-shape" d="${swedenPath}"></path>
          <path class="norway-edge" d="${norwayPath}"></path>
          <path class="kerala-inset" d="M70 58 H92 V90 H70 Z"></path>
          <path class="india-shape" d="${indiaPath}"></path>
          <text x="29" y="93">SWEDEN</text>
          <text x="72" y="60">INDIA</text>
        </g>
        <polyline class="sweden-route" points="${swedenRoute}" />
        ${PLACES.map((place) => `
          <circle class="map-dot map-dot-${place.key}" cx="${place.x}" cy="${place.y}" r="1.6"></circle>`).join("")}
      </svg>
      <div class="map-pin-layer">
        ${PLACES.map((place) => `
          <button class="map-pin map-pin-${place.key}" data-place="${place.key}" type="button" style="--x:${place.x};--y:${place.y}">
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
