const STATE = {
  active: "All",
};

function normalise(value = "") {
  return value.toString().trim().toLowerCase();
}

function cardTags(card) {
  return normalise(
    [
      card.dataset.projectCategory,
      card.dataset.projectTags,
      card.dataset.projectId,
      card.textContent,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function matches(card, filter) {
  if (filter === "All") return true;
  const haystack = cardTags(card);
  const needle = normalise(filter);
  if (needle === "industrial r&d") {
    return haystack.includes("industrial r&d") || haystack.includes("industrial decarbon");
  }
  if (needle === "mechanical & structural simulation") {
    return haystack.includes("structural fea") || haystack.includes("mechanical & structural simulation") || haystack.includes("ansys mechanical");
  }
  return haystack.includes(needle);
}

function apply(toolbar, grid) {
  const buttons = Array.from(toolbar.querySelectorAll("[data-featured-filter]"));
  const count = toolbar.querySelector("[data-featured-filter-count]");
  const cards = Array.from(grid.querySelectorAll(".project-card"));
  let visible = 0;

  buttons.forEach((button) => {
    const active = button.dataset.featuredFilter === STATE.active;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });

  cards.forEach((card) => {
    const show = matches(card, STATE.active);
    card.hidden = !show;
    card.classList.toggle("is-filtered-out", !show);
    if (show) visible += 1;
  });

  if (count) {
    count.textContent = `${visible} / ${cards.length}`;
  }
}

export async function init() {
  const toolbar = document.querySelector("[data-featured-project-filters]");
  const grid = document.querySelector("[data-featured-projects]");
  if (!toolbar || !grid) return null;

  const onClick = (event) => {
    const button = event.target.closest?.("[data-featured-filter]");
    if (!button) return;
    STATE.active = button.dataset.featuredFilter || "All";
    apply(toolbar, grid);
  };

  toolbar.addEventListener("click", onClick);

  const observer = new MutationObserver(() => apply(toolbar, grid));
  observer.observe(grid, { childList: true, subtree: false });
  apply(toolbar, grid);

  return {
    destroy() {
      toolbar.removeEventListener("click", onClick);
      observer.disconnect();
    },
  };
}

export function destroy(instance) {
  instance?.destroy?.();
}
