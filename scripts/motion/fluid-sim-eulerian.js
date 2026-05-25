/**
 * Hero instrument-scene renderer (main-thread side).
 *
 * Pipeline:
 *   1. Thermal scans the tracked ANSYS thesis result views; animation is
 *      presentational and the result image remains the evidence.
 *   2. Energy and Industrial paint data/model-driven diagrams from the PRO2
 *      playback and the stated mass/energy balance.
 *   3. Research paints the worker's equation-informed nozzle thermal scalar
 *      with channel/deposit overlays and live metrics.
 *   4. Per-mode live telemetry is computed (or read from worker metrics) and
 *      pushed into the [data-*-metric] DOM nodes that markup adds to the hero.
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

function stageBackground(ctx, width, height) {
  ctx.save();
  ctx.fillStyle = "#050a0f";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(119, 150, 159, 0.09)";
  ctx.lineWidth = 1;
  for (let x = 0.5; x < width; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0.5; y < height; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function stageLabel(ctx, text, x, y, color = "#9bb1bc") {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = "500 11px 'JetBrains Mono', ui-monospace, monospace";
  ctx.fillText(text, x, y);
  ctx.restore();
}

function isSwedish() {
  return document.documentElement.dataset.locale === "sv";
}

// ── CHT thermal-resistance circuit (Siemens thesis analytical method) ────
// Drives the Thermal & Fluid hero scene. Visualises the actual analysis
// that produced the Bi 0.003-0.004 finding: a 1-D resistance network from
// hot gas → wall → ambient. Heat flux Q is the "current" flowing through.
// Bar heights are proportional to each resistance, making it visually
// obvious that R_ext dominates while R_wall is vanishingly small —
// i.e. the wall is essentially lumped.
//
// equation: q = (T_gas - T_ext) / (1/h_gas + t_w/k_wall + 1/h_ext)
// equation: T_inner = T_gas - q · R_gas
// equation: T_outer = T_inner - q · R_wall
// equation: Bi_ext = h_ext · t_w / k_wall    (thesis-reported band)
//
// Inputs are the thesis operating point + representative correlations
// (Sieder-Tate-style internal h, free-convection external h for the
// uninsulated reducer case described in TRITA-ITM-EX 2026:14).
function chtState() {
  const T_gas = 673;           // K — inlet stagnation (thesis)
  const T_ext = 293;           // K — ambient
  const t_wall = 0.005;        // m — 5 mm steel wall
  const k_wall = 21.5;         // W/m·K — steel at ~673 K
  const h_gas = 320;           // W/m²·K — forced convection inside the reducer
  const h_ext = 14;            // W/m²·K — free convection on the outer wall
  const R_gas = 1 / h_gas;     // m²·K/W
  const R_wall = t_wall / k_wall;
  const R_ext = 1 / h_ext;
  const R_total = R_gas + R_wall + R_ext;
  const q = (T_gas - T_ext) / R_total;     // W/m²
  const T_inner = T_gas - q * R_gas;
  const T_outer = T_inner - q * R_wall;
  const Bi = h_ext * t_wall / k_wall;
  return { T_gas, T_ext, t_wall, k_wall, h_gas, h_ext, R_gas, R_wall, R_ext, R_total, q, T_inner, T_outer, Bi };
}

function drawThermalEvidence(ctx, width, height, _source, now) {
  stageBackground(ctx, width, height);
  const S = chtState();

  // ── Layout ──────────────────────────────────────────────────────────────
  const padX = 22;
  const headerH = 38;
  const wallY = 60;                       // top of the wall band
  const wallH = Math.min(118, height * 0.36);  // height of the wall band
  const barsY = wallY + wallH + 32;       // top of the resistance bars
  const barsH = Math.min(78, height * 0.20);

  // Three sub-widths: gas zone, wall zone, ext zone (wall narrow on purpose)
  const innerW = width - padX * 2;
  const wWall = Math.max(34, innerW * 0.08);
  const wGas = (innerW - wWall) * 0.50;
  const wExt = (innerW - wWall) * 0.50;
  const xGas = padX;
  const xWall = xGas + wGas;
  const xExt = xWall + wWall;

  // ── Header ──────────────────────────────────────────────────────────────
  stageLabel(ctx, isSwedish()
    ? "KONJUGERAD VÄRMEÖVERFÖRING / TERMISKT MOTSTÅND I VÄGGEN"
    : "CONJUGATE HEAT TRANSFER / WALL THERMAL RESISTANCE", padX, 18, "#82a4b4");
  stageLabel(ctx, "TRITA-ITM-EX 2026:14 · Siemens Energy Finspång", padX, 32, "#65d6c9");

  // ── Hot gas zone ───────────────────────────────────────────────────────
  const gasGrad = ctx.createLinearGradient(xGas, 0, xWall, 0);
  gasGrad.addColorStop(0, "#7c2d12");
  gasGrad.addColorStop(0.5, "#d0622c");
  gasGrad.addColorStop(1, "#f6c85f");
  ctx.fillStyle = gasGrad;
  ctx.fillRect(xGas, wallY, wGas, wallH);

  // ── Wall zone (steel) ──────────────────────────────────────────────────
  const wallGrad = ctx.createLinearGradient(xWall, 0, xExt, 0);
  // Through-wall gradient is tiny in reality (~1 K). Show as a near-uniform
  // dark band with two faint hatch marks to indicate "structural steel".
  wallGrad.addColorStop(0, "#3a3f4a");
  wallGrad.addColorStop(1, "#2c313b");
  ctx.fillStyle = wallGrad;
  ctx.fillRect(xWall, wallY, wWall, wallH);
  ctx.strokeStyle = "rgba(180, 188, 198, 0.18)";
  ctx.lineWidth = 1;
  for (let h = 0; h < 5; h++) {
    const hy = wallY + 8 + h * (wallH - 16) / 4;
    ctx.beginPath();
    ctx.moveTo(xWall + 3, hy);
    ctx.lineTo(xWall + wWall - 3, hy);
    ctx.stroke();
  }

  // ── External air zone ──────────────────────────────────────────────────
  const extGrad = ctx.createLinearGradient(xExt, 0, xExt + wExt, 0);
  extGrad.addColorStop(0, "#1e3a8a");
  extGrad.addColorStop(0.5, "#2563a8");
  extGrad.addColorStop(1, "#0b1a30");
  ctx.fillStyle = extGrad;
  ctx.fillRect(xExt, wallY, wExt, wallH);

  // ── Heat-flux arrows (animated, moving right) ──────────────────────────
  ctx.save();
  const arrowOffset = (now * 0.06) % 36;
  for (let row = 0; row < 3; row++) {
    const rowY = wallY + wallH * (0.30 + row * 0.20);
    ctx.strokeStyle = "rgba(255, 241, 199, 0.85)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let x = xGas + 6 - arrowOffset; x < xExt + wExt; x += 36) {
      const ax = x;
      // Arrow shaft
      ctx.moveTo(ax, rowY);
      ctx.lineTo(ax + 22, rowY);
      // Arrow head
      ctx.moveTo(ax + 18, rowY - 3);
      ctx.lineTo(ax + 22, rowY);
      ctx.lineTo(ax + 18, rowY + 3);
    }
    ctx.stroke();
  }
  ctx.restore();
  stageLabel(ctx, "Q  →", xExt + wExt - 24, wallY - 6, "#fff1c7");

  // ── Temperature labels ────────────────────────────────────────────────
  ctx.save();
  ctx.fillStyle = "rgba(255, 241, 199, 0.92)";
  ctx.font = "600 12px 'JetBrains Mono', ui-monospace, monospace";
  ctx.fillText(`T₀ = ${S.T_gas} K`, xGas + 6, wallY + wallH + 16);
  ctx.fillText(`T_inner ${Math.round(S.T_inner)} K`, xWall - 56, wallY + wallH + 16);
  ctx.fillText(`T_outer ${Math.round(S.T_outer)} K`, xExt + 4, wallY + wallH + 16);
  ctx.fillStyle = "rgba(173, 200, 240, 0.92)";
  ctx.textAlign = "right";
  ctx.fillText(`T_∞ = ${S.T_ext} K`, xExt + wExt - 6, wallY + wallH + 16);
  ctx.textAlign = "left";
  ctx.restore();

  // Zone labels
  stageLabel(ctx, isSwedish() ? "HET GAS" : "HOT GAS", xGas + 6, wallY + 14, "#fff1c7");
  stageLabel(ctx, `h_gas = ${S.h_gas} W/m²K`, xGas + 6, wallY + wallH - 8, "#fbbf24");
  stageLabel(ctx, isSwedish() ? "STÅL" : "STEEL", xWall + 3, wallY + 14, "#c9d1da");
  stageLabel(ctx, `k=${S.k_wall}`, xWall + 3, wallY + wallH - 8, "#c9d1da");
  stageLabel(ctx, isSwedish() ? "OMGIVNING" : "AMBIENT", xExt + 6, wallY + 14, "#bdd7f0");
  stageLabel(ctx, `h_ext = ${S.h_ext} W/m²K`, xExt + 6, wallY + wallH - 8, "#7dd3fc");

  // ── Resistance bar chart ───────────────────────────────────────────────
  stageLabel(ctx, isSwedish()
    ? "TERMISKT MOTSTÅNDSNÄTVERK · BARHÖJDEN ∝ R (m²K/W)"
    : "THERMAL RESISTANCE NETWORK · BAR LENGTH ∝ R (m²K/W)",
    padX, barsY - 12, "#82a4b4");

  // Bars are drawn horizontally with shared baseline; lengths scaled to R_max
  const R_max = Math.max(S.R_gas, S.R_wall, S.R_ext);
  const barXBase = padX + 70;
  const barMaxW = width - barXBase - padX;
  const barRowH = barsH / 3;

  const drawBar = (row, label, R, color) => {
    const y = barsY + row * barRowH + 4;
    const barH = barRowH - 8;
    const barW = (R / R_max) * barMaxW;
    // label
    ctx.save();
    ctx.fillStyle = "rgba(220, 226, 234, 0.88)";
    ctx.font = "600 11px 'JetBrains Mono', ui-monospace, monospace";
    ctx.fillText(label, padX, y + barH * 0.65);
    // bar
    ctx.fillStyle = color;
    ctx.fillRect(barXBase, y, Math.max(2, barW), barH);
    // value
    ctx.fillStyle = "rgba(220, 226, 234, 0.85)";
    ctx.fillText(R.toFixed(4), barXBase + barW + 8, y + barH * 0.65);
    ctx.restore();
  };
  drawBar(0, "R_gas", S.R_gas, "rgba(208, 98, 44, 0.85)");
  drawBar(1, "R_wall", S.R_wall, "rgba(180, 188, 198, 0.85)");
  drawBar(2, "R_ext", S.R_ext, "rgba(37, 99, 168, 0.85)");

  // ── Bi banner ──────────────────────────────────────────────────────────
  const bannerY = barsY + barsH + 14;
  if (bannerY + 28 <= height - 4) {
    ctx.save();
    ctx.fillStyle = "rgba(101, 214, 201, 0.12)";
    ctx.strokeStyle = "rgba(101, 214, 201, 0.45)";
    ctx.lineWidth = 1;
    ctx.fillRect(padX, bannerY, width - padX * 2, Math.min(28, height - bannerY - 4));
    ctx.strokeRect(padX + 0.5, bannerY + 0.5, width - padX * 2 - 1, Math.min(28, height - bannerY - 4) - 1);
    ctx.fillStyle = "#65d6c9";
    ctx.font = "700 12px 'JetBrains Mono', ui-monospace, monospace";
    const regime = S.Bi < 0.1 ? "LUMPED WALL" : S.Bi < 1 ? "INTERMEDIATE" : "CONDUCTION-LIMITED";
    ctx.fillText(`Bi = h_ext · t_w / k_wall = ${S.Bi.toFixed(4)}   ·   ${regime}`, padX + 10, bannerY + 18);
    ctx.fillStyle = "rgba(220, 226, 234, 0.78)";
    ctx.font = "500 10px 'JetBrains Mono', ui-monospace, monospace";
    const dT = (S.T_inner - S.T_outer).toFixed(1);
    ctx.fillText(`through-wall ΔT = ${dT} K  ·  q = ${Math.round(S.q)} W/m²`, width - padX - 8 - ctx.measureText(`through-wall ΔT = ${dT} K  ·  q = ${Math.round(S.q)} W/m²`).width, bannerY + 18);
    ctx.restore();
  }
}

function dispatchSplit(demand, price) {
  if (price < 650) {
    return { hp: demand * 0.72, chp: demand * 0.20, tes: demand * 0.08 };
  }
  if (price > 850) {
    return { hp: demand * 0.16, chp: demand * 0.59, tes: demand * 0.25 };
  }
  return { hp: demand * 0.42, chp: demand * 0.48, tes: demand * 0.10 };
}

function traceSeries(ctx, values, rect, min, max, color, width = 2) {
  ctx.save();
  ctx.beginPath();
  values.forEach((value, index) => {
    const x = rect.x + rect.w * index / (values.length - 1);
    const y = rect.y + rect.h * (1 - (value - min) / (max - min));
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.restore();
}

// 24h dispatch stacked-area chart driven by the real PRO2 demand + Nord
// Pool-style spot-price arrays. Dispatch policy = price-tiered allocation
// (HP cheap, CHP mid, TES + grid peak). The chart is the actual MILP-style
// output the case study would produce, just visualised.
//
// equation per hour: Q_total = Q_HP + Q_CHP + Q_TES + Q_grid_top-up
//                    where each is from dispatchSplit(demand, price)
function drawEnergyDispatch(ctx, width, height, now) {
  stageBackground(ctx, width, height);

  // Time cursor — sweeps 24 h every ~40 s of wall-clock
  const hourProgress = (now / 1700) % 24;
  const hour = Math.floor(hourProgress);
  const subHour = hourProgress - hour;

  // ── Layout ──────────────────────────────────────────────────────────────
  const padX = 36;
  const headerH = 28;
  const chartY = headerH + 22;
  const chartH = Math.min(190, height * 0.50);
  const chartW = width - padX * 2;

  // Precompute the dispatch matrix for all 24 hours
  // Layers (bottom → top in stack): HP, CHP, TES, Grid top-up (if any)
  const layers = { hp: [], chp: [], tes: [], grid: [] };
  for (let h = 0; h < 24; h++) {
    const split = dispatchSplit(PRO2_DEMAND_MW[h], PRO2_PRICE[h]);
    layers.hp.push(split.hp);
    layers.chp.push(split.chp);
    layers.tes.push(split.tes);
    // Grid top-up = anything beyond HP+CHP+TES vs demand
    const dispatched = split.hp + split.chp + split.tes;
    layers.grid.push(Math.max(0, PRO2_DEMAND_MW[h] - dispatched));
  }

  // Max stacked height for scale
  const maxStack = PRO2_DEMAND_MW.reduce((mx, _, i) =>
    Math.max(mx, layers.hp[i] + layers.chp[i] + layers.tes[i] + layers.grid[i]), 0);
  const yScale = chartH / (maxStack * 1.10);

  const xAt = (h) => padX + (h / 23) * chartW;
  const yAt = (cum) => chartY + chartH - cum * yScale;

  // ── Header ──────────────────────────────────────────────────────────────
  stageLabel(ctx, isSwedish()
    ? "DISTRIBUERAD FJÄRRVÄRMEDISPATCH · 24 H FRÅN PRO2-DATA"
    : "DISTRICT HEATING DISPATCH · 24 H FROM PRO2 INPUTS",
    padX, 18, "#82a4b4");
  stageLabel(ctx, "MW", padX - 22, chartY + 8, "#82a4b4");

  // ── Stacked areas (bottom → top: HP, CHP, TES, Grid) ───────────────────
  const drawLayer = (values, baseAcc, color, label) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(xAt(0), yAt(baseAcc[0]));
    for (let h = 0; h < 24; h++) {
      ctx.lineTo(xAt(h), yAt(baseAcc[h] + values[h]));
    }
    for (let h = 23; h >= 0; h--) {
      ctx.lineTo(xAt(h), yAt(baseAcc[h]));
    }
    ctx.closePath();
    ctx.fill();
  };

  const cum0 = new Array(24).fill(0);
  const cum1 = layers.hp.slice();
  const cum2 = cum1.map((v, i) => v + layers.chp[i]);
  const cum3 = cum2.map((v, i) => v + layers.tes[i]);

  drawLayer(layers.hp,   cum0, "rgba(101, 214, 201, 0.78)", "HP");
  drawLayer(layers.chp,  cum1, "rgba(37, 99, 168, 0.80)",   "CHP");
  drawLayer(layers.tes,  cum2, "rgba(246, 200, 95, 0.78)",  "TES");
  drawLayer(layers.grid, cum3, "rgba(208, 98, 44, 0.70)",   "Grid");

  // Demand line (total) on top
  ctx.strokeStyle = "rgba(230, 237, 242, 0.7)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let h = 0; h < 24; h++) {
    const x = xAt(h);
    const y = yAt(PRO2_DEMAND_MW[h]);
    if (h === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // ── Playhead ────────────────────────────────────────────────────────────
  const cursorX = xAt(hour + subHour);
  ctx.strokeStyle = "rgba(255, 241, 199, 0.95)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(cursorX, chartY - 6);
  ctx.lineTo(cursorX, chartY + chartH + 6);
  ctx.stroke();

  // ── X-axis tick labels (every 6h) ──────────────────────────────────────
  ctx.save();
  ctx.fillStyle = "rgba(180, 192, 204, 0.7)";
  ctx.font = "500 10px 'JetBrains Mono', ui-monospace, monospace";
  [0, 6, 12, 18, 23].forEach((h) => {
    const x = xAt(h);
    ctx.fillText(`${String(h).padStart(2, "0")}:00`, x - 14, chartY + chartH + 18);
  });
  ctx.restore();

  // ── Legend ──────────────────────────────────────────────────────────────
  const legendY = chartY + chartH + 32;
  const legendItems = [
    ["HP",   "rgba(101, 214, 201, 0.78)", isSwedish() ? "Värmepump" : "Heat pump"],
    ["CHP",  "rgba(37, 99, 168, 0.80)",   isSwedish() ? "Kraftvärme" : "CHP"],
    ["TES",  "rgba(246, 200, 95, 0.78)",  isSwedish() ? "Lager" : "Storage"],
    ["Grid", "rgba(208, 98, 44, 0.70)",   isSwedish() ? "Topplast" : "Grid peak"],
  ];
  let lx = padX;
  legendItems.forEach(([key, color, label]) => {
    ctx.fillStyle = color;
    ctx.fillRect(lx, legendY, 10, 10);
    ctx.fillStyle = "rgba(220, 226, 234, 0.85)";
    ctx.font = "500 10px 'JetBrains Mono', ui-monospace, monospace";
    ctx.fillText(label, lx + 14, legendY + 9);
    lx += 96;
  });

  // ── Live readout — current-hour breakdown ──────────────────────────────
  const split = dispatchSplit(PRO2_DEMAND_MW[hour], PRO2_PRICE[hour]);
  const gridTop = Math.max(0, PRO2_DEMAND_MW[hour] - (split.hp + split.chp + split.tes));
  const readoutY = legendY + 22;
  if (readoutY + 16 <= height - 4) {
    ctx.save();
    ctx.fillStyle = "rgba(101, 214, 201, 0.95)";
    ctx.font = "700 11px 'JetBrains Mono', ui-monospace, monospace";
    ctx.fillText(`${String(hour + 1).padStart(2, "0")}:00`, padX, readoutY + 10);
    ctx.fillStyle = "rgba(220, 226, 234, 0.88)";
    ctx.font = "500 11px 'JetBrains Mono', ui-monospace, monospace";
    const summary = `Q = ${PRO2_DEMAND_MW[hour].toFixed(2)} MW   ·   p = ${PRO2_PRICE[hour].toFixed(0)} SEK/MWh   ·   HP ${split.hp.toFixed(2)} + CHP ${split.chp.toFixed(2)} + TES ${split.tes.toFixed(2)}${gridTop > 0.001 ? ` + Grid ${gridTop.toFixed(2)}` : ""}`;
    ctx.fillText(summary, padX + 56, readoutY + 10);
    ctx.restore();
  }
}

function flowStroke(ctx, path, width, color, now, speed) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, width);
  ctx.lineCap = "round";
  ctx.setLineDash([7, 9]);
  ctx.lineDashOffset = -(now * speed) % 32;
  ctx.stroke(path);
  ctx.restore();
}

function processBox(ctx, x, y, width, height, label, color) {
  ctx.save();
  ctx.fillStyle = "#0d171c";
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
  stageLabel(ctx, label, x + 8, y + height / 2 + 4, "#e6edf2");
  ctx.restore();
}

// Industrial decarbonisation Sankey + baseline comparison.
// Energy flows visualised left-to-right (grid + fuel → conversion → process)
// with a recovery loop and explicit baseline-vs-active emissions strip.
// equation: EnPI = (E_elec + E_fuel) / production              (ISO 50006:2014)
// equation: emissions intensity = (E_elec·g_elec + E_fuel·g_gas) / production
function drawIndustrialBalance(ctx, width, height, controls, now) {
  stageBackground(ctx, width, height);
  const metrics = industrialModel(controls);

  // ── Layout ─────────────────────────────────────────────────────────────
  const sourceX = 22;
  const processX = width * 0.44;
  const outputX = width - 124;
  const topY = 56;
  const midY = height * 0.40;
  const bottomY = height * 0.62;
  const sourceW = 108;
  const blockH = 38;

  // ── Header ─────────────────────────────────────────────────────────────
  stageLabel(ctx, isSwedish()
    ? "ENERGIBALANS · ISO 50006 EnPI-RAM"
    : "UTILITY BALANCE · ISO 50006 EnPI FRAME", sourceX, 18, "#82a4b4");
  stageLabel(ctx, isSwedish()
    ? "Skjut grid-intensitet → utsläppsskillnaden visas i nedre strecket."
    : "Drag grid intensity → emissions delta shown in the bottom strip.",
    sourceX, 32, "#65d6c9");

  // ── Source boxes (left) ────────────────────────────────────────────────
  processBox(ctx, sourceX, topY, sourceW, blockH,
    isSwedish() ? "ELNÄT" : "GRID", "#65d6c9");
  stageLabel(ctx, `${metrics.electricInput.toFixed(2)} MW`, sourceX + 8, topY + blockH + 14, "#65d6c9");
  stageLabel(ctx, `${controls.grid} kgCO₂e/MWh`, sourceX + 8, topY + blockH + 28, "#82a4b4");

  processBox(ctx, sourceX, bottomY, sourceW, blockH,
    isSwedish() ? "BRÄNSLE" : "FUEL", "#d0622c");
  stageLabel(ctx, `${metrics.gasInput.toFixed(2)} MW`, sourceX + 8, bottomY + blockH + 14, "#d0622c");
  stageLabel(ctx, "202 kgCO₂/MWh", sourceX + 8, bottomY + blockH + 28, "#82a4b4");

  // ── Conversion node (heat pump or boiler) ─────────────────────────────
  const convX = (sourceX + processX) / 2;
  if (controls.heatPump) {
    processBox(ctx, convX - 30, midY - blockH / 2, 78, blockH, "HP COP 3.25", "#65d6c9");
  }
  if (controls.electricBoiler) {
    processBox(ctx, convX - 30, midY + 12, 78, blockH * 0.7, "BOILER η 0.98", "#7dd3fc");
  }
  processBox(ctx, convX - 30, bottomY - 14, 78, blockH * 0.8,
    isSwedish() ? "GASPANNA η 0.90" : "GAS BOILER η 0.90", "#d0622c");

  // ── Process + recovery (right) ────────────────────────────────────────
  processBox(ctx, processX, (topY + bottomY) / 2, 130, blockH * 1.4,
    isSwedish() ? "PROCESS" : "PROCESS", "#f6c85f");
  stageLabel(ctx, `${metrics.heatDemand.toFixed(2)} MW`, processX + 8, (topY + bottomY) / 2 + blockH * 1.4 + 14, "#f6c85f");

  if (controls.recovery) {
    processBox(ctx, outputX, topY, 100, blockH,
      isSwedish() ? "ÅTERVINNING 22%" : "RECOVERY 22%", "#a3e635");
    stageLabel(ctx, `${metrics.recovered.toFixed(2)} MW`, outputX + 8, topY + blockH + 14, "#a3e635");
  }

  processBox(ctx, outputX, bottomY, 100, blockH,
    isSwedish() ? "UTFALL" : "OUTPUT", "#2563a8");
  stageLabel(ctx, `${(10 * controls.load / 100).toFixed(1)} u/h`, outputX + 8, bottomY + blockH + 14, "#7dd3fc");

  // ── Animated flow lines ────────────────────────────────────────────────
  const gridPath = new Path2D();
  gridPath.moveTo(sourceX + sourceW, topY + blockH / 2);
  gridPath.bezierCurveTo(convX - 8, topY + blockH / 2, convX - 8, midY, convX - 30, midY);

  const convOutPath = new Path2D();
  convOutPath.moveTo(convX + 48, midY);
  convOutPath.bezierCurveTo(processX - 12, midY, processX - 12, (topY + bottomY) / 2 + blockH * 0.7, processX, (topY + bottomY) / 2 + blockH * 0.7);

  const fuelPath = new Path2D();
  fuelPath.moveTo(sourceX + sourceW, bottomY + blockH / 2);
  fuelPath.bezierCurveTo(convX - 8, bottomY + blockH / 2, convX - 8, bottomY + 4, convX - 30, bottomY + 4);

  const gasOutPath = new Path2D();
  gasOutPath.moveTo(convX + 48, bottomY + 4);
  gasOutPath.bezierCurveTo(processX - 12, bottomY + 4, processX - 12, (topY + bottomY) / 2 + blockH * 0.7, processX, (topY + bottomY) / 2 + blockH * 0.7);

  const recoveryPath = new Path2D();
  recoveryPath.moveTo(processX + 130, (topY + bottomY) / 2 + blockH * 0.4);
  recoveryPath.bezierCurveTo(outputX - 24, (topY + bottomY) / 2 + blockH * 0.4, outputX - 24, topY + 18, outputX, topY + 18);

  const outputPath = new Path2D();
  outputPath.moveTo(processX + 130, (topY + bottomY) / 2 + blockH * 1.0);
  outputPath.bezierCurveTo(outputX - 24, (topY + bottomY) / 2 + blockH * 1.0, outputX - 24, bottomY + 18, outputX, bottomY + 18);

  flowStroke(ctx, gridPath, Math.max(2, metrics.electricInput * 6), "#65d6c9", now, 0.030);
  flowStroke(ctx, convOutPath, Math.max(2, (metrics.heatDemand - metrics.gasInput * 0.90 + metrics.recovered) * 4), "#65d6c9", now, 0.030);
  flowStroke(ctx, fuelPath, Math.max(2, metrics.gasInput * 3), "#d0622c", now, 0.022);
  flowStroke(ctx, gasOutPath, Math.max(2, metrics.gasInput * 0.90 * 4), "#d0622c", now, 0.022);
  if (controls.recovery) {
    flowStroke(ctx, recoveryPath, Math.max(2, metrics.recovered * 5), "#a3e635", now, 0.038);
  }
  flowStroke(ctx, outputPath, Math.max(2, metrics.heatDemand * 1.6), "#2563a8", now, 0.025);

  // ── Baseline vs Active emissions strip (bottom) ───────────────────────
  const stripY = height - 38;
  const stripH = 22;
  const stripPadL = sourceX;
  const stripW = width - stripPadL * 2;
  // Baseline = all heat from gas boiler, only base electric load
  const maxIntensity = Math.max(metrics.emissions, metrics.baselineEmissions);
  const baselineW = (metrics.baselineEmissions / maxIntensity) * stripW;
  const activeW = (metrics.emissions / maxIntensity) * stripW;

  ctx.save();
  // Background
  ctx.fillStyle = "rgba(220, 226, 234, 0.06)";
  ctx.fillRect(stripPadL, stripY, stripW, stripH);
  // Baseline (gas-heavy)
  ctx.fillStyle = "rgba(208, 98, 44, 0.55)";
  ctx.fillRect(stripPadL, stripY, baselineW, stripH * 0.45);
  // Active (current dispatch)
  ctx.fillStyle = "rgba(101, 214, 201, 0.70)";
  ctx.fillRect(stripPadL, stripY + stripH * 0.55, activeW, stripH * 0.45);
  // Labels
  ctx.fillStyle = "rgba(208, 98, 44, 0.95)";
  ctx.font = "600 10px 'JetBrains Mono', ui-monospace, monospace";
  ctx.fillText(isSwedish() ? "BASLINJE" : "BASELINE", stripPadL + 4, stripY + 9);
  ctx.fillStyle = "rgba(101, 214, 201, 0.95)";
  ctx.fillText(isSwedish() ? "AKTIV" : "ACTIVE", stripPadL + 4, stripY + stripH - 1);
  ctx.fillStyle = "rgba(220, 226, 234, 0.92)";
  ctx.font = "700 11px 'JetBrains Mono', ui-monospace, monospace";
  ctx.textAlign = "right";
  ctx.fillText(`${metrics.baselineEmissions.toFixed(1)} kg/u`, stripPadL + stripW - 6, stripY + 9);
  ctx.fillText(`${metrics.emissions.toFixed(1)} kg/u  ·  −${metrics.emissionsReduction.toFixed(1)}`, stripPadL + stripW - 6, stripY + stripH - 1);
  ctx.textAlign = "left";
  ctx.restore();
}

function nozzlePlotRadius(t, height) {
  const throat = 0.205;
  const inletRadius = height * 0.27;
  const throatRadius = height * 0.052;
  const exitRadius = height * 0.135;
  if (t <= throat) return inletRadius + (throatRadius - inletRadius) * quintic(t / throat);
  return throatRadius + (exitRadius - throatRadius) * quintic((t - throat) / (1 - throat));
}

function nozzleWallPath(xStart, xExit, centreY, height, sign, offset = 0, factor = 1) {
  const path = new Path2D();
  for (let point = 0; point <= 72; point += 1) {
    const t = point / 72;
    const x = xStart + (xExit - xStart) * t;
    const y = centreY + sign * (nozzlePlotRadius(t, height) * factor + offset);
    if (point === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  }
  return path;
}

function nozzleDomainPath(xStart, xExit, centreY, height) {
  const path = nozzleWallPath(xStart, xExit, centreY, height, -1);
  for (let point = 72; point >= 0; point -= 1) {
    const t = point / 72;
    path.lineTo(xStart + (xExit - xStart) * t, centreY + nozzlePlotRadius(t, height));
  }
  path.closePath();
  return path;
}

function drawResearchDiagnostic(ctx, width, height, metrics, now) {
  stageBackground(ctx, width, height);
  const xStart = 14;
  const xExit = width * 0.54;
  const centreY = height * 0.49;
  const domain = nozzleDomainPath(xStart, xExit, centreY, height);
  const plumeEnd = width - 15;
  const exitRadius = nozzlePlotRadius(1, height);
  const shimmer = 0.82 + 0.12 * Math.sin(now * 0.002);

  stageLabel(ctx, isSwedish() ? "DE LAVAL / KYLKANAL / TERMISKT MOTSTÅND" : "DE LAVAL / COOLING CHANNEL / THERMAL RESISTANCE", 14, 19, "#82a4b4");
  stageLabel(ctx, "AREA-MACH + BARTZ + 1-D Rdep", 14, height - 14, "#82a4b4");

  // Gas temperature contours are clipped to the analytical de Laval domain.
  // equation: A/A* = (1/M)[2/(gamma+1)(1 + (gamma-1)M^2/2)]^((gamma+1)/(2(gamma-1))).
  ctx.save();
  ctx.clip(domain);
  const gasGradient = ctx.createLinearGradient(xStart, 0, xExit, 0);
  gasGradient.addColorStop(0, "#fff1c7");
  gasGradient.addColorStop(0.45, "#f6c85f");
  gasGradient.addColorStop(0.72, "#d0622c");
  gasGradient.addColorStop(1, "#2563a8");
  ctx.globalAlpha = shimmer;
  ctx.fillStyle = gasGradient;
  ctx.fillRect(xStart, centreY - height * 0.3, xExit - xStart, height * 0.6);
  // Diverging-section gas contours — sped up 4× so the dashed acceleration
  // streaks visibly translate downstream (was 0.017+0.006 → 0.068+0.024).
  [0.28, 0.53, 0.77].forEach((fraction, index) => {
    ctx.strokeStyle = `rgba(255,241,199,${0.33 - index * 0.06})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([10, 13]);
    ctx.lineDashOffset = -(now * (0.068 + index * 0.024)) % 46;
    ctx.stroke(nozzleWallPath(xStart, xExit, centreY, height, -1, 0, fraction));
    ctx.stroke(nozzleWallPath(xStart, xExit, centreY, height, 1, 0, fraction));
  });
  ctx.restore();

  // Downstream exhaust: smooth expanding envelope + pressure-cell contours.
  // The plume envelope itself wobbles slightly to read as live exhaust.
  const plumeWobble = Math.sin(now * 0.0042) * exitRadius * 0.10;
  const plume = new Path2D();
  plume.moveTo(xExit, centreY - exitRadius);
  plume.bezierCurveTo(width * 0.64, centreY - exitRadius * 1.04 + plumeWobble, width * 0.83, centreY - exitRadius * 1.5 + plumeWobble * 0.6, plumeEnd, centreY - exitRadius * 1.65);
  plume.lineTo(plumeEnd, centreY + exitRadius * 1.65);
  plume.bezierCurveTo(width * 0.83, centreY + exitRadius * 1.5 - plumeWobble * 0.6, width * 0.64, centreY + exitRadius * 1.04 - plumeWobble, xExit, centreY + exitRadius);
  plume.closePath();
  const plumeGradient = ctx.createLinearGradient(xExit, 0, plumeEnd, 0);
  plumeGradient.addColorStop(0, "rgba(208,98,44,0.85)");
  plumeGradient.addColorStop(0.38, "rgba(246,200,95,0.58)");
  plumeGradient.addColorStop(1, "rgba(37,99,168,0.16)");
  ctx.fillStyle = plumeGradient;
  ctx.fill(plume);
  ctx.save();
  ctx.clip(plume);
  // Expansion cells: ~8× faster phase (was 0.0024) + cell positions translate
  // downstream over time so the shock-diamond pattern is obviously dynamic.
  // equation: cells move at u_exit through the underexpanded plume.
  const cellShift = (now * 0.00018) % 0.20;
  for (let cell = 0; cell < 4; cell += 1) {
    const x = xExit + (plumeEnd - xExit) * ((0.16 + cell * 0.2 + cellShift) % 1);
    const half = exitRadius * (0.35 + cell * 0.12);
    const alpha = 0.28 + 0.18 * Math.sin(now * 0.018 + cell);
    ctx.strokeStyle = `rgba(246,200,95,${alpha})`;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(x - half * 1.7, centreY);
    ctx.lineTo(x, centreY - half);
    ctx.lineTo(x + half * 1.7, centreY);
    ctx.lineTo(x, centreY + half);
    ctx.closePath();
    ctx.stroke();
  }
  // Trailing shear streaks across the plume — short dashes drifting downstream.
  ctx.strokeStyle = "rgba(246,200,95,0.42)";
  ctx.lineWidth = 0.9;
  ctx.setLineDash([6, 9]);
  ctx.lineDashOffset = -(now * 0.12) % 30;
  for (const off of [-exitRadius * 0.9, -exitRadius * 0.4, 0, exitRadius * 0.4, exitRadius * 0.9]) {
    ctx.beginPath();
    ctx.moveTo(xExit, centreY + off);
    ctx.quadraticCurveTo((xExit + plumeEnd) / 2, centreY + off * 1.4, plumeEnd, centreY + off * 1.8);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();

  // Wall, methane coolant channel and deposit layer remain separate signals.
  const deposit = Math.max(1.2, Math.min(6, (metrics?.cokeThicknessMicrons || 0) / 10));
  [-1, 1].forEach((sign) => {
    const wall = nozzleWallPath(xStart, xExit, centreY, height, sign);
    const channel = nozzleWallPath(xStart, xExit, centreY, height, sign, 11);
    ctx.strokeStyle = "#c48e56";
    ctx.lineWidth = 6;
    ctx.stroke(wall);
    ctx.strokeStyle = "#65d6c9";
    ctx.lineWidth = 4;
    ctx.stroke(channel);
    ctx.strokeStyle = "#382218";
    ctx.lineWidth = deposit;
    ctx.stroke(wall);
    ctx.strokeStyle = "rgba(101,214,201,0.72)";
    ctx.lineWidth = 1.1;
    ctx.setLineDash([9, 10]);
    ctx.lineDashOffset = -(now * 0.024) % 38;
    ctx.stroke(channel);
    ctx.setLineDash([]);
  });

  ctx.strokeStyle = "rgba(246,200,95,0.8)";
  ctx.beginPath();
  ctx.moveTo(xStart + (xExit - xStart) * 0.205, centreY - 12);
  ctx.lineTo(xStart + (xExit - xStart) * 0.205, centreY + 12);
  ctx.stroke();
  stageLabel(ctx, isSwedish() ? "METANKYLKANAL" : "CH4 COOLANT", 18, height * 0.15, "#65d6c9");
  stageLabel(ctx, "THROAT", xStart + (xExit - xStart) * 0.205 - 20, centreY + 27, "#f6c85f");
  stageLabel(ctx, "EXPANSION CELLS", xExit + 12, centreY - exitRadius * 1.95, "#f6c85f");
  if (metrics) {
    stageLabel(ctx, `Tw ${Math.round(metrics.maxWallTemperature)} K`, width * 0.54, height - 14, "#f6c85f");
    stageLabel(ctx, `Rdep ${Math.round(metrics.cokeThicknessMicrons)} um`, width - 112, height - 14, "#d0622c");
  }
}

function createAmbientTracerField(host, options) {
  const canvas = document.createElement("canvas");
  canvas.className = "motion-ambient-canvas";
  canvas.setAttribute("aria-hidden", "true");
  host.prepend(canvas);
  const draw = canvas.getContext("2d", { alpha: true });
  if (!draw) return null;

  let mode = options.mode;
  let theme = options.theme;
  let width = 0;
  let height = 0;
  let frame = 0;
  let previous = 0;
  let animation = 0;
  let particles = [];
  const count = options.reducedMotion ? 62 : options.lowPower ? 84 : 138;

  function normal() {
    return Math.sqrt(-2 * Math.log(Math.max(Number.EPSILON, Math.random()))) * Math.cos(2 * Math.PI * Math.random());
  }

  function velocity(x, y, seconds) {
    const waviness = Math.sin(seconds * 0.34 + x * 9.5) * 0.012;
    if (mode === "thermal") {
      return [0.080 + 0.050 * Math.exp(-Math.pow((x - 0.64) / 0.20, 2)), waviness * (0.45 + y)];
    }
    if (mode === "energy") {
      return [0.052 + 0.014 * Math.cos(y * 9 + seconds), 0.020 * Math.sin(x * 11 - seconds * 0.6)];
    }
    if (mode === "decarbonisation") {
      return [0.062 + 0.012 * Math.sin(y * 12), 0.014 * Math.sin(seconds * 0.44 + x * 15)];
    }
    return [0.104 + 0.04 * Math.exp(-Math.pow((y - 0.5) / 0.16, 2)), waviness * 0.55];
  }

  function resetParticle(particle, anywhere = false) {
    particle.x = anywhere ? Math.random() : -0.02 - Math.random() * 0.08;
    particle.y = 0.04 + Math.random() * 0.92;
    particle.life = 0.48 + Math.random() * 0.6;
    particle.weight = 0.55 + Math.random() * 1.15;
    particle.trail = [];
    return particle;
  }

  function resize() {
    const bounds = host.getBoundingClientRect();
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    width = Math.max(1, Math.floor(bounds.width));
    height = Math.max(1, Math.floor(bounds.height));
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    draw.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (!particles.length) particles = Array.from({ length: count }, () => resetParticle({}, true));
  }

  function render(timestamp) {
    const seconds = timestamp * 0.001;
    const dt = Math.min(0.045, Math.max(0.012, previous ? (timestamp - previous) / 1000 : 0.016));
    previous = timestamp;
    draw.clearRect(0, 0, width, height);
    const palette = {
      thermal: "#65d6c9",
      energy: "#9be39d",
      decarbonisation: "#f6c85f",
      research: "#65d6c9",
    };
    draw.strokeStyle = rgba(palette[mode] || palette.thermal, theme === "light" ? 0.28 : 0.32);
    draw.lineCap = "round";

    particles.forEach((particle) => {
      const oldX = particle.x;
      const oldY = particle.y;
      const [u, v] = velocity(particle.x, particle.y, seconds);
      // Passive-tracer Euler-Maruyama step:
      // dX = U(X,t) dt + sqrt(2 D dt) dW, with D as a small mixing term.
      const diffusion = mode === "research" ? 0.0000025 : 0.000006;
      const stochastic = Math.sqrt(2 * diffusion * dt);
      particle.x += u * dt + stochastic * normal();
      particle.y += v * dt + stochastic * normal();
      particle.life -= dt * 0.11;
      if (particle.x > 1.03 || particle.y < -0.04 || particle.y > 1.04 || particle.life <= 0) {
        resetParticle(particle);
        return;
      }
      particle.trail.push([particle.x, particle.y]);
      if (particle.trail.length > 18) particle.trail.shift();
      draw.globalAlpha = Math.min(0.82, particle.life);
      draw.lineWidth = particle.weight;
      draw.beginPath();
      if (particle.trail.length > 1) {
        particle.trail.forEach(([trailX, trailY], index) => {
          if (index === 0) draw.moveTo(trailX * width, trailY * height);
          else draw.lineTo(trailX * width, trailY * height);
        });
      } else {
        draw.moveTo(oldX * width, oldY * height);
        draw.lineTo(particle.x * width, particle.y * height);
      }
      draw.stroke();
      draw.beginPath();
      draw.arc(particle.x * width, particle.y * height, particle.weight * 0.75, 0, Math.PI * 2);
      draw.fillStyle = rgba(palette[mode] || palette.thermal, theme === "light" ? 0.23 : 0.42);
      draw.fill();
    });
    draw.globalAlpha = 1;
    if (!options.reducedMotion) animation = requestAnimationFrame(render);
  }

  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  animation = requestAnimationFrame(render);

  return {
    setMode(nextMode) {
      mode = nextMode;
      particles.forEach((particle) => resetParticle(particle, true));
    },
    setTheme(nextTheme) {
      theme = nextTheme;
    },
    destroy() {
      cancelAnimationFrame(animation);
      observer.disconnect();
      canvas.remove();
    },
  };
}

// ── Public init ──────────────────────────────────────────────────────────
export async function init(ctx) {
  if (!ctx.supportsWorkers) return null;
  const host = document.querySelector("[data-motion-fluid-sim]");
  if (!host) return null;
  const stage = host.querySelector("[data-hero-scene-stage]") || host;

  // Remove any lightweight particle canvas already mounted.
  const oldCanvas = host.querySelector(".motion-fluid-canvas");
  oldCanvas?.remove();

  const canvas = document.createElement("canvas");
  canvas.className = "motion-fluid-canvas eulerian";
  canvas.setAttribute("aria-hidden", "true");
  stage.appendChild(canvas);
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
  const NX = ctx.lowPower ? 128 : aspect > 2.4 ? 244 : 224;
  const NY = Math.min(ctx.lowPower ? 80 : 128, Math.max(54, Math.round(NX / aspect)));

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
  const ambient = createAmbientTracerField(host, {
    mode,
    theme,
    lowPower: ctx.lowPower,
    reducedMotion: ctx.reducedMotion,
  });
  const thermalSource = {
    legacy: new Image(),
    redesign: new Image(),
  };
  thermalSource.legacy.src = new URL("../../assets/thesis/legacy-streamlines-dark.webp", import.meta.url).href;
  thermalSource.redesign.src = new URL("../../assets/thesis/redesigned-streamlines-dark.webp", import.meta.url).href;
  Object.values(thermalSource).forEach((image) => {
    image.addEventListener("load", () => {
      if (mode === "thermal") drawThermalEvidence(renderCtx, cssW, cssH, thermalSource, performance.now());
    });
  });
  const industrialControls = {
    load: 72,
    grid: 55,
    recovery: true,
    heatPump: true,
    electricBoiler: false,
  };
  host.dataset.motionScene = mode;
  stage.dataset.motionScene = mode;

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
      if (!ctx.reducedMotion) requestAnimationFrame(scheduleStep);
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
    const now = performance.now();

    if (mode === "thermal") {
      renderCtx.clearRect(0, 0, cssW, cssH);
      drawThermalEvidence(renderCtx, cssW, cssH, thermalSource, now);
      updateThermalMetrics();
      return;
    }
    if (mode === "energy") {
      renderCtx.clearRect(0, 0, cssW, cssH);
      drawEnergyDispatch(renderCtx, cssW, cssH, now);
      updateEnergyMetrics(now);
      return;
    }
    if (mode === "decarbonisation") {
      renderCtx.clearRect(0, 0, cssW, cssH);
      drawIndustrialBalance(renderCtx, cssW, cssH, industrialControls, now);
      updateIndustrialMetrics();
      return;
    }

    if (mode === "research") {
      renderCtx.clearRect(0, 0, cssW, cssH);
      drawResearchDiagnostic(renderCtx, cssW, cssH, m.metrics, now);
      if (m.metrics) updateResearchMetrics(m.metrics);
      return;
    }

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
    stageBackground(renderCtx, cssW, cssH);
    renderCtx.imageSmoothingEnabled = true;
    renderCtx.drawImage(fieldCanvas, 0, 0, cssW, cssH);

    // An unknown fallback mode may still render the transported scalar field.
  }

  worker.postMessage({ type: "init", nx: NX, ny: NY, mode, reducedMotion: ctx.reducedMotion });

  // ── Input + observer wiring ────────────────────────────────────────────
  // Display scenes are dataset or equation driven; pointer motion must not
  // pretend to perturb CFD, dispatch or process outputs.
  const onMove = () => {};
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
  const offMode = ctx.bus.on("motion:mode-change", ({ mode: m }) => {
    if (!m) return;
    mode = m;
    palette = (PALETTES[mode] || PALETTES.thermal)[theme];
    host.dataset.motionScene = mode;
    stage.dataset.motionScene = mode;
    ambient?.setMode(mode);
    renderCtx.clearRect(0, 0, cssW, cssH);
    frameBuf = null;
    worker.postMessage({ type: "mode", mode, reducedMotion: ctx.reducedMotion });
    if (ctx.reducedMotion) step();
  });
  const offTheme = ctx.bus.on("motion:theme-change", ({ theme: t }) => {
    theme = t === "light" ? "light" : "dark";
    palette = (PALETTES[mode] || PALETTES.thermal)[theme];
    ambient?.setTheme(theme);
  });
  const offLocale = ctx.bus.on("motion:locale-change", () => {
    if (ctx.reducedMotion) step();
  });

  return {
    destroy() {
      host.removeEventListener("mousemove", onMove);
      document.removeEventListener("visibilitychange", onVis);
      ro.disconnect();
      offMode?.();
      offTheme?.();
      offLocale?.();
      worker.terminate();
      ambient?.destroy();
      canvas.remove();
    },
  };
}

export function destroy(inst) { inst?.destroy?.(); }
