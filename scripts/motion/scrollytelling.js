/**
 * Thesis scrollytelling — Siemens reducer story in 5 pinned beats.
 *
 * v4-w16 rebuild: everything is drawn from parametric SVG at the actual
 * reducer proportions (35.05 → 11.25 → 6.0 mm for legacy, 150 mm C² quintic
 * for redesigned). No embedded raster backgrounds layered over mis-aligned
 * SVG outlines. The flow animation is strictly clipped INSIDE the channel.
 *
 * Beats:
 *   1. geometry  — both reducers materialise from CAD outlines, dimensioned.
 *   2. mesh      — structured grid lines populate inside each reducer, with
 *                  inflation-layer concentration near the walls.
 *   3. flow      — streamlines advect through both. Legacy shows a recirculation
 *                  lobe behind the abrupt step; C² shows smooth distributed
 *                  acceleration.
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
    copy: "Legacy two-step contraction (35.05 → 11.25 → 6.0 mm) versus a 150 mm quintic C² profile with zero slope and curvature at both endpoints.",
  },
  {
    key: "mesh",
    label: "02 / Mesh",
    title: "Wall-resolved before any result is reported",
    copy: "Three mesh levels (coarse → baseline → fine) with inflation layers concentrated near every wall. Mesh independence runs before flow or thermal numbers leave the lab.",
  },
  {
    key: "flow",
    label: "03 / Flow",
    title: "Inside the channel — separation vs. distributed acceleration",
    copy: "Legacy: the abrupt step concentrates acceleration and creates a recirculation lobe. Redesigned C²: acceleration is distributed through the 150 mm contraction.",
  },
  {
    key: "thermal",
    label: "04 / Wall temperature",
    title: "Resistance interpretation, not just temperature",
    copy: "Bi = hL/k = 0.003–0.004 → through-wall conduction is fast compared with surface convection. Apparent outlet-temperature gap is set by exposed external area, not internal heat transfer.",
  },
  {
    key: "kpi",
    label: "05 / Evidence",
    title: "Four signals that traceable back to the run",
    copy: "T₀ = 673 K from operating point; Bi from the resistance decomposition; Ma from compressible-flow output; 8/8 from the convergence + independence checklist.",
  },
];

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

// Structured mesh inside the reducer (axial + radial gridlines, inflation
// layers concentrated near walls). Produces an SVG <g> string of <path>s.
function legacyMesh() {
  const lines = [];
  // Inflation layers near each wall — denser closer to wall
  const inflate = [0.98, 0.92, 0.85, 0.76, 0.65];
  for (const frac of inflate) {
    lines.push(`<path d="${legacyStreamline(frac)}" />`);
    lines.push(`<path d="${legacyStreamline(-frac)}" />`);
  }
  // Bulk axial lines (sparser)
  for (let f = -0.5; f <= 0.5; f += 0.25) {
    if (Math.abs(f) < 0.01) continue;
    lines.push(`<path d="${legacyStreamline(f)}" />`);
  }
  // Centreline
  lines.push(`<path d="M60 ${LEGACY.yCenter} L${LEGACY.outletEnd + 20} ${LEGACY.yCenter}" />`);
  // Axial slices (every 60 viewBox units)
  for (let x = 100; x <= LEGACY.outletEnd; x += 60) {
    let topY, botY;
    if (x < LEGACY.inletEnd) { topY = LEGACY.yCenter - LEGACY.inletR; botY = LEGACY.yCenter + LEGACY.inletR; }
    else if (x < LEGACY.throatEnd) { topY = LEGACY.yCenter - LEGACY.throatR; botY = LEGACY.yCenter + LEGACY.throatR; }
    else { topY = LEGACY.yCenter - LEGACY.outletR; botY = LEGACY.yCenter + LEGACY.outletR; }
    lines.push(`<path d="M${x} ${topY} L${x} ${botY}" />`);
  }
  return lines.join("");
}

function c2Mesh() {
  const lines = [];
  const inflate = [0.98, 0.92, 0.85, 0.76, 0.65];
  for (const frac of inflate) {
    lines.push(`<path d="${c2Streamline(frac)}" />`);
    lines.push(`<path d="${c2Streamline(-frac)}" />`);
  }
  for (let f = -0.5; f <= 0.5; f += 0.25) {
    if (Math.abs(f) < 0.01) continue;
    lines.push(`<path d="${c2Streamline(f)}" />`);
  }
  lines.push(`<path d="M60 ${C2.yCenter} L${C2.outletEnd + 20} ${C2.yCenter}" />`);
  // Axial slices (every 60 units) — follow the smooth profile
  for (let x = 100; x <= C2.outletEnd; x += 60) {
    let r;
    if (x < C2.contractStart) r = C2.inletR;
    else if (x > C2.contractEnd) r = C2.outletR;
    else {
      const t = (x - C2.contractStart) / (C2.contractEnd - C2.contractStart);
      r = C2.inletR - (C2.inletR - C2.outletR) * quintic(t);
    }
    lines.push(`<path d="M${x} ${C2.yCenter - r} L${x} ${C2.yCenter + r} " />`);
  }
  return lines.join("");
}

function svgMarkup() {
  // Several streamline fractions for the flow beat
  const flowFracs = [-0.72, -0.48, -0.22, 0.22, 0.48, 0.72];

  return `
    <svg class="thesis-story-svg" viewBox="0 0 960 540" role="img" aria-label="Siemens thesis evidence sequence — parametric reducer animation">
      <defs>
        <linearGradient id="storyWallHeat" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#2563a8" stop-opacity="0.85"/>
          <stop offset="50%" stop-color="#65d6c9" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="#f6c85f" stop-opacity="0.85"/>
        </linearGradient>
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

      <!-- Static section labels (always visible) -->
      <text class="story-section-label" x="42" y="92">LEGACY · two-step contraction</text>
      <text class="story-section-label" x="42" y="332">REDESIGNED · 150 mm quintic C²</text>

      <!-- BEAT 1: GEOMETRY (always drawn; other beats add layers on top) -->
      <g class="story-layer story-geometry" data-story-layer="geometry">
        <path class="reducer-wall" d="${legacyUpperWallPath()}"/>
        <path class="reducer-wall" d="${legacyLowerWallPath()}"/>
        <path class="reducer-wall" d="${c2UpperWallPath()}"/>
        <path class="reducer-wall" d="${c2LowerWallPath()}"/>

        <!-- Dimension annotations -->
        <g class="dimension-annotation">
          <path d="M80 235 L80 245 L320 245 L320 235" />
          <text x="200" y="262" text-anchor="middle">D_in = 35.05 mm</text>
          <path d="M${LEGACY.inletEnd} 220 L${LEGACY.throatEnd} 220" />
          <text x="${(LEGACY.inletEnd + LEGACY.throatEnd) / 2}" y="212" text-anchor="middle">D_t = 11.25 mm</text>
          <path d="M${LEGACY.throatEnd} 195 L${LEGACY.outletEnd} 195" />
          <text x="${(LEGACY.throatEnd + LEGACY.outletEnd) / 2}" y="187" text-anchor="middle">D_out = 6.0 mm</text>
        </g>
        <g class="dimension-annotation">
          <path d="M${C2.contractStart} 480 L${C2.contractEnd} 480" />
          <text x="${(C2.contractStart + C2.contractEnd) / 2}" y="498" text-anchor="middle">L = 150 mm (quintic C²)</text>
        </g>
      </g>

      <!-- BEAT 2: MESH (revealed beat≥2) -->
      <g class="story-layer story-mesh" data-story-layer="mesh">
        <g clip-path="url(#legacyInterior)" class="mesh-lines legacy-mesh">
          ${legacyMesh()}
        </g>
        <g clip-path="url(#c2Interior)" class="mesh-lines c2-mesh">
          ${c2Mesh()}
        </g>
        <text class="story-note" x="640" y="92">y⁺ inflation layer · 3-level independence</text>
      </g>

      <!-- BEAT 3: FLOW (revealed beat≥3) -->
      <g class="story-layer story-flow" data-story-layer="flow">
        <g clip-path="url(#legacyInterior)" class="flow-lines legacy-flow">
          ${flowFracs.map((f, i) => `<path class="flow-stream" style="--delay:${i * 0.18}s" d="${legacyStreamline(f)}"/>`).join("")}
          <!-- Recirculation lobe behind the abrupt step -->
          <ellipse class="separation-lobe" cx="${LEGACY.inletEnd + 18}" cy="${LEGACY.yCenter - LEGACY.throatR - 6}" rx="14" ry="5"/>
          <ellipse class="separation-lobe" cx="${LEGACY.inletEnd + 18}" cy="${LEGACY.yCenter + LEGACY.throatR + 6}" rx="14" ry="5"/>
          <ellipse class="separation-lobe" cx="${LEGACY.throatEnd + 18}" cy="${LEGACY.yCenter - LEGACY.outletR - 4}" rx="10" ry="3"/>
          <ellipse class="separation-lobe" cx="${LEGACY.throatEnd + 18}" cy="${LEGACY.yCenter + LEGACY.outletR + 4}" rx="10" ry="3"/>
        </g>
        <g clip-path="url(#c2Interior)" class="flow-lines c2-flow">
          ${flowFracs.map((f, i) => `<path class="flow-stream" style="--delay:${i * 0.18}s" d="${c2Streamline(f)}"/>`).join("")}
        </g>
        <text class="story-note flow-note" x="${LEGACY.inletEnd + 28}" y="92">recirculation behind abrupt step (vena-contracta)</text>
        <text class="story-note flow-note" x="${C2.contractStart + 60}" y="332">distributed acceleration · no separation</text>
      </g>

      <!-- BEAT 4: THERMAL (wall colour gradient on the reducer outline) -->
      <g class="story-layer story-thermal" data-story-layer="thermal">
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

      <!-- BEAT 5: KPI (badges fly in with trace lines back to anatomy) -->
      <g class="story-layer story-kpis" data-story-layer="kpi">
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
      </g>
    </svg>`;
}

function build(stage) {
  stage.innerHTML = `
    <div class="thesis-story-visual">${svgMarkup()}</div>
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
  setBeat(root, 0);

  if (ctx.reducedMotion || !ctx.gsap || !ctx.ScrollTrigger) {
    root.classList.add("is-static");
    setBeat(root, BEATS.length - 1); // show final state
    return null;
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
