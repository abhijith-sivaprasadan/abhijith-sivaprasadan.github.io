/**
 * Thesis scrollytelling — Siemens reducer story in 5 pinned beats.
 *
 * v4-w16c: source figures remain the evidence layer. A separate parametric
 * SVG interpretation uses the reported reducer proportions (35.05 -> 11.25
 * -> 6.0 mm for legacy; 150 mm C2 quintic for redesigned) solely for clipped
 * motion and thermal annotation. It is not presented as new CFD output.
 *
 * Beats:
 *   1. geometry  - the exported geometry figures and reported dimensions.
 *   2. mesh      - the exported mesh figures; no browser-generated mesh is
 *                  substituted for the actual analysis evidence.
 *   3. flow      - exported CFD streamline figures plus a clearly labelled,
 *                  geometry-clipped moving interpretation below them.
 *   4. thermal   — wall colour gradients from 673 K inlet → outlet. Biot
 *                  decomposition annotation appears (Bi = hL/k = 0.003-0.004).
 *   5. kpi       — the 4 thesis KPI badges fly in (673 K, Bi, Ma, 8/8) with
 *                  trace lines back to the relevant anatomy.
 *
 * Coordinate system (viewBox 960 × 540):
 *   - Centreline of legacy reducer: y = 160
 *   - Centreline of redesigned reducer: y = 400
 *   - Inlet x-start: 80   Outlet x-end: 880 (length 800 ≈ 200 mm)
 *   - Half-radius scaling: 40 units = 35.05/2 mm, 7 units = 6/2 mm (5.7:1 ratio
 *     matches the actual 35.05/6.0 = 5.84:1 within 2%).
 */

const BEATS = [
  {
    key: "geometry",
    label: "01 / Geometry",
    title: "Two reducers, one delivery requirement",
    copy: "Exported thesis geometry: legacy two-step contraction (35.05 -> 11.25 -> 6.0 mm) versus the redesigned 150 mm quintic C2 contraction.",
    sv: {
      label: "01 / Geometri",
      title: "Två reduktionsgeometrier, ett leveranskrav",
      copy: "Exporterad uppsatsgeometri: äldre tvåstegsreduktion (35,05 -> 11,25 -> 6,0 mm) jämförd med den omkonstruerade 150 mm långa kvintiska C2-kontraktionen.",
    },
  },
  {
    key: "mesh",
    label: "02 / Mesh",
    title: "Inspect the actual discretisation first",
    copy: "Exported ANSYS mesh views show the near-wall and contraction-region resolution used before interpreting the simulation results.",
    sv: {
      label: "02 / Nät",
      title: "Inspektera den faktiska diskretiseringen först",
      copy: "Exporterade ANSYS-nätbilder visar upplösningen nära väggen och i kontraktionsområdet innan simuleringsresultaten tolkas.",
    },
  },
  {
    key: "flow",
    label: "03 / Flow",
    title: "CFD evidence, then interpretation",
    copy: "The exported CFD streamline figures are the result source. The moving trace below is a clipped geometry guide for flow direction and contraction shape, not a replacement solution.",
    sv: {
      label: "03 / Strömning",
      title: "CFD-belägg, därefter tolkning",
      copy: "De exporterade CFD-strömlinjefigurerna är resultatkällan. Den rörliga kurvan nedan är en geometribegränsad vägledning för strömningsriktning och kontraktionsform, inte en ersättande lösning.",
    },
  },
  {
    key: "thermal",
    label: "04 / Wall temperature",
    title: "Resistance interpretation, not just temperature",
    copy: "Bi = hL/k = 0.003–0.004 → through-wall conduction is fast compared with surface convection. Apparent outlet-temperature gap is set by exposed external area, not internal heat transfer.",
    sv: {
      label: "04 / Väggtemperatur",
      title: "Motståndstolkning, inte bara temperatur",
      copy: "Bi = hL/k = 0,003-0,004 innebär snabb ledning genom väggen relativt ytkonvektionen. Den synliga utloppstemperaturskillnaden bestäms av exponerad ytteryta, inte intern värmeöverföring.",
    },
  },
  {
    key: "kpi",
    label: "05 / Evidence",
    title: "Four signals traceable back to the run",
    copy: "T₀ = 673 K from operating point; Bi from the resistance decomposition; Ma from compressible-flow output; 8/8 from the convergence + independence checklist.",
    sv: {
      label: "05 / Belägg",
      title: "Fyra signaler spårbara till körningen",
      copy: "T0 = 673 K från driftpunkten; Bi från motståndsdekompositionen; Ma från det kompressibla strömningsresultatet; 8/8 från checklistan för konvergens och nätoberoende.",
    },
  },
];

const ASSETS = {
  legacyGeometry: "assets/thesis/legacy-reducer-geometry-dark.webp",
  designGeometry: "assets/thesis/redesigned-dimensions-dark.webp",
  legacyMesh: "assets/thesis/legacy-mesh-dark.webp",
  designMesh: "assets/thesis/redesigned-mesh-dark.webp",
  legacyFlow: "assets/thesis/legacy-streamlines-dark.webp",
  designFlow: "assets/thesis/redesigned-streamlines-dark.webp",
};

// ── Geometry helpers ──────────────────────────────────────────────────────
// Legacy stepped reducer outline (upper wall — lower mirrored).
// Wall radii at each station, in viewBox half-units around y=160 centreline.
const LEGACY = {
  yCenter: 160,
  inletEnd: 320,    // x where inlet section ends
  throatStart: 320, // abrupt step inward
  throatEnd: 520,   // x where throat ends
  outletStart: 520, // second abrupt step
  outletEnd: 880,
  inletR: 40,       // = 35.05/2 mm scaled
  throatR: 13,      // = 11.25/2 mm scaled
  outletR: 7,       // = 6.0/2 mm scaled
};

const C2 = {
  yCenter: 400,
  inletEnd: 200,    // x where inlet section ends (before contraction begins)
  contractStart: 200,
  contractEnd: 720, // 150 mm scaled to ~520 viewBox units
  outletEnd: 880,
  inletR: 40,
  outletR: 7,
};

// Quintic smoothstep — matches the thesis C² profile (6t⁵ − 15t⁴ + 10t³)
function quintic(t) {
  const c = Math.max(0, Math.min(1, t));
  return 6 * c ** 5 - 15 * c ** 4 + 10 * c ** 3;
}

// Build a polyline of points for the C² profile (upper wall)
function c2UpperWallPath() {
  const points = [];
  // Inlet
  points.push([80, C2.yCenter - C2.inletR]);
  points.push([C2.contractStart, C2.yCenter - C2.inletR]);
  // Smooth contraction (quintic)
  const STEPS = 32;
  for (let i = 1; i <= STEPS; i++) {
    const t = i / STEPS;
    const x = C2.contractStart + (C2.contractEnd - C2.contractStart) * t;
    const r = C2.inletR - (C2.inletR - C2.outletR) * quintic(t);
    points.push([x, C2.yCenter - r]);
  }
  // Outlet
  points.push([C2.outletEnd, C2.yCenter - C2.outletR]);
  return points.map(([x, y], i) => (i === 0 ? `M${x} ${y}` : `L${x} ${y}`)).join(" ");
}

function c2LowerWallPath() {
  const points = [];
  points.push([80, C2.yCenter + C2.inletR]);
  points.push([C2.contractStart, C2.yCenter + C2.inletR]);
  const STEPS = 32;
  for (let i = 1; i <= STEPS; i++) {
    const t = i / STEPS;
    const x = C2.contractStart + (C2.contractEnd - C2.contractStart) * t;
    const r = C2.inletR - (C2.inletR - C2.outletR) * quintic(t);
    points.push([x, C2.yCenter + r]);
  }
  points.push([C2.outletEnd, C2.yCenter + C2.outletR]);
  return points.map(([x, y], i) => (i === 0 ? `M${x} ${y}` : `L${x} ${y}`)).join(" ");
}

function legacyUpperWallPath() {
  return [
    `M80 ${LEGACY.yCenter - LEGACY.inletR}`,
    `L${LEGACY.inletEnd} ${LEGACY.yCenter - LEGACY.inletR}`,
    `L${LEGACY.inletEnd} ${LEGACY.yCenter - LEGACY.throatR}`,
    `L${LEGACY.throatEnd} ${LEGACY.yCenter - LEGACY.throatR}`,
    `L${LEGACY.throatEnd} ${LEGACY.yCenter - LEGACY.outletR}`,
    `L${LEGACY.outletEnd} ${LEGACY.yCenter - LEGACY.outletR}`,
  ].join(" ");
}

function legacyLowerWallPath() {
  return [
    `M80 ${LEGACY.yCenter + LEGACY.inletR}`,
    `L${LEGACY.inletEnd} ${LEGACY.yCenter + LEGACY.inletR}`,
    `L${LEGACY.inletEnd} ${LEGACY.yCenter + LEGACY.throatR}`,
    `L${LEGACY.throatEnd} ${LEGACY.yCenter + LEGACY.throatR}`,
    `L${LEGACY.throatEnd} ${LEGACY.yCenter + LEGACY.outletR}`,
    `L${LEGACY.outletEnd} ${LEGACY.yCenter + LEGACY.outletR}`,
  ].join(" ");
}

// Closed clipPath for legacy interior
function legacyClipPath() {
  return `${legacyUpperWallPath()} L${LEGACY.outletEnd} ${LEGACY.yCenter + LEGACY.outletR} ${legacyLowerWallPath().replace("M", "L")} L80 ${LEGACY.yCenter - LEGACY.inletR} Z`;
}

function c2ClipPath() {
  return `${c2UpperWallPath()} L${C2.outletEnd} ${C2.yCenter + C2.outletR} ${c2LowerWallPath().replace("M", "L")} L80 ${C2.yCenter - C2.inletR} Z`;
}

// Streamline paths bounded by reducer geometry. Each streamline starts at
// fraction `frac` of the inlet half-radius offset from centreline; it follows
// the local radius (legacy: stepped, C2: smooth) so the streamline strictly
// stays inside the channel.
function legacyStreamline(frac) {
  // frac ∈ [-0.85, 0.85] — closer to ±1 means closer to wall
  // y at each station = yCenter + frac * R(x)
  const pts = [
    [60, LEGACY.yCenter + frac * LEGACY.inletR],
    [LEGACY.inletEnd - 8, LEGACY.yCenter + frac * LEGACY.inletR],
    [LEGACY.inletEnd + 6, LEGACY.yCenter + frac * LEGACY.throatR],
    [LEGACY.throatEnd - 8, LEGACY.yCenter + frac * LEGACY.throatR],
    [LEGACY.throatEnd + 6, LEGACY.yCenter + frac * LEGACY.outletR],
    [LEGACY.outletEnd + 20, LEGACY.yCenter + frac * LEGACY.outletR],
  ];
  return pts.map(([x, y], i) => (i === 0 ? `M${x} ${y}` : `L${x} ${y}`)).join(" ");
}

function c2Streamline(frac) {
  const pts = [];
  pts.push([60, C2.yCenter + frac * C2.inletR]);
  pts.push([C2.contractStart, C2.yCenter + frac * C2.inletR]);
  const STEPS = 24;
  for (let i = 1; i <= STEPS; i++) {
    const t = i / STEPS;
    const x = C2.contractStart + (C2.contractEnd - C2.contractStart) * t;
    const r = C2.inletR - (C2.inletR - C2.outletR) * quintic(t);
    pts.push([x, C2.yCenter + frac * r]);
  }
  pts.push([C2.outletEnd + 20, C2.yCenter + frac * C2.outletR]);
  return pts.map(([x, y], i) => (i === 0 ? `M${x} ${y}` : `L${x} ${y}`)).join(" ");
}

function evidenceImage(href, x, label, height = 196) {
  return `
    <g class="story-source-frame">
      <text class="story-frame-label" x="${x}" y="36">${label}</text>
      <rect x="${x}" y="46" width="426" height="${height}" rx="8"></rect>
      <image href="${href}" x="${x + 4}" y="50" width="418" height="${height - 8}"
        preserveAspectRatio="xMidYMid meet"></image>
    </g>`;
}

function svgMarkup() {
  const flowFracs = [-0.72, -0.48, -0.22, 0.22, 0.48, 0.72];

  return `
    <svg class="thesis-story-svg" viewBox="0 0 960 540" role="img" aria-label="Siemens thesis evidence sequence using exported figures and a labelled geometry interpretation">
      <defs>
        <linearGradient id="storyStream" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#2563a8"/>
          <stop offset="64%" stop-color="#65d6c9"/>
          <stop offset="100%" stop-color="#f6c85f"/>
        </linearGradient>
        <linearGradient id="storyHot" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#2563a8"/>
          <stop offset="40%" stop-color="#65d6c9"/>
          <stop offset="80%" stop-color="#fbbf24"/>
          <stop offset="100%" stop-color="#d0622c"/>
        </linearGradient>
        <clipPath id="legacyInterior"><path d="${legacyClipPath()}"></path></clipPath>
        <clipPath id="c2Interior"><path d="${c2ClipPath()}"></path></clipPath>
      </defs>
      <rect class="story-bg" x="18" y="18" width="924" height="504" rx="14"/>
      <g class="story-grid" aria-hidden="true">
        ${Array.from({ length: 15 }, (_, i) => `<path d="M${42 + i * 60} 24V510"/>`).join("")}
        ${Array.from({ length: 9 }, (_, i) => `<path d="M28 ${44 + i * 56}H932"/>`).join("")}
      </g>

      <g class="story-layer story-geometry" data-story-layer="geometry">
        ${evidenceImage(ASSETS.legacyGeometry, 42, "EXPORTED GEOMETRY / LEGACY", 286)}
        ${evidenceImage(ASSETS.designGeometry, 492, "EXPORTED GEOMETRY / REDESIGNED", 286)}
        <text class="story-proof-label" x="42" y="364">SOURCE FIGURES FROM THE THESIS WORKFLOW</text>
        <g class="dimension-annotation">
          <text x="52" y="406">Legacy: D_in 35.05 mm -> D_mid 11.25 mm -> D_out 6.0 mm</text>
          <text x="52" y="436">Two abrupt contractions retained as the reference hardware.</text>
          <text x="502" y="406">Redesigned: L_contraction = 150 mm; D_out = 6.0 mm</text>
          <text x="502" y="436">Quintic C2 profile: zero endpoint slope and curvature.</text>
        </g>
      </g>

      <g class="story-layer story-mesh" data-story-layer="mesh">
        ${evidenceImage(ASSETS.legacyMesh, 42, "EXPORTED ANSYS MESH / LEGACY", 324)}
        ${evidenceImage(ASSETS.designMesh, 492, "EXPORTED ANSYS MESH / REDESIGNED", 324)}
        <text class="story-proof-label" x="42" y="406">EVIDENCE VIEW: EXPORTED DISCRETISATION, NOT A GENERATED SUBSTITUTE</text>
        <text class="story-note" x="42" y="435">Near-wall inflation and contraction refinement inspected before interpretation.</text>
        <text class="story-note" x="42" y="458">Three-level mesh-independence evidence is documented in the case study.</text>
      </g>

      <g class="story-layer story-flow" data-story-layer="flow">
        ${evidenceImage(ASSETS.legacyFlow, 42, "ANSYS VELOCITY STREAMLINES / LEGACY", 170)}
        ${evidenceImage(ASSETS.designFlow, 492, "ANSYS VELOCITY STREAMLINES / REDESIGNED", 170)}
        <text class="story-proof-label" x="42" y="250">ANIMATED INTERPRETATION / DIRECTION ONLY / NOT CFD OUTPUT</text>
        <rect class="flow-model-panel" x="42" y="262" width="876" height="224" rx="8"></rect>
        <g class="flow-interpretation" transform="translate(0 210) scale(1 0.42)">
          <path class="reducer-wall" d="${legacyUpperWallPath()}"/>
          <path class="reducer-wall" d="${legacyLowerWallPath()}"/>
          <path class="reducer-wall" d="${c2UpperWallPath()}"/>
          <path class="reducer-wall" d="${c2LowerWallPath()}"/>
          <g clip-path="url(#legacyInterior)" class="flow-lines legacy-flow">
            ${flowFracs.map((f, i) => `<path class="flow-stream" style="--delay:${i * 0.18}s" d="${legacyStreamline(f)}"/>`).join("")}
            <ellipse class="separation-lobe" cx="${LEGACY.inletEnd + 18}" cy="${LEGACY.yCenter - LEGACY.throatR - 6}" rx="14" ry="5"/>
            <ellipse class="separation-lobe" cx="${LEGACY.inletEnd + 18}" cy="${LEGACY.yCenter + LEGACY.throatR + 6}" rx="14" ry="5"/>
          </g>
          <g clip-path="url(#c2Interior)" class="flow-lines c2-flow">
            ${flowFracs.map((f, i) => `<path class="flow-stream" style="--delay:${i * 0.18}s" d="${c2Streamline(f)}"/>`).join("")}
          </g>
        </g>
        <text class="story-note flow-note" x="52" y="300">Legacy stepped path / geometry-bounded direction trace</text>
        <text class="story-note flow-note" x="52" y="403">C2 path / smoothly contracting direction trace</text>
      </g>

      <g class="story-layer story-thermal" data-story-layer="thermal">
        <text class="story-frame-label" x="42" y="48">PARAMETRIC WALL INTERPRETATION / REPORTED BIOT BAND</text>
        <text class="story-section-label" x="42" y="92">LEGACY / TWO-STEP CONTRACTION</text>
        <text class="story-section-label" x="42" y="332">REDESIGNED / 150 MM QUINTIC C2</text>
        <path class="reducer-wall" d="${legacyUpperWallPath()}"/>
        <path class="reducer-wall" d="${legacyLowerWallPath()}"/>
        <path class="reducer-wall" d="${c2UpperWallPath()}"/>
        <path class="reducer-wall" d="${c2LowerWallPath()}"/>
        <path class="thermal-wall" d="${legacyUpperWallPath()}"/>
        <path class="thermal-wall" d="${legacyLowerWallPath()}"/>
        <path class="thermal-wall" d="${c2UpperWallPath()}"/>
        <path class="thermal-wall" d="${c2LowerWallPath()}"/>
        <g class="thermal-legend">
          <rect x="640" y="220" width="240" height="10" rx="5"/>
          <text x="640" y="216">T(x) — wall temperature</text>
          <text x="640" y="246">cool inlet</text>
          <text x="880" y="246" text-anchor="end">warmer downstream</text>
        </g>
        <g class="biot-callout">
          <text class="biot-equation" x="480" y="280">Bi = h·Lc / k = 0.003 – 0.004</text>
          <text class="biot-meaning" x="480" y="298">through-wall conduction tiny → wall is "lumped"</text>
          <text class="biot-meaning" x="480" y="314">external convection dominates the apparent outlet ΔT</text>
        </g>
      </g>

      <g class="story-layer story-kpis" data-story-layer="kpi">
        <text class="story-frame-label" x="80" y="26">REPORTED / DERIVED THESIS SIGNALS</text>
        <g class="kpi-badge" data-kpi="t0" style="--delay:0s">
          <rect x="80" y="40" width="160" height="40" rx="6"/>
          <text class="kpi-value" x="160" y="58" text-anchor="middle">673 K</text>
          <text class="kpi-label" x="160" y="74" text-anchor="middle">inlet stagnation T</text>
          <path class="kpi-trace" d="M160 80 L160 120"/>
        </g>
        <g class="kpi-badge" data-kpi="bi" style="--delay:0.15s">
          <rect x="260" y="40" width="220" height="40" rx="6"/>
          <text class="kpi-value" x="370" y="58" text-anchor="middle">Bi 0.003–0.004</text>
          <text class="kpi-label" x="370" y="74" text-anchor="middle">resistance decomposition</text>
          <path class="kpi-trace" d="M370 80 L370 180"/>
        </g>
        <g class="kpi-badge" data-kpi="ma" style="--delay:0.30s">
          <rect x="500" y="40" width="220" height="40" rx="6"/>
          <text class="kpi-value" x="610" y="58" text-anchor="middle">Ma 0.990–1.006</text>
          <text class="kpi-label" x="610" y="74" text-anchor="middle">throat flow regime</text>
          <path class="kpi-trace" d="M610 80 L${LEGACY.throatEnd - 20} ${LEGACY.yCenter}"/>
        </g>
        <g class="kpi-badge" data-kpi="ok" style="--delay:0.45s">
          <rect x="740" y="40" width="140" height="40" rx="6"/>
          <text class="kpi-value" x="810" y="58" text-anchor="middle">8 / 8</text>
          <text class="kpi-label" x="810" y="74" text-anchor="middle">validation checks</text>
          <path class="kpi-trace" d="M810 80 L${C2.outletEnd - 40} ${C2.yCenter}"/>
        </g>
        <text class="story-note" x="80" y="460">Open the thesis case study for chart sources, assumptions, mesh independence and limitations.</text>
      </g>
    </svg>`;
}

function staticMarkup() {
  return `
    <div class="thesis-story-static" aria-label="Static Siemens thesis evidence sequence">
      <figure>
        <figcaption><strong data-i18n-sv="01 / Geometri">01 / Geometry</strong><span data-i18n-sv="Exporterade reduktionsgeometrifigurer och rapporterade dimensioner.">Exported reducer geometry figures and reported dimensions.</span></figcaption>
        <div><img src="${ASSETS.legacyGeometry}" alt="Legacy reducer geometry figure" loading="lazy"><img src="${ASSETS.designGeometry}" alt="Redesigned reducer geometry figure" loading="lazy"></div>
      </figure>
      <figure>
        <figcaption><strong data-i18n-sv="02 / Nät">02 / Mesh</strong><span data-i18n-sv="Exporterade ANSYS-nätbilder använda i modelleringsflödet.">Exported ANSYS mesh views used for the modelling workflow.</span></figcaption>
        <div><img src="${ASSETS.legacyMesh}" alt="Legacy reducer mesh figure" loading="lazy"><img src="${ASSETS.designMesh}" alt="Redesigned reducer mesh figure" loading="lazy"></div>
      </figure>
      <figure>
        <figcaption><strong data-i18n-sv="03 / CFD-strömning">03 / CFD flow</strong><span data-i18n-sv="Exporterade ANSYS-strömlinjefigurer; dessa är beläggskällan.">Exported ANSYS streamline figures; these are the evidence source.</span></figcaption>
        <div><img src="${ASSETS.legacyFlow}" alt="Legacy reducer streamline figure" loading="lazy"><img src="${ASSETS.designFlow}" alt="Redesigned reducer streamline figure" loading="lazy"></div>
      </figure>
      <figure class="static-story-note">
        <figcaption><strong data-i18n-sv="04 / Väggtemperatur">04 / Wall temperature</strong><span data-i18n-sv="Bi = h Lc / k = 0,003 - 0,004. Det rapporterade intervallet stöder en liten gradient genom väggen relativt ytvärmeförluster.">Bi = h Lc / k = 0.003 - 0.004. The reported band supports a small through-wall gradient relative to surface heat loss.</span></figcaption>
      </figure>
      <figure class="static-story-note">
        <figcaption><strong data-i18n-sv="05 / Belägg">05 / Evidence</strong><span data-i18n-sv="673 K inloppsvillkor; Bi 0,003-0,004; Ma 0,990-1,006; 8 / 8 valideringskontroller.">673 K inlet condition; Bi 0.003-0.004; Ma 0.990-1.006; 8 / 8 validation checks.</span></figcaption>
      </figure>
    </div>`;
}

function renderBeatCopy(root) {
  const isSwedish = document.documentElement.dataset.locale === "sv" || document.documentElement.lang === "sv";
  root.querySelectorAll(".thesis-story-beat").forEach((element, index) => {
    const beat = BEATS[index];
    const copy = isSwedish ? beat?.sv : beat;
    if (!copy) return;
    element.querySelector("span").textContent = copy.label;
    element.querySelector("strong").textContent = copy.title;
    element.querySelector("p").textContent = copy.copy;
  });
}

function build(stage) {
  stage.innerHTML = `
    <div class="thesis-story-visual">${svgMarkup()}</div>
    ${staticMarkup()}
    <div class="thesis-story-beats">
      ${BEATS.map((beat, index) => `
        <article class="thesis-story-beat ${index === 0 ? "is-active" : ""}" data-story-beat="${beat.key}">
          <span>${beat.label}</span>
          <strong>${beat.title}</strong>
          <p>${beat.copy}</p>
        </article>`).join("")}
    </div>`;
}

function setBeat(root, index) {
  root.dataset.storyStep = String(index);
  root.dataset.storyKey = BEATS[index]?.key || "geometry";
  root.querySelectorAll(".thesis-story-beat").forEach((el, i) =>
    el.classList.toggle("is-active", i === index)
  );
}

export async function init(ctx) {
  const root = document.querySelector("[data-motion-scrollyt]");
  const stage = root?.querySelector("[data-thesis-story-stage]");
  if (!root || !stage) return null;
  build(stage);
  renderBeatCopy(root);
  setBeat(root, 0);
  const offLocale = ctx?.bus?.on?.("motion:locale-change", () => renderBeatCopy(root));
  const compactLayout = window.matchMedia("(max-width: 600px)").matches;

  // Technical source figures require readable dimensions on small screens;
  // show the complete static evidence stack instead of pinning tiny diagrams.
  if (ctx.reducedMotion || compactLayout || !ctx.gsap || !ctx.ScrollTrigger) {
    root.classList.add("is-static");
    setBeat(root, BEATS.length - 1); // show final state
    return { destroy() { offLocale?.(); } };
  }

  const timeline = ctx.gsap.timeline({
    scrollTrigger: {
      trigger: root,
      start: "top top",
      end: `+=${BEATS.length * 55}%`,
      pin: true,
      scrub: 0.65,
      onUpdate(self) {
        setBeat(root, Math.min(BEATS.length - 1, Math.floor(self.progress * BEATS.length)));
      },
    },
  });
  timeline.to({}, { duration: BEATS.length });

  // Skip handlers
  const skipTargets = root.querySelectorAll('a[href="#signal-evidence-map"], [data-skip-story]');
  const skipStory = (event) => {
    if (event?.key && event.key !== "Escape") return;
    if (event?.key === "Escape" && root.getBoundingClientRect().bottom < 0) return;
    timeline.scrollTrigger?.scroll(timeline.scrollTrigger.end + 2);
  };
  skipTargets.forEach((el) => el.addEventListener("click", skipStory));
  document.addEventListener("keydown", skipStory);

  return {
    destroy() {
      offLocale?.();
      skipTargets.forEach((el) => el.removeEventListener("click", skipStory));
      document.removeEventListener("keydown", skipStory);
      timeline.scrollTrigger?.kill();
      timeline.kill();
    },
  };
}

export function destroy(instance) {
  instance?.destroy?.();
}
