const NODES = [
  {
    key: "cht",
    label: "CHT in high-temperature passages",
    copy: "High-temperature CHT links geometry, wall resistance, boundary conditions and validation-grade measurements.",
    x: 48,
    y: 14,
  },
  {
    key: "surface",
    label: "Surface-condition effects",
    copy: "Deposits and altered wall condition change thermal resistance and shift what a model can safely predict.",
    x: 32,
    y: 48,
  },
  {
    key: "electrification",
    label: "Industrial electrification",
    copy: "Energy-process modelling translates measured performance into low-carbon heat, power and utility decisions.",
    x: 72,
    y: 48,
  },
  {
    key: "measurement",
    label: "Measurement chains",
    copy: "Thermocouples, pressure sensors, NI-DAQ and LabVIEW close the loop between model prediction and physical evidence.",
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
        <path d="M48 20 C40 30 36 38 32 48" />
        <path d="M40 50 C52 45 60 45 72 48" />
        <path d="M70 55 C60 66 54 73 48 82" />
        <path d="M48 78 C40 70 36 60 32 48" />
      </svg>
      <div class="mindmap-node-layer">
        ${NODES.map((node) => `
          <button class="mindmap-node" data-mindmap-node="${node.key}" style="--x:${node.x};--y:${node.y}" type="button">
            <span>${node.label}</span>
          </button>`).join("")}
      </div>
      <article class="mindmap-detail" data-mindmap-detail>
        <span>${NODES[0].label}</span>
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
    root.querySelectorAll("path").forEach((path) => {
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
    });
    ctx.gsap.fromTo(root.querySelectorAll("path"),
      { opacity: 0 },
      { scrollTrigger: { trigger: root, start: "top 78%" }, strokeDashoffset: 0, opacity: 1, stagger: 0.08, duration: 0.6 }
    );
  }

  return { destroy() { root.remove(); } };
}

export function destroy(instance) {
  instance?.destroy?.();
}
