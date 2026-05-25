/**
 * CFD-style fluid simulation for the hero.
 *
 * Approach: particle-advected flow field.
 *   - A fixed velocity field is computed analytically:
 *       base potential flow (left→right) + obstacle deflection +
 *       recirculation lobes behind abrupt steps.
 *   - 1500 dye particles drift through the field; trails persist via
 *     low-alpha clear-rect each frame.
 *   - Mouse position injects a radial perturbation that decays with distance.
 *   - Home-mode + theme determine the obstacle shape and color palette.
 *
 * Performance: ~60fps on a mid-range laptop; degrades gracefully on
 * navigator.hardwareConcurrency ≤ 2 by halving particle count.
 *
 * Mounted into the element with [data-motion-fluid-sim].
 * Subscribes to motion bus events:
 *   "motion:mode-change"   — re-derive obstacle + palette
 *   "motion:theme-change"  — re-derive palette
 */

let state = null;

// ── Palette by mode + theme ───────────────────────────────────────────────
const PALETTES = {
  thermal: {
    dark:  ["#1e3a8a", "#2563a8", "#65d6c9", "#fbbf24", "#d0622c"],
    light: ["#dbeafe", "#7dd3fc", "#22d3ee", "#fb923c", "#dc2626"],
  },
  energy: {
    dark:  ["#064e3b", "#047857", "#10b981", "#a3e635", "#fde047"],
    light: ["#ecfdf5", "#86efac", "#22c55e", "#84cc16", "#facc15"],
  },
  decarbonisation: {
    dark:  ["#451a03", "#7c2d12", "#c2410c", "#ea580c", "#fbbf24"],
    light: ["#fed7aa", "#fb923c", "#ea580c", "#dc2626", "#f59e0b"],
  },
  research: {
    dark:  ["#1e1b4b", "#4338ca", "#7c3aed", "#a78bfa", "#e9d5ff"],
    light: ["#ede9fe", "#a78bfa", "#7c3aed", "#5b21b6", "#3730a3"],
  },
};

// ── Obstacle shapes (returns 1 if inside obstacle, 0 if free) ─────────────
function obstacleMask(mode, x, y, w, h) {
  if (mode === "research") return 0; // pure flow

  if (mode === "thermal") {
    // Reducer cross-section: two-step contraction
    // Upper wall + lower wall converging from 35→11→6mm
    const cx = w * 0.5;
    const ny = (y / h - 0.5) * 2; // -1..1
    const stage1Start = w * 0.32;
    const stage1End = w * 0.50;
    const stage2End = w * 0.68;
    // Upper wall profile
    let wallY;
    if (x < stage1Start)      wallY = 0.42;
    else if (x < stage1End)   wallY = 0.42 - (0.42 - 0.18) * ((x - stage1Start) / (stage1End - stage1Start));
    else if (x < stage2End)   wallY = 0.18 - (0.18 - 0.09) * ((x - stage1End) / (stage2End - stage1End));
    else                      wallY = 0.09;
    return Math.abs(ny) > wallY ? 1 : 0;
  }

  if (mode === "energy") {
    // Grid network: scattered transmission-tower-style obstacles
    const nodes = [
      [0.20, 0.30, 0.04], [0.20, 0.70, 0.04],
      [0.45, 0.20, 0.05], [0.45, 0.50, 0.05], [0.45, 0.80, 0.05],
      [0.70, 0.35, 0.04], [0.70, 0.65, 0.04],
    ];
    for (const [nx, ny, r] of nodes) {
      const dx = x / w - nx, dy = y / h - ny;
      if (dx * dx + dy * dy < r * r) return 1;
    }
    return 0;
  }

  if (mode === "decarbonisation") {
    // Industrial process: a few rectangular blocks at staggered heights
    const blocks = [
      [0.18, 0.55, 0.10, 0.20],
      [0.40, 0.30, 0.12, 0.18],
      [0.62, 0.55, 0.10, 0.22],
    ];
    for (const [bx, by, bw, bh] of blocks) {
      if (x / w > bx && x / w < bx + bw && y / h > by && y / h < by + bh) return 1;
    }
    return 0;
  }
  return 0;
}

// ── Velocity field sampling at a point (analytic) ─────────────────────────
function sampleVelocity(state, x, y) {
  const { width: w, height: h, mode, mouse } = state;
  if (obstacleMask(mode, x, y, w, h)) return [0, 0];

  // Base potential flow: rightward + slight curl
  let u = 1.0;
  let v = 0;

  if (mode === "thermal") {
    // Accelerate as the channel narrows (continuity)
    const ny = (y / h - 0.5) * 2;
    const xn = x / w;
    if (xn > 0.32 && xn < 0.68) {
      // Approximate area: throat is 0.18 wide; inlet is 0.84 wide
      const localArea = xn < 0.50
        ? 0.84 - (0.84 - 0.36) * ((xn - 0.32) / 0.18)
        : 0.36 - (0.36 - 0.18) * ((xn - 0.50) / 0.18);
      u = 1.0 / Math.max(localArea, 0.18);
    } else if (xn >= 0.68) {
      u = 1.0 / 0.18; // throat speed
    }
    // Slight wall-following deflection
    v = -ny * 0.25 * Math.min(u, 3);
    // Recirculation behind legacy abrupt step (small lobe near walls just after the step)
    if (xn > 0.50 && xn < 0.60 && Math.abs(ny) > 0.08 && Math.abs(ny) < 0.14) {
      v += -Math.sign(ny) * 0.4; // pulls back inward (vena-contracta)
      u *= 0.3;
    }
  }
  if (mode === "energy") {
    // Gentle field; avoid nodes by adding a soft repulsion
    const nodes = [
      [0.20, 0.30], [0.20, 0.70],
      [0.45, 0.20], [0.45, 0.50], [0.45, 0.80],
      [0.70, 0.35], [0.70, 0.65],
    ];
    for (const [nx, ny] of nodes) {
      const dx = x / w - nx, dy = y / h - ny;
      const d2 = dx * dx + dy * dy;
      if (d2 < 0.04) {
        const k = (0.04 - d2) * 20;
        u += dx * k;
        v += dy * k;
      }
    }
  }
  if (mode === "decarbonisation") {
    // Step-wise deflection past industrial blocks
    const blocks = [
      [0.18, 0.55, 0.10, 0.20],
      [0.40, 0.30, 0.12, 0.18],
      [0.62, 0.55, 0.10, 0.22],
    ];
    for (const [bx, by, bw, bh] of blocks) {
      const xn = x / w, yn = y / h;
      if (xn > bx - 0.04 && xn < bx + bw + 0.04 && yn > by - 0.04 && yn < by + bh + 0.04) {
        v += (yn < by + bh / 2 ? -1 : 1) * 0.4;
      }
    }
  }

  // Mouse perturbation: radial outward push that decays with distance
  if (mouse && mouse.active) {
    const dx = x - mouse.x;
    const dy = y - mouse.y;
    const r = Math.hypot(dx, dy);
    if (r < 140 && r > 1) {
      const k = (1 - r / 140) * 2.5;
      u += (dx / r) * k;
      v += (dy / r) * k;
    }
  }

  return [u, v];
}

// ── Particle init ─────────────────────────────────────────────────────────
function spawnParticle(state, dispersed = false) {
  const fullDomain = dispersed || state.mode === "research" || Math.random() < 0.22;
  return {
    x: fullDomain ? Math.random() * state.width : Math.random() * state.width * 0.15,
    y: Math.random() * state.height,
    age: Math.random() * 200,
    life: 200 + Math.random() * 400,
  };
}

function initParticles(state) {
  state.particles = [];
  for (let i = 0; i < state.particleCount; i++) {
    state.particles.push(spawnParticle(state, true));
  }
}

// ── Resize handling ───────────────────────────────────────────────────────
function resize(state) {
  const ratio = window.devicePixelRatio || 1;
  const rect = state.canvas.getBoundingClientRect();
  state.width = Math.max(360, Math.floor(rect.width));
  state.height = Math.max(220, Math.floor(rect.height));
  state.canvas.width = state.width * ratio;
  state.canvas.height = state.height * ratio;
  state.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  state.dpr = ratio;
}

// ── Color picker from palette by velocity magnitude ───────────────────────
function colorAt(palette, vmag) {
  const t = Math.min(1, vmag / 6);
  const idx = t * (palette.length - 1);
  const i0 = Math.floor(idx);
  const i1 = Math.min(palette.length - 1, i0 + 1);
  const f = idx - i0;
  return mix(palette[i0], palette[i1], f);
}

function mix(a, b, t) {
  const ah = a.replace("#", ""), bh = b.replace("#", "");
  const ar = parseInt(ah.slice(0, 2), 16), ag = parseInt(ah.slice(2, 4), 16), ab = parseInt(ah.slice(4, 6), 16);
  const br = parseInt(bh.slice(0, 2), 16), bg = parseInt(bh.slice(2, 4), 16), bb = parseInt(bh.slice(4, 6), 16);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

// ── Render frame ──────────────────────────────────────────────────────────
function step(state) {
  const { ctx, width: w, height: h, palette } = state;

  // Motion-blur fade
  ctx.fillStyle = state.fadeColor;
  ctx.fillRect(0, 0, w, h);

  // Advect particles
  for (let i = 0; i < state.particles.length; i++) {
    const p = state.particles[i];
    const [u, v] = sampleVelocity(state, p.x, p.y);
    const speed = Math.hypot(u, v);
    p.x += u * 1.7;
    p.y += v * 1.7;
    p.age++;

    // Reset if exited or expired or inside obstacle
    if (p.x > w + 6 || p.x < -6 || p.y > h + 6 || p.y < -6 ||
        p.age > p.life || obstacleMask(state.mode, p.x, p.y, w, h)) {
      const fresh = spawnParticle(state);
      p.x = fresh.x; p.y = fresh.y; p.age = 0; p.life = fresh.life;
      continue;
    }

    // Draw
    const c = colorAt(palette, speed);
    ctx.fillStyle = c;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(p.x, p.y, 1.4, 1.4);
  }
  ctx.globalAlpha = 1;

  // Draw obstacle outline (faint) so the user can see the geometry
  if (state.mode !== "research") {
    drawObstacleOutline(state);
  }

  state.frame++;
}

function drawObstacleOutline(state) {
  const { ctx, width: w, height: h, mode } = state;
  ctx.save();
  ctx.strokeStyle = state.outlineColor;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.35;
  ctx.beginPath();

  if (mode === "thermal") {
    // Upper wall
    const stages = [
      [0, h * 0.08], [w * 0.32, h * 0.08],
      [w * 0.50, h * 0.32], [w * 0.68, h * 0.41], [w, h * 0.41],
    ];
    ctx.moveTo(stages[0][0], stages[0][1]);
    for (const [px, py] of stages.slice(1)) ctx.lineTo(px, py);
    // Lower wall (mirror)
    ctx.moveTo(0, h * 0.92);
    ctx.lineTo(w * 0.32, h * 0.92);
    ctx.lineTo(w * 0.50, h * 0.68);
    ctx.lineTo(w * 0.68, h * 0.59);
    ctx.lineTo(w, h * 0.59);
  } else if (mode === "energy") {
    const nodes = [
      [0.20, 0.30, 0.04], [0.20, 0.70, 0.04],
      [0.45, 0.20, 0.05], [0.45, 0.50, 0.05], [0.45, 0.80, 0.05],
      [0.70, 0.35, 0.04], [0.70, 0.65, 0.04],
    ];
    for (const [nx, ny, r] of nodes) {
      ctx.moveTo((nx + r) * w, ny * h);
      ctx.arc(nx * w, ny * h, r * Math.min(w, h), 0, Math.PI * 2);
    }
  } else if (mode === "decarbonisation") {
    const blocks = [
      [0.18, 0.55, 0.10, 0.20],
      [0.40, 0.30, 0.12, 0.18],
      [0.62, 0.55, 0.10, 0.22],
    ];
    for (const [bx, by, bw, bh] of blocks) {
      ctx.rect(bx * w, by * h, bw * w, bh * h);
    }
  }
  ctx.stroke();
  ctx.restore();
}

// ── Public ────────────────────────────────────────────────────────────────
export async function init(ctx) {
  const host = document.querySelector("[data-motion-fluid-sim]");
  if (!host) return null;
  const stage = host.querySelector("[data-hero-scene-stage]") || host;

  const canvas = document.createElement("canvas");
  canvas.className = "motion-fluid-canvas";
  canvas.setAttribute("aria-hidden", "true");
  stage.appendChild(canvas);

  const renderCtx = canvas.getContext("2d", { alpha: true });
  if (!renderCtx) return null;

  const isLight = () => document.documentElement.dataset.theme === "light";
  const currentMode = () => document.body.dataset.homeMode || "thermal";

  const buildState = () => {
    const mode = currentMode();
    const themeKey = isLight() ? "light" : "dark";
    const palette = (PALETTES[mode] || PALETTES.thermal)[themeKey];
    return {
      canvas,
      ctx: renderCtx,
      width: 0,
      height: 0,
      dpr: 1,
      mode,
      palette,
      particleCount: ctx.lowPower ? 700 : 1500,
      particles: [],
      frame: 0,
      mouse: { x: 0, y: 0, active: false },
      fadeColor: isLight() ? "rgba(244,246,250,0.10)" : "rgba(7,9,14,0.10)",
      outlineColor: isLight() ? "#0f172a" : "#e8eef7",
    };
  };

  state = buildState();
  resize(state);
  initParticles(state);

  // ── Loop ───────────────────────────────────────────────────────────────
  let running = true;
  let visible = true;
  const onVis = () => { visible = !document.hidden; };
  document.addEventListener("visibilitychange", onVis);

  const loop = () => {
    if (!running) return;
    if (visible) step(state);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  // ── Input ──────────────────────────────────────────────────────────────
  const onMove = (e) => {
    const r = canvas.getBoundingClientRect();
    state.mouse.x = e.clientX - r.left;
    state.mouse.y = e.clientY - r.top;
    state.mouse.active = true;
  };
  const onLeave = () => { state.mouse.active = false; };
  stage.addEventListener("mousemove", onMove, { passive: true });
  stage.addEventListener("mouseleave", onLeave, { passive: true });

  // ── Resize ─────────────────────────────────────────────────────────────
  const ro = new ResizeObserver(() => resize(state));
  ro.observe(canvas);

  // ── Bus subscriptions ──────────────────────────────────────────────────
  ctx.bus.on("motion:mode-change", () => {
    const next = buildState();
    next.particles = state.particles; // keep particles for continuity
    state.mode = next.mode;
    state.palette = next.palette;
    state.fadeColor = next.fadeColor;
    state.outlineColor = next.outlineColor;
  });
  ctx.bus.on("motion:theme-change", () => {
    const next = buildState();
    state.palette = next.palette;
    state.fadeColor = next.fadeColor;
    state.outlineColor = next.outlineColor;
  });

  // Reduced-motion: render a single frame, then stop
  if (ctx.reducedMotion) {
    for (let i = 0; i < 60; i++) step(state); // settle particles
    running = false;
  }

  return {
    pause() { running = false; },
    resume() { if (!running) { running = true; requestAnimationFrame(loop); } },
    destroy() {
      running = false;
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      stage.removeEventListener("mousemove", onMove);
      stage.removeEventListener("mouseleave", onLeave);
      stage.removeChild(canvas);
    },
  };
}

export function destroy(instance) {
  if (instance?.destroy) instance.destroy();
}
