const TOPIC_RULES = [
  {
    lens: "research",
    label: "Research thermal signal",
    terms: ["research", "rocket", "cooling", "pyrolysis", "coking", "methalox", "merit"],
  },
  {
    lens: "thermal",
    label: "Thermal-fluid evidence",
    terms: ["siemens", "thesis", "thermal", "fluid", "cfd", "cht", "heat transfer", "mtes", "pcm", "peltier", "battery", "tes"],
  },
  {
    lens: "energy",
    label: "Energy systems model",
    terms: ["energy systems", "district", "heating", "grid", "dispatch", "pypsa", "homer", "leap", "hydrogen", "pynexus", "forecast", "built environment", "residential", "hylkysaari"],
  },
  {
    lens: "industrial",
    label: "Industrial R&D frame",
    terms: ["industrial", "alleima", "decarbon", "kpi", "enpi", "ets", "process", "efficiency", "waste-to-energy"],
  },
  {
    lens: "structural",
    label: "Structural mechanics frame",
    terms: ["structural", "fea", "reactor", "mechanical", "vibration", "baja", "tractor", "bicycle", "robotic", "frame", "wireless"],
  },
  {
    lens: "software",
    label: "Tooling architecture",
    terms: ["qburst", "backend", "api", "admin", "toolkit", "calculator"],
  },
];

const MINI_PATHS = {
  thermal: '<path d="M2 8.5h5.6c1.4 0 1.8-1.8 3.2-1.8H18" /><path d="M2 12.5h7.4c1.6 0 2.4 1.5 4 1.5H18" />',
  energy: '<path d="M2.2 14.5 6.4 9l3.8 2.7 4.2-6.2 3.4 2.2" /><circle cx="6.4" cy="9" r="1.2" /><circle cx="14.4" cy="5.5" r="1.2" />',
  industrial: '<rect x="2.2" y="5" width="4.8" height="9" /><rect x="13" y="4" width="4.8" height="10" /><path d="M7.2 9.5h5.5M9.8 7.5l2.9 2-2.9 2" />',
  research: '<path d="M2.4 6.6c3.2 2.2 3.2 6.6 0 8.8h4.4c2.6 0 3.9-2.1 5.2-4.4-1.3-2.3-2.6-4.4-5.2-4.4H2.4Z" /><path d="M12.5 11h5.1M14 8.5l3.4 2.5-3.4 2.5" />',
  structural: '<path d="M3 15 6 5h8l3 10H3Z" /><path d="M6 5l3.8 10M14 5l-3.8 10M4.4 11h11.2M5.2 8h9.6" />',
  software: '<rect x="2.5" y="4" width="5" height="5" /><rect x="12.5" y="4" width="5" height="5" /><rect x="7.5" y="12" width="5" height="5" /><path d="M7.5 6.5h5M10 9v3" />',
  default: '<circle cx="6" cy="10" r="2.2" /><circle cx="14" cy="6" r="2.2" /><circle cx="15" cy="15" r="2.2" /><path d="M8 9.1 12 6.9M7.9 10.9 13 14.2" />',
};

function pageText() {
  const path = window.location.pathname.toLowerCase();
  const title = document.title.toLowerCase();
  const key = document.body?.dataset?.pageKey?.toLowerCase() || "";
  const h1 = document.querySelector("h1")?.textContent?.toLowerCase() || "";
  return `${path} ${title} ${key} ${h1}`;
}

function resolveTopic(text = pageText()) {
  const path = window.location.pathname.toLowerCase();
  const key = document.body?.dataset?.pageKey?.toLowerCase() || "";
  if (path.endsWith("/research.html") || key === "research") return TOPIC_RULES[0];
  if (path.includes("structural-fea") || path.includes("reactor-internals")) return TOPIC_RULES.find((rule) => rule.lens === "structural");
  if (path.includes("siemens") || path.includes("numerical-heat") || path.includes("mtes") || path.includes("peltier")) {
    return TOPIC_RULES.find((rule) => rule.lens === "thermal");
  }
  if (path.includes("energy-systems") || path.includes("district") || path.includes("grid") || path.includes("pynexus") || path.includes("pypsa")) {
    return TOPIC_RULES.find((rule) => rule.lens === "energy");
  }
  if (path.includes("industrial") || path.includes("alleima") || path.includes("kpi") || path.includes("ets")) {
    return TOPIC_RULES.find((rule) => rule.lens === "industrial");
  }
  const found = TOPIC_RULES.find((rule) => rule.terms.some((term) => text.includes(term)));
  return found || { lens: "default", label: "Evidence signal" };
}

function miniIcon(lens) {
  return `
    <span class="signal-mini-icon signal-mini-icon-${lens}" aria-hidden="true">
      <svg viewBox="0 0 20 20" fill="none">${MINI_PATHS[lens] || MINI_PATHS.default}</svg>
    </span>
  `;
}

function artSvg(lens) {
  if (lens === "energy") {
    return `
      <svg viewBox="0 0 280 180" fill="none" role="presentation">
        <path class="grid-line" d="M30 135 C66 104 86 113 116 78 S172 42 244 62" />
        <path class="energy-curve" d="M28 132 C61 105 88 115 116 78 S173 42 244 62" />
        <g class="node-set"><circle cx="54" cy="113" r="6"/><circle cx="116" cy="78" r="6"/><circle cx="174" cy="50" r="6"/><circle cx="232" cy="61" r="6"/></g>
        <path class="signal-dash" d="M42 145 H236" />
      </svg>`;
  }
  if (lens === "industrial") {
    return `
      <svg viewBox="0 0 280 180" fill="none" role="presentation">
        <rect class="process-box" x="34" y="46" width="66" height="42"/>
        <rect class="process-box amber" x="174" y="44" width="70" height="46"/>
        <rect class="process-box blue" x="108" y="112" width="64" height="34"/>
        <path class="flow-line" d="M100 67 C130 67 143 67 174 67" />
        <path class="flow-line secondary" d="M82 88 C98 123 122 132 108 132" />
        <path class="flow-line recovery" d="M172 129 C217 127 236 101 216 90" />
      </svg>`;
  }
  if (lens === "research") {
    return `
      <svg viewBox="0 0 280 180" fill="none" role="presentation">
        <path class="cooling-loop" d="M42 48 C64 82 64 104 42 136" />
        <path class="nozzle-wall upper" d="M38 62 C86 82 111 83 139 77 C173 70 205 71 248 58" />
        <path class="nozzle-wall lower" d="M38 118 C86 98 111 97 139 103 C173 110 205 109 248 122" />
        <path class="plume-core" d="M134 90 C166 82 192 83 246 72" />
        <path class="plume-core lower" d="M134 90 C166 98 192 97 246 108" />
        <path class="deposit-strip" d="M65 114 C95 101 116 100 138 105" />
      </svg>`;
  }
  if (lens === "structural") {
    return `
      <svg viewBox="0 0 280 180" fill="none" role="presentation">
        <path class="mesh-outline" d="M58 132 L82 42 H198 L226 132 Z" />
        <path class="mesh-line" d="M82 42 126 132M122 42 166 132M166 42 106 132M198 42 146 132M68 94 H214M74 70 H206M62 118 H222" />
        <circle class="constraint" cx="82" cy="42" r="6" /><circle class="constraint" cx="198" cy="42" r="6" />
        <path class="load-arrow" d="M142 20 v42M130 50l12 12 12-12" />
      </svg>`;
  }
  if (lens === "software") {
    return `
      <svg viewBox="0 0 280 180" fill="none" role="presentation">
        <rect class="process-box" x="40" y="50" width="58" height="38"/>
        <rect class="process-box blue" x="182" y="50" width="58" height="38"/>
        <rect class="process-box amber" x="111" y="112" width="58" height="34"/>
        <path class="flow-line" d="M98 69 H182" />
        <path class="flow-line secondary" d="M142 88 V112" />
        <path class="signal-dash" d="M56 126 H224" />
      </svg>`;
  }
  return `
    <svg viewBox="0 0 280 180" fill="none" role="presentation">
      <path class="reducer-wall upper" d="M28 65 H96 V49 H122 V73 H162 V83 H246" />
      <path class="reducer-wall lower" d="M28 115 H96 V131 H122 V107 H162 V97 H246" />
      <path class="reducer-c2 upper" d="M28 64 C78 64 104 69 132 78 S190 86 246 86" />
      <path class="reducer-c2 lower" d="M28 116 C78 116 104 111 132 102 S190 94 246 94" />
      <path class="flow-line" d="M34 90 C92 90 128 90 238 90" />
      <path class="flow-line secondary" d="M42 78 C92 78 111 84 136 88 S190 92 238 92" />
      <path class="thermal-band" d="M60 126 H236" />
    </svg>`;
}

function addHeroArt(topic) {
  if (document.querySelector(".signal-page-art")) return;
  const target =
    document.querySelector(".case-hero .container") ||
    document.querySelector(".hero-slab") ||
    document.querySelector(".page-shell .container") ||
    document.querySelector("main .container") ||
    document.querySelector("main");
  if (!target) return;
  target.classList.add("has-signal-page-art");
  const art = document.createElement("aside");
  art.className = `signal-page-art signal-page-art-${topic.lens}`;
  art.setAttribute("aria-hidden", "true");
  art.innerHTML = `
    <div class="signal-art-head">
      <span>${topic.label}</span>
      <b>${topic.lens}</b>
    </div>
    ${artSvg(topic.lens)}
  `;
  target.appendChild(art);
}

function addMiniIcons(topic) {
  const candidates = Array.from(document.querySelectorAll(
    ".page-panel h2, .case-panel h2, .card h3, .project-card h3, .timeline-item h3, .compact-item h3, .assignment-card h3, .testimonial-card .testimonial-author strong"
  )).slice(0, 90);
  candidates.forEach((heading) => {
    if (heading.querySelector(".signal-mini-icon")) return;
    const localTopic = resolveTopic(`${pageText()} ${heading.textContent?.toLowerCase() || ""}`);
    heading.classList.add("signal-heading-icon");
    heading.insertAdjacentHTML("afterbegin", miniIcon(localTopic.lens || topic.lens));
  });
}

function shouldInjectSignalArt() {
  const body = document.body;
  return Boolean(body?.matches("[data-signal-page-art]") || document.querySelector("[data-signal-page-art]"));
}

export async function init() {
  const body = document.body;
  if (!body) return null;
  if (!shouldInjectSignalArt()) return null;
  body.classList.add("signal-rebuild");
  const topic = resolveTopic();
  body.dataset.signalLens = topic.lens;
  if (!["home", "admin"].includes(body.dataset.pageKey || "")) {
    addHeroArt(topic);
  }
  addMiniIcons(topic);
  return { topic };
}
