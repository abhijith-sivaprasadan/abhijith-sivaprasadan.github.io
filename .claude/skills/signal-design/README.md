# Signal — Design System

The visual + content design system for **Abhijith Sivaprasadan's** professional
portfolio: a research-facing engineering site for a thermal-fluid / energy-systems
engineer. The aesthetic is a dark **scientific instrument console** — monospace
telemetry, CFD/thermal schematics, KPI badges and a calm, evidence-first voice.

This folder lets a design agent generate on-brand interfaces, slides, mocks and
assets that look and read like the real site.

---

## What this product is

A single-author technical portfolio for **Abhijith Sivaprasadan**, an M.Sc.
Sustainable Energy Engineering candidate at **KTH Royal Institute of Technology**
(Stockholm/Solna, Sweden) who completed a thesis embedded at **Siemens Energy
Finspång**. The site is aimed at PhD admissions committees and industrial R&D
hiring managers across Sweden and the EU.

The content is organised around four **audience "lenses"** that re-tint and
re-frame the same evidence base:

| Lens | Accent | Focus |
|------|--------|-------|
| **Thermal & Fluid** | teal `#65d6c9` | High-temperature CFD/CHT, compressible flow, test-rig validation |
| **Energy Systems** | green `#9bd69f` | IDA ICE, HOMER Pro, LEAP, Python/PuLP optimisation, forecasting |
| **Industrial R&D** | amber `#d7b46a` | KPI/EnPI methods, metering logic, decarbonisation decision-support |
| **Research** | blue `#8fb7ff` | Conjugate heat transfer, surface-condition effects, experimental-numerical methods |

The shared anchor across all lenses is the **Siemens Energy thesis**
(*Numerical Investigation of Steady-State Thermo-Fluid Performance of a Reducer
for a High-Temperature Dynamic Pressure Sensor Calibration Rig*, TRITA-ITM-EX 2026:14).

### Surfaces (products) represented
- **Marketing / portfolio website** — the primary product. Hero with audience-lens
  switch, project bento grid, capability radar, experience timeline, case studies,
  contact. Built as a static site (HTML/CSS/vanilla JS + GSAP motion).
- **Case-study / long-read pages** — per-project deep dives with reading progress,
  interactive calculators (e.g. Biot number), 3D viewers and animated CFD story panels.

There is also a small **Sanity CMS** and a **Node backend** powering project data
(`api/*.json`) — not design surfaces, but the source of the project copy.

---

## Sources (for the reader — you may or may not have access)

- **GitHub repo:** <https://github.com/abhijith-sivaprasadan/abhijith-sivaprasadan.github.io>
  — the full static site. Explore this for the deepest fidelity: `styles.css`
  (8.9k lines, the canonical token + component sheet), `styles/v4.css` (the "v4"
  instrument layer), `styles/tokens.css`, the `projects/*.html` case studies and
  `api/*.json` content.
- **Live site:** <https://abhijith-sivaprasadan.github.io/>
- **Local codebase** (read-only mount during build): `abhijith-sivaprasadan.github.io/`

> The active site body carries the classes `signal-rebuild future-v3` — i.e. the
> **"Signal Deck Rebuild (2026-05)"** theme is the live one. This design system
> documents *that* theme. Older themes (a warm `#ff6a4a` orange variant, GitHub-dark,
> etc.) exist in `styles.css` but are superseded; ignore them unless asked.

---

## CONTENT FUNDAMENTALS

How the brand writes.

**Voice.** Calm, precise, evidence-first. Engineering registry, not marketing
hype. Reads like a competent researcher's lab notebook turned outward. Every claim
is backed by a method, a number, or a named artefact.

**Person & address.** Mostly **third-person / impersonal** in framing copy
("The portfolio is organised around four tracks…", "The technical anchor is the
Siemens Energy thesis"). First-person **"I/my"** appears only in the genuinely
personal *Research* statement ("My interests are conjugate heat transfer in
thermally loaded passages…"). Rarely addresses the reader as "you"; instead it
addresses *readers* as a category ("built for CFD, heat-transfer… readers").

**Tone.** Understated and exact. It *quantifies instead of adjectives*: not
"highly accurate simulation" but "three-level mesh independence, Bi = 0.003–0.004".
Honest about scope — exploratory work is labelled as such ("PyPSA-NL is framed
transparently as an exploratory learning project").

**Casing.** Sentence case for headings and body. **UPPERCASE** is reserved for
mono UI chrome: eyebrows, nav, buttons, diagram labels, telemetry tags
(`PULSATORN RIG · CFD/CHT REDUCER`). Eyebrows are short noun phrases
("Current snapshot", "Portfolio map", "Licenses & certifications").

**Spelling.** British/European English ("optimisation", "decarbonisation",
"modelling", "metre"). The site is bilingual — many strings carry a Swedish
`data-i18n-sv` translation.

**Mechanics & motifs.**
- Heavy use of **proper nouns and identifiers**: tool names (ANSYS Fluent, IDA ICE,
  HOMER Pro, LabVIEW, NI-DAQ), standards (ISO 50001, k-omega SST), course codes
  (MJ2515), credential IDs, document IDs (TRITA-ITM-EX 2026:14).
- **Units always attached** to numbers (673 K, 100 kPa, 700°C, 30 ECTS, 115 hp).
- Middot `·` as an inline separator in meta lines and diagram captions.
- Em-dashes for asides; `→` arrows in CTAs ("View full course descriptions →").
- **No emoji. No exclamation marks. No emoji-style icons.** The energy is conveyed
  by density of real evidence, not punctuation.

**Example specimens.**
> *Eyebrow:* `CURRENT SNAPSHOT`
> *H2:* "Current technical direction"
> *Lead:* "Thermal-fluid engineer translating high-temperature heat-transfer and
> compressible-flow problems into CFD/CHT evidence, instrumentation context and
> physical design decisions."
> *Meta:* `M.Sc. Sustainable Energy Engineering · KTH 2026`
> *Status banner:* "Currently targeting PhD positions and industrial R&D roles in
> Sweden and the EU."
> *Diagram caption:* `ANSYS Fluent · k-omega SST · Conjugate Heat Transfer · Mesh Independence`

---

## VISUAL FOUNDATIONS

**Overall vibe.** A dark instrument console / oscilloscope. Green-black
background, hairline grid drifting behind content, monospace readouts, and
high-chroma technical diagrams that look like CFD post-processing exports. It
feels measured, engineered and a little nocturnal — never playful, never glossy.

**Color.** See `colors_and_type.css`. The page sits on a near-black green-tinted
`#070807`. Ink is a warm off-white `#f2f0e7` (not pure white). One **primary
accent at a time** — sage `--green #9bd69f` — which *shifts hue per active
audience lens* (teal / green / amber / blue). Amber `#d7b46a` is the standing
secondary (used for eyebrows). A separate, higher-chroma **instrument palette**
(blue/sky/teal/orange/amber/violet on navy) lives *inside diagrams and KPI
badges only* — keep it out of UI chrome.

**Type.** **Inter** (variable, optical sizing) for headings and body; **JetBrains
Mono** for all chrome — eyebrows, nav, buttons, labels, telemetry, captions. The
mono-everywhere-on-chrome / Inter-for-prose split is the single most recognisable
type signature. Headings use optical-size 28 and weight ~540; hero pushes to opsz
32 / wght 640 with tighter tracking. Tabular figures (`tnum`) for all numbers.

**Spacing & layout.** A `--max-width: 1180px` content column. An ambient 36px grid
drifts behind everything at low opacity. Generous vertical rhythm between sections
(`clamp(60px, 8vw, 110px)`). Asymmetric two-column hero (copy + instrument panel).
Project area uses a **bento grid** (featured card spans 2×2). Fixed elements: a top
status banner ("currently targeting…"), a sticky blurred header, a scroll-progress
bar, a skip link.

**Backgrounds.** No photos as backgrounds. Layered low-opacity **linear-gradient
washes** tinted by the active lens, plus **repeating 1px grid lines** (`36px`
pitch). Diagrams have their own navy gradient + dashed measurement gridlines. The
texture is *technical drafting paper*, not gradient-mesh.

**Imagery.** Custom **SVG instrument diagrams** — CFD reducer cross-sections, flow
vectors, thermal fields, KPI bars, radar charts — drawn in the instrument palette
with monospace annotations (`T = 673 K`, `Bi = 0.003–0.004`). Plus a single
photographic **headshot** (warm, neutral). Imagery skews **cool and schematic**;
the only warmth is the off-white ink and amber accents. No stock photography.

**Animation.** GSAP + ScrollTrigger. Restrained and purposeful: fades and short
translate-ups on entrance (`--ease-out` cubic-bezier(0.22,1,0.36,1)); a
spring (`cubic-bezier(0.34,1.56,0.64,1)`) only for KPI badges flying in. Signature
ambient motions: a **scan-line sweep** across rails, a **drifting grid**, a
**pulsing status dot**, animated **flow-advection dashes** in diagrams, and a
boot-up overlay on first load. Everything respects `prefers-reduced-motion`
(`html.motion-reduced` disables it all).

**Hover states.** Subtle. Buttons lift `translateY(-2px)` and gain a soft glow
ring in the accent color. Cards lift 1–2px and brighten their border toward the
accent (`border-color: color-mix(... var(--green) 50%, var(--line))`). Headings
*increase optical weight* on hover (opsz 28→32, wght 540→640) — a tactile,
type-led hover unique to this brand. Links underline-offset 3px.

**Press / active.** Light scale settle; buttons drop the lift. No heavy depress.

**Borders.** Hairline `1px solid var(--line)` (#2d3a31) everywhere — the dominant
structural device. Accent borders are made with `color-mix` toward the lens color.
Dashed borders mark *provisional / optional* zones (e.g. calendar embed slots).

**Radii.** **Small and technical.** Buttons `6px`, chips/panels `8px`, standard
cards `14px`, hero/feature `22px`, pills `999px`. Nothing is very round — the
crispness reads as engineered.

**Shadows / elevation.** Big, soft, low-opacity drop shadows for floating panels
(`0 18px 60px rgba(0,0,0,0.28)`, strong `0 28px 90px rgba(0,0,0,0.38)`). No inner
shadows in dark mode; light mode adds a subtle inset top highlight on letters.
Elevation is communicated by shadow + a brighter border, not by lightening fills.

**Cards.** Dark fill (a faint accent-tinted gradient over `#1d2027→#121318`),
1px line border, `14px` radius, big soft shadow. On hover: lift + accent border.
Featured/bento cards add an animated mini-chart or KPI bars pinned bottom-right.

**Transparency & blur.** Used deliberately: the header and floating chips use
`backdrop-filter: blur(12–18px)` over translucent fills; modal backdrops blur the
page. Panel fills are often `color-mix(... 80–92%, transparent)` so the grid shows
through faintly.

**Buttons.** Pill or `6px` rect, **mono uppercase** label. Primary = solid lens
color with near-black ink (`#071007`). Secondary = translucent dark fill with
off-white ink and a faint accent border. (See `ui_kits/website/Buttons.jsx`.)

---

## ICONOGRAPHY

The brand is **icon-light and diagram-heavy**. There is **no icon font** and **no
third-party icon library** (no Lucide/Heroicons/FontAwesome). Approach:

- **Inline hand-drawn SVG glyphs**, drawn to match the line work — thin
  `stroke-width: 1.2–1.4`, `currentColor`, 13–14px viewBoxes. Used sparingly: the
  hero audience-lens toggle (a thermal wave, a line chart, KPI bars, a magnifier),
  small UI affordances. These are simple geometric line icons, not detailed.
- **Brand mark / logo:** a teal **"A" monogram** in a rounded-square
  (`assets/favicon.svg` — teal `#65d6c9` chevron-A on navy `#07111f` with a blue
  underbar). The wordmark in the header is just the name set in **mono uppercase**
  ("ABHIJITH SIVAPRASADAN"). There is no separate graphical logo.
- **The real "iconography" is the diagram system** — full SVG instrument
  illustrations (`assets/thumb-*.svg`, `assets/card-*.svg`): CFD cross-sections,
  flow fields, thermal maps, grid/energy schematics. Each is a self-contained
  scientific figure with monospace labels and the instrument palette. These act as
  project thumbnails and section art. **Copied into `assets/`** — reference them
  directly; never redraw them.
- **External brand chips** (ORCID, Google Scholar, DiVA, LinkedIn, GitHub, KTH)
  render as small colored monogram tiles (solid brand-color square + 1–2 letter
  mono label), not real logos.
- **Unicode/typographic marks** stand in for icons in text: middot `·`, arrow `→`,
  status dot `●` (a pulsing `<span>`), `×` for dismiss.
- **No emoji anywhere.**

If you need a generic UI icon not present here, draw a minimal 1.3px-stroke
`currentColor` line glyph in a ~14px viewBox to match — or, if you must use a
library, Lucide is the closest match in stroke weight and **must be flagged** as a
substitution.

---

## Files in this folder (index)

- **`README.md`** — this file.
- **`colors_and_type.css`** — all color + type tokens (CSS custom properties) and
  semantic element styles. Import this first in any build.
- **`SKILL.md`** — Agent-Skill manifest so this folder works as a Claude skill.
- **`assets/`** — brand assets: `favicon.svg` (A monogram), `headshot.jpg/.webp`,
  and the instrument diagram SVGs (`thumb-*.svg`, `card-*.svg`).
- **`preview/`** — small HTML specimen cards that populate the Design System tab
  (color, type, components, spacing, brand). Not for production use.
- **`ui_kits/website/`** — high-fidelity recreation of the portfolio website:
  `index.html` (interactive demo) plus modular JSX components
  (header, hero, project bento, buttons, cards, footer, etc.). See its README.

### Quick start
```html
<link rel="stylesheet" href="colors_and_type.css" />
<!-- then use the tokens: var(--green), var(--font-mono), var(--radius), … -->
```

---

## CAVEATS / SUBSTITUTIONS
- **Fonts:** the source site loads **Inter** and **JetBrains Mono** from Google
  Fonts (no local `.ttf`/`.woff` in the repo), so this system links them from the
  Google Fonts CDN rather than bundling files. The CSS also *references*
  "Roboto" / "Roboto Mono" as fallbacks but never loads them — effective fonts are
  Inter + JetBrains Mono.
