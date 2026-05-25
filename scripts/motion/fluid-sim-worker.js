/**
 * Stable Fluids (Jos Stam, 1999) Eulerian solver — runs in a Web Worker so
 * it never blocks the main thread.
 *
 * Grid: configurable (default 96 × 56), wrap-free, no-slip walls.
 * State arrays:
 *   u, v       — velocity components
 *   u0, v0     — previous step velocity
 *   d, d0      — density (dye) for visualization
 *   solid      — obstacle mask (1 = solid cell, 0 = fluid)
 *
 * Each frame the main thread sends:
 *   { type: "step", dt, viscosity, diffusion, force, dyeSource, mode }
 * The worker responds with:
 *   { type: "frame", density: Float32Array, magnitude: Float32Array, nx, ny }
 *
 * No external dependencies; pure ES module worker.
 */

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
  chamberTemperature: 3500,
  pressureRatio: 58,
  cokeThickness: 0.02,
};

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
  const cycleFrames = 1080;
  const runProgress = (frameCount % cycleFrames) / cycleFrames;
  const ignition = quintic(Math.min(1, runProgress / 0.08));
  const depositionProgress = quintic(Math.max(0, Math.min(1, (runProgress - 0.12) / 0.78)));
  const recovery = Math.sqrt(NOZZLE.prandtl);
  const chamberTemperature = 112 + (NOZZLE.stagnationTemperature - 112) * ignition;
  const cokeThickness = 0.002 + 0.058 * depositionProgress;
  const cokeMeters = cokeThickness / 1000;
  const wallThickness = 0.020;
  const channelThickness = 0.040;
  const throatGasCoefficient = 12500;
  const throatGasResistance = 1 / throatGasCoefficient;
  const copperResistance = 0.0012 / 320;
  const coolantResistance = 1 / 26000;
  const cokeResistance = cokeMeters / 1.15;
  const throatTotalResistance = throatGasResistance + copperResistance + coolantResistance + cokeResistance;
  const cleanThroatResistance = throatGasResistance + copperResistance + coolantResistance;
  const coolantTemperature = 112;
  let maxWallTemperature = coolantTemperature;
  let exitMach = 1;
  let exitTemperature = chamberTemperature;
  let heatFluxPeak = 0;

  for (let i = 1; i <= N_X; i++) {
    const xn = i / N_X;
    if (xn > NOZZLE.exitX) continue;
    const radius = nozzleRadius(xn);
    const areaRatio = (radius / NOZZLE.throatRadius) ** 2;
    const mach = solveMach(areaRatio, xn >= NOZZLE.throatX);
    const thermalRatio = 1 + ((NOZZLE.gamma - 1) / 2) * mach * mach;
    const staticTemperature = chamberTemperature / thermalRatio;
    const adiabaticWallTemperature = staticTemperature * (1 + recovery * ((NOZZLE.gamma - 1) / 2) * mach * mach);
    if (xn >= NOZZLE.exitX - 1 / N_X) {
      exitMach = mach;
      exitTemperature = staticTemperature;
    }
    // Bartz-style local scaling: h_g / h_g* approximately follows
    // (A_t / A)^0.9. Absolute coefficient and cooling-side values are
    // representative inputs for this interactive research-direction model.
    const areaHeatTransferScale = Math.pow(NOZZLE.throatRadius / radius, 1.8);
    const gasCoefficient = throatGasCoefficient * areaHeatTransferScale;
    const localTotalResistance = 1 / gasCoefficient + copperResistance + coolantResistance + cokeResistance;
    const heatFlux = (adiabaticWallTemperature - coolantTemperature) / localTotalResistance;
    const hotWallTemperature = coolantTemperature + heatFlux * (coolantResistance + copperResistance + cokeResistance);
    heatFluxPeak = Math.max(heatFluxPeak, heatFlux);
    maxWallTemperature = Math.max(maxWallTemperature, hotWallTemperature);

    for (let j = 1; j <= N_Y; j++) {
      const yn = Math.abs((j / N_Y - 0.5) * 2);
      const k = idx(i, j);
      if (yn > radius && yn < radius + wallThickness) zones[k] = 1;
      if (yn >= radius + wallThickness && yn < radius + wallThickness + channelThickness) zones[k] = 2;
      const depositVisualThickness = cokeThickness > 0
        ? Math.max(0.003, cokeThickness * 0.18)
        : 0;
      if (depositVisualThickness && yn >= radius - depositVisualThickness && yn <= radius) zones[k] = 3;
      if (yn > radius) continue;
      const eta = Math.min(1, yn / radius);
      const wallBlend = eta < 0.72 ? 0 : quintic((eta - 0.72) / 0.28);
      const localTemperature = staticTemperature + (adiabaticWallTemperature - staticTemperature) * wallBlend;
      const localPressure = thermalRatio ** (-NOZZLE.gamma / (NOZZLE.gamma - 1));
      if (sceneControls.field === "mach") scalar[k] = Math.min(1, mach / 3.5);
      else if (sceneControls.field === "pressure") scalar[k] = Math.min(1, localPressure);
      else if (sceneControls.field === "wall") scalar[k] = wallBlend ? Math.min(1, hotWallTemperature / 1600) : Math.min(0.20, localTemperature / chamberTemperature);
      else scalar[k] = Math.max(0.03, Math.min(1, localTemperature / chamberTemperature));
    }
  }

  const exitPressureRatio = (1 + ((NOZZLE.gamma - 1) / 2) * exitMach * exitMach) ** (-NOZZLE.gamma / (NOZZLE.gamma - 1));
  const pressureMismatch = exitPressureRatio * sceneControls.pressureRatio - 1;
  for (let i = 1; i <= N_X; i++) {
    const xn = i / N_X;
    if (xn <= NOZZLE.exitX) continue;
    const streamwise = (xn - NOZZLE.exitX) / (1 - NOZZLE.exitX);
    const cellLength = 0.12 + 0.08 * Math.min(1.5, Math.abs(pressureMismatch));
    const shockCell = Math.cos((streamwise / cellLength) * Math.PI * 2 - frameCount * 0.045);
    const rollUp = Math.sin(streamwise * 20 - frameCount * 0.10) * (0.016 + 0.030 * streamwise);
    const pairedCurl = Math.sin(streamwise * 12 + frameCount * 0.065) * (0.007 + 0.013 * streamwise);
    const centreOffset = rollUp + pairedCurl;
    const spread = NOZZLE.exitRadius + streamwise * (0.16 + 0.018 * Math.abs(pressureMismatch));
    for (let j = 1; j <= N_Y; j++) {
      const yn = (j / N_Y - 0.5) * 2;
      const k = idx(i, j);
      const radial = Math.abs(yn - centreOffset);
      const core = Math.exp(-Math.pow(radial / Math.max(0.018, spread * 0.75), 2));
      const shearTop = Math.exp(-Math.pow((yn - centreOffset - spread) / 0.045, 2));
      const shearBottom = Math.exp(-Math.pow((yn - centreOffset + spread) / 0.045, 2));
      const curlIntensity = (shearTop + shearBottom) * (0.34 + 0.28 * Math.abs(shockCell));
      const plumeTemperature = exitTemperature * (0.44 + 0.56 * core) * (1 + 0.09 * shockCell * core);
      const plumeMach = Math.max(0, exitMach + 0.28 * shockCell * core - 0.34 * streamwise);
      if (sceneControls.field === "mach") scalar[k] = Math.min(1, (plumeMach * core + curlIntensity) / 3.5);
      else if (sceneControls.field === "pressure") scalar[k] = Math.min(1, Math.abs(pressureMismatch) * core * (0.18 + 0.16 * Math.abs(shockCell)) + curlIntensity * 0.2);
      else if (sceneControls.field === "wall") scalar[k] = curlIntensity * 0.25;
      else scalar[k] = Math.min(1, (plumeTemperature / chamberTemperature) * core + curlIntensity);
    }
  }
  return {
    scalar,
    zones,
    metrics: {
      exitMach,
      exitTemperature,
      heatFluxPeak,
      maxWallTemperature,
      resistanceIncrease: ((throatTotalResistance / cleanThroatResistance) - 1) * 100,
      healthIndex: Math.max(0, Math.min(100, (cleanThroatResistance / throatTotalResistance) * 100)),
      stagnationTemperature: chamberTemperature,
      cokeThicknessMicrons: cokeThickness * 1000,
      simulatedTime: runProgress * 180,
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
    self.postMessage({ type: "ready", nx: N_X, ny: N_Y });
  } else if (msg.type === "mode") {
    lastMode = msg.mode;
    buildObstacle(lastMode);
    resetFields();
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
