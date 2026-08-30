const AXES = [
  { label: "CFD/CHT",       evidence: "ANSYS Fluent, k-omega SST, conjugate heat transfer, compressible reducer flow and mesh-independence work." },
  { label: "Test chain",    evidence: "NI-DAQ/LabVIEW commissioning, thermocouple chains, high-temperature test context and root-cause analysis." },
  { label: "Energy models", evidence: "IDA ICE, HOMER Pro, LEAP, SAM and district-heating model inputs across building and energy-system studies." },
  { label: "Optimisation",  evidence: "Python/PuLP dispatch, scenario screening, techno-economic assessment and decision-support modelling." },
  { label: "Data/code",     evidence: "Python, pandas, scikit-learn, Streamlit/Plotly, TypeScript/NestJS and reproducible engineering tools." },
  { label: "Industrial EnPI", evidence: "ISO 50001/EED-style KPI and EnPI framing, load-driver logic, metering readiness and industrial utilities." },
  { label: "CAD/FEA",       evidence: "Siemens NX, Teamcenter, SolidWorks, ANSYS Mechanical/SpaceClaim and structural modelling context." },
  { label: "Research",      evidence: "Thesis framing, validation logic, thermal resistance interpretation, literature synthesis and research statements." },
];

const TRACKS = {
  everything: { label: "All tracks", color: "#f6c85f", summary: "Max envelope across the focused tracks." },
  thermal:    { label: "Thermal & Fluid",  color: "#65d6c9", summary: "Simulation, measurement chain and validation-heavy profile.", values: [92, 86, 32, 38, 64, 26, 78, 82] },
  energy:     { label: "Energy Systems",   color: "#9bd69f", summary: "Energy modelling, optimisation and data workflow profile.",    values: [28, 36, 92, 84, 78, 62, 22, 68] },
  decarbonisation: { label: "Industrial R&D", color: "#f0561d", summary: "Industrial energy, EnPI and decision-support profile.",    values: [26, 52, 74, 88, 76, 92, 34, 70] },
  research:   { label: "Research",         color: "#8fb7ff", summary: "Thesis, methods, validation and experimental-numerical framing profile.", values: [84, 82, 42, 48, 72, 38, 66, 94] },
};

const TRACK_ORDER = ["thermal", "energy", "decarbonisation", "research"];
const CX = 160;
const CY = 150;
const RADIUS = 96;

function combinedValues() {
  return AXES.map((_, i) => Math.max(...TRACK_ORDER.map((t) => TRACKS[t].values[i])));
}

function profileFor(mode) {
  const key = TRACKS[mode] ? mode : "everything";
  const track = TRACKS[key];
  return { key, label: track.label, color: track.color, summary: track.summary,
           values: key === "everything" ? combinedValues() : track.values };
}

function angleAt(index) {
  return -Math.PI / 2 + (index / AXES.length) * Math.PI * 2;
}

function point(index, value, radius = RADIUS) {
  const angle = angleAt(index);
  const scaled = (value / 100) * radius;
  return [CX + Math.cos(angle) * scaled, CY + Math.sin(angle) * scaled];
}

function polygonPoints(values) {
  return values.map((v, i) => point(i, v).join(",")).join(" ");
}

function labelAnchor(index) {
  const x = Math.cos(angleAt(index));
  if (Math.abs(x) < 0.32) return "middle";
  return x > 0 ? "start" : "end";
}

function template() {
  const gridLevels = [25, 50, 75, 100];
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
          <defs>
            <radialGradient id="radarFill" cx="50%" cy="42%" r="60%">
              <stop offset="0%"   stop-color="var(--radar-color)" stop-opacity="0.65"/>
              <stop offset="45%"  stop-color="var(--radar-color)" stop-opacity="0.28"/>
              <stop offset="100%" stop-color="var(--radar-color)" stop-opacity="0.04"/>
            </radialGradient>
            <filter id="radarGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="7" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <!-- Sweep trail gradients — radial from center so they work on any arc angle -->
            <radialGradient id="sweepTrailGrad" cx="${CX}" cy="${CY}" r="${RADIUS}" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stop-color="var(--radar-color)" stop-opacity="0"/>
              <stop offset="18%"  stop-color="var(--radar-color)" stop-opacity="0.35"/>
              <stop offset="65%"  stop-color="var(--radar-color)" stop-opacity="0.25"/>
              <stop offset="100%" stop-color="var(--radar-color)" stop-opacity="0"/>
            </radialGradient>
            <radialGradient id="sweepHaloGrad" cx="${CX}" cy="${CY}" r="${RADIUS}" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stop-color="var(--radar-color)" stop-opacity="0"/>
              <stop offset="12%"  stop-color="var(--radar-color)" stop-opacity="0.12"/>
              <stop offset="70%"  stop-color="var(--radar-color)" stop-opacity="0.08"/>
              <stop offset="100%" stop-color="var(--radar-color)" stop-opacity="0"/>
            </radialGradient>
          </defs>

          <!-- Outer halo ring -->
          <circle class="radar-halo" cx="${CX}" cy="${CY}" r="${RADIUS + 22}" aria-hidden="true"/>

          <!-- Grid rings + spokes -->
          <g class="radar-grid" aria-hidden="true">
            ${gridLevels.map((lvl, i) =>
              `<polygon class="radar-ring ring-${i}" points="${polygonPoints(AXES.map(() => lvl))}"/>`
            ).join("")}
            ${AXES.map((_, i) => {
              const [x, y] = point(i, 100);
              return `<line x1="${CX}" y1="${CY}" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}"/>`;
            }).join("")}
          </g>

          <!-- Signal polygon -->
          <polygon class="radar-signal" data-radar-polygon
            fill="url(#radarFill)" filter="url(#radarGlow)"
            points="${polygonPoints(AXES.map(() => 0))}"/>

          <!-- Sweep beam — group rotates via CSS; trail wedges create fan effect -->
          <g class="radar-sweep-g" aria-hidden="true">
            <!-- Wide dim halo (40° trailing fan) -->
            <path class="radar-sweep-trail radar-sweep-trail--wide"
                  d="M ${CX},${CY} L ${CX},${CY - RADIUS} A ${RADIUS},${RADIUS},0,0,0,${(CX - RADIUS * Math.sin(0.6981)).toFixed(2)},${(CY - RADIUS * Math.cos(0.6981)).toFixed(2)} Z"
                  fill="url(#sweepHaloGrad)" stroke="none"/>
            <!-- Narrow bright trail (25°) -->
            <path class="radar-sweep-trail"
                  d="M ${CX},${CY} L ${CX},${CY - RADIUS} A ${RADIUS},${RADIUS},0,0,0,${(CX - RADIUS * Math.sin(0.4363)).toFixed(2)},${(CY - RADIUS * Math.cos(0.4363)).toFixed(2)} Z"
                  fill="url(#sweepTrailGrad)" stroke="none"/>
            <!-- Leading edge line -->
            <line class="radar-sweep" x1="${CX}" y1="${CY}" x2="${CX}" y2="${CY - RADIUS}"/>
          </g>

          <!-- Centre core dot -->
          <circle class="radar-core" cx="${CX}" cy="${CY}" r="4.5" aria-hidden="true"/>

          <!-- Axis labels -->
          <g class="radar-labels">
            ${AXES.map((axis, i) => {
              const [x, y] = point(i, 120);
              return `<text class="radar-axis" x="${x.toFixed(2)}" y="${y.toFixed(2)}"
                        text-anchor="${labelAnchor(i)}" dominant-baseline="middle">${axis.label}</text>`;
            }).join("")}
          </g>
        </svg>
      </div>

      <!-- Readout buttons -->
      <div class="radar-readout" data-radar-readout>
        ${AXES.map((axis, i) => `
          <button type="button" data-radar-axis="${i}" title="${axis.evidence}">
            <span>${axis.label}</span>
            <strong data-radar-readout-value="${i}">0</strong>
          </button>`).join("")}
      </div>

      <article class="radar-evidence" data-radar-evidence aria-live="polite"></article>
      <p class="radar-note" data-radar-note>0–100 self-assessed. Switch focus to compare profiles.</p>
    </section>`;
}

function renderValues(root, values) {
  root.querySelector("[data-radar-polygon]")?.setAttribute("points", polygonPoints(values));
  AXES.forEach((_, i) => {
    const el = root.querySelector(`[data-radar-readout-value="${i}"]`);
    if (el) el.textContent = String(Math.round(values[i]));
  });
}

function selectAxis(root, state, index) {
  state.selectedAxis = index;
  const value = state.current[index] ?? state.target[index] ?? 0;
  root.querySelectorAll("[data-radar-axis]").forEach((btn) => {
    btn.classList.toggle("is-selected", Number(btn.getAttribute("data-radar-axis")) === index);
  });
  const detail = root.querySelector("[data-radar-evidence]");
  if (detail) {
    detail.innerHTML = `
      <strong>${AXES[index].label}<span>${Math.round(value)} / 100</span></strong>
      <p>${AXES[index].evidence}</p>`;
  }
}

// Spring physics: K=stiffness, B=damping — gives a subtle elastic overshoot
function animateTo(root, state, target, immediate = false) {
  cancelAnimationFrame(state.raf);

  if (immediate || state.reducedMotion) {
    state.current = target.slice();
    state.velocities = AXES.map(() => 0);
    renderValues(root, state.current);
    selectAxis(root, state, state.selectedAxis);
    return;
  }

  const K = 220;   // stiffness — higher = snappier
  const B = 20;    // damping  — lower = more bounce
  const dt = 1 / 60;

  const step = () => {
    let settled = true;
    state.current = state.current.map((pos, i) => {
      const vel = state.velocities[i];
      const force = -K * (pos - target[i]) - B * vel;
      const newVel = vel + force * dt;
      const newPos = pos + newVel * dt;
      state.velocities[i] = newVel;
      if (Math.abs(newPos - target[i]) > 0.08 || Math.abs(newVel) > 0.12) settled = false;
      return newPos;
    });
    renderValues(root, state.current);
    selectAxis(root, state, state.selectedAxis);
    if (!settled) {
      state.raf = requestAnimationFrame(step);
    } else {
      state.current = target.slice();
      state.velocities = AXES.map(() => 0);
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
  const note  = root.querySelector("[data-radar-note]");
  if (title) title.textContent = profile.label;
  if (note)  note.textContent  = `${profile.summary} 0–100 self-assessed.`;

  root.querySelectorAll("[data-radar-local-mode]").forEach((btn) => {
    const active = btn.getAttribute("data-radar-local-mode") === profile.key;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
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
    target:  AXES.map(() => 0),
    velocities: AXES.map(() => 0),
    selectedAxis: 0,
    raf: 0,
    reducedMotion: Boolean(ctx.reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches),
  };

  const onClick = (event) => {
    const axisBtn = event.target.closest?.("[data-radar-axis]");
    if (axisBtn) { selectAxis(root, state, Number(axisBtn.getAttribute("data-radar-axis"))); return; }
    const modeBtn = event.target.closest?.("[data-radar-local-mode]");
    if (modeBtn) setMode(root, state, modeBtn.getAttribute("data-radar-local-mode"));
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

export function destroy(instance) { instance?.destroy?.(); }
