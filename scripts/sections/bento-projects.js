function svgDispatch() {
  return `<svg class="bento-mini-chart" viewBox="0 0 180 72" aria-hidden="true">
    <path d="M10 56H170M10 16V56" />
    <path class="mini-line" d="M14 48C38 50 52 30 70 32S99 54 118 38S146 18 168 24" />
    <circle cx="70" cy="32" r="3"/><circle cx="118" cy="38" r="3"/>
  </svg>`;
}

function svgKpis() {
  return `<div class="bento-kpi-bars" aria-hidden="true">
    <span style="--v:82%"></span><span style="--v:64%"></span><span style="--v:74%"></span><span style="--v:48%"></span>
  </div>`;
}

function enhanceCard(card) {
  if (card.dataset.bentoReady) return;
  card.dataset.bentoReady = "true";
  const title = (card.querySelector("h3")?.textContent || "").toLowerCase();
  const thumb = card.querySelector(".project-thumb");
  if (!thumb) return;
  if (/alleima|energy performance/.test(title)) {
    thumb.insertAdjacentHTML("beforeend", svgKpis());
  } else if (/district heating|dispatch/.test(title)) {
    thumb.insertAdjacentHTML("beforeend", svgDispatch());
  } else if (/numerical heat|forecast|heating demand/.test(title)) {
    thumb.insertAdjacentHTML("beforeend", svgDispatch());
  }
}

function enhance(root = document) {
  root.querySelectorAll?.("#projects .project-card").forEach(enhanceCard);
}

export async function init() {
  enhance();
  const target = document.querySelector("[data-featured-projects]");
  const observer = new MutationObserver(() => enhance(target || document));
  if (target) observer.observe(target, { childList: true, subtree: true });
  return { destroy() { observer.disconnect(); } };
}

export function destroy(instance) {
  instance?.destroy?.();
}
