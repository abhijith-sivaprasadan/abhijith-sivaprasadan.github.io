function laneMode(lane) {
  return lane.getAttribute("data-home-mode-target") || "thermal energy decarbonisation research";
}

function isActiveForMode(lane, mode) {
  return laneMode(lane).split(/\s+/).includes(mode);
}

function build(lanes) {
  const nodes = lanes.map((lane, index) => ({
    index,
    mode: laneMode(lane),
    href: lane.getAttribute("href"),
    label: lane.querySelector("span")?.textContent?.trim() || "Evidence",
    title: lane.querySelector("strong")?.textContent?.trim() || lane.textContent.trim(),
    copy: lane.querySelector("small")?.textContent?.trim() || "",
    x: [16, 40, 68, 82, 28, 58, 74, 50, 20, 84, 44][index % 11],
    y: [24, 18, 30, 54, 62, 74, 20, 48, 78, 82, 42][index % 11],
  }));
  const edges = nodes.slice(1).map((node) => [0, node.index]);
  return `
    <div class="v4-evidence-graph" data-evidence-graph>
      <svg viewBox="0 0 100 100" aria-label="Interactive evidence relationship map">
        <g class="graph-edges">
          ${edges.map(([a, b]) => `<line data-a="${a}" data-b="${b}" x1="${nodes[a].x}" y1="${nodes[a].y}" x2="${nodes[b].x}" y2="${nodes[b].y}"/>`).join("")}
        </g>
        <g class="graph-markers" aria-hidden="true">
          ${nodes.map((node) => `<circle data-node-marker="${node.index}" cx="${node.x}" cy="${node.y}" r="${node.index === 0 ? 3.2 : 2.2}"/>`).join("")}
        </g>
      </svg>
      <div class="graph-node-layer" aria-label="Evidence nodes">
        ${nodes.map((node) => `
          <button class="graph-node" data-node-index="${node.index}" data-node-mode="${node.mode}" style="--x:${node.x};--y:${node.y}" type="button">
            <span>${node.label}</span>
            <strong>${node.title}</strong>
          </button>`).join("")}
      </div>
      <article class="graph-detail" data-graph-detail>
        <span>${nodes[0]?.label || "Evidence"}</span>
        <strong>${nodes[0]?.title || ""}</strong>
        <p>${nodes[0]?.copy || ""}</p>
        <a href="${nodes[0]?.href || "#"}">Open evidence</a>
      </article>
    </div>`;
}

function update(root, mode) {
  root.querySelectorAll(".graph-node").forEach((node) => {
    node.classList.toggle("is-dimmed", !node.dataset.nodeMode.split(/\s+/).includes(mode));
  });
  root.querySelectorAll("[data-node-marker]").forEach((marker) => {
    const node = root.querySelector(`[data-node-index="${marker.dataset.nodeMarker}"]`);
    marker.classList.toggle("is-dimmed", node?.classList.contains("is-dimmed"));
  });
  root.querySelectorAll(".graph-edges line").forEach((edge) => {
    const node = root.querySelector(`[data-node-index="${edge.dataset.b}"]`);
    edge.classList.toggle("is-dimmed", node?.classList.contains("is-dimmed"));
  });
}

export async function init(ctx) {
  const lanes = Array.from(document.querySelectorAll(".evidence-lanes .evidence-lane"));
  const host = document.querySelector(".evidence-lanes");
  if (!lanes.length || !host || document.querySelector("[data-evidence-graph]")) return null;
  host.insertAdjacentHTML("afterend", build(lanes));
  host.classList.add("has-v4-graph-source");
  const graph = document.querySelector("[data-evidence-graph]");
  const detail = graph.querySelector("[data-graph-detail]");

  graph.addEventListener("click", (event) => {
    const node = event.target.closest(".graph-node");
    if (!node) return;
    const source = lanes[Number(node.dataset.nodeIndex)];
    detail.innerHTML = `
      <span>${source.querySelector("span")?.textContent || "Evidence"}</span>
      <strong>${source.querySelector("strong")?.textContent || ""}</strong>
      <p>${source.querySelector("small")?.textContent || ""}</p>
      <a href="${source.getAttribute("href") || "#"}">Open evidence</a>`;
  });

  const off = ctx.bus.on("motion:mode-change", ({ mode }) => update(graph, mode || document.body.dataset.homeMode || "thermal"));
  update(graph, document.body.dataset.homeMode || "thermal");
  return { destroy() { off?.(); host.classList.remove("has-v4-graph-source"); graph.remove(); } };
}

export function destroy(instance) {
  instance?.destroy?.();
}
