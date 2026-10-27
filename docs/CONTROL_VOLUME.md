# Control volume: site theme, motion and interaction layer

Status: **the live design for every page** (27 October 2026). It supersedes the 7 October "engineering index" baseline; see `docs/DESIGN_FREEZE.md`. The feature demo stays at `labs/control-volume.html` (marked `noindex`).

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
| `styles/cv-site.css` | Site theme: re-points the shared tokens (`--folio-*`, `--unified-*`, `--paper-*`, …) and restyles shared structures, plus the page modules (lenses, cycle, nested boundaries, gates, scale ladder, evidence-class pills, 404). Loaded last. |
| `styles/control-volume.css` | All motion, overlays, glyph animations and toy styles. Scoped to `body.cv`. |
| `scripts/control-volume.js` | Vanilla runtime (no dependencies, no audio files, no network). Auto-starts on `body.cv`. |
| `scripts/flux-lab.js` + `styles/flux-lab.css` | Optional Flux Lab chamber, animated telemetry, visitor-selected motion presets and page transitions. |
| `labs/control-volume.html` | Standalone demo of every feature. |

## How pages are wired

| Pages | Wiring |
| --- | --- |
| Generated: `index.html`, `tracks/*`, `skills/*` | `scripts/build-academic.cjs` writes the fonts, both stylesheets and the runtime into every page. Edit the generator, then run `node scripts/build-academic.cjs`. |
| 57 legacy endpoints (root pages, `projects/`, `experience/`, `reports.html`) | `scripts/public-config.js` adds the fonts, both stylesheets (re-appended at `DOMContentLoaded` so they load last), the runtime and the `cv` body class, and pins the dark theme. |
| `404.html` | Loads everything directly with root-absolute paths, because GitHub Pages serves it at any depth. `scripts/unified-shell.js` links from `/` on this page. |
| `for/siemens-feed.html` | Loads both stylesheets and the runtime directly. `data-cv-focused` keeps the console to actions only, matching the page's deliberately narrow navigation. |
| `cet2026/index.html` | `cet2026/cet.css` is re-paletted; the page loads the motion stylesheet and runtime only. |
| `tap/*` | Contact-card pages are re-paletted inline and carry the dashed boundary, with no runtime, so the floating controls never cover the contact buttons. |

## Opting a page in

```html
<link rel="stylesheet" href="styles/control-volume.css" />
<body class="cv" data-cv-label="S3 · CASES">
  …
  <script src="scripts/control-volume.js" defer></script>
</body>
```

Optional body attributes: `data-cv-boot` (solver boot available on request through console, not automatic), `data-cv-no-sweep` (skip the page-entry sweep), `data-cv-root="../"` (prefix for console links on nested pages).

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
| `data-note="220"` | Plucks a string when sound is on; the button vibrates either way and nudges the sound switch when it is off. |
| `data-cv-focused` (body) | Console shows actions only, no site navigation. |

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
- The colours follow the Signal palette (`#070807`, `#65d6c9`, `#d7b46a`, `#8fb7ff`, `#9bd69f`, `#f98e09`).


## Flux Lab 02 / kinetic overdrive

- FLOW is the animated default; STILL quiets ornamental motion, and CHAOS enables optional pointer trails and stronger interaction effects. Reduced-motion preference forces STILL.
- Flux Lab includes an explicitly illustrative particle field, with interactive attractor, keyboard arrows and reset. These particles are not a validated energy or thermal model.
- Native `<dialog>` provides modal focus management, Escape support and a visible close control. The existing solver console has a Tab focus loop; source movement in the heat-field toy is keyboard operable.
- The first-visit solver boot no longer blocks the homepage; launch it by command. Page-entry sweep remains.
- Internal page transitions skip external links, downloads, in-page fragments and keyboard modifier clicks. No transition runs for reduced motion or STILL.
- Flux Lab canvas runs only while open and visible; device pixel ratio and particle count are capped. Decorative trails require a fine pointer and CHAOS.
- Site-wide assets are wired from the academic generator and shared public config; standalones include the files directly. CI knows how to resolve 404 root-absolute links.

## Discovery, not a takeover

The Flux Lab expansion is progressive disclosure rather than a new navigation hierarchy. The opener is hidden during the hero and only appears once a visitor has scrolled into meaningful content. Compact *boundary traces* appear after existing demonstrations on the homepage, research page, thesis case and reports index. They link real evidence in a loose loop (heat field → wall resistance → thesis → reports → cases), without a forced tour, reward gate or blocking navigation. The telemetry rail is only visible when users explicitly select CHAOS. Existing sections, headings, cards and information architecture remain primary.

The STILL option also cancels inherited Control Volume animations and overlays, not merely Flux Lab particles, and the dialog remains functional. Changing from STILL back to FLOW or CHAOS while the lab is open resumes the particle field without re-opening the panel.

The fourth trace completes the loop at `projects.html`, where a private, session-scoped marginal annotation appears only if the visitor has followed all four evidence links. It can open the laboratory, but the normal navigation and project catalogue work unchanged for everyone else. Nothing is registered or transmitted to a server.

## Responsive browser verification

PR UI audit runs headless Chromium over every public HTML route at 390px and 22 representative pages at 320/673/1024/1440px. The check detects horizontal overflow, uncaught runtime exceptions, date-slider/reset regressions and dialog keyboard controls. A second full-motion pass captures annual-cycle and high-risk page samples and checks SVG-label collisions and hover probe occlusion. Images and JSON results are uploaded as GitHub Actions artifacts. Design-preview fixture files under `.claude/` are explicitly excluded; they are not public portfolio endpoints.
