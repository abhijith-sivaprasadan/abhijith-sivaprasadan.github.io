/**
 * Eulerian fluid sim renderer (main-thread side).
 *
 * Spawns scripts/motion/fluid-sim-worker.js, sends step messages at the
 * page's frame cadence, and paints the density field onto a canvas using
 * the thesis palette.
 *
 * Replaces scripts/motion/fluid-sim.js (the particle-advected version) when
 * the page has [data-motion-fluid-sim-eulerian]. We keep the lightweight
 * particle version available as a fallback for low-power devices.
 */

const PALETTES = {
  thermal: {
    dark:  ["#0b1a30", "#1e3a8a", "#2563a8", "#65d6c9", "#fbbf24", "#d0622c"],
    light: ["#eef4fb", "#bdd7f0", "#7dd3fc", "#22d3ee", "#fb923c", "#dc2626"],
  },
  energy: {
    dark:  ["#04231a", "#064e3b", "#047857", "#10b981", "#a3e635", "#fde047"],
    light: ["#ecfdf5", "#bbf7d0", "#86efac", "#22c55e", "#84cc16", "#facc15"],
  },
  decarbonisation: {
    dark:  ["#220a02", "#451a03", "#7c2d12", "#c2410c", "#ea580c", "#fbbf24"],
    light: ["#fef0e2", "#fed7aa", "#fb923c", "#ea580c", "#dc2626", "#f59e0b"],
  },
  research: {
    dark:  ["#0c0a26", "#1e1b4b", "#4338ca", "#7c3aed", "#a78bfa", "#e9d5ff"],
    light: ["#ede9fe", "#c4b5fd", "#a78bfa", "#7c3aed", "#5b21b6", "#3730a3"],
  },
};

function lerpColor(palette, t) {
  const p = palette;
  const idx = Math.max(0, Math.min(p.length - 1, t * (p.length - 1)));
  const i0 = Math.floor(idx);
  const i1 = Math.min(p.length - 1, i0 + 1);
  const f = idx - i0;
  const [r0, g0, b0] = hexToRgb(p[i0]);
  const [r1, g1, b1] = hexToRgb(p[i1]);
  return [
    Math.round(r0 + (r1 - r0) * f),
    Math.round(g0 + (g1 - g0) * f),
    Math.round(b0 + (b1 - b0) * f),
  ];
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export async function init(ctx) {
  if (!ctx.supportsWorkers || ctx.lowPower) return null;
  const host = document.querySelector("[data-motion-fluid-sim]");
  if (!host) return null;

  // Remove the lightweight particle canvas if it has already mounted.
  // We claim the hero canvas slot for the Eulerian solver on capable devices.
  const oldCanvas = host.querySelector(".motion-fluid-canvas");
  oldCanvas?.remove();

  const canvas = document.createElement("canvas");
  canvas.className = "motion-fluid-canvas eulerian";
  canvas.setAttribute("aria-hidden", "true");
  host.appendChild(canvas);
  const renderCtx = canvas.getContext("2d", { alpha: true });
  if (!renderCtx) return null;

  // Resize tracking
  let cssW = 0, cssH = 0, dpr = window.devicePixelRatio || 1;
  function resize() {
    const r = canvas.getBoundingClientRect();
    cssW = Math.max(360, Math.floor(r.width));
    cssH = Math.max(220, Math.floor(r.height));
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    renderCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  // Pick a grid that matches the aspect roughly
  const aspect = cssW / cssH;
  const NX = aspect > 2.4 ? 112 : 96;
  const NY = Math.max(40, Math.round(NX / aspect));

  let worker;
  try {
    worker = new Worker(new URL("./fluid-sim-worker.js", import.meta.url), { type: "module" });
  } catch {
    // Some browsers require classic workers; degrade by not running
    return null;
  }

  let mode = document.body.dataset.homeMode || "thermal";
  let theme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
  let palette = (PALETTES[mode] || PALETTES.thermal)[theme];
  let frameBuf = null;

  worker.onmessage = (e) => {
    const m = e.data;
    if (m.type === "ready") {
      step();
    } else if (m.type === "frame") {
      paintFrame(m);
      requestAnimationFrame(step);
    }
  };

  function step() {
    if (document.hidden) {
      // Skip stepping when tab hidden; resume on visibilitychange
      return;
    }
    worker.postMessage({ type: "step", dt: 0.08, viscosity: 5e-6, diffusion: 8e-5 });
  }

  function paintFrame(m) {
    const { density, solid, nx, ny } = m;
    // We render into an offscreen ImageData scaled to canvas resolution
    if (!frameBuf || frameBuf.width !== Math.floor(cssW) || frameBuf.height !== Math.floor(cssH)) {
      frameBuf = renderCtx.createImageData(Math.floor(cssW), Math.floor(cssH));
    }
    const dw = frameBuf.width, dh = frameBuf.height;
    const data = frameBuf.data;
    for (let y = 0; y < dh; y++) {
      const j = Math.min(ny, Math.max(1, Math.round((y / dh) * ny)));
      for (let x = 0; x < dw; x++) {
        const i = Math.min(nx, Math.max(1, Math.round((x / dw) * nx)));
        const k = i + (nx + 2) * j;
        if (solid[k]) {
          // Solid cells: faint outline color
          const off = (y * dw + x) * 4;
          data[off]     = theme === "light" ? 22  : 200;
          data[off + 1] = theme === "light" ? 32  : 200;
          data[off + 2] = theme === "light" ? 40  : 210;
          data[off + 3] = 28;
        } else {
          const intensity = Math.min(1, density[k] * 0.4);
          const [r, g, b] = lerpColor(palette, intensity);
          const off = (y * dw + x) * 4;
          data[off]     = r;
          data[off + 1] = g;
          data[off + 2] = b;
          data[off + 3] = Math.round(220 * intensity);
        }
      }
    }
    renderCtx.putImageData(frameBuf, 0, 0);
  }

  worker.postMessage({ type: "init", nx: NX, ny: NY, mode });

  // ── Wiring ─────────────────────────────────────────────────────────────
  const onMove = (e) => {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    const dx = (e.movementX || 0) / r.width;
    const dy = (e.movementY || 0) / r.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    worker.postMessage({ type: "force", x, y, dx, dy });
  };
  host.addEventListener("mousemove", onMove, { passive: true });

  const ro = new ResizeObserver(() => { resize(); frameBuf = null; });
  ro.observe(canvas);

  const onVis = () => { if (!document.hidden) step(); };
  document.addEventListener("visibilitychange", onVis);

  ctx.bus.on("motion:mode-change", ({ mode: m }) => {
    if (!m) return; mode = m;
    palette = (PALETTES[mode] || PALETTES.thermal)[theme];
    worker.postMessage({ type: "mode", mode });
  });
  ctx.bus.on("motion:theme-change", ({ theme: t }) => {
    theme = t === "light" ? "light" : "dark";
    palette = (PALETTES[mode] || PALETTES.thermal)[theme];
  });

  return {
    destroy() {
      host.removeEventListener("mousemove", onMove);
      document.removeEventListener("visibilitychange", onVis);
      ro.disconnect();
      worker.terminate();
      canvas.remove();
    },
  };
}

export function destroy(inst) { inst?.destroy?.(); }
