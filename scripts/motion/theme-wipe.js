export async function init(ctx) {
  let lastPoint = { x: window.innerWidth - 48, y: 48 };

  document.addEventListener("pointerdown", (event) => {
    const btn = event.target.closest?.("[data-theme-toggle]");
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    lastPoint = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }, { capture: true, passive: true });

  const off = ctx.bus.on("motion:theme-change", () => {
    const overlay = document.createElement("div");
    overlay.className = "motion-theme-wipe";
    overlay.style.setProperty("--wipe-x", `${lastPoint.x}px`);
    overlay.style.setProperty("--wipe-y", `${lastPoint.y}px`);
    overlay.style.background = document.documentElement.dataset.theme === "light" ? "#f5f3ea" : "#070907";
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("is-active"));
    ctx.gsap?.to(overlay, {
      opacity: 0,
      duration: 0.38,
      delay: 0.48,
      ease: "power2.out",
      onComplete: () => overlay.remove(),
    }) || setTimeout(() => overlay.remove(), 850);
  });

  return { destroy() { off?.(); } };
}

export function destroy(instance) {
  instance?.destroy?.();
}
