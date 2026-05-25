function clean(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

function ensureDialog() {
  let dialog = document.querySelector("[data-letter-dialog]");
  if (dialog) return dialog;
  dialog = document.createElement("dialog");
  dialog.className = "letter-dialog";
  dialog.setAttribute("data-letter-dialog", "");
  dialog.innerHTML = `
    <div class="letter-dialog-panel">
      <button class="letter-dialog-close" type="button" data-letter-close aria-label="Close recommendation viewer">Close</button>
      <article class="letter-page" data-letter-page></article>
    </div>`;
  document.body.appendChild(dialog);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog || event.target.closest("[data-letter-close]")) {
      if (dialog.close) dialog.close();
      else dialog.removeAttribute("open");
    }
  });
  return dialog;
}

function contentFromCard(card) {
  const summary = clean(card.querySelector(".testimonial-body")?.textContent);
  const author = clean(card.querySelector(".testimonial-author strong")?.textContent);
  const role = clean(card.querySelector(".testimonial-author span")?.textContent);
  return { summary, author, role };
}

function render(dialog, card) {
  const { summary, author, role } = contentFromCard(card);
  dialog.querySelector("[data-letter-page]").innerHTML = `
    <div class="letter-header">
      <span>Academic recommendation summary</span>
      <strong>College of Engineering Perumon</strong>
    </div>
    <p class="letter-summary">${summary}</p>
    <div class="letter-meta">
      <strong>${author}</strong>
      <span>${role}</span>
    </div>
    <p>Paraphrased from a signed academic recommendation letter. Full document available on request.</p>`;
}

export async function init() {
  const cards = Array.from(document.querySelectorAll(".testimonial-card"));
  if (!cards.length) return null;
  const dialog = ensureDialog();
  cards.forEach((card) => {
    if (card.querySelector("[data-letter-open]")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "letter-open";
    button.setAttribute("data-letter-open", "");
    button.textContent = "View summary";
    card.appendChild(button);
    button.addEventListener("click", () => {
      render(dialog, card);
      if (dialog.showModal) dialog.showModal();
      else dialog.setAttribute("open", "");
    });
  });
  return {
    destroy() {
      cards.forEach((card) => card.querySelector("[data-letter-open]")?.remove());
      dialog.remove();
    },
  };
}

export function destroy(instance) {
  instance?.destroy?.();
}
