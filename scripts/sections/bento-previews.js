/**
 * Bento-tile live mini-previews.
 *
 * Each featured project card with a known data-project-id gets a small
 * inline canvas animation that runs only while the tile is in the
 * viewport. All animations are vanilla canvas — no GSAP — to keep them
 * light.
 *
 * Implemented previews:
 *   siemens-thesis            → mini flow-past-reducer streamlines
 *   alleima-energy-efficiency → animated KPI bar
 *   district-heating-optim    → dispatch curve (sine-ish heat demand)
 *   numerical-heat-transfer   → diffusion field (warm spot spreading)
 * Unknown project IDs get no preview (tile stays as-is).
 */

const PALETTE = {
  blue: "#2563a8",
  teal: "#65d6c9",
  orange: "#d0622c",
  amber: "#f6c85f",
};

const RENDERERS = {
  "siemens-thesis": renderStreamlines,
  "siemens-gas-turbine-thesis": renderStreamlines,
  "alleima-energy-efficiency": renderKpiBar,
  "district-heating-optimisation": renderDispatchCurve,
  "numerical-heat-transfer": renderDiffusion,
  "tes-peak-shaving": renderDispatchCurve,
};

function attachCanvas(card) {
  const slot = card.querySelector(".project-thumb, .project-thumb-svg, .project-card-thumb, picture, img");
  if (!slot) return null;
  const wrapper = document.createElement("div");
  wrapper.className = "bento-preview";
  wrapper.setAttribute("aria-hidden", "true");
  const canvas = document.createElement("canvas");
  wrapper.appendChild(canvas);
  slot.parentNode.insertBefore(wrapper, slot.nextSibling);
  return { wrapper, canvas };
}

function fit(canvas) {
  const r = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(r.width * ratio));
  canvas.height = Math.max(1, Math.floor(r.height * ratio));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { ctx, w: r.width, h: r.height };
}

// ─── Streamlines preview (Siemens thesis) ─────────────────────────────────
function renderStreamlines(canvas) {
  const { ctx, w, h } = fit(canvas);
  const t0 = performance.now();
  const lines = 6;
  return (now) => {
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1.4;
    for (let i = 0; i < lines; i++) {
      const y0 = (h / (lines + 1)) * (i + 1);
      ctx.beginPath();
      ctx.strokeStyle = i < lines / 2 ? PALETTE.blue : PALETTE.teal;
      const offset = ((now - t0) / 1100 + i / lines) % 1;
      for (let x = 0; x < w; x += 2) {
        const xn = x / w;
        // narrow channel: amplitude shrinks then expands
        const a = 0.10 + 0.18 * Math.sin(Math.PI * xn) * (1 - Math.min(xn * 1.3, 1));
        const wave = Math.sin((xn * 8 + offset * 6) * Math.PI) * a * h;
        const y = y0 + wave * 0.35;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  };
}

// ─── Animated KPI bar (Alleima) ───────────────────────────────────────────
function renderKpiBar(canvas) {
  const { ctx, w, h } = fit(canvas);
  const t0 = performance.now();
  return (now) => {
    ctx.clearRect(0, 0, w, h);
    const phase = Math.min(1, (now - t0) / 1400);
    const barH = 14;
    const y = h - barH - 18;
    ctx.fillStyle = "rgba(180,190,205,0.18)";
    ctx.fillRect(12, y, w - 24, barH);
    const grad = ctx.createLinearGradient(12, 0, w - 12, 0);
    grad.addColorStop(0, PALETTE.orange);
    grad.addColorStop(1, PALETTE.amber);
    ctx.fillStyle = grad;
    ctx.fillRect(12, y, (w - 24) * phase, barH);
    ctx.fillStyle = "rgba(225,230,238,0.85)";
    ctx.font = `600 11px var(--font-mono, ui-monospace, monospace)`;
    const pct = Math.round(phase * 32);
    ctx.fillText(`-${pct}% energy intensity (target)`, 12, y - 6);
  };
}

// ─── Dispatch curve (district heating, TES) ───────────────────────────────
function renderDispatchCurve(canvas) {
  const { ctx, w, h } = fit(canvas);
  const t0 = performance.now();
  return (now) => {
    ctx.clearRect(0, 0, w, h);
    const phase = ((now - t0) / 4000) % 1;
    ctx.fillStyle = "rgba(101,214,201,0.14)";
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 2) {
      const xn = x / w;
      const hour = (xn + phase) * 24;
      const demand = 0.55 + 0.35 * Math.sin((hour - 6) / 24 * Math.PI * 2) - 0.15 * Math.cos((hour) / 24 * Math.PI * 4);
      ctx.lineTo(x, h - demand * h * 0.7);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = PALETTE.teal;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 2) {
      const xn = x / w;
      const hour = (xn + phase) * 24;
      const demand = 0.55 + 0.35 * Math.sin((hour - 6) / 24 * Math.PI * 2) - 0.15 * Math.cos((hour) / 24 * Math.PI * 4);
      const y = h - demand * h * 0.7;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };
}

// ─── Diffusion (numerical heat transfer) ──────────────────────────────────
function renderDiffusion(canvas) {
  const { ctx, w, h } = fit(canvas);
  const t0 = performance.now();
  const cx = w * 0.32;
  const cy = h * 0.55;
  return (now) => {
    ctx.clearRect(0, 0, w, h);
    const t = (now - t0) / 1000;
    for (let i = 0; i < 6; i++) {
      const r = 8 + i * 14 + (t * 12) % 14;
      ctx.beginPath();
      ctx.strokeStyle = i < 2 ? PALETTE.orange : i < 4 ? PALETTE.amber : PALETTE.blue;
      ctx.globalAlpha = Math.max(0, 0.7 - i * 0.12);
      ctx.lineWidth = 1.3;
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };
}

function mount(card) {
  const id = card.dataset.projectId;
  const renderer = RENDERERS[id];
  if (!renderer) return null;
  const slot = attachCanvas(card);
  if (!slot) return null;

  const draw = renderer(slot.canvas);
  let raf = null;
  let visible = false;

  const tick = (now) => {
    if (!visible) return;
    draw(now);
    raf = requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      visible = entry.isIntersecting;
      if (visible) raf = requestAnimationFrame(tick);
      else if (raf) cancelAnimationFrame(raf);
    });
  }, { threshold: 0.25 });
  io.observe(slot.canvas);

  return { stop() { io.disconnect(); if (raf) cancelAnimationFrame(raf); slot.wrapper.remove(); } };
}

export async function init(ctx) {
  if (ctx?.reducedMotion) return null;

  const cards = document.querySelectorAll("[data-project-id]");
  const instances = [];
  cards.forEach((card) => {
    const inst = mount(card);
    if (inst) instances.push(inst);
  });
  if (!instances.length) return null;
  return {
    destroy() { instances.forEach((i) => i.stop()); },
  };
}

export function destroy(inst) { inst?.destroy?.(); }
