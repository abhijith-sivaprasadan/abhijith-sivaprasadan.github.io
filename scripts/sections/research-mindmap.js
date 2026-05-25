const NODES = [
  {
    key: "cht",
    label: "CHT in high-temperature passages",
    copy: "High-temperature CHT links geometry, wall resistance, boundary conditions and validation-grade measurements.",
    signal: "MODEL: conjugate heat transfer / thermal resistance",
    x: 48,
    y: 14,
  },
  {
    key: "surface",
    label: "Surface-condition effects",
    copy: "Deposits and altered wall condition change thermal resistance and shift what a model can safely predict.",
    signal: "DEGRADATION: deposit layer -> rising wall temperature",
    x: 32,
    y: 48,
  },
  {
    key: "electrification",
    label: "Industrial electrification",
    copy: "Energy-process modelling translates measured performance into low-carbon heat, power and utility decisions.",
    signal: "SYSTEM: EnPI / heat recovery / electrification",
    x: 72,
    y: 48,
  },
  {
    key: "measurement",
    label: "Measurement chains",
    copy: "Thermocouples, pressure sensors, NI-DAQ and LabVIEW close the loop between model prediction and physical evidence.",
    signal: "VALIDATE: NI-DAQ / LabVIEW / thermocouples",
    x: 48,
    y: 82,
  },
];

function findResearchSection() {
  return Array.from(document.querySelectorAll("section")).find((section) => {
    const eyebrow = section.querySelector(".section-heading .eyebrow");
    return eyebrow?.textContent?.trim().toLowerCase() === "research interests";
  });
}

function template() {
  return `
    <div class="research-mindmap" data-research-mindmap>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <marker id="research-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
            <path class="mindmap-arrowhead" d="M0 0 L5 2.5 L0 5 Z" />
          </marker>
        </defs>
        <path marker-end="url(#research-arrow)" d="M48 24 C42 30 37 35 34 40" />
        <path marker-end="url(#research-arrow)" d="M40 48 C50 43 59 43 66 48" />
        <path marker-end="url(#research-arrow)" d="M68 56 C61 63 55 68 50 73" />
        <path marker-end="url(#research-arrow)" d="M45 73 C39 67 35 61 33 56" />
      </svg>
      <div class="mindmap-node-layer">
        ${NODES.map((node) => `
          <button class="mindmap-node" data-mindmap-node="${node.key}" style="--x:${node.x};--y:${node.y}" type="button">
            <span>${node.label}</span>
          </button>`).join("")}
      </div>
      <article class="mindmap-detail" data-mindmap-detail>
        <span>${NODES[0].label}</span>
        <small>${NODES[0].signal}</small>
        <p>${NODES[0].copy}</p>
      </article>
    </div>`;
}

function setActive(root, key) {
  const node = NODES.find((item) => item.key === key) || NODES[0];
  root.querySelectorAll(".mindmap-node").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mindmapNode === node.key);
  });
  root.querySelector("[data-mindmap-detail]").innerHTML = `
    <span>${node.label}</span>
    <small>${node.signal}</small>
    <p>${node.copy}</p>`;
}

export async function init(ctx) {
  const section = findResearchSection();
  if (!section || section.querySelector("[data-research-mindmap]")) return null;
  const heading = section.querySelector(".section-heading");
  heading.insertAdjacentHTML("afterend", template());
  const root = section.querySelector("[data-research-mindmap]");
  setActive(root, "cht");

  root.addEventListener("click", (event) => {
    const node = event.target.closest("[data-mindmap-node]");
    if (!node) return;
    setActive(root, node.dataset.mindmapNode);
  });

  if (ctx.gsap && ctx.ScrollTrigger && !ctx.reducedMotion) {
    root.querySelectorAll("svg > path").forEach((path) => {
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
    });
    ctx.gsap.fromTo(root.querySelectorAll("svg > path"),
      { opacity: 0 },
      { scrollTrigger: { trigger: root, start: "top 78%" }, strokeDashoffset: 0, opacity: 1, stagger: 0.08, duration: 0.6 }
    );
  }

  return { destroy() { root.remove(); } };
}

export function destroy(instance) {
  instance?.destroy?.();
}
