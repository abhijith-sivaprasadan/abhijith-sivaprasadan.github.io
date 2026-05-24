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
 *   { type: "frame", densityBuffer: Float32Array (transferred), w, h }
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

// ── Obstacles per mode (same shapes as the lightweight fluid-sim) ─────────
function buildObstacle(mode) {
  solid.fill(0);
  if (mode === "research") return;
  if (mode === "thermal") {
    // Reducer cross-section: upper + lower wall converging
    for (let i = 1; i <= N_X; i++) {
      const xn = i / N_X;
      let wallY;
      if (xn < 0.32)      wallY = 0.42;
      else if (xn < 0.50) wallY = 0.42 - (0.42 - 0.18) * ((xn - 0.32) / 0.18);
      else if (xn < 0.68) wallY = 0.18 - (0.18 - 0.09) * ((xn - 0.50) / 0.18);
      else                wallY = 0.09;
      for (let j = 1; j <= N_Y; j++) {
        const yn = (j / N_Y - 0.5) * 2;
        if (Math.abs(yn) > wallY) solid[idx(i, j)] = 1;
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
  // Maintain dye source at the left edge so the channel is never blank
  for (let j = 2; j <= N_Y - 1; j++) {
    if (solid[idx(1, j)]) continue;
    d0[idx(1, j)] += strength;
    u0[idx(1, j)] += strength * 0.8;
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
    self.postMessage({ type: "ready", nx: N_X, ny: N_Y });
  } else if (msg.type === "mode") {
    lastMode = msg.mode;
    buildObstacle(lastMode);
  } else if (msg.type === "force") {
    injectForce(msg.x, msg.y, msg.dx, msg.dy);
  } else if (msg.type === "step") {
    continuousInflow(0.4);
    velStep(msg.viscosity ?? 1e-6, msg.dt ?? 0.08);
    densStep(msg.diffusion ?? 5e-5, msg.dt ?? 0.08);
    // Send back the density field (transfer-able)
    const out = new Float32Array(d);
    self.postMessage({
      type: "frame",
      density: out,
      uField: new Float32Array(u),
      vField: new Float32Array(v),
      solid: new Uint8Array(solid),
      nx: N_X, ny: N_Y,
    }, [out.buffer]);
  }
};
