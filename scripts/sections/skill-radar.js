const AXES = [
  { label: "CFD/CHT", evidence: "Siemens thesis: ANSYS Fluent, k-omega SST, CHT and three-level mesh independence." },
  { label: "Energy systems", evidence: "IDA ICE, HOMER Pro, LEAP and Python/PuLP district-heating dispatch modelling." },
  { label: "Industrial decarb", evidence: "Alleima ISO 50001/EED-aligned energy performance mapping methodology." },
  { label: "Research methods", evidence: "TRITA-ITM-EX 2026:14, validation framing and heater-failure root-cause analysis." },
  { label: "Programming", evidence: "Python modelling workflows, MATLAB coursework and TypeScript/NestJS delivery." },
  { label: "Experimental", evidence: "NI-DAQ/LabVIEW commissioning plus battery and thermal laboratory work." },
];

// Values encode relative prominence of documented portfolio evidence in each
// selected reading lens, not a certified proficiency score.
const MODE_VALUES = {
  // Siemens CFD/CHT thesis and measurement-chain commissioning dominate.
  thermal: [95, 55, 48, 82, 68, 88],
  // Multiple public modelling projects dominate; experiments remain supporting.
  energy: [50, 91, 69, 66, 80, 45],
  // Alleima methodology plus energy optimisation are the public anchors.
  decarbonisation: [44, 72, 88, 68, 75, 43],
  // Thesis method and instrumentation lead, supported by thermal modelling.
  research: [86, 51, 45, 93, 67, 82],
};

function point(index, value, radius = 82) {
  const angle = -Math.PI / 2 + (index / AXES.length) * Math.PI * 2;
  const scaled = (value / 100) * radius;
  return [120 + Math.cos(angle) * scaled, 120 + Math.sin(angle) * scaled];
}

function points(values) {
  return values.map((value, index) => point(index, value).join(",")).join(" ");
}

function labelPoint(index) {
  const angle = -Math.PI / 2 + (index / AXES.length) * Math.PI * 2;
  return [120 + Math.cos(angle) * 104, 120 + Math.sin(angle) * 104];
}

function template() {
  return `
    <div class="capability-radar" data-capability-radar>
      <div class="radar-copy">
        <p class="eyebrow">Capability radar</p>
        <h3>Evidence emphasis by track.</h3>
        <p>The polygon shifts with the selected track to show which documented evidence is most prominent. It is not a self-rated proficiency score.</p>
      </div>
      <div class="radar-frame">
        <svg viewBox="0 0 240 240" role="img" aria-label="Capability radar chart">
          <g class="radar-grid" aria-hidden="true">
            ${[20, 40, 60, 80, 100].map((level) => `<polygon points="${points(Array(AXES.length).fill(level))}"></polygon>`).join("")}
            ${AXES.map((_, index) => {
              const [x, y] = point(index, 100);
              return `<line x1="120" y1="120" x2="${x}" y2="${y}"></line>`;
            }).join("")}
          </g>
          <polygon class="radar-signal" data-radar-polygon points="${points(MODE_VALUES.thermal)}"></polygon>
          <g class="radar-labels">
            ${AXES.map((axis, index) => {
              const [x, y] = labelPoint(index);
              return `<text x="${x}" y="${y}" text-anchor="middle">${axis.label}</text>`;
            }).join("")}
          </g>
        </svg>
      </div>
      <div class="radar-readout" data-radar-readout></div>
    </div>`;
}

function update(root, mode, ctx) {
  const activeMode = MODE_VALUES[mode] ? mode : "thermal";
  const values = MODE_VALUES[activeMode];
  const polygon = root.querySelector("[data-radar-polygon]");
  const readout = root.querySelector("[data-radar-readout]");
  const nextPoints = points(values);

  if (ctx.gsap && !ctx.reducedMotion) {
    ctx.gsap.to(polygon, { attr: { points: nextPoints }, duration: 0.45, ease: "power2.out" });
  } else {
    polygon.setAttribute("points", nextPoints);
  }

  readout.innerHTML = AXES.map((axis, index) => `
    <span title="${axis.evidence}"><strong>${values[index]}</strong>${axis.label}</span>
  `).join("");
}

export async function init(ctx) {
  const host = document.querySelector("[data-dynamic-skills]");
  if (!host || document.querySelector("[data-capability-radar]")) return null;
  host.insertAdjacentHTML("beforebegin", template());
  const radar = document.querySelector("[data-capability-radar]");
  const off = ctx.bus.on("motion:mode-change", ({ mode }) => update(radar, mode, ctx));
  update(radar, document.body.dataset.homeMode || "thermal", ctx);
  return { destroy() { off?.(); radar.remove(); } };
}

export function destroy(instance) {
  instance?.destroy?.();
}
