const PLACES = [
  { key: "siemens", label: "Siemens Energy", place: "Finspang", x: 32, y: 52 },
  { key: "alleima", label: "Alleima", place: "Sandviken", x: 38, y: 42 },
  { key: "kth", label: "KTH", place: "Stockholm", x: 43, y: 51 },
  { key: "qburst", label: "QBurst", place: "Kerala", x: 79, y: 73 },
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
        <g class="map-silhouette" aria-hidden="true">
          <path class="sweden-shape" d="M34 11L39 14 40 22 44 27 42 35 46 43 45 52 39 60 37 70 32 75 29 66 31 56 28 47 31 37 29 29 32 22Z"></path>
          <path class="kerala-inset" d="M69 58H91V87H69Z"></path>
          <path class="kerala-shape" d="M79 62L82 66 81 71 84 76 82 82 79 84 78 78 76 73 77 68Z"></path>
          <text x="26" y="88">SWEDEN</text>
          <text x="70" y="94">KERALA INSET</text>
        </g>
        <polyline points="38,42 43,51 32,52" />
        ${PLACES.map((place) => `
          <circle class="map-dot map-dot-${place.key}" cx="${place.x}" cy="${place.y}" r="1.7"></circle>`).join("")}
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
