const STORAGE_KEY = "portfolioAudioEnabled";
const MODE_FREQ = { thermal: 240, energy: 320, decarbonisation: 180, research: 440 };

let audioCtx = null;
let enabled = false;

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

function tone(freq = 240, duration = 0.16, type = "sine", gain = 0.025) {
  if (!enabled) return;
  const ctx = ensureContext();
  const start = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  osc.frequency.exponentialRampToValueAtTime(freq * 1.08, start + duration);
  const env = envelopeGain(ctx, start, duration, gain);
  osc.connect(env).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function noiseWhoosh(duration = 0.32) {
  if (!enabled) return;
  const ctx = ensureContext();
  const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(380, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + duration);
  const env = envelopeGain(ctx, ctx.currentTime, duration, 0.03);
  src.connect(filter).connect(env).connect(ctx.destination);
  src.start();
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
  if (enabled) tone(440, 0.22, "triangle", 0.03);
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
    if (event.target.closest?.(".button, [data-home-mode-button], .signal-routes a, .project-links a")) tone(720, 0.035, "square", 0.006);
  };
  document.addEventListener("pointerenter", hover, true);

  const offMode = ctx.bus.on("motion:mode-change", ({ mode }) => tone(MODE_FREQ[mode] || 260, 0.2, "sine", 0.018));
  const offTheme = ctx.bus.on("motion:theme-change", () => noiseWhoosh(0.22));
  const offPage = ctx.bus.on("motion:page-transition", () => noiseWhoosh(0.28));
  const offContact = ctx.bus.on("motion:contact-success", () => {
    tone(520, 0.12, "triangle", 0.022);
    setTimeout(() => tone(760, 0.18, "triangle", 0.026), 90);
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
