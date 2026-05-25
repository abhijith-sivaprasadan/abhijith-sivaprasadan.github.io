/**
 * Live Biot-number calculator.
 *
 * Drop-in widget: any element with `data-biot-calculator` becomes an
 * interactive Biot calculator. Inputs are h, L, k. Output is Bi = hL/k
 * with a thermal-resistance interpretation that updates live.
 *
 * Mode-aware preset values:
 *   thermal     → reducer wall (steel, 5 mm, gas at 673 K)
 *   energy      → district heating pipe
 *   research    → rocket cooling-channel (copper, 1 mm, methane)
 *   decarbon.   → industrial heat exchanger
 */

const PRESETS = {
  thermal: {
    label: "Pulsatorn reducer wall",
    h: 320,   // W/m²·K  (forced convection inside reducer)
    L: 0.005, // m       (wall thickness 5 mm)
    k: 21.5,  // W/m·K   (steel at 673 K)
  },
  research: {
    label: "Rocket cooling channel",
    h: 25000,  // W/m²·K (methane regenerative cooling)
    L: 0.0008, // m       (channel wall 0.8 mm)
    k: 380,    // W/m·K   (copper alloy)
  },
  energy: {
    label: "District heating pipe",
    h: 1200,
    L: 0.006,
    k: 50,
  },
  decarbonisation: {
    label: "Process heat exchanger tube",
    h: 800,
    L: 0.0025,
    k: 16,
  },
};

function interpret(Bi) {
  if (Bi < 0.1) {
    return {
      label: "Lumped",
      copy: "Bi &lt; 0.1 — through-wall conduction is fast compared with surface convection. The solid is effectively at one temperature; lumped-capacitance modelling is valid. This is the Siemens thesis regime (Bi 0.003–0.004).",
      tone: "thermal",
    };
  }
  if (Bi < 1) {
    return {
      label: "Intermediate",
      copy: "0.1 &le; Bi &lt; 1 — surface convection and wall conduction matter comparably. A 1-D wall model with both effects is needed.",
      tone: "energy",
    };
  }
  return {
    label: "Conduction-limited",
    copy: "Bi &ge; 1 — through-wall conduction is the bottleneck. Surface boundary-layer details matter less than the wall material and thickness. Coke deposits in rocket cooling channels push this regime fast.",
    tone: "decarbonisation",
  };
}

function fmt(n, digits = 3) {
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n) < 0.01 || Math.abs(n) >= 10000) return n.toExponential(2);
  return n.toFixed(digits);
}

function build(host) {
  host.innerHTML = `
    <article class="biot-calc">
      <header class="biot-calc-head">
        <p class="eyebrow">Try it · Biot number calculator</p>
        <h3>Bi = <span class="math" data-math="\\dfrac{h \\, L}{k}"></span></h3>
        <p class="biot-calc-help">Bi compares surface convection against through-wall conduction. Under 0.1 the wall behaves as a single thermal lump — which is exactly why the Siemens thesis result (Bi 0.003–0.004) reframed the outlet-temperature gap as a surface-area problem, not an internal heat-transfer problem.</p>
      </header>
      <div class="biot-calc-grid">
        <label>
          <span>h <small>W/m²·K</small></span>
          <input type="number" data-biot-input="h" min="1" step="any" />
          <input type="range" data-biot-range="h" min="1" max="50000" step="1" />
        </label>
        <label>
          <span>L <small>m</small></span>
          <input type="number" data-biot-input="L" min="0.0001" step="any" />
          <input type="range" data-biot-range="L" min="0.0001" max="0.05" step="0.0001" />
        </label>
        <label>
          <span>k <small>W/m·K</small></span>
          <input type="number" data-biot-input="k" min="0.1" step="any" />
          <input type="range" data-biot-range="k" min="0.1" max="500" step="0.1" />
        </label>
      </div>
      <div class="biot-calc-result" data-biot-result>
        <div class="biot-calc-value">
          <span class="eyebrow">Result</span>
          <strong data-biot-value>—</strong>
        </div>
        <div class="biot-calc-interpretation" data-biot-interpretation></div>
      </div>
      <div class="biot-calc-presets">
        <span class="eyebrow">Try a preset</span>
        <div class="biot-preset-row">
          ${Object.entries(PRESETS).map(([key, p]) =>
            `<button type="button" data-biot-preset="${key}">${p.label}</button>`
          ).join("")}
        </div>
      </div>
    </article>
  `;
}

function apply(host, h, L, k) {
  const inputs = host.querySelectorAll("[data-biot-input], [data-biot-range]");
  inputs.forEach((el) => {
    const key = el.dataset.biotInput || el.dataset.biotRange;
    const v = { h, L, k }[key];
    if (el.value !== String(v)) el.value = v;
  });

  const Bi = (h * L) / k;
  const interp = interpret(Bi);
  host.querySelector("[data-biot-value]").innerHTML = `Bi = ${fmt(Bi)}`;
  host.querySelector("[data-biot-interpretation]").innerHTML = `
    <span class="biot-tag" data-tone="${interp.tone}">${interp.label}</span>
    <p>${interp.copy}</p>
  `;
}

function wireInputs(host, state) {
  host.querySelectorAll("[data-biot-input], [data-biot-range]").forEach((el) => {
    el.addEventListener("input", () => {
      const key = el.dataset.biotInput || el.dataset.biotRange;
      const v = Number(el.value);
      if (!Number.isFinite(v) || v <= 0) return;
      state[key] = v;
      apply(host, state.h, state.L, state.k);
    });
  });
  host.querySelectorAll("[data-biot-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const preset = PRESETS[btn.dataset.biotPreset];
      if (!preset) return;
      state.h = preset.h; state.L = preset.L; state.k = preset.k;
      apply(host, state.h, state.L, state.k);
    });
  });
}

export async function init(ctx) {
  const hosts = document.querySelectorAll("[data-biot-calculator]");
  if (!hosts.length) return null;

  hosts.forEach(async (host) => {
    const mode = document.body.dataset.homeMode || "thermal";
    const preset = PRESETS[mode] || PRESETS.thermal;
    const state = { h: preset.h, L: preset.L, k: preset.k };
    build(host);
    apply(host, state.h, state.L, state.k);
    wireInputs(host, state);
    // Kick KaTeX so the formula renders
    if (window.Motion?.load) {
      window.Motion.load("katex");
    }
  });

  return { presets: PRESETS };
}

export function destroy() {}
