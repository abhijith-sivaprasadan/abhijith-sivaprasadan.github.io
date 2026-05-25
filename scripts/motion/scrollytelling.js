const BEATS = [
  {
    key: "geometry",
    label: "01 / Geometry",
    title: "Two reducers, one delivery requirement",
    copy: "The source geometry compares the legacy stepped reducer with a 150 mm C2-continuous contraction from 35.05 mm to 6.0 mm.",
  },
  {
    key: "mesh",
    label: "02 / Mesh",
    title: "Near-wall resolution before results",
    copy: "The source mesh figures expose refinement at the contraction and wall layers before comparing flow or heat transfer.",
  },
  {
    key: "flow",
    label: "03 / CFD flow",
    title: "Acceleration stays inside the passage",
    copy: "ANSYS streamline figures remain the evidence source. The moving overlay is clipped to dimension-scaled channel sections: separated acceleration for the stepped path and distributed acceleration for C2.",
  },
  {
    key: "thermal",
    label: "04 / Wall temperature",
    title: "Temperature interpreted through resistance",
    copy: "The C2 wall trace shifts through the thermal palette while the Biot interpretation identifies a small internal wall gradient relative to surface heat loss.",
  },
  {
    key: "kpi",
    label: "05 / Evidence",
    title: "Results condensed without losing provenance",
    copy: "The headline values point back to the mesh, flow and thermal interpretation used in the Siemens thesis case study.",
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

function evidenceImage(href, x, label) {
  return `
    <g class="story-source-frame">
      <text class="story-frame-label" x="${x}" y="33">${label}</text>
      <rect x="${x}" y="42" width="430" height="226" rx="8"></rect>
      <image href="${href}" x="${x + 4}" y="46" width="422" height="218"
        preserveAspectRatio="xMidYMid meet"></image>
    </g>`;
}

function svgMarkup() {
  return `
    <svg class="thesis-story-svg" viewBox="0 0 960 540" role="img" aria-label="Siemens thesis evidence sequence grounded in source figures">
      <defs>
        <linearGradient id="storyWallHeat" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#2563a8"/>
          <stop offset="42%" stop-color="#65d6c9"/>
          <stop offset="74%" stop-color="#f6c85f"/>
          <stop offset="100%" stop-color="#d0622c"/>
        </linearGradient>
        <linearGradient id="storyFluid" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#2563a8"/>
          <stop offset="64%" stop-color="#65d6c9"/>
          <stop offset="100%" stop-color="#f6c85f"/>
        </linearGradient>
        <clipPath id="legacyChannel">
          <path d="M56 330 H266 V349 H372 V360 H890 V378 H372 V389 H266 V408 H56 Z"></path>
        </clipPath>
        <clipPath id="c2Channel">
          <path d="M56 430 H270 C382 430 438 448 522 459 C632 473 746 472 890 471 L890 487 C746 488 632 487 522 473 C438 462 382 444 270 444 H56 Z"></path>
        </clipPath>
        <filter id="storySignal" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <rect class="story-bg" x="18" y="18" width="924" height="504" rx="12"></rect>
      <g class="story-grid" aria-hidden="true">
        ${Array.from({ length: 15 }, (_, i) => `<path d="M${42 + i * 60} 24V510"/>`).join("")}
        ${Array.from({ length: 9 }, (_, i) => `<path d="M28 ${44 + i * 56}H932"/>`).join("")}
      </g>

      <g class="story-layer story-geometry" data-story-layer="geometry">
        ${evidenceImage(ASSETS.legacyGeometry, 38, "LEGACY / STEPPED REDUCER")}
        ${evidenceImage(ASSETS.designGeometry, 492, "REDESIGNED / C2 CONTINUOUS")}
        <g class="story-dimensions">
          <text x="48" y="310">Source geometry figures</text>
          <text x="48" y="338">D_in = 35.05 mm</text>
          <text x="252" y="338">D_out = 6.0 mm</text>
          <text x="492" y="310">C2 contraction profile</text>
          <text x="492" y="338">L = 150 mm</text>
          <text x="662" y="338">smooth endpoint slope / curvature</text>
        </g>
      </g>

      <g class="story-layer story-mesh" data-story-layer="mesh">
        ${evidenceImage(ASSETS.legacyMesh, 38, "LEGACY / WALL-REFINED MESH")}
        ${evidenceImage(ASSETS.designMesh, 492, "REDESIGNED / WALL-REFINED MESH")}
        <path class="story-callout" d="M188 302V270"></path>
        <text class="story-note" x="74" y="325">Inflation layer and contraction refinement</text>
        <path class="story-callout" d="M700 302V270"></path>
        <text class="story-note" x="548" y="325">Mesh-independence comparison before conclusions</text>
      </g>

      <g class="story-layer story-flow" data-story-layer="flow">
        ${evidenceImage(ASSETS.legacyFlow, 38, "ANSYS REFERENCE / LEGACY")}
        ${evidenceImage(ASSETS.designFlow, 492, "ANSYS REFERENCE / REDESIGNED")}
        <text class="story-note" x="56" y="312">Dimension-scaled moving section overlay: flow direction left to right</text>
        <g class="flow-outline">
          <path class="legacy-outline" d="M56 330 H266 V349 H372 V360 H890"></path>
          <path class="legacy-outline" d="M56 408 H266 V389 H372 V378 H890"></path>
          <path class="c2-outline" d="M56 430 H270 C382 430 438 448 522 459 C632 473 746 472 890 471"></path>
          <path class="c2-outline" d="M56 444 H270 C382 444 438 462 522 473 C632 487 746 488 890 487"></path>
        </g>
        <g class="bounded-flow legacy-bounded-flow" clip-path="url(#legacyChannel)">
          <path d="M36 339 H282 L384 364 H914"></path>
          <path d="M36 350 H276 L384 367 H914"></path>
          <path d="M36 362 H914"></path>
          <path d="M36 396 H282 L384 374 H914"></path>
          <path d="M36 385 H276 L384 371 H914"></path>
          <ellipse class="separation-lobe" cx="292" cy="365" rx="34" ry="20"></ellipse>
        </g>
        <g class="bounded-flow c2-bounded-flow" clip-path="url(#c2Channel)">
          <path d="M36 433 C295 433 384 447 526 465 S760 478 914 478"></path>
          <path d="M36 437 C295 437 384 450 526 468 S760 479 914 479"></path>
          <path d="M36 441 C295 441 384 454 526 471 S760 481 914 481"></path>
        </g>
      </g>

      <g class="story-layer story-thermal" data-story-layer="thermal">
        <text class="story-frame-label" x="52" y="60">REDESIGNED REDUCER / WALL TEMPERATURE INTERPRETATION</text>
        <path class="thermal-channel-wall" d="M72 204 H276 C390 204 450 244 540 262 C650 284 765 284 892 282"></path>
        <path class="thermal-channel-wall" d="M72 336 H276 C390 336 450 296 540 278 C650 256 765 256 892 258"></path>
        <path class="thermal-centreline" d="M72 270 H892"></path>
        <g class="thermal-legend">
          <rect x="74" y="390" width="286" height="10" rx="5"></rect>
          <text x="74" y="423">cooler outer wall</text>
          <text x="272" y="423">warmer downstream region</text>
        </g>
        <g class="biot-note">
          <text x="510" y="380">Bi = h Lc / k = 0.003 - 0.004</text>
          <text x="510" y="408">small through-wall gradient</text>
          <text x="510" y="432">surface heat loss controls interpretation</text>
        </g>
      </g>

      <g class="story-layer story-kpis" data-story-layer="kpi">
        <text class="story-frame-label" x="54" y="68">THESIS SIGNAL / TRACEABLE SUMMARY</text>
        <path class="kpi-trace" d="M150 164V126H86"></path>
        <path class="kpi-trace" d="M367 164V116H474"></path>
        <path class="kpi-trace" d="M582 164V126H680"></path>
        <path class="kpi-trace" d="M798 164V114H870"></path>
        <rect x="54" y="166" width="190" height="98" rx="8"></rect>
        <text class="kpi-value" x="76" y="204">673 K</text>
        <text class="kpi-label" x="76" y="232">inlet condition</text>
        <rect x="266" y="166" width="190" height="98" rx="8"></rect>
        <text class="kpi-value" x="288" y="204">Bi 0.003-0.004</text>
        <text class="kpi-label" x="288" y="232">thermal interpretation</text>
        <rect x="478" y="166" width="190" height="98" rx="8"></rect>
        <text class="kpi-value" x="500" y="204">Ma 0.990-1.006</text>
        <text class="kpi-label" x="500" y="232">flow-regime range</text>
        <rect x="690" y="166" width="190" height="98" rx="8"></rect>
        <text class="kpi-value" x="712" y="204">8 / 8</text>
        <text class="kpi-label" x="712" y="232">validation checks</text>
        <text class="story-note" x="54" y="338">Open the case study for charts, mesh-independence detail, geometry comparison and limitations.</text>
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
  root.querySelectorAll(".thesis-story-beat").forEach((element, beatIndex) => {
    element.classList.toggle("is-active", beatIndex === index);
  });
}

export async function init(ctx) {
  const root = document.querySelector("[data-motion-scrollyt]");
  const stage = root?.querySelector("[data-thesis-story-stage]");
  if (!root || !stage) return null;
  build(stage);
  setBeat(root, 0);

  if (ctx.reducedMotion || !ctx.gsap || !ctx.ScrollTrigger) {
    root.classList.add("is-static");
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

  const skip = root.querySelector('a[href="#signal-evidence-map"]');
  const skipStory = (event) => {
    if (event?.key && event.key !== "Escape") return;
    if (event?.key === "Escape" && root.getBoundingClientRect().bottom < 0) return;
    timeline.scrollTrigger?.scroll(timeline.scrollTrigger.end + 2);
  };
  skip?.addEventListener("click", skipStory);
  document.addEventListener("keydown", skipStory);

  return {
    destroy() {
      skip?.removeEventListener("click", skipStory);
      document.removeEventListener("keydown", skipStory);
      timeline.scrollTrigger?.kill();
      timeline.kill();
    },
  };
}

export function destroy(instance) {
  instance?.destroy?.();
}
