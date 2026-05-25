const STORAGE_KEY = "portfolioAudioEnabled";
const MODE_PROFILE = {
  thermal: { rumble: 82, band: 470 },
  energy: { rumble: 108, band: 680 },
  decarbonisation: { rumble: 64, band: 360 },
  research: { rumble: 94, band: 560 },
};

let audioCtx = null;
let enabled = false;
let lastHoverTarget = null;
let lastHoverTime = 0;

function ensureContext() {
  if (!audioCtx) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioCtor();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function envelopeGain(ctx, start, duration, gain = 0.035) {
  const node = ctx.createGain();
  node.gain.setValueAtTime(0.0001, start);
  node.gain.exponentialRampToValueAtTime(gain, start + duration * 0.22);
  node.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  return node;
}

function dampedPulse(freq, duration, gain = 0.008) {
  if (!enabled) return;
  const ctx = ensureContext();
  const start = ctx.currentTime;
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, start);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.965, start + duration);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(Math.max(160, freq * 3.2), start);
  filter.Q.value = 0.55;
  const env = envelopeGain(ctx, start, duration, gain);
  osc.connect(filter).connect(env).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function filteredFlow(duration, fromHz, toHz, gain = 0.012, q = 0.8) {
  if (!enabled) return;
  const ctx = ensureContext();
  const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    const taper = Math.sin(Math.PI * i / data.length);
    data[i] = (Math.random() * 2 - 1) * taper;
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = q;
  filter.frequency.setValueAtTime(fromHz, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(toHz, ctx.currentTime + duration);
  const env = envelopeGain(ctx, ctx.currentTime, duration, gain);
  src.connect(filter).connect(env).connect(ctx.destination);
  src.start();
}

// A muted pressure-tap/relay detent, used sparingly on actionable controls.
// It deliberately avoids tonal hover "pings" so the interface stays technical.
function instrumentDetent() {
  filteredFlow(0.038, 980, 470, 0.003, 1.8);
  dampedPulse(76, 0.045, 0.0018);
}

function modeFlowCue(mode) {
  const profile = MODE_PROFILE[mode] || MODE_PROFILE.thermal;
  filteredFlow(0.22, profile.band * 1.45, profile.band * 0.72, 0.008, 0.75);
  dampedPulse(profile.rumble, 0.18, 0.006);
}

function thermalCameraSweep() {
  filteredFlow(0.2, 1480, 340, 0.008, 1.15);
  dampedPulse(71, 0.12, 0.003);
}

function ductTransition() {
  filteredFlow(0.3, 260, 1120, 0.011, 0.62);
}

function injectButton() {
  const nav = document.querySelector(".nav");
  if (!nav || document.querySelector("[data-motion-audio-toggle]")) return null;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "motion-audio-toggle";
  button.dataset.motionAudioToggle = "";
  button.setAttribute("aria-label", "Enable interface audio");
  button.setAttribute("aria-pressed", "false");
  button.innerHTML = `
    <svg class="audio-icon-off" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M18 9l3 3m0-3l-3 3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
    <svg class="audio-icon-on" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M17 8c1.2 1.1 1.8 2.4 1.8 4s-.6 2.9-1.8 4M19.5 5.5c2 1.8 3 4 3 6.5s-1 4.7-3 6.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;
  nav.appendChild(button);
  return button;
}

function apply(button, next) {
  enabled = next;
  try { localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0"); } catch {}
  button.setAttribute("aria-pressed", enabled ? "true" : "false");
  button.setAttribute("aria-label", enabled ? "Disable interface audio" : "Enable interface audio");
  if (enabled) thermalCameraSweep();
}

export async function init(ctx) {
  const button = injectButton();
  if (!button) return null;
  try { enabled = localStorage.getItem(STORAGE_KEY) === "1"; } catch { enabled = false; }
  button.setAttribute("aria-pressed", enabled ? "true" : "false");

  button.addEventListener("click", () => apply(button, !enabled));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && enabled) apply(button, false);
  });

  const hover = (event) => {
    const target = event.target.closest?.(".button, [data-home-mode-button], .signal-routes a, .project-links a");
    const now = performance.now();
    if (!target || (target === lastHoverTarget && now - lastHoverTime < 450)) return;
    lastHoverTarget = target;
    lastHoverTime = now;
    instrumentDetent();
  };
  document.addEventListener("pointerenter", hover, true);

  const offMode = ctx.bus.on("motion:mode-change", ({ mode }) => modeFlowCue(mode));
  const offTheme = ctx.bus.on("motion:theme-change", () => thermalCameraSweep());
  const offPage = ctx.bus.on("motion:page-transition", () => ductTransition());
  const offContact = ctx.bus.on("motion:contact-success", () => {
    filteredFlow(0.24, 420, 980, 0.009, 0.85);
    dampedPulse(116, 0.19, 0.006);
  });

  return {
    destroy() {
      offMode?.(); offTheme?.(); offPage?.(); offContact?.();
      document.removeEventListener("pointerenter", hover, true);
      button.remove();
      audioCtx?.close?.();
    },
  };
}

export function destroy(instance) {
  instance?.destroy?.();
}
