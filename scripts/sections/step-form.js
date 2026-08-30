function assignSteps(form) {
  const row = form.querySelector(".contact-form-row");
  const subjectLabel = form.querySelector('select[name="reason"]')?.closest("label");
  const messageLabel = form.querySelector('textarea[name="message"]')?.closest("label");
  if (subjectLabel) subjectLabel.dataset.stepPanel = "1";
  if (row) row.dataset.stepPanel = "2";
  if (messageLabel) messageLabel.dataset.stepPanel = "3";
}

function controls() {
  return `
    <div class="step-form-progress" aria-label="Contact form steps">
      <span data-step-dot="1">Reason</span>
      <span data-step-dot="2">Details</span>
      <span data-step-dot="3">Message</span>
    </div>
    <div class="step-form-actions">
      <button class="button secondary" type="button" data-step-prev>Back</button>
      <button class="button primary" type="button" data-step-next>Next</button>
    </div>`;
}

function setStep(form, step) {
  const nextStep = Math.min(3, Math.max(1, step));
  form.dataset.step = String(nextStep);
  form.querySelectorAll("[data-step-dot]").forEach((dot) => {
    const value = Number(dot.dataset.stepDot);
    dot.classList.toggle("is-active", value === nextStep);
    dot.classList.toggle("is-complete", value < nextStep);
  });
}

function validateStep(form) {
  const step = form.dataset.step || "1";
  const fields = Array.from(form.querySelectorAll(`[data-step-panel="${step}"] input, [data-step-panel="${step}"] select, [data-step-panel="${step}"] textarea`));
  return fields.every((field) => field.reportValidity());
}

export async function init(ctx) {
  const form = document.querySelector("[data-contact-form]");
  if (!form || form.classList.contains("step-contact-form")) return null;
  assignSteps(form);
  form.classList.add("step-contact-form");
  form.insertAdjacentHTML("afterbegin", controls());
  setStep(form, 1);

  form.querySelector("[data-step-next]").addEventListener("click", () => {
    if (!validateStep(form)) return;
    setStep(form, Number(form.dataset.step || 1) + 1);
    ctx.bus.emit("motion:form-step", { step: Number(form.dataset.step) });
  });
  form.querySelector("[data-step-prev]").addEventListener("click", () => {
    setStep(form, Number(form.dataset.step || 1) - 1);
  });

  form.addEventListener("submit", (event) => {
    if (Number(form.dataset.step || 1) < 3) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (validateStep(form)) setStep(form, Number(form.dataset.step || 1) + 1);
    }
  }, true);

  return {
    destroy() {
      form.classList.remove("step-contact-form");
      form.querySelector(".step-form-progress")?.remove();
      form.querySelector(".step-form-actions")?.remove();
      delete form.dataset.step;
    },
  };
}

export function destroy(instance) {
  instance?.destroy?.();
}
