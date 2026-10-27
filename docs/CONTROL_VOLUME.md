# Control volume: motion and interaction layer (design spike)

Status: **design spike, not wired into live pages.** The demo lives at `labs/control-volume.html` (marked `noindex`). Adopting it site-wide would supersede the 7 October 2026 "engineering index" baseline in `docs/DESIGN_FREEZE.md`, so that is a deliberate decision, not a side effect of merging this branch.

## The idea

Every piece of work is drawn as a system with a boundary and read in four terms, always in this order:

1. **Boundary**: what is in scope.
2. **Method**: how it was analysed.
3. **Evidence**: what was found, with units.
4. **Residual**: what is not claimed. In CFD the residual is what is left when the solver stops; here it is what is left when the claim stops.

The motion is physics-true: fronts propagate, residuals converge, boundaries march, heat diffuses. No bounce for its own sake, no emoji.

## Files

| File | Role |
| --- | --- |
| `styles/control-volume.css` | All motion, overlays, glyph animations and toy styles. Scoped to `body.cv`. |
| `scripts/control-volume.js` | Vanilla runtime (no dependencies, no audio files, no network). Auto-starts on `body.cv`. |
| `labs/control-volume.html` | Standalone demo of every feature. |

## Opting a page in

```html
<link rel="stylesheet" href="styles/control-volume.css" />
<body class="cv" data-cv-label="S3 · CASES">
  …
  <script src="scripts/control-volume.js" defer></script>
</body>
```

Optional body attributes: `data-cv-boot` (solver boot once per session, plus a `boot` console command), `data-cv-no-sweep` (skip the page-entry sweep), `data-cv-root="../"` (prefix for console links on nested pages).

Markup hooks:

| Hook | Effect |
| --- | --- |
| `data-probe="T = 673 K"` | The probe cursor shows this readout over the element. |
| `.cd` | Card: lifts, heats to orange and its grid refines on hover. |
| `.cs` (`.a` amber, `.b` blue, `.g` green, `.n` neutral) | Marching dashed control surface. |
| `.rs` | Residual hatch that creeps slowly. |
| `.eb` | Eyebrow with a blinking caret. |
| `.gl .gl-flame` etc. | Reactive glyphs: flame, therm, wave, gear, cup, cycle, check, mesh, nest, lamp, spark, probe, key, bob, sun. |
| `.cf` | Filter-coffee loader SVG. |
| `data-cv-num="2026"` | Number that switches to Malayalam numerals on request. |
| `data-cv-toy="heat-field \| mesh \| biot \| year \| cycle"` | Interactive toys (see the demo for the expected inner `data-out` slots). |
| `data-cv-lamp="template-id"` | Opens the Kerala night scene from a `<template>`. |
| `data-note="220"` | Plucks a string when sound is on. |

## Motion catalogue

| Motion | Trigger | Timing |
| --- | --- | --- |
| Heat-front sweep | page entry | 1.25 s, `cubic-bezier(.7,0,.25,1)`, inferno colormap |
| Solver boot | first visit per session, opt-in | 3.3 s, skippable, rerunnable |
| Probe cursor and heat blob | pointer, desktop only | rAF-throttled |
| Residual scroll rail | scroll | scroll-linked where supported |
| Headline converge | entry | 1.4 s, tracking and blur relax |
| Marching boundary | always | 1.2 s loop, 0.45 s under the probe |
| Card heat and mesh refine | hover | 0.45 s lift, grid 28 → 9 px over 0.7 s |
| Residual hatch creep | always | 5 s loop |
| Cold/hot theme | toggle or `theme cold` | 1.4 s circular cold front (backdrop invert) |
| Monsoon | June to September by default, or `monsoon on` | 0.5 s / 0.8 s rain layers |
| Solver console | ⌘K / Ctrl+K or the CONSOLE button | navigation plus actions |
| Sound | opt-in, remembered | Web Audio synthesis |

## Accessibility and limits

- `prefers-reduced-motion: reduce` switches off every animation, the sweep, the probe and the boot.
- All controls are real `<button>`, `<a>` and `<input>` elements with 44 px targets; icon-only controls carry `aria-label`.
- Preferences (`cv-sound`, `cv-theme`, `cv-rain`, `cv-ml`) live in `localStorage` and fail safe when storage is blocked.
- The cold theme uses `backdrop-filter`; browsers without it simply keep the hot theme.
- Toy values are illustrative and labelled as such. Thesis figures shown (T = 673 K, P_gauge = 100 kPa, Bi = 0.003–0.004, discretisation error below 2 %) are the ones already published on the site. The mesh toy states that mesh independence is not validation.
- The colours follow the earlier Signal palette (`#070807`, `#65d6c9`, `#d7b46a`), not the current engineering-index palette.
