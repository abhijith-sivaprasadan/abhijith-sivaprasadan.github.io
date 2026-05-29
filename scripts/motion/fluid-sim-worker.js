/**
 * Worker-side model engine for the hero's Research scene.
 *
 * Research paints an equation-informed de Laval nozzle / regenerative-cooling
 * thermal field. v4-lensphys1: the Research scene now imports the shared
 * physics layer (chamber thermochemistry, full Bartz, Arrhenius coke) so
 * the live readouts are defensible from real engine equations rather than
 * representative constants.
 *
 * State arrays:
 *   u, v       — velocity components (Stable-Fluids fallback path only)
 *   solid      — obstacle mask (1 = solid cell, 0 = fluid)
 *   d, d0      — density (dye) for visualization (fallback only)
 *
 * Each frame the main thread sends:
 *   { type: "step", dt, viscosity, diffusion }
 *   { type: "controls", controls: {...} }  ← new: methalox engine parameters
 * The worker responds with a thermal scalar + zone + metrics for Research,
 * or a lightweight animation tick for evidence/data scenes.
 *
 * Imports the audited physics layer (loaded as ES module).
 */
import {
  methaloxChamberState, chokedMassFlow, vacuumSpecificImpulse,
} from "../physics/combustion.js";
import { bartzFullCoefficient } from "../physics/gas-dynamics.js";
import {
  cokeDepositionRate, copperConductivityAtT,
} from "../physics/heat-transfer.js";
import {
  ambientPressure, expansionState, atmosphereLayer,
  thrust as thrustEq, specificImpulse,
} from "../physics/atmosphere.js";

let N_X = 96;
let N_Y = 56;
let SIZE = (N_X + 2) * (N_Y + 2);

let u = new Float32Array(SIZE);
let v = new Float32Array(SIZE);
let u0 = new Float32Array(SIZE);
let v0 = new Float32Array(SIZE);
let d = new Float32Array(SIZE);
let d0 = new Float32Array(SIZE);
let solid = new Uint8Array(SIZE);
let lastMode = "thermal";
let frameCount = 0;
let sceneControls = {
  field: "temperature",
  // Methalox engine controls (v4-lensphys1 — user-driven from the lens UI)
  chamberPressureMPa: 10,           // P_c
  mixtureRatio: 3.6,                // O/F
  throatDiameter_mm: 100,           // D_t
  coolantInletK: 130,               // T_coolant_in (liquid CH4)
  areaRatioExit: 60,                // ε for Isp_vac
  pressureRatio: 58,                // exit p_e / p_amb (used for plume look)
  altitudeKm: 0,                    // flight altitude → ambient pressure
};

// Persistent coke-deposit state, integrated by Arrhenius across frames.
// Reset when the user toggles a control (so they can A/B different inputs).
let cokeThicknessMicrons = 0;
let prevControlsKey = "";

const idx = (i, j) => i + (N_X + 2) * j;

// ── Boundary conditions ───────────────────────────────────────────────────
function setBnd(b, x) {
  // No-slip walls + obstacles
  for (let i = 1; i <= N_X; i++) {
    x[idx(i, 0)] = b === 2 ? -x[idx(i, 1)] : x[idx(i, 1)];
    x[idx(i, N_Y + 1)] = b === 2 ? -x[idx(i, N_Y)] : x[idx(i, N_Y)];
  }
  for (let j = 1; j <= N_Y; j++) {
    // Inlet on the left (j = 0), outlet on the right
    if (b === 1) {
      x[idx(0, j)] = solid[idx(1, j)] ? 0 : 1.6;        // inflow
      x[idx(N_X + 1, j)] = x[idx(N_X, j)];                 // outflow
    } else if (b === 2) {
      x[idx(0, j)] = 0;
      x[idx(N_X + 1, j)] = x[idx(N_X, j)];
    } else {
      x[idx(0, j)] = x[idx(1, j)];
      x[idx(N_X + 1, j)] = x[idx(N_X, j)];
    }
  }
  // Obstacles: zero out velocity inside solid cells
  if (b === 1 || b === 2) {
    for (let i = 1; i <= N_X; i++) {
      for (let j = 1; j <= N_Y; j++) {
        if (solid[idx(i, j)]) x[idx(i, j)] = 0;
      }
    }
  }
}

function addSource(x, s, dt) {
  for (let k = 0; k < SIZE; k++) x[k] += dt * s[k];
}

function linSolve(b, x, x0, a, c) {
  const cRecip = 1 / c;
  for (let k = 0; k < 12; k++) {
    for (let i = 1; i <= N_X; i++) {
      for (let j = 1; j <= N_Y; j++) {
        if (solid[idx(i, j)]) continue;
        x[idx(i, j)] = (x0[idx(i, j)] + a * (
          x[idx(i - 1, j)] + x[idx(i + 1, j)] +
          x[idx(i, j - 1)] + x[idx(i, j + 1)]
        )) * cRecip;
      }
    }
    setBnd(b, x);
  }
}

function diffuse(b, x, x0, diff, dt) {
  const a = dt * diff * N_X * N_Y;
  linSolve(b, x, x0, a, 1 + 4 * a);
}

function advect(b, dArr, d0Arr, uArr, vArr, dt) {
  const dt0x = dt * N_X;
  const dt0y = dt * N_Y;
  for (let i = 1; i <= N_X; i++) {
    for (let j = 1; j <= N_Y; j++) {
      if (solid[idx(i, j)]) { dArr[idx(i, j)] = 0; continue; }
      let x = i - dt0x * uArr[idx(i, j)];
      let y = j - dt0y * vArr[idx(i, j)];
      if (x < 0.5) x = 0.5; if (x > N_X + 0.5) x = N_X + 0.5;
      if (y < 0.5) y = 0.5; if (y > N_Y + 0.5) y = N_Y + 0.5;
      const i0 = Math.floor(x), i1 = i0 + 1;
      const j0 = Math.floor(y), j1 = j0 + 1;
      const s1 = x - i0, s0 = 1 - s1;
      const t1 = y - j0, t0 = 1 - t1;
      dArr[idx(i, j)] =
        s0 * (t0 * d0Arr[idx(i0, j0)] + t1 * d0Arr[idx(i0, j1)]) +
        s1 * (t0 * d0Arr[idx(i1, j0)] + t1 * d0Arr[idx(i1, j1)]);
    }
  }
  setBnd(b, dArr);
}

function project(uArr, vArr, p, div) {
  const hx = 1 / N_X, hy = 1 / N_Y;
  for (let i = 1; i <= N_X; i++) {
    for (let j = 1; j <= N_Y; j++) {
      if (solid[idx(i, j)]) { div[idx(i, j)] = 0; p[idx(i, j)] = 0; continue; }
      div[idx(i, j)] = -0.5 * (
        hx * (uArr[idx(i + 1, j)] - uArr[idx(i - 1, j)]) +
        hy * (vArr[idx(i, j + 1)] - vArr[idx(i, j - 1)])
      );
      p[idx(i, j)] = 0;
    }
  }
  setBnd(0, div); setBnd(0, p);
  linSolve(0, p, div, 1, 4);
  for (let i = 1; i <= N_X; i++) {
    for (let j = 1; j <= N_Y; j++) {
      if (solid[idx(i, j)]) continue;
      uArr[idx(i, j)] -= 0.5 * (p[idx(i + 1, j)] - p[idx(i - 1, j)]) / hx;
      vArr[idx(i, j)] -= 0.5 * (p[idx(i, j + 1)] - p[idx(i, j - 1)]) / hy;
    }
  }
  setBnd(1, uArr); setBnd(2, vArr);
}

function velStep(viscosity, dt) {
  addSource(u, u0, dt); addSource(v, v0, dt);
  // Swap and diffuse
  let tmp = u; u = u0; u0 = tmp;
  diffuse(1, u, u0, viscosity, dt);
  tmp = v; v = v0; v0 = tmp;
  diffuse(2, v, v0, viscosity, dt);
  project(u, v, u0, v0);
  tmp = u; u = u0; u0 = tmp;
  tmp = v; v = v0; v0 = tmp;
  advect(1, u, u0, u0, v0, dt);
  advect(2, v, v0, u0, v0, dt);
  project(u, v, u0, v0);
  u0.fill(0); v0.fill(0);
}

function densStep(diffusion, dt) {
  addSource(d, d0, dt);
  let tmp = d; d = d0; d0 = tmp;
  diffuse(0, d, d0, diffusion, dt);
  tmp = d; d = d0; d0 = tmp;
  advect(0, d, d0, u, v, dt);
  d0.fill(0);
}

function resetFields() {
  u.fill(0);
  v.fill(0);
  u0.fill(0);
  v0.fill(0);
  d.fill(0);
  d0.fill(0);
  frameCount = 0;
}

function quintic(value) {
  const t = Math.max(0, Math.min(1, value));
  return 6 * t ** 5 - 15 * t ** 4 + 10 * t ** 3;
}

// Representative methane/oxygen combustion-product assumptions for the
// research-direction hero visual. This is not thesis result data.
const NOZZLE = {
  gamma: 1.22,
  gasConstant: 355,
  stagnationTemperature: 3500,
  throatX: 0.23,
  exitX: 0.47,
  inletRadius: 0.29,
  throatRadius: 0.065,
  exitRadius: 0.14,
  prandtl: 0.70,
};

function nozzleRadius(xn) {
  if (xn <= NOZZLE.throatX) {
    const t = quintic((xn - 0.025) / (NOZZLE.throatX - 0.025));
    return NOZZLE.inletRadius + (NOZZLE.throatRadius - NOZZLE.inletRadius) * t;
  }
  const t = quintic((xn - NOZZLE.throatX) / (NOZZLE.exitX - NOZZLE.throatX));
  return NOZZLE.throatRadius + (NOZZLE.exitRadius - NOZZLE.throatRadius) * t;
}

function areaMach(mach) {
  const gamma = NOZZLE.gamma;
  const term = (2 / (gamma + 1)) * (1 + ((gamma - 1) / 2) * mach * mach);
  return (1 / mach) * term ** ((gamma + 1) / (2 * (gamma - 1)));
}

function solveMach(areaRatio, supersonic) {
  if (areaRatio <= 1.00001) return 1;
  let low = supersonic ? 1.0001 : 0.005;
  let high = supersonic ? 8 : 0.9999;
  for (let iteration = 0; iteration < 42; iteration++) {
    const mid = (low + high) / 2;
    const current = areaMach(mid);
    if (supersonic) {
      if (current < areaRatio) low = mid;
      else high = mid;
    } else if (current > areaRatio) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return (low + high) / 2;
}

function reducerRadius(xn) {
  const contraction = quintic((xn - 0.27) / 0.45);
  return 0.40 - (0.40 - 0.10) * contraction;
}

function buildNozzleThermalFrame() {
  const scalar = new Float32Array(SIZE);
  const zones = new Uint8Array(SIZE);

  // ── Read controls, reset coke state if inputs changed ─────────────────
  const ctlKey = [
    sceneControls.chamberPressureMPa,
    sceneControls.mixtureRatio,
    sceneControls.throatDiameter_mm,
    sceneControls.coolantInletK,
  ].join("|");
  if (ctlKey !== prevControlsKey) {
    cokeThicknessMicrons = 0;
    prevControlsKey = ctlKey;
  }

  // ── Compute chamber state from methalox thermochemistry ───────────────
  const P_c = sceneControls.chamberPressureMPa * 1e6;
  const OF  = sceneControls.mixtureRatio;
  const D_t = sceneControls.throatDiameter_mm / 1000;
  const A_t = Math.PI * D_t * D_t / 4;
  const chamber = methaloxChamberState(P_c, OF);
  const mDotTotal = chokedMassFlow(chamber, A_t);
  const mDotCoolant = mDotTotal / (1 + OF);                   // CH4 fraction
  const Isp_vac = vacuumSpecificImpulse(chamber, sceneControls.areaRatioExit);
  const recovery = Math.pow(chamber.Pr, 1 / 3);               // turbulent recovery

  // ── Cooling-channel and wall geometry ────────────────────────────────
  const wallThickness_m = 0.0012;                             // 1.2 mm copper
  // Channel-side film coefficient for supercritical CH4 in high-aspect-ratio
  // ribbed regen channels — published values 100-200 kW/m²K (Pizzarelli et
  // al., Acta Astronautica 2010; SpaceX Raptor cooling commentary).
  const coolant_h = 150_000;                                  // W/m²K
  const cp_CH4 = 3500;                                        // J/kgK supercritical CH4 ~150K
  const coolantInletK = sceneControls.coolantInletK;
  // Film-cooling efficiency: a fuel-rich curtain reduces effective T_aw on
  // the wall. Methalox flight engines typically run 0.6-0.8 film efficiency
  // on the throat liner (NASA SP-8124, Sutton & Biblarz Ch.8). 0.75 baseline.
  const FILM_EFF = 0.75;

  // ── Sweep the nozzle axis, computing local h_g and T_w with the full
  //    Bartz σ correction (T_w-dependent → 3 Picard iterations per cell)
  let maxWallTemperature = coolantInletK;
  let exitMach = 1;
  let exitTemperature = chamber.T_c;
  let heatFluxPeak = 0;
  let h_throat_local = 0;
  let totalHeatLoad_W = 0;                                    // ∫ q · dA  for ΔT_coolant

  for (let i = 1; i <= N_X; i++) {
    const xn = i / N_X;
    if (xn > NOZZLE.exitX) continue;
    const radius_norm = nozzleRadius(xn);                     // normalised
    const areaRatio = (radius_norm / NOZZLE.throatRadius) ** 2;
    const mach = solveMach(areaRatio, xn >= NOZZLE.throatX);
    const thermalRatio = 1 + ((chamber.gamma - 1) / 2) * mach * mach;
    const staticTemperature = chamber.T_c / thermalRatio;
    const adiabaticWallTemperature = staticTemperature *
      (1 + recovery * ((chamber.gamma - 1) / 2) * mach * mach);
    if (xn >= NOZZLE.exitX - 1 / N_X) {
      exitMach = mach;
      exitTemperature = staticTemperature;
    }
    // Picard iteration: T_w depends on h_g (via Bartz σ), h_g depends on T_w.
    let T_w = coolantInletK + 600;                            // initial guess
    let h_g = 0, heatFlux = 0, k_Cu = 360;
    for (let it = 0; it < 4; it += 1) {
      const bz = bartzFullCoefficient({
        chamber, D_throat_m: D_t, r_curv_m: D_t,
        M_local: mach, T_wall: T_w, areaRatio,
      });
      h_g = bz.h_local;
      k_Cu = copperConductivityAtT(T_w);
      const R_gas    = 1 / h_g;
      const R_wall   = wallThickness_m / k_Cu;
      const R_coke   = (cokeThicknessMicrons * 1e-6) / 1.15;  // k_coke ≈ 1.15 W/mK
      const R_cool   = 1 / coolant_h;
      const R_total  = R_gas + R_wall + R_coke + R_cool;
      // Film-cooled effective T_aw — fuel curtain reduces wall-side gas T.
      const T_aw_eff = coolantInletK + FILM_EFF * (adiabaticWallTemperature - coolantInletK);
      heatFlux = (T_aw_eff - coolantInletK) / R_total;
      T_w = coolantInletK + heatFlux * (R_wall + R_coke + R_cool);
    }
    heatFluxPeak = Math.max(heatFluxPeak, heatFlux);
    maxWallTemperature = Math.max(maxWallTemperature, T_w);
    if (xn >= NOZZLE.throatX - 0.01 && xn <= NOZZLE.throatX + 0.01) {
      h_throat_local = h_g;
    }
    // Accumulate heat load on cooling channel (annulus area dA ≈ 2π·r·dx_actual).
    // Approximate dx_actual = scale·dx_norm where scale ≈ 4·D_t (typical L_nozzle).
    const dA = 2 * Math.PI * (radius_norm * 4 * D_t) * (4 * D_t / N_X);
    totalHeatLoad_W += heatFlux * dA;

    // Traveling expansion wave in the diverging section (visualisation only —
    // illustrates that the supersonic half has continuous fluid motion).
    const inDivergent = xn > NOZZLE.throatX && xn <= NOZZLE.exitX;
    const wavePhase = inDivergent
      ? ((xn - NOZZLE.throatX) / (NOZZLE.exitX - NOZZLE.throatX)) * Math.PI * 6 - frameCount * 0.22
      : 0;
    const travelingWave = inDivergent ? 0.18 * Math.sin(wavePhase) : 0;

    // Visualisation: scalar field for the colour map + zone classification.
    // wallThickness_vis / channelThickness_vis are normalised display widths
    // (NOT the physical 1.2 mm — that would be invisible at this scale).
    const wallThickness_vis = 0.020;
    const channelThickness_vis = 0.040;
    // Coke deposit thickness (µm) → normalised visual band.
    const cokeNorm = cokeThicknessMicrons * 1e-4;       // 100 µm → 0.01 norm
    for (let j = 1; j <= N_Y; j++) {
      const yn = Math.abs((j / N_Y - 0.5) * 2);
      const k = idx(i, j);
      if (yn > radius_norm && yn < radius_norm + wallThickness_vis) zones[k] = 1;
      if (yn >= radius_norm + wallThickness_vis && yn < radius_norm + wallThickness_vis + channelThickness_vis) zones[k] = 2;
      const depositVisualThickness = cokeNorm > 0
        ? Math.max(0.003, cokeNorm * 0.6)
        : 0;
      if (depositVisualThickness && yn >= radius_norm - depositVisualThickness && yn <= radius_norm) zones[k] = 3;
      if (yn > radius_norm) continue;
      const eta = Math.min(1, yn / radius_norm);
      const wallBlend = eta < 0.72 ? 0 : quintic((eta - 0.72) / 0.28);
      const localTemperature = staticTemperature + (adiabaticWallTemperature - staticTemperature) * wallBlend;
      const localPressure = thermalRatio ** (-chamber.gamma / (chamber.gamma - 1));
      const centreWeight = 1 - eta * eta;
      const waveContribution = travelingWave * centreWeight;
      if (sceneControls.field === "mach") scalar[k] = Math.min(1, mach / 3.5 + waveContribution);
      else if (sceneControls.field === "pressure") scalar[k] = Math.min(1, localPressure + waveContribution * 0.4);
      else if (sceneControls.field === "wall") scalar[k] = wallBlend ? Math.min(1, T_w / 1600) : Math.min(0.20, localTemperature / chamber.T_c);
      else scalar[k] = Math.max(0.03, Math.min(1, localTemperature / chamber.T_c + waveContribution));
    }
  }

  // ── Coke growth: integrate Arrhenius rate at the hottest wall T ────────
  // dt_sim is the per-frame wall-clock; we scale ×10 so failure-mode runs
  // are observable in the ~30 s lens-watch window without being instant.
  // The Arrhenius *temperature-sensitivity* is the physically meaningful
  // part (Hayhurst & Lawrence 1992, Eₐ = 245 kJ/mol).
  const dt_sim = 0.033;
  cokeThicknessMicrons += cokeDepositionRate(maxWallTemperature) * 1e6 * dt_sim * 10;
  cokeThicknessMicrons = Math.min(120, cokeThicknessMicrons);

  // ── Coolant ΔT closure (real signal in a regen-cooled engine) ─────────
  const dT_coolant_K = (mDotCoolant > 0)
    ? totalHeatLoad_W / (mDotCoolant * cp_CH4) : 0;
  const T_coolant_out = coolantInletK + dT_coolant_K;

  // ── Health / failure-mode indicators ──────────────────────────────────
  const R_dep = (cokeThicknessMicrons * 1e-6) / 1.15;
  const R_clean_throat = (1 / Math.max(h_throat_local, 100))
                       + (wallThickness_m / copperConductivityAtT(maxWallTemperature))
                       + (1 / coolant_h);
  const R_total_throat = R_clean_throat + R_dep;
  const resistanceIncrease = ((R_total_throat / R_clean_throat) - 1) * 100;
  const healthIndex = Math.max(0, Math.min(100, (R_clean_throat / R_total_throat) * 100));

  const exitPressureRatio = (1 + ((chamber.gamma - 1) / 2) * exitMach * exitMach) ** (-chamber.gamma / (chamber.gamma - 1));
  const pressureMismatch = exitPressureRatio * sceneControls.pressureRatio - 1;
  // Plume animation amplitudes boosted in v4-w16c so shock cells + roll-up
  // are clearly readable; previous values were physically right but visually
  // imperceptible against the chamber-temperature backdrop.
  for (let i = 1; i <= N_X; i++) {
    const xn = i / N_X;
    if (xn <= NOZZLE.exitX) continue;
    const streamwise = (xn - NOZZLE.exitX) / (1 - NOZZLE.exitX);
    const cellLength = 0.12 + 0.08 * Math.min(1.5, Math.abs(pressureMismatch));
    // 2× faster shock-cell phase advance → cells visibly translate downstream
    const shockCell = Math.cos((streamwise / cellLength) * Math.PI * 2 - frameCount * 0.09);
    // 2× larger centreline roll-up amplitude
    const rollUp = Math.sin(streamwise * 20 - frameCount * 0.18) * (0.032 + 0.060 * streamwise);
    const pairedCurl = Math.sin(streamwise * 12 + frameCount * 0.12) * (0.014 + 0.026 * streamwise);
    const centreOffset = rollUp + pairedCurl;
    const spread = NOZZLE.exitRadius + streamwise * (0.16 + 0.018 * Math.abs(pressureMismatch));
    for (let j = 1; j <= N_Y; j++) {
      const yn = (j / N_Y - 0.5) * 2;
      const k = idx(i, j);
      const radial = Math.abs(yn - centreOffset);
      const core = Math.exp(-Math.pow(radial / Math.max(0.018, spread * 0.75), 2));
      const shearTop = Math.exp(-Math.pow((yn - centreOffset - spread) / 0.045, 2));
      const shearBottom = Math.exp(-Math.pow((yn - centreOffset + spread) / 0.045, 2));
      // Curl intensity ×1.5 so the shear filaments read as moving streaks
      const curlIntensity = (shearTop + shearBottom) * (0.51 + 0.42 * Math.abs(shockCell));
      const plumeTemperature = exitTemperature * (0.44 + 0.56 * core) * (1 + 0.14 * shockCell * core);
      const plumeMach = Math.max(0, exitMach + 0.28 * shockCell * core - 0.34 * streamwise);
      if (sceneControls.field === "mach") scalar[k] = Math.min(1, (plumeMach * core + curlIntensity) / 3.5);
      else if (sceneControls.field === "pressure") scalar[k] = Math.min(1, Math.abs(pressureMismatch) * core * (0.18 + 0.16 * Math.abs(shockCell)) + curlIntensity * 0.2);
      else if (sceneControls.field === "wall") scalar[k] = curlIntensity * 0.25;
      // Default field: 1.4× plume brightness so it doesn't fade against dark bg
      else scalar[k] = Math.min(1, (plumeTemperature / chamber.T_c) * core * 1.4 + curlIntensity * 1.2);
    }
  }
  return {
    scalar,
    zones,
    metrics: {
      // Existing fields (kept for back-compat with the main-thread renderer):
      exitMach,
      exitTemperature,
      heatFluxPeak,
      maxWallTemperature,
      resistanceIncrease,
      healthIndex,
      stagnationTemperature: chamber.T_c,
      cokeThicknessMicrons,
      simulatedTime: (frameCount % 1080) / 1080 * 180,
      // New methalox-physics readouts (drive the realistic Research telemetry):
      T_c:           chamber.T_c,
      gamma:         chamber.gamma,
      cStar:         chamber.c_star,
      Isp_vac,
      mDotTotal,
      mDotCoolant,
      coolantOutletK: T_coolant_out,
      coolantDeltaTK: dT_coolant_K,
      h_throat:      h_throat_local,
      P_c_MPa:       sceneControls.chamberPressureMPa,
      OF:            sceneControls.mixtureRatio,
      D_throat_mm:   sceneControls.throatDiameter_mm,
      // Combustion efficiency: typical methalox engines achieve 95-98 %
      // of theoretical c*. We expose 0.97 (Sutton & Biblarz Ch.5).
      etaCstar: 0.97,
      // Characteristic length L* = V_chamber / A_t (typical methalox 1.0-1.3 m)
      Lstar: 1.10,
      // ── Flight / altitude-adaptation physics (the showpiece) ─────────
      //   F = ṁ·V_e + (p_e − p_amb)·A_e   (Sutton & Biblarz Eq. 3-29)
      //   regime + plume morph from p_e/p_amb (Summerfield separation).
      ...(() => {
        // Self-consistent at the nozzle expansion ratio ε: solve the exit
        // Mach for ε, then derive V_e, p_e and A_e from the SAME ε. (The
        // geometry-derived `exitMach` drives the visual plume; the thrust
        // physics uses the ε-consistent value so F, p_e and Isp agree.)
        const eps = sceneControls.areaRatioExit;
        const Me = solveMach(eps, true);
        const T_e = chamber.T_c / (1 + ((chamber.gamma - 1) / 2) * Me * Me);
        const V_e = Me * Math.sqrt(chamber.gamma * chamber.R_s * T_e);
        const p_e = chamber.P_c *
          Math.pow(1 + ((chamber.gamma - 1) / 2) * Me * Me,
                   -chamber.gamma / (chamber.gamma - 1));
        const A_e = eps * A_t;
        const altKm = sceneControls.altitudeKm || 0;
        const p_amb = ambientPressure(altKm * 1000);
        const exp = expansionState(p_e, p_amb);
        const F_alt = thrustEq(mDotTotal, V_e, p_e, p_amb, A_e);
        const F_SL  = thrustEq(mDotTotal, V_e, p_e, 101325, A_e);
        const F_vac = thrustEq(mDotTotal, V_e, p_e, 0, A_e);
        return {
          thrust_kN:    F_alt / 1000,
          thrustSL_kN:  F_SL / 1000,
          thrustVac_kN: F_vac / 1000,
          Isp_alt:      specificImpulse(F_alt, mDotTotal),
          exitVelocity: V_e,
          altitudeKm:   altKm,
          ambientPa:    p_amb,
          exitPa:       p_e,
          expansionRatio: exp.ratio,
          expansionLabel: exp.label,
          expansionRegime: exp.regime,
          separated:    exp.separated,
          flareFactor:  exp.flare,
          machDiskStrength: exp.machDisk,
          atmLayer:     atmosphereLayer(altKm),
        };
      })(),
    },
  };
}

// ── Obstacles per track ────────────────────────────────────────────────────
function buildObstacle(mode) {
  solid.fill(0);
  if (mode === "thermal") {
    // Siemens-inspired smooth C2 reducer cross-section.
    for (let i = 1; i <= N_X; i++) {
      const xn = i / N_X;
      const wallY = reducerRadius(xn);
      for (let j = 1; j <= N_Y; j++) {
        const yn = (j / N_Y - 0.5) * 2;
        if (Math.abs(yn) > wallY) solid[idx(i, j)] = 1;
      }
    }
  } else if (mode === "research") {
    for (let i = 1; i <= N_X; i++) {
      const xn = i / N_X;
      if (xn > NOZZLE.exitX) continue;
      const wallY = nozzleRadius(xn);
      for (let j = 1; j <= N_Y; j++) {
        const yn = Math.abs((j / N_Y - 0.5) * 2);
        if (yn > wallY + 0.060) solid[idx(i, j)] = 1;
      }
    }
  } else if (mode === "energy") {
    const nodes = [
      [0.20, 0.30, 0.04], [0.20, 0.70, 0.04],
      [0.45, 0.20, 0.05], [0.45, 0.50, 0.05], [0.45, 0.80, 0.05],
      [0.70, 0.35, 0.04], [0.70, 0.65, 0.04],
    ];
    for (let i = 1; i <= N_X; i++) {
      for (let j = 1; j <= N_Y; j++) {
        const xn = i / N_X, yn = j / N_Y;
        for (const [nx, ny, r] of nodes) {
          const dx = xn - nx, dy = yn - ny;
          if (dx * dx + dy * dy < r * r) { solid[idx(i, j)] = 1; break; }
        }
      }
    }
  } else if (mode === "decarbonisation") {
    const blocks = [
      [0.18, 0.55, 0.10, 0.20],
      [0.40, 0.30, 0.12, 0.18],
      [0.62, 0.55, 0.10, 0.22],
    ];
    for (let i = 1; i <= N_X; i++) {
      for (let j = 1; j <= N_Y; j++) {
        const xn = i / N_X, yn = j / N_Y;
        for (const [bx, by, bw, bh] of blocks) {
          if (xn > bx && xn < bx + bw && yn > by && yn < by + bh) { solid[idx(i, j)] = 1; break; }
        }
      }
    }
  }
}

function injectForce(mouseX, mouseY, dx, dy) {
  if (lastMode === "research") return;
  const ci = Math.max(1, Math.min(N_X, Math.round(mouseX * N_X)));
  const cj = Math.max(1, Math.min(N_Y, Math.round(mouseY * N_Y)));
  for (let i = ci - 2; i <= ci + 2; i++) {
    for (let j = cj - 2; j <= cj + 2; j++) {
      if (i < 1 || j < 1 || i > N_X || j > N_Y) continue;
      if (solid[idx(i, j)]) continue;
      u0[idx(i, j)] += dx * 12;
      v0[idx(i, j)] += dy * 12;
      d0[idx(i, j)] += 6;
    }
  }
}

function continuousInflow(strength) {
  if (lastMode === "thermal") {
    for (let j = 2; j <= N_Y - 1; j++) {
      if (solid[idx(1, j)]) continue;
      d0[idx(1, j)] += strength;
      u0[idx(1, j)] += strength * 0.8;
    }
    return;
  }

  if (lastMode === "energy") {
    const sources = [[2, N_Y * 0.30], [2, N_Y * 0.70], [N_X * 0.44, N_Y * 0.50]];
    for (const [x, y] of sources) {
      const i = Math.max(1, Math.round(x));
      const j = Math.max(2, Math.min(N_Y - 1, Math.round(y)));
      d0[idx(i, j)] += strength * 3.2;
      u0[idx(i, j)] += strength * 1.4;
    }
    return;
  }

  if (lastMode === "decarbonisation") {
    const processPath = [[2, N_Y * 0.44], [N_X * 0.31, N_Y * 0.44], [N_X * 0.55, N_Y * 0.56]];
    for (const [x, y] of processPath) {
      const i = Math.max(1, Math.round(x));
      const j = Math.max(2, Math.min(N_Y - 1, Math.round(y)));
      if (solid[idx(i, j)]) continue;
      d0[idx(i, j)] += strength * 2.2;
      u0[idx(i, j)] += strength;
    }
    return;
  }

  // Research plume is calculated directly from nozzle/plume relations below.
  if (lastMode === "research") return;
  // Fallback signal lens: periodic narrow measurement pulses.
  const pulse = 0.35 + 0.65 * Math.abs(Math.sin(frameCount * 0.075));
  for (let j = 2; j <= N_Y - 1; j += 8) {
    d0[idx(1, j)] += strength * pulse;
    u0[idx(1, j)] += strength * 0.6;
  }
}

self.onmessage = (e) => {
  const msg = e.data;
  if (msg.type === "init") {
    N_X = msg.nx || 96;
    N_Y = msg.ny || 56;
    SIZE = (N_X + 2) * (N_Y + 2);
    u = new Float32Array(SIZE);
    v = new Float32Array(SIZE);
    u0 = new Float32Array(SIZE);
    v0 = new Float32Array(SIZE);
    d = new Float32Array(SIZE);
    d0 = new Float32Array(SIZE);
    solid = new Uint8Array(SIZE);
    lastMode = msg.mode || "thermal";
    buildObstacle(lastMode);
    resetFields();
    if (lastMode === "research") frameCount = msg.reducedMotion ? 540 : 120;
    self.postMessage({ type: "ready", nx: N_X, ny: N_Y });
  } else if (msg.type === "mode") {
    lastMode = msg.mode;
    buildObstacle(lastMode);
    resetFields();
    if (lastMode === "research") frameCount = msg.reducedMotion ? 540 : 120;
  } else if (msg.type === "controls") {
    sceneControls = { ...sceneControls, ...msg.controls };
  } else if (msg.type === "force") {
    injectForce(msg.x, msg.y, msg.dx, msg.dy);
  } else if (msg.type === "step") {
    if (lastMode === "research") {
      frameCount += 1;
      const thermalFrame = buildNozzleThermalFrame();
      self.postMessage({
        type: "frame",
        fieldKind: "temperature",
        density: thermalFrame.scalar,
        solid: new Uint8Array(solid),
        zones: thermalFrame.zones,
        metrics: thermalFrame.metrics,
        nx: N_X,
        ny: N_Y,
      }, [thermalFrame.scalar.buffer]);
      return;
    }
    if (lastMode === "thermal" || lastMode === "energy" || lastMode === "decarbonisation") {
      frameCount += 1;
      self.postMessage({ type: "frame", nx: N_X, ny: N_Y });
      return;
    }
    frameCount += 1;
    continuousInflow(0.4);
    velStep(msg.viscosity ?? 1e-6, msg.dt ?? 0.08);
    densStep(msg.diffusion ?? 5e-5, msg.dt ?? 0.08);
    // Velocity magnitude is exposed to the renderer so the visible contour is
    // generated from the solved Eulerian field, rather than decorative paths.
    // Stable Fluids is an incompressible transport visualisation; compressible
    // reducer/nozzle values shown in telemetry use the separate equations noted
    // in the renderer and must not be read as this grid's numerical CFD output.
    const out = new Float32Array(d);
    const magnitude = new Float32Array(SIZE);
    let peakMagnitude = 1e-8;
    for (let i = 1; i <= N_X; i++) {
      for (let j = 1; j <= N_Y; j++) {
        if (solid[idx(i, j)]) continue;
        const speed = Math.hypot(u[idx(i, j)], v[idx(i, j)]);
        magnitude[idx(i, j)] = speed;
        peakMagnitude = Math.max(peakMagnitude, speed);
      }
    }
    for (let k = 0; k < SIZE; k++) magnitude[k] /= peakMagnitude;
    self.postMessage({
      type: "frame",
      density: out,
      magnitude,
      solid: new Uint8Array(solid),
      nx: N_X, ny: N_Y,
    }, [out.buffer, magnitude.buffer]);
  }
};
