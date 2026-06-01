const AXES = [
  {
    label: "CFD/CHT",
    evidence: "ANSYS Fluent, k-omega SST, conjugate heat transfer, compressible reducer flow and mesh-independence work.",
  },
  {
    label: "Test chain",
    evidence: "NI-DAQ/LabVIEW commissioning, thermocouple chains, high-temperature test context and root-cause analysis.",
  },
  {
    label: "Energy models",
    evidence: "IDA ICE, HOMER Pro, LEAP, SAM and district-heating model inputs across building and energy-system studies.",
  },
  {
    label: "Optimisation",
    evidence: "Python/PuLP dispatch, scenario screening, techno-economic assessment and decision-support modelling.",
  },
  {
    label: "Data/code",
    evidence: "Python, pandas, scikit-learn, Streamlit/Plotly, TypeScript/NestJS and reproducible engineering tools.",
  },
  {
    label: "Industrial EnPI",
    evidence: "ISO 50001/EED-style KPI and EnPI framing, load-driver logic, metering readiness and industrial utilities.",
  },
  {
    label: "CAD/FEA",
    evidence: "Siemens NX, Teamcenter, SolidWorks, ANSYS Mechanical/SpaceClaim and structural modelling context.",
  },
  {
    label: "Research",
    evidence: "Thesis framing, validation logic, thermal resistance interpretation, literature synthesis and research statements.",
  },
];

const TRACKS = {
  everything: {
    label: "All tracks",
    color: "#f6c85f",
    summary: "Max envelope across the focused tracks.",
  },
  thermal: {
    label: "Thermal & Fluid",
    color: "#65d6c9",
    summary: "Simulation, measurement chain and validation-heavy profile.",
    values: [92, 86, 32, 38, 64, 26, 78, 82],
  },
  energy: {
    label: "Energy Systems",
    color: "#9bd69f",
    summary: "Energy modelling, optimisation and data workflow profile.",
    values: [28, 36, 92, 84, 78, 62, 22, 68],
  },
  decarbonisation: {
    label: "Industrial R&D",
    color: "#f0561d",
    summary: "Industrial energy, EnPI and decision-support profile.",
    values: [26, 52, 74, 88, 76, 92, 34, 70],
  },
  research: {
    label: "Research",
    color: "#8fb7ff",
    summary: "Thesis, methods, validation and experimental-numerical framing profile.",
    values: [84, 82, 42, 48, 72, 38, 66, 94],
  },
};

const TRACK_ORDER = ["thermal", "energy", "decarbonisation", "research"];
const CX = 160;
const CY = 150;
const RADIUS = 96;

function combinedValues() {
  return AXES.map((_, index) => Math.max(...TRACK_ORDER.map((track) => TRACKS[track].values[index])));
}

function profileFor(mode) {
  const key = TRACKS[mode] ? mode : "thermal";
  const track = TRACKS[key];
  return {
    key,
    label: track.label,
    color: track.color,
    summary: track.summary,
    values: key === "everything" ? combinedValues() : track.values,
  };
}

function angleAt(index) {
  return -Math.PI / 2 + (index / AXES.length) * Math.PI * 2;
}

function point(index, value, radius = RADIUS) {
  const angle = angleAt(index);
  const scaled = (value / 100) * radius;
  return [
    CX + Math.cos(angle) * scaled,
    CY + Math.sin(angle) * scaled,
  ];
}

function polygonPoints(values) {
  return values.map((value, index) => point(index, value).join(",")).join(" ");
}

function labelAnchor(index) {
  const x = Math.cos(angleAt(index));
  if (Math.abs(x) < 0.32) return "middle";
  return x > 0 ? "start" : "end";
}

function template() {
  const gridValues = [25, 50, 75, 100];
  return `
    <section class="capability-radar radar-self" data-capability-radar>
      <header class="radar-head">
        <div>
          <span>Capability radar</span>
          <strong data-radar-title>Thermal &amp; Fluid</strong>
        </div>
        <button type="button" class="radar-all-btn" data-radar-local-mode="everything" aria-pressed="false">All</button>
      </header>
      <div class="radar-frame">
        <svg viewBox="0 0 320 300" role="img" aria-label="Self-assessed capability radar chart">
          <g class="radar-grid" aria-hidden="true">
            ${gridValues.map((level) => `<polygon points="${polygonPoints(AXES.map(() => level))}"></polygon>`).join("")}
            ${AXES.map((_, index) => {
              const [x, y] = point(index, 100);
              return `<line x1="${CX}" y1="${CY}" x2="${x}" y2="${y}"></line>`;
            }).join("")}
          </g>
          <polygon class="radar-signal" data-radar-polygon points="${polygonPoints(AXES.map(() => 0))}"></polygon>
          <line class="radar-sweep" x1="${CX}" y1="${CY}" x2="${CX}" y2="${CY - RADIUS}" aria-hidden="true"></line>
          <g class="radar-labels">
            ${AXES.map((axis, index) => {
              const [x, y] = point(index, 118);
              return `<text class="radar-axis" x="${x}" y="${y}" text-anchor="${labelAnchor(index)}" dominant-baseline="middle">${axis.label}</text>`;
            }).join("")}
          </g>
          <g class="radar-vertices">
            ${AXES.map((_, index) => `
              <g data-radar-vertex="${index}">
                <circle class="radar-point" data-radar-point r="3" cx="${CX}" cy="${CY}"></circle>
                <text class="radar-val" data-radar-value x="${CX}" y="${CY}" text-anchor="middle">0</text>
              </g>
            `).join("")}
          </g>
        </svg>
      </div>
      <div class="radar-readout" data-radar-readout>
        ${AXES.map((axis, index) => `
          <button type="button" data-radar-axis="${index}" title="${axis.evidence}">
            <span>${axis.label}</span>
            <strong data-radar-readout-value="${index}">0</strong>
          </button>
        `).join("")}
      </div>
      <article class="radar-evidence" data-radar-evidence aria-live="polite"></article>
      <p class="radar-note" data-radar-note>0-100 self-assessed. Switch focus to compare profiles.</p>
    </section>`;
}

function renderValues(root, values) {
  root.querySelector("[data-radar-polygon]")?.setAttribute("points", polygonPoints(values));
  AXES.forEach((_, index) => {
    const value = values[index];
    const [x, y] = point(index, value);
    const vertex = root.querySelector(`[data-radar-vertex="${index}"]`);
    const dot = vertex?.querySelector("[data-radar-point]");
    const label = vertex?.querySelector("[data-radar-value]");
    const readout = root.querySelector(`[data-radar-readout-value="${index}"]`);
    dot?.setAttribute("cx", x.toFixed(2));
    dot?.setAttribute("cy", y.toFixed(2));
    label?.setAttribute("x", x.toFixed(2));
    label?.setAttribute("y", (y - 8).toFixed(2));
    if (label) label.textContent = String(Math.round(value));
    if (readout) readout.textContent = String(Math.round(value));
  });
}

function selectAxis(root, state, index) {
  state.selectedAxis = index;
  const value = state.current[index] ?? state.target[index] ?? 0;
  root.querySelectorAll("[data-radar-axis]").forEach((button) => {
    button.classList.toggle("is-selected", Number(button.getAttribute("data-radar-axis")) === index);
  });
  const detail = root.querySelector("[data-radar-evidence]");
  if (detail) {
    detail.innerHTML = `
      <strong>${AXES[index].label}<span>${Math.round(value)} / 100</span></strong>
      <p>${AXES[index].evidence}</p>`;
  }
}

function animateTo(root, state, target, immediate = false) {
  cancelAnimationFrame(state.raf);
  const start = state.current.slice();
  const startTime = performance.now();
  const duration = immediate ? 0 : 620;
  const stagger = immediate ? 0 : 26;
  const ease = (t) => 1 - Math.pow(1 - t, 3);

  const step = (now) => {
    const next = start.map((value, index) => {
      if (!duration) return target[index];
      const local = Math.min(1, Math.max(0, (now - startTime - index * stagger) / duration));
      return value + (target[index] - value) * ease(local);
    });
    state.current = next;
    renderValues(root, next);
    selectAxis(root, state, state.selectedAxis);
    if (next.some((value, index) => Math.abs(value - target[index]) > 0.2)) {
      state.raf = requestAnimationFrame(step);
    } else {
      state.current = target.slice();
      renderValues(root, state.current);
      selectAxis(root, state, state.selectedAxis);
    }
  };

  state.raf = requestAnimationFrame(step);
}

function setMode(root, state, mode, immediate = false) {
  const profile = profileFor(mode);
  if (state.mode === profile.key && !immediate) return;
  state.mode = profile.key;
  state.target = profile.values.slice();
  root.dataset.radarMode = profile.key;
  root.style.setProperty("--radar-color", profile.color);

  const title = root.querySelector("[data-radar-title]");
  const note = root.querySelector("[data-radar-note]");
  if (title) title.textContent = profile.label;
  if (note) note.textContent = `${profile.summary} 0-100 self-assessed.`;

  root.querySelectorAll("[data-radar-local-mode]").forEach((button) => {
    const active = button.getAttribute("data-radar-local-mode") === profile.key;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });

  const strongest = profile.values.indexOf(Math.max(...profile.values));
  state.selectedAxis = strongest >= 0 ? strongest : 0;
  animateTo(root, state, profile.values, immediate || state.reducedMotion);
}

export async function init(ctx = {}) {
  const anchor = document.querySelector("[data-skill-radar]");
  if (!anchor || anchor.dataset.radarMounted === "true") return null;
  anchor.dataset.radarMounted = "true";
  anchor.innerHTML = template();

  const root = anchor.querySelector("[data-capability-radar]");
  if (!root) return null;

  const state = {
    mode: "",
    current: AXES.map(() => 0),
    target: AXES.map(() => 0),
    selectedAxis: 0,
    raf: 0,
    reducedMotion: Boolean(ctx.reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches),
  };

  const onClick = (event) => {
    const axisButton = event.target.closest?.("[data-radar-axis]");
    if (axisButton) {
      selectAxis(root, state, Number(axisButton.getAttribute("data-radar-axis")));
      return;
    }
    const modeButton = event.target.closest?.("[data-radar-local-mode]");
    if (modeButton) {
      setMode(root, state, modeButton.getAttribute("data-radar-local-mode"));
    }
  };

  const onHomeMode = (event) => {
    setMode(root, state, event.detail?.mode || document.body.dataset.homeMode || "thermal");
  };

  root.addEventListener("click", onClick);
  document.addEventListener("home-mode-change", onHomeMode);

  const offBus = ctx.bus?.on?.("motion:mode-change", ({ mode }) => {
    setMode(root, state, mode || document.body.dataset.homeMode || "thermal");
  });

  const modeObserver = new MutationObserver(() => {
    setMode(root, state, document.body.dataset.homeMode || "thermal");
  });
  modeObserver.observe(document.body, { attributes: true, attributeFilter: ["data-home-mode"] });

  setMode(root, state, document.body.dataset.homeMode || "thermal", true);

  return {
    destroy() {
      cancelAnimationFrame(state.raf);
      root.removeEventListener("click", onClick);
      document.removeEventListener("home-mode-change", onHomeMode);
      modeObserver.disconnect();
      offBus?.();
      anchor.innerHTML = "";
      delete anchor.dataset.radarMounted;
    },
  };
}

export function destroy(instance) {
  instance?.destroy?.();
}
