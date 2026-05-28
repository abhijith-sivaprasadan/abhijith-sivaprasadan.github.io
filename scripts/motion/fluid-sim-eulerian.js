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
 *
 * All formulas route through scripts/physics/ — one audited module per
 * domain, every constant cited.
 */

import {
  // Constants
  REDUCER_T0, REDUCER_T_AMBIENT, REDUCER_T_WALL_M, REDUCER_K_WALL,
  REDUCER_H_GAS, REDUCER_H_EXT, REDUCER_D_HYDRAULIC, REDUCER_P0_PA,
  REDUCER_MACH_SMOOTH, REDUCER_MACH_LEGACY, REDUCER_CASES,
  INSULATION_T_M, INSULATION_K, INSULATION_H_EXT,
  GAMMA_AIR, GAMMA_CH4, PR_AIR, CP_CH4_COOL,
  G_GAS_LHV, PEF_EL_EU, ETA_TES_RT, ETA_ELECTRIC_BOILER, ETA_GAS_BOILER,
  T_BURNOUT_CU,
  // Gas dynamics
  staticTemperatureFromTotal, staticToTotalPressure, adiabaticWallTemperature,
  reynoldsNumber, stantonNumber,
  // Heat transfer
  thermalResistanceCircuit, thermalResistanceCircuitInsulated, biotNumber,
  conductanceHealthRatio, depositResistanceShare, burnoutMargin,
  coolantTemperatureRise,
  // Energy systems
  heatPumpCarnotCOP, marginalHeatPriceFromElectricity,
  energyPerformanceIndicator, emissionsIntensity as emissionsIntensityFn,
  marginalAbatementCost, scopeSplit, toPrimaryEnergy,
  heatRecoveryEffectiveness, dispatchMeritOrder,
  specificEnergyConsumption,
} from "../physics/index.js";

// Rolling buffer for d(T_w)/dt — used by the research-lens time-to-margin.
const __researchWallTBuf = [];
function pushWallTSample(t_s, T_K) {
  __researchWallTBuf.push({ t: t_s, T: T_K });
  while (__researchWallTBuf.length > 12) __researchWallTBuf.shift();
}
function wallHeatingRateK_per_s() {
  if (__researchWallTBuf.length < 2) return 0;
  const a = __researchWallTBuf[0];
  const b = __researchWallTBuf[__researchWallTBuf.length - 1];
  if (b.t <= a.t) return 0;
  return (b.T - a.T) / (b.t - a.t);
}

// Stated reference values for the regenerative-cooling closure. They are
// representative inputs for a small-scale methalox demonstrator, NOT
// measurements. All flagged in the lens-3 methodology disclosure.
const NOZZLE_THROAT_WALL_AREA_M2 = 0.0025;  // m²   — throat-band wall area
const NOZZLE_COOLANT_MASSFLOW    = 1.2;     // kg/s — CH4 coolant ṁ
const NOZZLE_THROAT_DENSITY      = 0.62;    // kg/m³ — gas at throat (rep.)
const NOZZLE_THROAT_VELOCITY     = 880;     // m/s  — sonic at throat (rep.)
const NOZZLE_THROAT_CP           = 4200;    // J/kg·K — combustion-product cp
const NOZZLE_THROAT_H_GAS        = 12500;   // W/m²·K — Bartz throat (matches worker)

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

// ── Domain telemetry: thermal mode (compressible flow through C2 reducer) ─
// Inputs are reported thesis signals: T0 = 673 K, Ma = 0.990 for the smooth
// reducer and Ma = 1.006 for the legacy two-step. The animation never
// perturbs these evidence values; motion is a transport-field lens behind
// the reported result.
//
// Geometry switch (data-thermal-geometry on body): "smooth" (default) or
// "legacy" — both Mach numbers are reported in TRITA-ITM-EX 2026:14.
// All formulas via scripts/physics/.
const THERMAL_THESIS_BI_BAND = "0.003–0.004";

function thermalControls() {
  const geom = (document.body.dataset.thermalGeometry || "smooth").toLowerCase();
  const insul = document.body.dataset.thermalInsulation === "on";
  const caseKey = (document.body.dataset.thermalCase || "C").toUpperCase();
  const T0 = Number(document.body.dataset.thermalT0) || REDUCER_T0;
  return {
    geometry: geom === "legacy" ? "legacy" : "smooth",
    insulation: insul,
    caseKey: ["A", "B", "C"].includes(caseKey) ? caseKey : "C",
    T0,
  };
}

function thermalTelemetry() {
  const ctrl = thermalControls();
  const caseDef = REDUCER_CASES[ctrl.caseKey];
  // Mach selection from thesis-reported case/geometry table.
  const throatMach = ctrl.geometry === "legacy" ? caseDef.machLegacy : caseDef.machSmooth;
  // Isentropic state at the throat using the user-controlled T₀.
  const T_throat = staticTemperatureFromTotal(ctrl.T0, throatMach);
  const T_aw = adiabaticWallTemperature(throatMach, T_throat, PR_AIR);
  const pRatio = staticToTotalPressure(throatMach);
  const p_static = pRatio * REDUCER_P0_PA;
  const Re = reynoldsNumber(throatMach, T_throat, p_static, REDUCER_D_HYDRAULIC);
  // Choose resistance circuit (3-layer uninsulated, 4-layer insulated).
  let cht, T_outer, BiCalc;
  if (ctrl.insulation) {
    cht = thermalResistanceCircuitInsulated({
      T_hot: ctrl.T0,
      T_cold: REDUCER_T_AMBIENT,
      h_internal: REDUCER_H_GAS,
      wallThicknessM: REDUCER_T_WALL_M,
      wallConductivity: REDUCER_K_WALL,
      insulationThicknessM: INSULATION_T_M,
      insulationConductivity: INSULATION_K,
      h_external: INSULATION_H_EXT,
    });
    T_outer = cht.T_insulOuter;
    // With insulation the dominant Bi is the insulation/air boundary.
    BiCalc = biotNumber(INSULATION_H_EXT, INSULATION_T_M, INSULATION_K);
  } else {
    cht = thermalResistanceCircuit({
      T_hot: ctrl.T0,
      T_cold: REDUCER_T_AMBIENT,
      h_internal: REDUCER_H_GAS,
      wallThicknessM: REDUCER_T_WALL_M,
      wallConductivity: REDUCER_K_WALL,
      h_external: REDUCER_H_EXT,
    });
    T_outer = cht.T_outer;
    BiCalc = biotNumber(REDUCER_H_EXT, REDUCER_T_WALL_M, REDUCER_K_WALL);
  }
  return {
    geometry: ctrl.geometry,
    insulation: ctrl.insulation,
    caseKey: ctrl.caseKey,
    T0_K: ctrl.T0,
    mach: throatMach.toFixed(3),
    temperature: `${Math.round(T_throat)} K`,
    pressureDrop: `p/p0 ${pRatio.toFixed(3)}`,
    biot: ctrl.insulation
      ? `${BiCalc.toFixed(3)} (insulation layer; not lumped)`
      : `${BiCalc.toFixed(4)} (thesis ${THERMAL_THESIS_BI_BAND})`,
    heatFlux: `${cht.q.toFixed(0)} W/m²`,
    wallOuter: `${T_outer.toFixed(1)} K`,
    adiabaticWall: `${T_aw.toFixed(1)} K`,
    reynolds: `Re ${Re.toExponential(2)}`,
    _cht: cht,
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

// Energy-system constants for the screening view. The TES tank capacity is a
// stated reference, not a fitted value — typical small district-heating tank
// for ~5 km loop sits in this band. The HP COP is the simple constant used
// by the MILP study; lens 4 extends it to a Carnot-fraction model.
const ENERGY_TES_CAPACITY_MWH = 14;     // MWh — stated reference tank size
const ENERGY_HP_COP_THERMAL    = 3.20;  // [-]  PRO2 dispatch input
const ENERGY_GRID_INTENSITY    = 25;    // gCO₂/kWh_el — SE3 area average
const ENERGY_CHP_HEAT_FACTOR   = 220;   // gCO₂/MWh_th — gas-CHP heat slice
const ENERGY_PEAK_MW = Math.max(...PRO2_DEMAND_MW);
const ENERGY_DAILY_TOTAL_MWH = PRO2_DEMAND_MW.reduce((a, b) => a + b, 0); // 1 h Δt
const ENERGY_AVG_PRICE = PRO2_PRICE.reduce((a, b) => a + b, 0) / PRO2_PRICE.length;

function classifyMarginal(price, copHp) {
  // physics-based threshold: heat-pump beats CHP when p_el/COP < c_chp_heat
  // c_chp_heat ≈ 270 SEK/MWh_th (CHP fuel + O&M). Above 850 SEK/MWh_el the
  // price spike justifies TES discharge against the fuel-heavy CHP.
  const heatPriceHP = marginalHeatPriceFromElectricity(price, copHp);
  if (price < 650) return { label: "Heat pump + charge", heatPriceHP };
  if (price > 850) return { label: "CHP + TES discharge", heatPriceHP };
  return { label: "CHP / heat pump", heatPriceHP };
}

function energyTelemetry(now) {
  const hour = Math.floor((now / 1666) % 24);
  const demand_MW = PRO2_DEMAND_MW[hour];
  const price = PRO2_PRICE[hour];
  const marginal = classifyMarginal(price, ENERGY_HP_COP_THERMAL);
  // TES SOC integrated through hour-by-hour policy rule (unchanged behaviour);
  // mapped to MWh using the stated capacity for engineering legibility.
  let tesSocPct = 50;
  for (let index = 0; index <= hour; index += 1) {
    tesSocPct += PRO2_PRICE[index] < 650 ? 8 : PRO2_PRICE[index] > 850 ? -10 : -2;
    tesSocPct = Math.max(15, Math.min(92, tesSocPct));
  }
  const tesMWh = (tesSocPct / 100) * ENERGY_TES_CAPACITY_MWH;
  // Marginal CO₂ intensity depends on which source is on the margin.
  const marginalGCO2 = marginal.label.startsWith("Heat pump")
    ? ENERGY_GRID_INTENSITY / ENERGY_HP_COP_THERMAL * 1000   // gCO₂/MWh_th
    : ENERGY_CHP_HEAT_FACTOR * 1000;
  return {
    hour: `${String(hour + 1).padStart(2, "0")}:00`,
    demand: `${demand_MW.toFixed(2)} MW`,
    marginal: marginal.label,
    tes: `${tesSocPct.toFixed(0)}%`,
    // Extended readouts (lens 2):
    marginalPrice: `${marginal.heatPriceHP.toFixed(0)} SEK/MWh_th`,
    tesEnergy: `${tesMWh.toFixed(1)} / ${ENERGY_TES_CAPACITY_MWH} MWh`,
    dailyTotal: `${ENERGY_DAILY_TOTAL_MWH.toFixed(1)} MWh/day`,
    peak: `${ENERGY_PEAK_MW.toFixed(2)} MW (${((demand_MW / ENERGY_PEAK_MW) * 100).toFixed(0)}% of peak)`,
    priceDeviation: `${price.toFixed(0)} (avg ${ENERGY_AVG_PRICE.toFixed(0)}, ${((price / ENERGY_AVG_PRICE - 1) * 100).toFixed(1)}%)`,
    roundTrip: `η_RT ${(ETA_TES_RT * 100).toFixed(0)}%`,
    marginalCO2: `${(marginalGCO2 / 1000).toFixed(0)} kgCO₂/MWh_th`,
  };
}

// ── Industrial decarbonisation telemetry — physical model ────────────────
// Physical equations are now sourced from scripts/physics/energy-systems.js
// (ISO 50006:2014 EnPI, IPCC AR5 NG factor on LHV, EU EED PEF, Carnot HP).
//
// Stated capacities and prices for the model boundary:
const INDUSTRIAL_HP_CAPACITY_MW = 2.0;   // MW_th — typical mid-size industrial HP
const INDUSTRIAL_EB_CAPACITY_MW = 1.8;   // MW_th — electric trim boiler
const INDUSTRIAL_PARASITIC_KW   = 320;   // kW    — site parasitic load
const INDUSTRIAL_PRICE_EL_SEK   = 850;   // SEK/MWh — industrial electricity
const INDUSTRIAL_PRICE_GAS_SEK  = 350;   // SEK/MWh_LHV — industrial NG
const INDUSTRIAL_HOURS_PER_YEAR = 7200;  // h/y   — 82% utilisation

function industrialModel(controls) {
  const load = controls.load / 100;
  const heatDemand = 5.2 * load;                                      // MW
  // Heat-recovery effectiveness η_HR is now load-dependent (extends the
  // old fixed 22 %). η = 0.18 + 0.04·load gives 22 % at full load (preserves
  // the old behaviour at load=1.0) and rolls down at part load.
  const eta_hr = controls.recovery ? heatRecoveryEffectiveness(load) : 0;
  const recovered = heatDemand * eta_hr;
  const netHeat = heatDemand - recovered;
  // Heat-pump COP from Carnot fraction (process T from slider, default 80°C).
  const processT_C = controls.processT ?? 80;
  const copHP = heatPumpCarnotCOP(processT_C);                        // [-]
  // Capacity-limited merit order replaces the arbitrary "52 % of net heat".
  const dispatch = dispatchMeritOrder({
    netHeatDemandMW: netHeat,
    heatPumpEnabled: !!controls.heatPump,
    heatPumpCapacityMW: INDUSTRIAL_HP_CAPACITY_MW,
    electricBoilerEnabled: !!controls.electricBoiler,
    electricBoilerCapacityMW: INDUSTRIAL_EB_CAPACITY_MW,
    gasBoilerEnabled: true,  // gas covers any balance
  });
  const electricInput = dispatch.heatPumpHeat / copHP
                      + dispatch.electricBoilerHeat / ETA_ELECTRIC_BOILER
                      + (INDUSTRIAL_PARASITIC_KW / 1000) * load;       // MW
  const gasInput = dispatch.gasBoilerHeat / ETA_GAS_BOILER;            // MW
  const production = 10 * load;                                        // units/h
  const purchasedEnergy = electricInput + gasInput;
  // ISO 50006 EnPI. Intensity uses MW-scale inputs (matches the original
  // model's compact display convention "g/u"); kWh-correct conversion is
  // only used below for tonnes-CO₂/year and MAC.
  const enpi          = energyPerformanceIndicator(purchasedEnergy, production);
  const emissions     = emissionsIntensityFn({
    electricityKwh: electricInput,
    gasKwh:         gasInput,
    production:     production,
    gridEmissionFactor: controls.grid,
    gasEmissionFactor: G_GAS_LHV,
  });
  // Baseline = no recovery, no HP/EB, gas covers everything (the "as-is").
  const baselineElectricInput = (INDUSTRIAL_PARASITIC_KW / 1000) * load;
  const baselineGasInput      = heatDemand / ETA_GAS_BOILER;
  const baselinePurchased     = baselineElectricInput + baselineGasInput;
  const baselineEnpi          = energyPerformanceIndicator(baselinePurchased, production);
  const baselineEmissions     = emissionsIntensityFn({
    electricityKwh: baselineElectricInput,
    gasKwh:         baselineGasInput,
    production:     production,
    gridEmissionFactor: controls.grid,
    gasEmissionFactor: G_GAS_LHV,
  });
  // Scope 1 / Scope 2 split per GHG Protocol — these stay in proper kWh/h units
  // so the kgCO₂/h display is dimensionally honest.
  const scopes = scopeSplit({
    electricityKwh: electricInput * 1000,
    gasKwh:         gasInput * 1000,
    gridEmissionFactor: controls.grid,
    gasEmissionFactor:  G_GAS_LHV,
  });
  // MAC (annualised). ΔOPEX = (E_new − E_base) priced; ΔCO₂ avoided in tonnes.
  const deltaElecMWh = (electricInput - baselineElectricInput) * INDUSTRIAL_HOURS_PER_YEAR;
  const deltaGasMWh  = (gasInput - baselineGasInput)           * INDUSTRIAL_HOURS_PER_YEAR;
  const deltaOpex = deltaElecMWh * INDUSTRIAL_PRICE_EL_SEK
                  + deltaGasMWh  * INDUSTRIAL_PRICE_GAS_SEK;
  // Convert MW → kWh/h: 1 MW = 1000 kWh/h; emission factors are gCO₂/kWh.
  // gCO₂/h → tCO₂/y: × hours/year ÷ 1e6 g/tonne.
  const co2NowAnnual_t  = ((electricInput * 1000 * controls.grid)
                          + (gasInput * 1000 * G_GAS_LHV))
                          * INDUSTRIAL_HOURS_PER_YEAR / 1e6;
  const co2BaseAnnual_t = ((baselineElectricInput * 1000 * controls.grid)
                          + (baselineGasInput * 1000 * G_GAS_LHV))
                          * INDUSTRIAL_HOURS_PER_YEAR / 1e6;
  const co2Avoided_t    = co2BaseAnnual_t - co2NowAnnual_t;
  const mac             = marginalAbatementCost(deltaOpex, co2Avoided_t);
  // Primary energy (EU EED PEF) — for the electric portion only.
  const primaryEnergy = toPrimaryEnergy(electricInput) + gasInput;
  return {
    heatDemand,
    recovered,
    electricInput,
    gasInput,
    enpi,
    baselineEnpi,
    emissions,
    baselineEmissions,
    enpiImprovement: Math.max(0, ((baselineEnpi - enpi) / baselineEnpi) * 100),
    emissionsReduction: Math.max(0, baselineEmissions - emissions),
    // New extended outputs:
    copHP,
    eta_hr,
    dispatch,                          // {heatPumpHeat, electricBoilerHeat, gasBoilerHeat, unmet}
    sec: specificEnergyConsumption(purchasedEnergy, production),
    scopes,                            // {scope1, scope2}  gCO₂
    mac,                               // SEK/tCO₂  or NaN if no abatement
    primaryEnergyMW: primaryEnergy,
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
  // Reads live state from thermalTelemetry() — picks up the current
  // T₀ slider, insulation toggle, geometry toggle, case selector.
  const t = thermalTelemetry();
  const insul = !!t.insulation;
  const c = t._cht;
  // 3-resistor (uninsulated) vs 4-resistor (insulated) — caller sees a
  // unified shape via T_outer + an optional T_insulOuter + R_insul.
  if (insul) {
    const Bi_insul = biotNumber(INSULATION_H_EXT, INSULATION_T_M, INSULATION_K);
    return {
      insulated: true,
      T_gas: t.T0_K,
      T_ext: REDUCER_T_AMBIENT,
      t_wall: REDUCER_T_WALL_M,
      k_wall: REDUCER_K_WALL,
      h_gas: REDUCER_H_GAS,
      h_ext: INSULATION_H_EXT,
      t_insul: INSULATION_T_M,
      k_insul: INSULATION_K,
      R_gas: c.R_gas,
      R_wall: c.R_wall,
      R_insul: c.R_insul,
      R_ext: c.R_ext,
      R_total: c.R_total,
      q: c.q,
      T_inner: c.T_inner,
      T_metalOuter: c.T_metalOuter,
      T_outer: c.T_insulOuter,
      Bi: Bi_insul,
    };
  }
  const Bi = biotNumber(REDUCER_H_EXT, REDUCER_T_WALL_M, REDUCER_K_WALL);
  return {
    insulated: false,
    T_gas: t.T0_K,
    T_ext: REDUCER_T_AMBIENT,
    t_wall: REDUCER_T_WALL_M,
    k_wall: REDUCER_K_WALL,
    h_gas: REDUCER_H_GAS,
    h_ext: REDUCER_H_EXT,
    R_gas: c.R_gas,
    R_wall: c.R_wall,
    R_ext: c.R_ext,
    R_total: c.R_total,
    q: c.q,
    T_inner: c.T_inner,
    T_outer: c.T_outer,
    Bi,
  };
}

function drawThermalEvidence(ctx, width, height, now) {
  stageBackground(ctx, width, height);
  const S = chtState();

  // ── Layout (w17f-1: distribute over full vertical) ─────────────────────
  // Vertical budget for a 519×472 desktop canvas (default), scales to any
  // size proportionally. Sections, top → bottom:
  //   1. Header strip          (32 px)
  //   2. T(x) profile plot     (~18% of height)
  //   3. Cross-section band    (~28% of height) — gas / wall / ext zones
  //   4. Temperature labels    (18 px)
  //   5. Resistance bars       (~22% of height)
  //   6. Bi regime banner      (~7% of height)
  // Sub-band ratios sum to about 95%; the remainder is small gaps.
  const padX = 22;
  const headerH = 36;
  const profileH = Math.max(64, height * 0.18);
  const profileY = headerH + 8;
  const wallY = profileY + profileH + 18;
  const wallH = Math.max(86, height * 0.28);
  const tempLabelsH = 18;
  const barsLabelGap = 22;
  const barsY = wallY + wallH + tempLabelsH + barsLabelGap;
  const barsH = Math.max(72, height * 0.22);

  // Cross-section sub-widths: gas | wall | (insulation | ) ext
  // When insulated, an insulation band sits between the steel wall and the
  // external ambient zone — visually proportional to its physical thickness.
  const innerW = width - padX * 2;
  const wWall = Math.max(34, innerW * 0.08);
  const wInsul = S.insulated ? Math.max(40, innerW * 0.18) : 0;
  const wGas = (innerW - wWall - wInsul) * 0.50;
  const wExt = (innerW - wWall - wInsul) * 0.50;
  const xGas = padX;
  const xWall = xGas + wGas;
  const xInsul = xWall + wWall;             // insulation start (= xExt when no insul)
  const xExt = xInsul + wInsul;

  // ── Header ──────────────────────────────────────────────────────────────
  stageLabel(ctx, isSwedish()
    ? "KONJUGERAD VÄRMEÖVERFÖRING / TERMISKT MOTSTÅND I VÄGGEN"
    : "CHT / 1-D THERMAL RESISTANCE NETWORK", padX, 18, "#82a4b4");
  stageLabel(ctx, "TRITA-ITM-EX 2026:14 · Siemens Energy Finspång", padX, 32, "#65d6c9");

  // ── T(x) temperature-profile plot ──────────────────────────────────────
  // Piecewise-linear temperature profile sampled along the full gas → wall
  // → ambient path. Y axis is T (K) from T_ext to T_gas; X axis matches the
  // cross-section x-positions below so the eye can trace where the gradient
  // is steep vs flat. The flat section across the wall is the visual
  // proof of Bi ≪ 0.1.
  // equation: linear T fall = q · R_zone across each leg
  const profileXL = padX;
  const profileXR = width - padX;
  const profileXMin = profileXL;
  const profileXMax = profileXR;
  const T_min = S.T_ext - 20;
  const T_max = S.T_gas + 20;
  const yAtT = (T) => profileY + profileH - ((T - T_min) / (T_max - T_min)) * profileH;

  // Plot frame
  ctx.save();
  ctx.strokeStyle = "rgba(101, 214, 201, 0.18)";
  ctx.lineWidth = 1;
  ctx.strokeRect(profileXL + 0.5, profileY + 0.5, profileXMax - profileXMin - 1, profileH - 1);
  // Y-axis ticks at T_ext, T_outer, T_inner, T_gas
  ctx.fillStyle = "rgba(180, 192, 204, 0.7)";
  ctx.font = "500 9px 'JetBrains Mono', ui-monospace, monospace";
  [S.T_ext, S.T_outer, S.T_inner, S.T_gas].forEach((T) => {
    const py = yAtT(T);
    ctx.strokeStyle = "rgba(180, 192, 204, 0.10)";
    ctx.beginPath();
    ctx.moveTo(profileXMin, py);
    ctx.lineTo(profileXMax, py);
    ctx.stroke();
    ctx.fillText(`${Math.round(T)}`, profileXMin + 4, py - 2);
  });
  ctx.fillStyle = "rgba(180, 192, 204, 0.85)";
  ctx.fillText("T(x)  K", profileXMax - 60, profileY + 12);
  ctx.restore();

  // T(x) zone boundaries — must match the cross-section x-positions.
  // When insulated, the polyline gains a 5th leg through the insulation.
  const xGas_ = xGas;
  const xWall_ = xWall;
  const xInsul_ = xInsul;
  const xExt_ = xExt;
  const wGas_ = wGas;
  const wExt_ = wExt;
  const filmFrac = 0.18;
  const segments = S.insulated ? [
    [xGas_,                              S.T_gas],
    [xWall_ - wGas_ * filmFrac,          S.T_gas],
    [xWall_,                             S.T_inner],
    [xInsul_,                            S.T_metalOuter],
    [xExt_,                              S.T_outer],         // = T_insulOuter
    [xExt_ + wExt_ * filmFrac,           S.T_ext],
    [xExt_ + wExt_,                      S.T_ext],
  ] : [
    [xGas_,                              S.T_gas],
    [xWall_ - wGas_ * filmFrac,          S.T_gas],
    [xWall_,                             S.T_inner],
    [xExt_,                              S.T_outer],
    [xExt_ + wExt_ * filmFrac,           S.T_ext],
    [xExt_ + wExt_,                      S.T_ext],
  ];
  ctx.save();
  ctx.strokeStyle = "rgba(246, 200, 95, 0.92)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  segments.forEach(([x, T], i) => {
    const y = yAtT(T);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  // Mark the inner / outer wall points with small dots
  ctx.fillStyle = "rgba(246, 200, 95, 0.95)";
  ctx.beginPath();
  ctx.arc(xWall_, yAtT(S.T_inner), 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(xExt_, yAtT(S.T_outer), 3, 0, Math.PI * 2);
  ctx.fill();
  // Annotate the through-wall delta
  const dT = (S.T_inner - S.T_outer).toFixed(1);
  ctx.fillStyle = "rgba(255, 241, 199, 0.9)";
  ctx.font = "600 10px 'JetBrains Mono', ui-monospace, monospace";
  const midWallX = (xWall_ + xExt_) / 2;
  ctx.textAlign = "center";
  ctx.fillText(`ΔT_wall = ${dT} K`, midWallX, yAtT((S.T_inner + S.T_outer) / 2) - 8);
  ctx.textAlign = "left";
  ctx.restore();

  // ── Hot gas zone ───────────────────────────────────────────────────────
  const gasGrad = ctx.createLinearGradient(xGas, 0, xWall, 0);
  gasGrad.addColorStop(0, "#7c2d12");
  gasGrad.addColorStop(0.5, "#d0622c");
  gasGrad.addColorStop(1, "#f6c85f");
  ctx.fillStyle = gasGrad;
  ctx.fillRect(xGas, wallY, wGas, wallH);

  // ── Wall zone (steel) ──────────────────────────────────────────────────
  const wallGrad = ctx.createLinearGradient(xWall, 0, xInsul, 0);
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

  // ── Insulation zone (40 mm ceramic blanket; visible only when toggled) ─
  if (S.insulated) {
    const insulGrad = ctx.createLinearGradient(xInsul, 0, xExt, 0);
    insulGrad.addColorStop(0, "#8b4513");
    insulGrad.addColorStop(0.5, "#a0522d");
    insulGrad.addColorStop(1, "#cd853f");
    ctx.fillStyle = insulGrad;
    ctx.fillRect(xInsul, wallY, wInsul, wallH);
    // Cross-hatch fibre texture so it reads as insulation, not metal.
    ctx.strokeStyle = "rgba(255, 230, 200, 0.18)";
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 8; i++) {
      const xx = xInsul + 4 + i * ((wInsul - 8) / 7);
      ctx.beginPath();
      ctx.moveTo(xx, wallY + 4);
      ctx.lineTo(xx, wallY + wallH - 4);
      ctx.stroke();
    }
    stageLabel(ctx, "INSUL", xInsul + 4, wallY + 14, "#ffe6c8");
    stageLabel(ctx, `${(S.t_insul * 1000).toFixed(0)}mm k=${S.k_insul}`,
               xInsul + 4, wallY + wallH - 8, "#ffe6c8");
  }

  // ── External air zone ──────────────────────────────────────────────────
  const extGrad = ctx.createLinearGradient(xExt, 0, xExt + wExt, 0);
  extGrad.addColorStop(0, "#1e3a8a");
  extGrad.addColorStop(0.5, "#2563a8");
  extGrad.addColorStop(1, "#0b1a30");
  ctx.fillStyle = extGrad;
  ctx.fillRect(xExt, wallY, wExt, wallH);

  // ── Heat-flux arrows (animated; opacity pulses with q-magnitude rhythm)
  // The pulse is illustrative — it suggests transient response, not a real
  // unsteady solution.
  ctx.save();
  const arrowOffset = (now * 0.065) % 36;
  const pulse = 0.65 + 0.25 * Math.sin(now * 0.0018);
  for (let row = 0; row < 3; row++) {
    const rowY = wallY + wallH * (0.30 + row * 0.20);
    ctx.strokeStyle = `rgba(255, 241, 199, ${0.55 + 0.35 * pulse})`;
    ctx.lineWidth = 1.4 + 0.4 * pulse;
    ctx.beginPath();
    for (let x = xGas + 6 + arrowOffset - 36; x < xExt + wExt; x += 36) {
      const ax = x;
      ctx.moveTo(ax, rowY);
      ctx.lineTo(ax + 22, rowY);
      ctx.moveTo(ax + 18, rowY - 3);
      ctx.lineTo(ax + 22, rowY);
      ctx.lineTo(ax + 18, rowY + 3);
    }
    ctx.stroke();
  }
  ctx.restore();
  stageLabel(ctx, "Q  →", xExt + wExt - 24, wallY - 6, "#fff1c7");

  // ── Sweeping thermal probe ─────────────────────────────────────────────
  // Vertical readout that slides across the cross-section showing local
  // temperature T(x) at the chosen position. The temperature profile is
  // linear in each zone (1-D steady-state conduction + convective film):
  //   gas film:    T(x) → T_inner  as x crosses the boundary layer
  //   wall:        linear between T_inner and T_outer
  //   external:    T(x) → T_ext    via the convective film
  const probeT = (now / 4800) % 1;             // 4.8 s sweep
  const probeX = xGas + (xExt + wExt - xGas) * probeT;
  let probeTemp;
  if (probeX < xWall) {
    // In the gas zone: assume nearly uniform at T_gas with thin boundary
    // layer near the wall; show a smooth blend
    const t = (probeX - xGas) / (xWall - xGas);
    probeTemp = S.T_gas - (S.T_gas - S.T_inner) * Math.max(0, (t - 0.85) / 0.15);
  } else if (probeX < xExt) {
    // In the wall: linear T_inner → T_outer
    const t = (probeX - xWall) / (xExt - xWall);
    probeTemp = S.T_inner + (S.T_outer - S.T_inner) * t;
  } else {
    // External: T_outer → T_ext via convective film (thin layer at boundary)
    const t = (probeX - xExt) / (xExt + wExt - xExt);
    probeTemp = S.T_outer - (S.T_outer - S.T_ext) * Math.min(1, t / 0.15);
  }
  // Probe line
  ctx.save();
  ctx.strokeStyle = "rgba(101, 214, 201, 0.85)";
  ctx.lineWidth = 1.2;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(probeX, wallY - 14);
  ctx.lineTo(probeX, wallY + wallH + 6);
  ctx.stroke();
  ctx.setLineDash([]);
  // Probe head with temperature readout
  ctx.fillStyle = "rgba(7, 12, 18, 0.92)";
  const labelW = 70;
  ctx.fillRect(probeX - labelW / 2, wallY - 30, labelW, 18);
  ctx.strokeStyle = "rgba(101, 214, 201, 0.85)";
  ctx.lineWidth = 1;
  ctx.strokeRect(probeX - labelW / 2 + 0.5, wallY - 29.5, labelW - 1, 17);
  ctx.fillStyle = "#65d6c9";
  ctx.font = "700 11px 'JetBrains Mono', ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillText(`${Math.round(probeTemp)} K`, probeX, wallY - 17);
  ctx.textAlign = "left";
  ctx.restore();

  // ── Temperature labels ────────────────────────────────────────────────
  ctx.save();
  ctx.fillStyle = "rgba(255, 241, 199, 0.92)";
  ctx.font = "600 12px 'JetBrains Mono', ui-monospace, monospace";
  ctx.fillText(`T0 ${S.T_gas} K`, xGas + 6, wallY + wallH + 16);
  ctx.fillText(`STEEL dT ${(S.T_inner - S.T_outer).toFixed(1)} K`, xWall - 22, wallY + wallH + 16);
  ctx.fillStyle = "rgba(173, 200, 240, 0.92)";
  ctx.textAlign = "right";
  ctx.fillText(`Tamb ${S.T_ext} K`, xExt + wExt - 6, wallY + wallH + 16);
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
  const barEntries = S.insulated
    ? [
        ["R_gas",   S.R_gas,   "rgba(208, 98, 44, 0.85)"],
        ["R_wall",  S.R_wall,  "rgba(180, 188, 198, 0.85)"],
        ["R_insul", S.R_insul, "rgba(205, 133, 63, 0.85)"],
        ["R_ext",   S.R_ext,   "rgba(37, 99, 168, 0.85)"],
      ]
    : [
        ["R_gas",   S.R_gas,   "rgba(208, 98, 44, 0.85)"],
        ["R_wall",  S.R_wall,  "rgba(180, 188, 198, 0.85)"],
        ["R_ext",   S.R_ext,   "rgba(37, 99, 168, 0.85)"],
      ];
  const R_max = Math.max(...barEntries.map((e) => e[1]));
  const barXBase = padX + 70;
  const barMaxW = width - barXBase - padX;
  const barRowH = barsH / barEntries.length;

  const drawBar = (row, label, R, color) => {
    const y = barsY + row * barRowH + 4;
    const barH = barRowH - 8;
    const barW = (R / R_max) * barMaxW;
    ctx.save();
    ctx.fillStyle = "rgba(220, 226, 234, 0.88)";
    ctx.font = "600 11px 'JetBrains Mono', ui-monospace, monospace";
    ctx.fillText(label, padX, y + barH * 0.65);
    ctx.fillStyle = color;
    ctx.fillRect(barXBase, y, Math.max(2, barW), barH);
    ctx.fillStyle = "rgba(220, 226, 234, 0.85)";
    ctx.textAlign = "right";
    ctx.fillText(R.toFixed(4), width - padX, y + barH * 0.65);
    ctx.textAlign = "left";
    ctx.restore();
  };
  barEntries.forEach((entry, i) => drawBar(i, entry[0], entry[1], entry[2]));

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
    ctx.fillText(`Bi = ${S.Bi.toFixed(4)}  |  LUMPED WALL  |  q = ${Math.round(S.q)} W/m2`, padX + 10, bannerY + 18);
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

// 24h dispatch stacked-area chart driven by the real PRO2 demand + supplied
// electricity-price arrays. Dispatch policy = a labelled price-tier screening
// (HP cheap, CHP mid, TES + grid peak), not an in-browser MILP result.
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

  // ── Stacked areas — built up to the current hour (animated fill-in) ─────
  // Cursor position determines how far the dispatch is "filled". Past hours
  // are fully opaque; future hours are dimmed to indicate they haven't been
  // dispatched yet. This makes it visually obvious that the chart is a
  // chronological dispatch decision, not a static snapshot.
  const fillUpTo = hour + subHour;          // current playhead position
  const drawLayer = (values, baseAcc, color) => {
    // Past (fully filled) area: indices 0 .. floor(fillUpTo)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(xAt(0), yAt(baseAcc[0]));
    const lastFull = Math.floor(fillUpTo);
    for (let h = 0; h <= lastFull; h++) {
      ctx.lineTo(xAt(h), yAt(baseAcc[h] + values[h]));
    }
    // Partial cell at fillUpTo (interpolate between lastFull and lastFull+1)
    if (lastFull < 23) {
      const frac = fillUpTo - lastFull;
      const xFrac = xAt(lastFull) + (xAt(lastFull + 1) - xAt(lastFull)) * frac;
      const valFrac = values[lastFull] + (values[lastFull + 1] - values[lastFull]) * frac;
      const baseFrac = baseAcc[lastFull] + (baseAcc[lastFull + 1] - baseAcc[lastFull]) * frac;
      ctx.lineTo(xFrac, yAt(baseFrac + valFrac));
      ctx.lineTo(xFrac, yAt(baseFrac));
    }
    for (let h = lastFull; h >= 0; h--) {
      ctx.lineTo(xAt(h), yAt(baseAcc[h]));
    }
    ctx.closePath();
    ctx.fill();
    // Future (dimmed) area: from playhead to 23
    if (lastFull < 23) {
      ctx.save();
      ctx.globalAlpha = 0.30;
      ctx.beginPath();
      const frac = fillUpTo - lastFull;
      const xFrac = xAt(lastFull) + (xAt(lastFull + 1) - xAt(lastFull)) * frac;
      const valFrac = values[lastFull] + (values[lastFull + 1] - values[lastFull]) * frac;
      const baseFrac = baseAcc[lastFull] + (baseAcc[lastFull + 1] - baseAcc[lastFull]) * frac;
      ctx.moveTo(xFrac, yAt(baseFrac + valFrac));
      for (let h = lastFull + 1; h < 24; h++) {
        ctx.lineTo(xAt(h), yAt(baseAcc[h] + values[h]));
      }
      for (let h = 23; h >= lastFull + 1; h--) {
        ctx.lineTo(xAt(h), yAt(baseAcc[h]));
      }
      ctx.lineTo(xFrac, yAt(baseFrac));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  };

  const cum0 = new Array(24).fill(0);
  const cum1 = layers.hp.slice();
  const cum2 = cum1.map((v, i) => v + layers.chp[i]);
  const cum3 = cum2.map((v, i) => v + layers.tes[i]);

  drawLayer(layers.hp,   cum0, "rgba(101, 214, 201, 0.78)");
  drawLayer(layers.chp,  cum1, "rgba(37, 99, 168, 0.80)");
  drawLayer(layers.tes,  cum2, "rgba(246, 200, 95, 0.78)");
  drawLayer(layers.grid, cum3, "rgba(208, 98, 44, 0.70)");

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

  // ── Active dispatch indicator ─────────────────────────────────────────
  // Small pulsing dots near the playhead showing which sources are
  // currently dispatching (= nonzero contribution this hour).
  const currentSplit = dispatchSplit(PRO2_DEMAND_MW[hour], PRO2_PRICE[hour]);
  const gridTopHere = Math.max(0, PRO2_DEMAND_MW[hour] - (currentSplit.hp + currentSplit.chp + currentSplit.tes));
  const activeNow = [
    { active: currentSplit.hp > 0.01, color: "rgba(101, 214, 201, 0.95)" },
    { active: currentSplit.chp > 0.01, color: "rgba(37, 99, 168, 0.95)" },
    { active: currentSplit.tes > 0.01, color: "rgba(246, 200, 95, 0.95)" },
    { active: gridTopHere > 0.01, color: "rgba(208, 98, 44, 0.95)" },
  ];
  const pulseEnergy = 0.7 + 0.3 * Math.sin(now * 0.005);
  activeNow.forEach((src, i) => {
    if (!src.active) return;
    const dotY = chartY - 14;
    const dotX = cursorX - 18 + i * 12;
    ctx.fillStyle = src.color;
    ctx.globalAlpha = pulseEnergy;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });

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
// w17f-2: full Industrial scene rebuild.
// The previous scene was Sankey-only. Now the headline visual is the actual
// ISO 50006 EnPI methodology — a regression scatter of Energy vs Production
// with baseline vs active fit lines and a deviation indicator. The Sankey
// is compressed to a thin top strip so both stories are visible.
//
// Top  (~25%): compact 3-block Sankey — sources → conversion → process
// Mid  (~55%): EnPI regression scatter (the analytical anchor)
// Bot  (~12%): baseline-vs-active emissions intensity strip

// 14-week synthetic historical dataset (production rate vs purchased energy).
// Each point is scattered around a fixed baseline line E = 1.6 + 0.52·P + ε
// to look like real operational data. Generated once, kept stable.
const ENPI_HISTORY = [
  [3.2, 3.45], [4.1, 3.78], [4.6, 4.10], [5.0, 4.42], [5.3, 4.51],
  [5.8, 4.78], [6.2, 4.83], [6.8, 5.21], [7.1, 5.18], [7.4, 5.58],
  [7.9, 5.79], [8.3, 5.94], [8.7, 6.25], [9.1, 6.32],
];
const ENPI_BASELINE_A = 1.6;       // intercept (idle utility load)
const ENPI_BASELINE_B = 0.52;      // slope (MWh per production unit)
function enpiBaselineE(production) {
  return ENPI_BASELINE_A + ENPI_BASELINE_B * production;
}

function drawIndustrialBalance(ctx, width, height, controls, now) {
  stageBackground(ctx, width, height);
  const metrics = industrialModel(controls);

  // ── Vertical layout (proportional to canvas height) ────────────────────
  const padX = 22;
  const headerH = 38;
  // Sankey now uses a real ribbon diagram (filled bezier shapes) rather than
  // pill-shaped stroked dashes — the previous look made arrival labels collide
  // with the moving stroke. Slightly taller because ribbons need vertical
  // room proportional to MW flow to be legible.
  const sankeyH = Math.max(110, height * 0.26);
  const sankeyY = headerH;
  const scatterY = sankeyY + sankeyH + 14;
  const scatterH = Math.max(132, height * 0.42);
  const stripY = scatterY + scatterH + 12;
  const stripH = Math.min(34, height - stripY - 10);

  // ── Header ─────────────────────────────────────────────────────────────
  stageLabel(ctx, isSwedish()
    ? "ENERGIBALANS · ISO 50006 EnPI-RAM"
    : "UTILITY BALANCE · ISO 50006 EnPI FRAME", padX, 18, "#82a4b4");
  stageLabel(ctx, isSwedish()
    ? "Skjut grid-intensitet → utsläppsskillnaden visas i nedre strecket."
    : "Drag grid intensity → emissions delta in bottom strip · ribbon width ∝ MW",
    padX, 32, "#65d6c9");

  // ── Sankey node layout (3 column: sources | converters | sink) ─────────
  // Each node is a filled vertical bar; height proportional to MW it handles.
  // Column geometry:
  const colW = 70;                                   // bar thickness
  const srcColX = padX;
  const convColX = padX + 180;                       // ribbon span source→conv
  const sinkColX = width - padX - colW;              // ribbon span conv→sink
  const innerTop = sankeyY + 6;
  const innerBot = sankeyY + sankeyH - 6;
  const innerH = innerBot - innerTop;

  // MW totals — drawn from the live merit-order dispatch so the diagram
  // matches the controls panel exactly. Previously this used an arbitrary
  // "52% of net heat" rule that ignored Electric Boiler and process-T.
  const gridMW = Math.max(0.01, metrics.electricInput);
  const fuelMW = Math.max(0.01, metrics.gasInput);
  const sourceTotal = gridMW + fuelMW;
  const heatPumpMW       = Math.max(0, metrics.dispatch.heatPumpHeat);
  const electricBoilerMW = Math.max(0, metrics.dispatch.electricBoilerHeat);
  const gasBoilerMW      = Math.max(0, metrics.dispatch.gasBoilerHeat);
  const recoveredMW      = Math.max(0, metrics.recovered);
  const sinkTotal = Math.max(0.01, heatPumpMW + electricBoilerMW + gasBoilerMW);
  // MW-to-pixels — scale uses the larger of the two totals so nothing
  // overflows the band, then leave a small margin so converters can slot in.
  const mwScale = (innerH * 0.92) / Math.max(sourceTotal, sinkTotal);

  // Helper — draw a vertical Sankey bar with rounded inner edge and a label
  // inscribed at the top.
  const drawBar = (x, yTop, h, color, label, valueLabel) => {
    ctx.save();
    // base fill (very dark) + colored inner panel
    ctx.fillStyle = "rgba(13, 23, 28, 0.92)";
    ctx.fillRect(x, yTop, colW, h);
    // inner colored swatch along the connecting edge
    const grad = ctx.createLinearGradient(x, yTop, x + colW, yTop);
    grad.addColorStop(0, rgba(color, 0.22));
    grad.addColorStop(1, rgba(color, 0.55));
    ctx.fillStyle = grad;
    ctx.fillRect(x, yTop, colW, h);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x + 0.5, yTop + 0.5, colW - 1, h - 1);
    // labels — top label (name), MW under
    ctx.fillStyle = "#e6edf2";
    ctx.font = "700 10px 'JetBrains Mono', ui-monospace, monospace";
    ctx.fillText(label, x + 6, yTop + 13);
    if (valueLabel) {
      ctx.fillStyle = color;
      ctx.font = "600 10px 'JetBrains Mono', ui-monospace, monospace";
      ctx.fillText(valueLabel, x + 6, yTop + 26);
    }
    ctx.restore();
  };

  // Helper — draw a filled Sankey ribbon between (x1, y1a..y1b) on the left
  // and (x2, y2a..y2b) on the right with a smooth horizontal bezier. Inside
  // the ribbon, animated streak lines drift left→right to telegraph flow.
  // equation: ribbon thickness ∝ MW flow; ribbon energy is conserved.
  const drawRibbon = (x1, y1a, y1b, x2, y2a, y2b, color) => {
    const cx1 = x1 + (x2 - x1) * 0.45;
    const cx2 = x1 + (x2 - x1) * 0.55;
    const path = new Path2D();
    path.moveTo(x1, y1a);
    path.bezierCurveTo(cx1, y1a, cx2, y2a, x2, y2a);
    path.lineTo(x2, y2b);
    path.bezierCurveTo(cx2, y2b, cx1, y1b, x1, y1b);
    path.closePath();
    // Fill with horizontal gradient (dim at source, glow at sink edge)
    const grad = ctx.createLinearGradient(x1, 0, x2, 0);
    grad.addColorStop(0,    rgba(color, 0.45));
    grad.addColorStop(0.5,  rgba(color, 0.30));
    grad.addColorStop(1,    rgba(color, 0.55));
    ctx.save();
    ctx.fillStyle = grad;
    ctx.fill(path);
    // soft outline so ribbons read against each other
    ctx.strokeStyle = rgba(color, 0.65);
    ctx.lineWidth = 1;
    ctx.stroke(path);
    // Animated streaks INSIDE the ribbon — short tangential dashes following
    // 5 interior bezier centrelines. Phase-shifted so the flow direction is
    // visible. Streaks are rendered as bright white-ish dashes (much higher
    // contrast than the ribbon fill) with butt line caps so no rounded pill
    // artifacts poke out beyond the ribbon edges.
    ctx.clip(path);
    const ribbonH = Math.max(Math.abs(y1b - y1a), Math.abs(y2b - y2a));
    const streakCount = Math.max(3, Math.min(7, Math.round(ribbonH / 9)));
    for (let s = 0; s < streakCount; s += 1) {
      const t = (s + 1) / (streakCount + 1);
      const yA = y1a + (y1b - y1a) * t;
      const yB = y2a + (y2b - y2a) * t;
      const streak = new Path2D();
      streak.moveTo(x1, yA);
      streak.bezierCurveTo(cx1, yA, cx2, yB, x2, yB);
      // Bright streak: much lighter than the ribbon fill so the flow reads.
      ctx.strokeStyle = "rgba(255, 255, 255, 0.32)";
      ctx.lineWidth = 1.4;
      ctx.lineCap = "butt"; // no rounded pill caps
      ctx.setLineDash([10, 22]);
      // Faster phase so the streak motion is unambiguous (≈2–3 px/frame).
      ctx.lineDashOffset = -((now * 0.18) + s * 9) % 32;
      ctx.stroke(streak);
    }
    ctx.setLineDash([]);
    ctx.restore();
  };

  // ── Source bars (left column) ──────────────────────────────────────────
  const gridH = gridMW * mwScale;
  const fuelH = fuelMW * mwScale;
  const gridGap = 8;
  const srcStackH = gridH + fuelH + gridGap;
  const srcStartY = innerTop + (innerH - srcStackH) / 2;
  const gridY = srcStartY;
  const fuelY = gridY + gridH + gridGap;
  drawBar(srcColX, gridY, gridH, "#65d6c9",
    isSwedish() ? "ELNÄT" : "GRID",
    `${gridMW.toFixed(2)} MW`);
  drawBar(srcColX, fuelY, fuelH, "#d0622c",
    isSwedish() ? "BRÄNSLE" : "FUEL",
    `${fuelMW.toFixed(2)} MW`);
  // tiny side annotations for grid intensity (placed OUTSIDE any ribbon zone)
  ctx.save();
  ctx.fillStyle = "rgba(130, 164, 180, 0.75)";
  ctx.font = "500 9px 'JetBrains Mono', ui-monospace, monospace";
  ctx.fillText(`${controls.grid} gCO₂/kWh`, srcColX, gridY + gridH + 16 > fuelY ? fuelY - 2 : gridY + gridH + 12);
  ctx.fillText("202 gCO₂/kWh", srcColX, fuelY + fuelH + 12);
  ctx.restore();

  // ── Converter bars (middle column) — HP top, EB middle, Gas Boiler bottom
  const hpH = heatPumpMW * mwScale;
  const ebH = electricBoilerMW * mwScale;
  const gbH = gasBoilerMW * mwScale;
  const convGap = 8;
  const convStackH = hpH + (electricBoilerMW > 0.01 ? ebH + convGap : 0)
                   + (gasBoilerMW > 0.01 ? gbH + convGap : 0);
  const convStartY = innerTop + (innerH - convStackH) / 2;
  let convCursor = convStartY;
  const hpY = convCursor;
  if (heatPumpMW > 0.01) {
    drawBar(convColX, hpY, Math.max(18, hpH), "#65d6c9",
      "HEAT PUMP",
      `COP ${metrics.copHP.toFixed(2)} · T${(controls.processT ?? 80)}°C`);
    convCursor += hpH + convGap;
  }
  const ebY = convCursor;
  if (electricBoilerMW > 0.01) {
    drawBar(convColX, ebY, Math.max(18, ebH), "#ffd166",
      isSwedish() ? "EL-PANNA" : "ELECTRIC BOILER",
      `η ${ETA_ELECTRIC_BOILER.toFixed(2)}`);
    convCursor += ebH + convGap;
  }
  const gbY = convCursor;
  if (gasBoilerMW > 0.01) {
    drawBar(convColX, gbY, Math.max(18, gbH), "#d0622c",
      isSwedish() ? "GASPANNA" : "GAS BOILER",
      `η ${ETA_GAS_BOILER.toFixed(2)}`);
  }

  // ── Sink bar (right column) — PROCESS ─────────────────────────────────
  const sinkH = sinkTotal * mwScale;
  const sinkY = innerTop + (innerH - sinkH) / 2;
  drawBar(sinkColX, sinkY, sinkH, "#f6c85f",
    "PROCESS",
    `${metrics.heatDemand.toFixed(2)} MWth`);
  // production-rate sublabel inside the bar (below MWth)
  ctx.save();
  ctx.fillStyle = "rgba(180, 192, 204, 0.75)";
  ctx.font = "500 9px 'JetBrains Mono', ui-monospace, monospace";
  ctx.fillText(`${(10 * controls.load / 100).toFixed(1)} u/h`, sinkColX + 6, sinkY + 38);
  ctx.restore();

  // ── Ribbons (filled, color-graded) ─────────────────────────────────────
  // GRID splits between HP and EB (both electric); FUEL feeds GB only.
  const gridSplitForHP = (heatPumpMW > 0.01)
    ? (heatPumpMW / metrics.copHP) / Math.max(gridMW, 0.001) : 0;
  const gridSplitForEB = (electricBoilerMW > 0.01)
    ? (electricBoilerMW / ETA_ELECTRIC_BOILER) / Math.max(gridMW, 0.001) : 0;
  const gridHPSlice = gridH * Math.min(1, gridSplitForHP);
  const gridEBSlice = gridH * Math.min(1 - Math.min(1, gridSplitForHP), gridSplitForEB);
  const gridY_HP = gridY;
  const gridY_EB = gridY + gridHPSlice;
  if (heatPumpMW > 0.01 && hpH > 0.5) {
    drawRibbon(
      srcColX + colW, gridY_HP, gridY_HP + gridHPSlice,
      convColX,       hpY,      hpY + hpH,
      "#65d6c9"
    );
    drawRibbon(
      convColX + colW, hpY,   hpY + hpH,
      sinkColX,        sinkY, sinkY + hpH,
      "#65d6c9"
    );
  }
  if (electricBoilerMW > 0.01 && ebH > 0.5) {
    drawRibbon(
      srcColX + colW, gridY_EB, gridY_EB + gridEBSlice,
      convColX,       ebY,      ebY + ebH,
      "#ffd166"
    );
    drawRibbon(
      convColX + colW, ebY,           ebY + ebH,
      sinkColX,        sinkY + hpH,   sinkY + hpH + ebH,
      "#ffd166"
    );
  }
  if (gasBoilerMW > 0.01 && gbH > 0.5) {
    drawRibbon(
      srcColX + colW, fuelY, fuelY + fuelH,
      convColX,       gbY,   gbY + gbH,
      "#d0622c"
    );
    drawRibbon(
      convColX + colW, gbY,                 gbY + gbH,
      sinkColX,        sinkY + hpH + ebH,   sinkY + sinkH,
      "#d0622c"
    );
  }

  // ── HEAT RECOVERY back-arrow ribbon (literal arrow PROCESS → input) ────
  // When recovery is enabled, a translucent ribbon arches from the PROCESS
  // sink back down to the demand side, width proportional to recovered MW.
  // The visible loop is the "−Q_HR" the controller is offsetting from gross
  // heat demand. Vanishes entirely when toggle is off.
  if (controls.recovery && recoveredMW > 0.01) {
    const recH = Math.max(6, recoveredMW * mwScale);
    const arcStartX = sinkColX + colW * 0.5;
    const arcEndX   = srcColX;
    const arcStartY = sinkY + sinkH + 6;
    const arcMidY   = arcStartY + 28;
    const arcEndY   = innerBot - 6;
    ctx.save();
    ctx.strokeStyle = "rgba(155, 214, 159, 0.78)";
    ctx.lineWidth = Math.max(2, recH * 0.5);
    ctx.lineCap = "round";
    ctx.setLineDash([8, 8]);
    ctx.lineDashOffset = -(now * 0.10) % 32;
    ctx.beginPath();
    ctx.moveTo(arcStartX, arcStartY);
    ctx.bezierCurveTo(
      arcStartX, arcMidY,
      arcEndX + 80, arcEndY,
      arcEndX + 10, arcEndY
    );
    ctx.stroke();
    ctx.setLineDash([]);
    // Arrowhead at the receiving end
    ctx.fillStyle = "rgba(155, 214, 159, 0.95)";
    ctx.beginPath();
    ctx.moveTo(arcEndX + 10, arcEndY - 6);
    ctx.lineTo(arcEndX,      arcEndY);
    ctx.lineTo(arcEndX + 10, arcEndY + 6);
    ctx.closePath();
    ctx.fill();
    // Label
    ctx.fillStyle = "rgba(155, 214, 159, 0.95)";
    ctx.font = "700 10px 'JetBrains Mono', ui-monospace, monospace";
    ctx.fillText(
      isSwedish()
        ? `VÄRMEÅTERV.  −${recoveredMW.toFixed(2)} MW  (η_HR ${(metrics.eta_hr * 100).toFixed(0)}%)`
        : `HEAT RECOVERY  −${recoveredMW.toFixed(2)} MW  (η_HR ${(metrics.eta_hr * 100).toFixed(0)}%)`,
      arcEndX + 16, arcEndY - 8
    );
    ctx.restore();
  }

  // ── EnPI regression scatter chart (the analytical anchor) ─────────────
  // Plots Energy_purchased (MWh) vs Production (units/h) with:
  //   - 14 historical scatter points (synthetic, fixed)
  //   - baseline regression line (orange, dashed)  E = 1.6 + 0.52·P
  //   - active operating line (cyan, solid) computed from current dispatch
  //   - current point highlighted with pulse + deviation arrow
  // equation: EnPI = E_purchased / P  (ISO 50006:2014)
  //           Baseline E_b(P) = a + b·P  (load-driver regression)
  //           Deviation = (E_active − E_baseline) / E_baseline × 100 %

  const plotPadL = padX + 32;
  const plotPadR = padX + 70;        // room for live labels
  const plotPadT = 14;
  const plotPadB = 18;
  const scatterPlotX = plotPadL;
  const scatterPlotY = scatterY + plotPadT;
  const scatterPlotW = width - plotPadL - plotPadR;
  const scatterPlotH = scatterH - plotPadT - plotPadB;

  // X axis: 0..12 units/h.  Y axis: 0..10 MWh
  const X_MIN = 0, X_MAX = 12;
  const Y_MIN = 0, Y_MAX = 10;
  const xToPx = (P) => scatterPlotX + ((P - X_MIN) / (X_MAX - X_MIN)) * scatterPlotW;
  const yToPx = (E) => scatterPlotY + scatterPlotH - ((E - Y_MIN) / (Y_MAX - Y_MIN)) * scatterPlotH;

  // Chart background + frame
  ctx.save();
  ctx.fillStyle = "rgba(13, 23, 28, 0.55)";
  ctx.fillRect(scatterPlotX, scatterPlotY, scatterPlotW, scatterPlotH);
  ctx.strokeStyle = "rgba(101, 214, 201, 0.18)";
  ctx.lineWidth = 1;
  ctx.strokeRect(scatterPlotX + 0.5, scatterPlotY + 0.5, scatterPlotW - 1, scatterPlotH - 1);
  // Grid
  ctx.strokeStyle = "rgba(180, 192, 204, 0.07)";
  for (let p = 2; p <= 12; p += 2) {
    const gx = xToPx(p);
    ctx.beginPath(); ctx.moveTo(gx, scatterPlotY); ctx.lineTo(gx, scatterPlotY + scatterPlotH); ctx.stroke();
  }
  for (let e = 2; e <= 10; e += 2) {
    const gy = yToPx(e);
    ctx.beginPath(); ctx.moveTo(scatterPlotX, gy); ctx.lineTo(scatterPlotX + scatterPlotW, gy); ctx.stroke();
  }
  // Axis ticks
  ctx.fillStyle = "rgba(180, 192, 204, 0.65)";
  ctx.font = "500 9px 'JetBrains Mono', ui-monospace, monospace";
  for (let p = 0; p <= 12; p += 4) {
    ctx.fillText(`${p}`, xToPx(p) - 4, scatterPlotY + scatterPlotH + 13);
  }
  for (let e = 0; e <= 10; e += 2) {
    ctx.textAlign = "right";
    ctx.fillText(`${e}`, scatterPlotX - 4, yToPx(e) + 3);
  }
  ctx.textAlign = "left";
  // Axis labels
  ctx.fillStyle = "rgba(180, 192, 204, 0.85)";
  ctx.font = "500 10px 'JetBrains Mono', ui-monospace, monospace";
  ctx.fillText("Production  P  [u/h] →", scatterPlotX + scatterPlotW - 138, scatterPlotY + scatterPlotH - 6);
  ctx.save();
  ctx.translate(scatterPlotX - 22, scatterPlotY + 80);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("Energy  E  [MWh] ↑", 0, 0);
  ctx.restore();
  ctx.restore();

  // Scatter points (faded with age — newest first / brightest)
  ctx.save();
  ENPI_HISTORY.forEach(([P, E], i) => {
    const opacity = 0.30 + 0.55 * (i / ENPI_HISTORY.length);
    ctx.fillStyle = `rgba(180, 192, 204, ${opacity.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(xToPx(P), yToPx(E), 2.6, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  // Baseline regression line (orange dashed): E = a + b·P
  ctx.save();
  ctx.strokeStyle = "rgba(208, 98, 44, 0.78)";
  ctx.lineWidth = 1.6;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(xToPx(0),       yToPx(enpiBaselineE(0)));
  ctx.lineTo(xToPx(X_MAX),   yToPx(enpiBaselineE(X_MAX)));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(208, 98, 44, 0.95)";
  ctx.font = "600 10px 'JetBrains Mono', ui-monospace, monospace";
  ctx.fillText("Baseline  E = 1.6 + 0.52·P",
    scatterPlotX + scatterPlotW - 192, yToPx(enpiBaselineE(X_MAX * 0.7)) - 6);
  ctx.restore();

  // Active operating line — from current EnPI extrapolated through origin's
  // baseline intercept (so it's a line, not just a point). Slope reflects
  // how much per-unit energy the current dispatch needs.
  const currentP = 10 * controls.load / 100;
  const currentE = metrics.electricInput + metrics.gasInput;
  // Slope of active line: pivot from baseline intercept through current point
  const activeSlope = currentP > 0.1 ? (currentE - ENPI_BASELINE_A) / currentP : ENPI_BASELINE_B;
  ctx.save();
  ctx.strokeStyle = "rgba(101, 214, 201, 0.95)";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(xToPx(0),     yToPx(ENPI_BASELINE_A));
  ctx.lineTo(xToPx(X_MAX), yToPx(ENPI_BASELINE_A + activeSlope * X_MAX));
  ctx.stroke();
  ctx.restore();

  // Current operating point — pulsing dot + vertical/horizontal guides
  const cpx = xToPx(currentP);
  const cpy = yToPx(currentE);
  const pulseR = 5 + 2 * Math.sin(now * 0.005);
  ctx.save();
  // Guides
  ctx.strokeStyle = "rgba(255, 241, 199, 0.30)";
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 3]);
  ctx.beginPath();
  ctx.moveTo(cpx, scatterPlotY + scatterPlotH);
  ctx.lineTo(cpx, cpy);
  ctx.lineTo(scatterPlotX, cpy);
  ctx.stroke();
  ctx.setLineDash([]);
  // Halo
  ctx.fillStyle = "rgba(255, 241, 199, 0.25)";
  ctx.beginPath();
  ctx.arc(cpx, cpy, pulseR + 4, 0, Math.PI * 2);
  ctx.fill();
  // Dot
  ctx.fillStyle = "#fff1c7";
  ctx.beginPath();
  ctx.arc(cpx, cpy, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Deviation indicator: vertical arrow from current point to baseline at P
  const baselineHere = enpiBaselineE(currentP);
  const baselineY = yToPx(baselineHere);
  const deviationPct = baselineHere > 0
    ? ((currentE - baselineHere) / baselineHere) * 100
    : 0;
  ctx.save();
  const arrowColor = deviationPct > 0 ? "#d0622c" : "#65d6c9";
  ctx.strokeStyle = arrowColor;
  ctx.fillStyle = arrowColor;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(cpx + 14, cpy);
  ctx.lineTo(cpx + 14, baselineY);
  ctx.stroke();
  // arrowhead
  const arrowDir = baselineY > cpy ? 1 : -1;
  ctx.beginPath();
  ctx.moveTo(cpx + 14, baselineY);
  ctx.lineTo(cpx + 10, baselineY - 5 * arrowDir);
  ctx.lineTo(cpx + 18, baselineY - 5 * arrowDir);
  ctx.closePath();
  ctx.fill();
  // Deviation label
  ctx.fillStyle = arrowColor;
  ctx.font = "700 11px 'JetBrains Mono', ui-monospace, monospace";
  ctx.fillText(`${deviationPct > 0 ? "+" : ""}${deviationPct.toFixed(1)} %`, cpx + 22, (cpy + baselineY) / 2 + 4);
  ctx.restore();

  // Right-side live readout
  const readX = scatterPlotX + scatterPlotW + 8;
  ctx.save();
  ctx.fillStyle = "rgba(255, 241, 199, 0.92)";
  ctx.font = "700 11px 'JetBrains Mono', ui-monospace, monospace";
  ctx.fillText(`EnPI ${(currentE / Math.max(0.1, currentP)).toFixed(2)}`, readX, scatterPlotY + 18);
  ctx.fillStyle = "rgba(180, 192, 204, 0.80)";
  ctx.font = "500 10px 'JetBrains Mono', ui-monospace, monospace";
  ctx.fillText("MWh/u", readX, scatterPlotY + 30);
  ctx.fillStyle = "rgba(101, 214, 201, 0.92)";
  ctx.fillText(`P  ${currentP.toFixed(1)}`, readX, scatterPlotY + 52);
  ctx.fillStyle = "rgba(208, 98, 44, 0.92)";
  ctx.fillText(`E  ${currentE.toFixed(2)}`, readX, scatterPlotY + 66);
  ctx.fillStyle = "rgba(180, 192, 204, 0.70)";
  ctx.fillText("Baseline:", readX, scatterPlotY + 90);
  ctx.fillStyle = "rgba(208, 98, 44, 0.88)";
  ctx.fillText(`a=1.6  b=0.52`, readX, scatterPlotY + 102);
  ctx.restore();

  // Draw conversion and process instrumentation above the moving flow lanes,
  // keeping animated pipes legible without allowing them to overwrite labels.
  if (controls.heatPump) {
    drawConversionNode(convX, midY - blockH / 2, convW, blockH + 6,
      isSwedish() ? "VARMEPUMP" : "HEAT PUMP", "COP 3.25", "#65d6c9", true);
  }
  if (controls.electricBoiler) {
    drawConversionNode(convX, midY + 30, convW, blockH,
      isSwedish() ? "ELPANNA" : "E-BOILER", "EFF 0.98", "#7dd3fc", true);
  }
  drawConversionNode(convX, bottomY - 10, convW, blockH + 2,
    isSwedish() ? "GASPANNA" : "GAS BOILER", "EFF 0.90", "#d0622c",
    metrics.gasInput > 0.01);
  drawConversionNode(processX, processY, processW, 48,
    "PROCESS", `${metrics.heatDemand.toFixed(2)} MWth`, "#f6c85f", false);

  // ── Baseline vs Active emissions strip (bottom) ───────────────────────
  const stripPadL = padX;
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
  ctx.fillText(`${metrics.emissions.toFixed(1)} kg/u  delta -${metrics.emissionsReduction.toFixed(1)}`, stripPadL + stripW - 6, stripY + stripH - 1);
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
  stageLabel(ctx, "MODEL: AREA-MACH + BARTZ + Rdep=t/k", 14, 33, "#82a4b4");

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
    // Coolant flow animation — sped up 4× for visibility (was 0.024)
    ctx.strokeStyle = "rgba(101,214,201,0.85)";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([9, 10]);
    ctx.lineDashOffset = -(now * 0.10) % 38;
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
  // ── Thermal resistance ladder (bottom strip) ──────────────────────────
  // Shows the 1-D heat flux path: gas → copper → coke (GROWING) → coolant.
  // R_coke bar width grows with the simulated coke thickness, dramatising
  // the failure mode: as deposit builds, the thermal bottleneck shifts.
  // equation per resistor: R_i = t_i / k_i (conduction) or 1/h_i (convection)
  const ladderY = height - 36;
  const ladderH = 10;
  const ladderX0 = 14;
  const ladderW = width - 28;
  const baseR = {
    gas: 1 / 12500,      // 1/h_gas
    copper: 0.0012 / 320, // t_cu / k_cu
    coolant: 1 / 26000,  // 1/h_coolant
  };
  // R_coke grows with deposit thickness (in metres)
  const cokeMeters = (metrics?.cokeThicknessMicrons || 0) * 1e-6;
  const Rcoke = cokeMeters / 1.15; // k_coke ~ 1.15 W/m·K
  const Rtotal = baseR.gas + baseR.copper + Rcoke + baseR.coolant;
  // Plot bars proportional to each R as a fraction of total
  const widths = {
    gas: (baseR.gas / Rtotal) * ladderW,
    copper: (baseR.copper / Rtotal) * ladderW,
    coke: (Rcoke / Rtotal) * ladderW,
    coolant: (baseR.coolant / Rtotal) * ladderW,
  };
  let lx = ladderX0;
  ctx.save();
  // Gas resistance (orange)
  ctx.fillStyle = "rgba(208, 98, 44, 0.80)";
  ctx.fillRect(lx, ladderY, Math.max(1, widths.gas), ladderH);
  lx += widths.gas;
  // Copper wall (warm brown)
  ctx.fillStyle = "rgba(196, 142, 86, 0.80)";
  ctx.fillRect(lx, ladderY, Math.max(1, widths.copper), ladderH);
  lx += widths.copper;
  // Coke deposit (dark, glowing red border to highlight failure mode)
  if (widths.coke > 0.5) {
    ctx.fillStyle = "rgba(56, 34, 24, 0.95)";
    ctx.fillRect(lx, ladderY, widths.coke, ladderH);
    ctx.strokeStyle = `rgba(208, 98, 44, ${0.6 + 0.4 * Math.sin(now * 0.005)})`;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(lx + 0.5, ladderY + 0.5, widths.coke - 1, ladderH - 1);
    lx += widths.coke;
  }
  // Coolant resistance (cyan)
  ctx.fillStyle = "rgba(101, 214, 201, 0.80)";
  ctx.fillRect(lx, ladderY, Math.max(1, widths.coolant), ladderH);
  ctx.restore();

  // Labels above the ladder
  stageLabel(ctx, isSwedish()
    ? "TERMISKT MOTSTÅND: GAS → KOPPAR → KOKS (växande) → KYLMEDEL"
    : "THERMAL RESISTANCE: GAS → COPPER → COKE (growing) → COOLANT",
    ladderX0, ladderY - 6, "#82a4b4");
  if (metrics) {
    stageLabel(ctx, `Tw ${Math.round(metrics.maxWallTemperature)} K`, ladderX0, height - 10, "#f6c85f");
    stageLabel(ctx, `Rdep ${Math.round(metrics.cokeThicknessMicrons)} um`, width - 126, height - 10, "#d0622c");
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
  const count = options.reducedMotion ? 72 : options.lowPower ? 110 : 176;

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
      if (particle.trail.length > 5) particle.trail.shift();
      draw.globalAlpha = Math.min(0.16, particle.life * 0.2);
      draw.lineWidth = 0.65;
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
      draw.globalAlpha = Math.min(0.95, particle.life);
      draw.beginPath();
      draw.arc(particle.x * width, particle.y * height, 1 + particle.weight * 0.85, 0, Math.PI * 2);
      draw.fillStyle = rgba(palette[mode] || palette.thermal, theme === "light" ? 0.52 : 0.66);
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
  const industrialControls = {
    load: 72,
    grid: 55,
    processT: 80,     // °C — heat-pump sink temperature (drives Carnot COP)
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
      drawThermalEvidence(renderCtx, cssW, cssH, now);
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
    // Track wall T for the dT/dt prediction.
    pushWallTSample(metrics.simulatedTime, metrics.maxWallTemperature);
    const dTdt = wallHeatingRateK_per_s();
    // Derived quantities via shared physics layer:
    const burnout = burnoutMargin(metrics.maxWallTemperature, T_BURNOUT_CU);
    const dT_coolant = coolantTemperatureRise({
      heatFluxWPerM2: metrics.heatFluxPeak,
      wallAreaM2: NOZZLE_THROAT_WALL_AREA_M2,
      coolantMassFlowKgs: NOZZLE_COOLANT_MASSFLOW,
      coolantCpJperKgK: CP_CH4_COOL,
    });
    const pRatioExit = staticToTotalPressure(metrics.exitMach, GAMMA_CH4);
    const St = stantonNumber(
      NOZZLE_THROAT_H_GAS, NOZZLE_THROAT_DENSITY,
      NOZZLE_THROAT_VELOCITY, NOZZLE_THROAT_CP,
    );
    // Time-to-margin: extrapolate current heating rate to T_burnout.
    let timeToMargin;
    if (dTdt > 0.01 && burnout.marginK > 0) {
      timeToMargin = `${(burnout.marginK / dTdt).toFixed(0)} s`;
    } else if (burnout.marginK <= 0) {
      timeToMargin = "Past limit";
    } else {
      timeToMargin = "Stable (dT/dt ≤ 0)";
    }
    const text = {
      exitMach: `Ma ${metrics.exitMach.toFixed(2)}`,
      wallTemperature: `${Math.round(metrics.maxWallTemperature)} K`,
      healthIndex: `${Math.round(metrics.healthIndex)} / 100`,
      runtime: `${Math.round(metrics.simulatedTime)} s`,
      depositThickness: `${Math.round(metrics.cokeThicknessMicrons)} µm`,
      // Extended readouts:
      throatHeatFlux: `${(metrics.heatFluxPeak / 1e6).toFixed(2)} MW/m²`,
      depositResistanceShare: `${metrics.resistanceIncrease.toFixed(1)} %`,
      conductanceRatio: `${metrics.healthIndex.toFixed(0)} %`,
      coolantDeltaT: `${dT_coolant.toFixed(1)} K`,
      burnoutMargin: `${burnout.marginK.toFixed(0)} K (T/T_burn ${(burnout.ratio * 100).toFixed(1)}%)`,
      exitPressureRatio: `p_e/p_0 ${pRatioExit.toFixed(4)}`,
      stantonNumber: `St ${St.toExponential(2)}`,
      timeToMargin,
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
      // Extended readouts:
      heatFlux: t.heatFlux,
      wallOuter: t.wallOuter,
      adiabaticWall: t.adiabaticWall,
      reynolds: t.reynolds,
    };
    Object.entries(text).forEach(([key, value]) => {
      const node = document.querySelector(`[data-thermal-metric="${key}"]`);
      if (node) node.textContent = value;
    });
    // Reflect active geometry in the segmented control button state.
    const geom = t.geometry;
    document.querySelectorAll("[data-thermal-geom]").forEach((btn) => {
      const active = btn.dataset.thermalGeom === geom;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  // Wire the geometry toggle (smooth quintic C² vs legacy two-step).
  document.querySelectorAll("[data-thermal-geom]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.body.dataset.thermalGeometry = btn.dataset.thermalGeom;
      updateThermalMetrics();
    });
  });
  // Wire the insulation toggle.
  document.querySelectorAll("[data-thermal-insul]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.body.dataset.thermalInsulation = btn.dataset.thermalInsul;
      document.querySelectorAll("[data-thermal-insul]").forEach((b) => {
        const active = b.dataset.thermalInsul === btn.dataset.thermalInsul;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", active ? "true" : "false");
      });
      updateThermalMetrics();
    });
  });
  // Wire the case selector (Case A / B / C — thesis back-pressure conditions).
  document.querySelectorAll("[data-thermal-case]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.body.dataset.thermalCase = btn.dataset.thermalCase;
      document.querySelectorAll("[data-thermal-case]").forEach((b) => {
        const active = b.dataset.thermalCase === btn.dataset.thermalCase;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", active ? "true" : "false");
      });
      updateThermalMetrics();
    });
  });
  // Wire the inlet T₀ slider.
  document.querySelectorAll("[data-thermal-input='T0']").forEach((input) => {
    input.addEventListener("input", () => {
      document.body.dataset.thermalT0 = input.value;
      const out = document.querySelector("[data-thermal-output='T0']");
      if (out) out.textContent = `${input.value} K`;
      updateThermalMetrics();
    });
  });

  function updateEnergyMetrics(now) {
    const t = energyTelemetry(now);
    const text = {
      hour: t.hour,
      demand: t.demand,
      marginal: t.marginal,
      tes: `TES ${t.tes}`,
      // Extended readouts:
      marginalPrice: t.marginalPrice,
      tesEnergy: t.tesEnergy,
      dailyTotal: t.dailyTotal,
      peak: t.peak,
      priceDeviation: t.priceDeviation,
      roundTrip: t.roundTrip,
      marginalCO2: t.marginalCO2,
    };
    Object.entries(text).forEach(([key, value]) => {
      const node = document.querySelector(`[data-energy-metric="${key}"]`);
      if (node) node.textContent = value;
    });
  }

  function updateIndustrialMetrics() {
    const metrics = industrialModel(industrialControls);
    // Format scope split (gCO₂ → kgCO₂)
    const s1 = (metrics.scopes.scope1 / 1000).toFixed(0);
    const s2 = (metrics.scopes.scope2 / 1000).toFixed(0);
    // Format dispatch split (MW_th)
    const hp = metrics.dispatch.heatPumpHeat.toFixed(2);
    const eb = metrics.dispatch.electricBoilerHeat.toFixed(2);
    const gas = metrics.dispatch.gasBoilerHeat.toFixed(2);
    // MAC may be NaN (no abatement) → show "—"
    const macStr = Number.isFinite(metrics.mac)
      ? `${metrics.mac.toFixed(0)} SEK/tCO₂`
      : "— (no abatement)";
    const text = {
      heat: `${metrics.heatDemand.toFixed(2)} MW`,
      recovered: `${metrics.recovered.toFixed(2)} MW`,
      enpi: `${metrics.enpi.toFixed(3)} MWh/u`,
      emissions: `${metrics.emissions.toFixed(1)} g/u`,
      baselineEnpi: `${metrics.baselineEnpi.toFixed(3)} MWh/u`,
      emissionsReduction: `-${metrics.emissionsReduction.toFixed(1)} g/u`,
      // Extended readouts:
      copHP: `${metrics.copHP.toFixed(2)}`,
      dispatchSplit: `HP ${hp} / EB ${eb} / G ${gas} MW`,
      mac: macStr,
      sec: `${metrics.sec.toFixed(3)} MWh/u`,
      scopes: `S1 ${s1} / S2 ${s2} kgCO₂/h`,
      primary: `${metrics.primaryEnergyMW.toFixed(2)} MW (PEF 1.9)`,
      etaHR: `${(metrics.eta_hr * 100).toFixed(1)} %`,
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
        if (key === "load") output.textContent = `${industrialControls[key]}%`;
        else if (key === "processT") output.textContent = `${industrialControls[key]} °C`;
        else output.textContent = `${industrialControls[key]} kg CO2e/MWh`;
      }
      updateIndustrialMetrics();
    });
  });
  // Seed processT default in industrialControls if missing
  if (industrialControls.processT === undefined) industrialControls.processT = 80;
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
    // Force the render loop to tick at least once after the mode swap.
    // Without this, if the previous frame's rAF was suppressed (document.hidden
    // or scroll-pause), the loop never wakes back up after switching tracks.
    if (ctx.reducedMotion) {
      step();
    } else {
      requestAnimationFrame(scheduleStep);
    }
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
