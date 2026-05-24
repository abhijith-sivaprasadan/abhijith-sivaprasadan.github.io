const BEATS = [
  {
    key: "geometry",
    label: "01 / Geometry",
    title: "Reducer geometry materialises",
    copy: "Legacy two-step contraction versus the 150 mm C2 quintic reducer: the design question starts as a pressure-loss and thermal-delivery trade-off.",
  },
  {
    key: "mesh",
    label: "02 / Mesh",
    title: "Coarse to baseline to fine",
    copy: "The thesis campaign only moved forward after mesh independence checks and near-wall treatment were physically defensible.",
  },
  {
    key: "flow",
    label: "03 / Flow",
    title: "Compressible streamlines separate the story",
    copy: "The legacy path concentrates acceleration and loss; the redesigned C2 contraction distributes acceleration through the geometry.",
  },
  {
    key: "thermal",
    label: "04 / Thermal",
    title: "Wall temperature becomes a resistance problem",
    copy: "Bi = 0.003-0.004 reframes the thermal result: external area and surface heat loss dominate the apparent outlet-temperature gap.",
  },
  {
    key: "kpi",
    label: "05 / Evidence",
    title: "KPI evidence snaps into the rail",
    copy: "673 K, Bi 0.003-0.004, Ma 0.990-1.006 and 8/8 checks become the compact evidence signal for fast readers.",
  },
];

function svgMarkup() {
  return `
    <svg class="thesis-story-svg" viewBox="0 0 900 520" role="img" aria-label="Animated Siemens thesis evidence sequence">
      <defs>
        <linearGradient id="storyFlow" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stop-color="#2563a8"/>
          <stop offset="42%" stop-color="#65d6c9"/>
          <stop offset="72%" stop-color="#d0622c"/>
          <stop offset="100%" stop-color="#f6c85f"/>
        </linearGradient>
        <filter id="softSignal" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <rect class="story-bg" x="22" y="28" width="856" height="464" rx="18"/>
      <g class="story-grid" opacity="0.35">
        ${Array.from({ length: 13 }, (_, i) => `<path d="M${80 + i * 58} 48V472"/>`).join("")}
        ${Array.from({ length: 7 }, (_, i) => `<path d="M52 ${90 + i * 56}H848"/>`).join("")}
      </g>
      <g class="story-geometry">
        <path class="legacy-wall" d="M110 188H360V226H462V264H790" />
        <path class="legacy-wall lower" d="M110 332H360V294H462V256H790" />
        <path class="c2-wall" d="M110 188H336C460 188 480 226 558 240C628 252 708 250 790 250" />
        <path class="c2-wall lower" d="M110 332H336C460 332 480 294 558 280C628 268 708 270 790 270" />
      </g>
      <g class="story-mesh" opacity="0">
        ${Array.from({ length: 19 }, (_, i) => `<path d="M${120 + i * 34} 182L${92 + i * 38} 338"/>`).join("")}
        ${Array.from({ length: 10 }, (_, i) => `<path d="M104 ${190 + i * 16}H800"/>`).join("")}
      </g>
      <g class="story-streamlines" opacity="0">
        ${Array.from({ length: 8 }, (_, i) => `<path d="M96 ${210 + i * 16}C280 ${204 + i * 9} 390 ${236 - i * 3} 510 ${252 + i * 2}S680 ${260 + i * 6} 805 ${248 + i * 8}"/>`).join("")}
        <path class="story-jet" d="M345 258C420 230 478 238 542 258C475 281 420 287 345 258Z"/>
      </g>
      <g class="story-thermal" opacity="0">
        <path d="M116 192H338C474 194 498 232 560 246C630 262 712 258 790 252" stroke="#f6c85f" stroke-width="16" stroke-linecap="round"/>
        <path d="M116 328H338C474 326 498 288 560 274C630 258 712 262 790 268" stroke="#2563a8" stroke-width="16" stroke-linecap="round"/>
      </g>
      <g class="story-kpis" opacity="0">
        <rect x="106" y="386" width="158" height="62" rx="12"/><text x="126" y="413">673 K</text><text x="126" y="433">inlet condition</text>
        <rect x="282" y="386" width="178" height="62" rx="12"/><text x="302" y="413">Bi 0.003-0.004</text><text x="302" y="433">thermal band</text>
        <rect x="478" y="386" width="180" height="62" rx="12"/><text x="498" y="413">Ma 0.990-1.006</text><text x="498" y="433">flow regime</text>
        <rect x="676" y="386" width="118" height="62" rx="12"/><text x="696" y="413">8/8</text><text x="696" y="433">checks</text>
      </g>
    </svg>`;
}

function build(stage) {
  stage.innerHTML = `
    <div class="thesis-story-visual">${svgMarkup()}</div>
    <div class="thesis-story-beats">
      ${BEATS.map((beat, index) => `
        <article class="thesis-story-beat ${index === 0 ? "is-active" : ""}" data-story-beat="${beat.key}">
          <span>${beat.label}</span>
          <strong>${beat.title}</strong>
          <p>${beat.copy}</p>
        </article>`).join("")}
    </div>`;
}

function setBeat(root, index) {
  root.dataset.storyStep = String(index);
  root.querySelectorAll(".thesis-story-beat").forEach((el, i) => el.classList.toggle("is-active", i === index));
}

export async function init(ctx) {
  const root = document.querySelector("[data-motion-scrollyt]");
  const stage = root?.querySelector("[data-thesis-story-stage]");
  if (!root || !stage) return null;
  build(stage);

  if (ctx.reducedMotion || !ctx.gsap || !ctx.ScrollTrigger) {
    root.classList.add("is-static");
    setBeat(root, BEATS.length - 1);
    return null;
  }

  const gsap = ctx.gsap;
  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: root,
      start: "top top",
      end: `+=${BEATS.length * 55}%`,
      pin: true,
      scrub: 0.65,
      onUpdate(self) {
        setBeat(root, Math.min(BEATS.length - 1, Math.floor(self.progress * BEATS.length)));
      },
    },
  });

  timeline
    .fromTo(root.querySelectorAll(".c2-wall"), { strokeDashoffset: 600, strokeDasharray: 600, opacity: 0 }, { strokeDashoffset: 0, opacity: 1, duration: 1 })
    .to(root.querySelector(".story-mesh"), { opacity: 0.82, duration: 1 })
    .to(root.querySelector(".story-streamlines"), { opacity: 1, duration: 1 })
    .to(root.querySelector(".story-thermal"), { opacity: 0.92, duration: 1 })
    .to(root.querySelector(".story-kpis"), { opacity: 1, y: -8, duration: 1 });

  return { destroy() { timeline.scrollTrigger?.kill(); timeline.kill(); } };
}

export function destroy(instance) {
  instance?.destroy?.();
}
