/**
 * Eulerian fluid sim renderer (main-thread side).
 *
 * Pipeline:
 *   1. Worker (fluid-sim-worker.js) runs Stable Fluids per frame and returns
 *      a density (or scalar) field + a solid-cell mask + zone tags + per-mode
 *      metrics.
 *   2. paintFrame() paints the density field via ImageData on an offscreen
 *      canvas at simulation resolution, then composites it to the visible
 *      canvas (cheap upscale).
 *   3. drawObstacleOverlay() strokes a thin obstacle wireframe over the
 *      density so the viewer can see the geometry. NO animated curves —
 *      the density IS the visible flow.
 *   4. Per-mode live telemetry is computed (or read from worker metrics) and
 *      pushed into the [data-*-metric] DOM nodes that markup adds to the hero.
 *
 * w16: removed the 4 `drawXScene` Math.sin overlays — they covered the real
 * density with decorative curves and made the visualisation look like dotted
 * particles rather than fluid.
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
    dark:  ["#050811", "#102f55", "#0e7490", "#f05b25", "#ffbf45", "#fff1c7"],
    light: ["#edf4fa", "#93c5df", "#0891b2", "#ea580c", "#f59e0b", "#7c2d12"],
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgba(hex, alpha) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function lerpColor(palette, t) {
  const idx = Math.max(0, Math.min(palette.length - 1, t * (palette.length - 1)));
  const i0 = Math.floor(idx);
  const i1 = Math.min(palette.length - 1, i0 + 1);
  const f = idx - i0;
  const [r0, g0, b0] = hexToRgb(palette[i0]);
  const [r1, g1, b1] = hexToRgb(palette[i1]);
  return [
    Math.round(r0 + (r1 - r0) * f),
    Math.round(g0 + (g1 - g0) * f),
    Math.round(b0 + (b1 - b0) * f),
  ];
}

function quintic(value) {
  const t = Math.max(0, Math.min(1, value));
  return 6 * t ** 5 - 15 * t ** 4 + 10 * t ** 3;
}

// ── Obstacle outline overlays (thin wireframe only, no animated curves) ──
function drawObstacleOverlay(ctx, mode, width, height, palette) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = rgba(palette[5] || palette[palette.length - 1], 0.32);
  ctx.lineWidth = 1.2;

  if (mode === "thermal") {
    // Smooth C2 reducer outline. Mirrors fluid-sim-worker.js reducerRadius().
    // R(xn) = 0.40 - 0.30 * quintic((xn - 0.27) / 0.45)
    for (const sign of [-1, 1]) {
      ctx.beginPath();
      for (let x = 0; x <= width; x += 4) {
        const xn = x / width;
        const r = 0.40 - 0.30 * quintic((xn - 0.27) / 0.45);
        const y = height * (0.5 + sign * r / 2);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // Throat marker — a faint vertical tick at xn=0.72 (downstream of contraction)
    const throatX = width * 0.72;
    ctx.strokeStyle = rgba(palette[4], 0.40);
    ctx.beginPath();
    ctx.moveTo(throatX, height * 0.46);
    ctx.lineTo(throatX, height * 0.54);
    ctx.stroke();
  } else if (mode === "research") {
    // Converging-diverging nozzle outline. Mirrors worker nozzleRadius().
    const nozzleR = (xn) => {
      if (xn <= 0.23) return 0.29 + (0.065 - 0.29) * quintic((xn - 0.025) / 0.205);
      return 0.065 + (0.14 - 0.065) * quintic((xn - 0.23) / 0.24);
    };
    for (const sign of [-1, 1]) {
      ctx.beginPath();
      for (let x = width * 0.025; x <= width * 0.47; x += 3) {
        const r = nozzleR(x / width);
        const y = height * (0.5 + sign * r / 2);
        if (x === width * 0.025) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // Throat tick
    const throatX = width * 0.23;
    ctx.strokeStyle = rgba(palette[4], 0.50);
    ctx.beginPath();
    ctx.moveTo(throatX, height * 0.46);
    ctx.lineTo(throatX, height * 0.54);
    ctx.stroke();
  } else if (mode === "energy") {
    // Grid network: 7 nodes connected by thin lines.
    const nodes = [
      [0.20, 0.30], [0.20, 0.70],
      [0.45, 0.20], [0.45, 0.50], [0.45, 0.80],
      [0.70, 0.35], [0.70, 0.65],
    ];
    const edges = [[0, 2], [0, 3], [1, 3], [1, 4], [2, 5], [3, 5], [3, 6], [4, 6]];
    ctx.strokeStyle = rgba(palette[2], 0.28);
    edges.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(nodes[a][0] * width, nodes[a][1] * height);
      ctx.lineTo(nodes[b][0] * width, nodes[b][1] * height);
      ctx.stroke();
    });
    nodes.forEach(([nx, ny]) => {
      ctx.fillStyle = rgba(palette[4], 0.50);
      ctx.beginPath();
      ctx.arc(nx * width, ny * height, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (mode === "decarbonisation") {
    // Process blocks
    const blocks = [
      [0.18, 0.55, 0.10, 0.20],
      [0.40, 0.30, 0.12, 0.18],
      [0.62, 0.55, 0.10, 0.22],
    ];
    ctx.strokeStyle = rgba(palette[3], 0.45);
    blocks.forEach(([bx, by, bw, bh]) => {
      ctx.strokeRect(bx * width, by * height, bw * width, bh * height);
    });
    // Meter dots
    const meters = [
      [0.11, 0.24, palette[2]],
      [0.09, 0.42, palette[3]],
      [0.70, 0.58, palette[4]],
    ];
    meters.forEach(([mx, my, color]) => {
      ctx.fillStyle = rgba(color, 0.80);
      ctx.beginPath();
      ctx.arc(mx * width, my * height, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  ctx.restore();
}

// ── Domain telemetry: thermal mode (compressible flow through C2 reducer) ─
// Inputs are reported thesis signals: T0 = 673 K, Ma = 0.990 for the smooth
// reducer and Bi = 0.003-0.004. The animation never perturbs these evidence
// values; motion is a transport-field lens behind the reported result.
// equation: T/T0 = (1 + (gamma - 1) / 2 * M^2)^-1 - Anderson, ch. 3.
function thermalTelemetry() {
  const gamma = 1.4;
  const T0 = 673;
  const throatMach = 0.990;
  const T_throat = T0 / (1 + ((gamma - 1) / 2) * throatMach ** 2);
  // equation: Bi = h Lc / k; the thesis-reported band is used verbatim.
  return {
    mach: throatMach.toFixed(3),
    temperature: `${Math.round(T_throat)} K`,
    pressureDrop: "CFD comparison",
    biot: "0.003-0.004",
  };
}

// ── Domain telemetry: energy mode (24h dispatch) ─────────────────────────
// Uses the first 24 hours of the portfolio's PRO2 input files:
// Demand profiles_heating.csv (sum of five loads, kW) and elprice.csv
// (electricity-price input). This is an animated input-and-policy screening
// view, not a claim that the MILP optimum is being recalculated in-browser.
// equation: Q_dem = sum_i Q_i; marginal HP heat price = p_el / COP.
const PRO2_DEMAND_MW = [
  1.5459, 1.5103, 1.5149, 1.4863, 1.5587, 1.5800,
  1.6828, 1.6489, 1.6985, 1.7021, 1.7269, 1.7640,
  1.8287, 1.7704, 1.7499, 1.6661, 1.6354, 1.6617,
  1.7667, 1.6510, 1.6189, 1.5936, 1.6234, 1.5933,
];
const PRO2_PRICE = [
  595.9, 571.7, 516.2, 515.2, 581.1, 702.3,
  788.0, 915.9, 957.7, 962.0, 876.3, 854.5,
  817.3, 834.3, 832.5, 827.3, 809.7, 832.5,
  810.9, 799.8, 725.5, 694.0, 694.8, 678.6,
];
function energyTelemetry(now) {
  const hour = Math.floor((now / 1666) % 24);
  const demand_MW = PRO2_DEMAND_MW[hour];
  const price = PRO2_PRICE[hour];
  const marginal = price < 650 ? "Heat pump + charge" : price > 850 ? "CHP + TES discharge" : "CHP / heat pump";
  let tesSOC = 50;
  for (let index = 0; index <= hour; index += 1) {
    tesSOC += PRO2_PRICE[index] < 650 ? 8 : PRO2_PRICE[index] > 850 ? -10 : -2;
    tesSOC = Math.max(15, Math.min(92, tesSOC));
  }
  return {
    hour: `${String(hour + 1).padStart(2, "0")}:00`,
    demand: `${demand_MW.toFixed(1)} MW`,
    marginal,
    tes: `${tesSOC.toFixed(0)}%`,
  };
}

// ── Industrial decarbonisation telemetry — physical model ────────────────
// equation: EnPI = E_purchased / production  (ISO 50006:2014)
// equation: emissions intensity = (E_elec · gCO2/kWh_elec + E_gas · gCO2/kWh_gas) / production
// Heat pump COP assumed 3.25; electric boiler η = 0.98; condensing gas boiler η = 0.90.
function industrialModel(controls) {
  const load = controls.load / 100;
  const heatDemand = 5.2 * load;
  const recovered = controls.recovery ? heatDemand * 0.22 : 0;
  const netHeat = heatDemand - recovered;
  const heatPumpHeat = controls.heatPump ? netHeat * 0.52 : 0;
  const boilerHeat = controls.electricBoiler ? (netHeat - heatPumpHeat) * 0.62 : 0;
  const gasHeat = Math.max(0, netHeat - heatPumpHeat - boilerHeat);
  const electricInput = heatPumpHeat / 3.25 + boilerHeat / 0.98 + 0.32 * load;
  const gasInput = gasHeat / 0.90;
  const production = 10 * load;
  const purchasedEnergy = electricInput + gasInput;
  const emissions = electricInput * controls.grid + gasInput * 202; // gCO2/kWh_gas ≈ 202
  const baselineElectricInput = 0.32 * load;
  const baselineGasInput = heatDemand / 0.90;
  const baselinePurchasedEnergy = baselineElectricInput + baselineGasInput;
  const baselineEmissions = baselineElectricInput * controls.grid + baselineGasInput * 202;
  const enpi = purchasedEnergy / production;
  const baselineEnpi = baselinePurchasedEnergy / production;
  const emissionsIntensity = emissions / production;
  const baselineEmissionsIntensity = baselineEmissions / production;
  return {
    heatDemand,
    recovered,
    electricInput,
    gasInput,
    enpi,
    baselineEnpi,
    emissions: emissionsIntensity,
    baselineEmissions: baselineEmissionsIntensity,
    enpiImprovement: Math.max(0, ((baselineEnpi - enpi) / baselineEnpi) * 100),
    emissionsReduction: Math.max(0, baselineEmissionsIntensity - emissionsIntensity),
  };
}

// ── Public init ──────────────────────────────────────────────────────────
export async function init(ctx) {
  if (!ctx.supportsWorkers || ctx.lowPower) return null;
  const host = document.querySelector("[data-motion-fluid-sim]");
  if (!host) return null;

  // Remove any lightweight particle canvas already mounted.
  const oldCanvas = host.querySelector(".motion-fluid-canvas");
  oldCanvas?.remove();

  const canvas = document.createElement("canvas");
  canvas.className = "motion-fluid-canvas eulerian";
  canvas.setAttribute("aria-hidden", "true");
  host.appendChild(canvas);
  const renderCtx = canvas.getContext("2d", { alpha: true });
  if (!renderCtx) return null;

  let cssW = 0, cssH = 0;
  const dpr = window.devicePixelRatio || 1;
  function resize() {
    const r = canvas.getBoundingClientRect();
    cssW = Math.max(360, Math.floor(r.width));
    cssH = Math.max(220, Math.floor(r.height));
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    renderCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  const aspect = cssW / cssH;
  // Keep the contour field visibly smooth on modern displays while capping
  // the tall-hero grid so the worker remains responsive at 30 fps.
  const NX = aspect > 2.4 ? 244 : 224;
  const NY = Math.min(128, Math.max(68, Math.round(NX / aspect)));

  let worker;
  try {
    const workerUrl = new URL("./fluid-sim-worker.js", import.meta.url);
    workerUrl.search = new URL(import.meta.url).search;
    worker = new Worker(workerUrl, { type: "module" });
  } catch {
    return null;
  }

  let mode = document.body.dataset.homeMode || "thermal";
  let theme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
  let palette = (PALETTES[mode] || PALETTES.thermal)[theme];
  const industrialControls = {
    load: 72,
    grid: 55,
    recovery: true,
    heatPump: true,
    electricBoiler: false,
  };
  host.dataset.motionScene = mode;

  // Field canvas painted at simulation resolution — composited up to display
  const fieldCanvas = document.createElement("canvas");
  const fieldCtx = fieldCanvas.getContext("2d", { alpha: true });
  let frameBuf = null;
  let lastFrameAt = 0;

  worker.onmessage = (e) => {
    const m = e.data;
    if (m.type === "ready") {
      requestAnimationFrame(scheduleStep);
    } else if (m.type === "frame") {
      paintFrame(m);
      requestAnimationFrame(scheduleStep);
    }
  };

  function scheduleStep(now) {
    if (now - lastFrameAt < 33) {
      requestAnimationFrame(scheduleStep);
      return;
    }
    lastFrameAt = now;
    step();
  }

  function step() {
    if (document.hidden) return;
    worker.postMessage({ type: "step", dt: 0.08, viscosity: 5e-6, diffusion: 8e-5 });
  }

  function paintFrame(m) {
    const { density, magnitude, solid, zones, nx, ny } = m;
    if (!fieldCtx) return;
    if (!frameBuf || frameBuf.width !== nx || frameBuf.height !== ny) {
      fieldCanvas.width = nx;
      fieldCanvas.height = ny;
      frameBuf = fieldCtx.createImageData(nx, ny);
    }
    const data = frameBuf.data;
    for (let y = 0; y < ny; y++) {
      const j = y + 1;
      for (let x = 0; x < nx; x++) {
        const i = x + 1;
        const k = i + (nx + 2) * j;
        const off = (y * nx + x) * 4;
        if (zones?.[k] === 1) {
          // Wall (research mode)
          data[off] = 148; data[off + 1] = 158; data[off + 2] = 170; data[off + 3] = 145;
        } else if (zones?.[k] === 2) {
          // Cooling channel
          data[off] = 34; data[off + 1] = 174; data[off + 2] = 210; data[off + 3] = 185;
        } else if (zones?.[k] === 3) {
          // Coke deposit
          data[off] = 44; data[off + 1] = 30; data[off + 2] = 22; data[off + 3] = 230;
        } else if (solid[k]) {
          // Generic solid — faint outline tint
          data[off]     = theme === "light" ? 22  : 200;
          data[off + 1] = theme === "light" ? 32  : 200;
          data[off + 2] = theme === "light" ? 40  : 210;
          data[off + 3] = 28;
        } else {
          // Research supplies a temperature scalar. Other modes colour by
          // solved velocity magnitude, with transported dye controlling alpha.
          const intensity = mode === "research"
            ? Math.min(1, density[k])
            : Math.min(1, magnitude?.[k] ?? 0);
          const transportedDensity = Math.min(1, density[k] * 0.38);
          const [r, g, b] = lerpColor(palette, intensity);
          data[off]     = r;
          data[off + 1] = g;
          data[off + 2] = b;
          data[off + 3] = Math.round(225 * (mode === "research" ? intensity : transportedDensity));
        }
      }
    }
    fieldCtx.putImageData(frameBuf, 0, 0);

    renderCtx.clearRect(0, 0, cssW, cssH);
    renderCtx.imageSmoothingEnabled = true;
    renderCtx.drawImage(fieldCanvas, 0, 0, cssW, cssH);

    // Thin obstacle outline ONLY — no animated curves, no Math.sin overlays.
    // The density field IS the visible flow.
    drawObstacleOverlay(renderCtx, mode, cssW, cssH, palette);

    // Telemetry updates per mode
    if (mode === "research" && m.metrics) updateResearchMetrics(m.metrics);
    else if (mode === "thermal") updateThermalMetrics();
    else if (mode === "energy") updateEnergyMetrics(performance.now());
    else if (mode === "decarbonisation") updateIndustrialMetrics();
  }

  worker.postMessage({ type: "init", nx: NX, ny: NY, mode });

  // ── Input + observer wiring ────────────────────────────────────────────
  const onMove = (e) => {
    if (mode === "research") return; // plume is parameter-driven, not perturbed
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

  const onVis = () => { if (!document.hidden) requestAnimationFrame(scheduleStep); };
  document.addEventListener("visibilitychange", onVis);

  // ── Telemetry DOM update functions ─────────────────────────────────────
  function updateResearchMetrics(metrics) {
    const text = {
      exitMach: `Ma ${metrics.exitMach.toFixed(2)}`,
      wallTemperature: `${Math.round(metrics.maxWallTemperature)} K`,
      healthIndex: `${Math.round(metrics.healthIndex)} / 100`,
      runtime: `${Math.round(metrics.simulatedTime)} s`,
      depositThickness: `${Math.round(metrics.cokeThicknessMicrons)} µm`,
    };
    Object.entries(text).forEach(([key, value]) => {
      const node = document.querySelector(`[data-research-metric="${key}"]`);
      if (node) node.textContent = value;
    });
  }

  function updateThermalMetrics() {
    const t = thermalTelemetry();
    const text = {
      mach: `Ma ${t.mach}`,
      temperature: t.temperature,
      pressureDrop: t.pressureDrop,
      biot: `Bi ${t.biot}`,
    };
    Object.entries(text).forEach(([key, value]) => {
      const node = document.querySelector(`[data-thermal-metric="${key}"]`);
      if (node) node.textContent = value;
    });
  }

  function updateEnergyMetrics(now) {
    const t = energyTelemetry(now);
    const text = {
      hour: t.hour,
      demand: t.demand,
      marginal: t.marginal,
      tes: `TES ${t.tes}`,
    };
    Object.entries(text).forEach(([key, value]) => {
      const node = document.querySelector(`[data-energy-metric="${key}"]`);
      if (node) node.textContent = value;
    });
  }

  function updateIndustrialMetrics() {
    const metrics = industrialModel(industrialControls);
    const text = {
      heat: `${metrics.heatDemand.toFixed(2)} MW`,
      recovered: `${metrics.recovered.toFixed(2)} MW`,
      enpi: `${metrics.enpi.toFixed(3)} MWh/u`,
      emissions: `${metrics.emissions.toFixed(1)} kg/u`,
      baselineEnpi: `${metrics.baselineEnpi.toFixed(3)} MWh/u`,
      emissionsReduction: `-${metrics.emissionsReduction.toFixed(1)} kg/u`,
    };
    Object.entries(text).forEach(([key, value]) => {
      const node = document.querySelector(`[data-industrial-metric="${key}"]`);
      if (node) node.textContent = value;
    });
  }

  // Bind industrial controls (sliders + checkboxes in the hero markup)
  document.querySelectorAll("[data-industrial-control]").forEach((input) => {
    input.addEventListener("input", () => {
      const key = input.dataset.industrialControl;
      industrialControls[key] = input.type === "checkbox" ? input.checked : Number(input.value);
      const output = document.querySelector(`[data-industrial-output="${key}"]`);
      if (output) {
        output.textContent = key === "load" ? `${industrialControls[key]}%` : `${industrialControls[key]} kg CO2e/MWh`;
      }
      updateIndustrialMetrics();
    });
  });
  updateIndustrialMetrics();

  // Bus subscriptions for mode + theme swap
  ctx.bus.on("motion:mode-change", ({ mode: m }) => {
    if (!m) return;
    mode = m;
    palette = (PALETTES[mode] || PALETTES.thermal)[theme];
    host.dataset.motionScene = mode;
    renderCtx.clearRect(0, 0, cssW, cssH);
    frameBuf = null;
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
