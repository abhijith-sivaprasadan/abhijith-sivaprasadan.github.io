# Signal UI Kit — Website

A high-fidelity, interactive recreation of **Abhijith Sivaprasadan's portfolio
website** (the live `signal-rebuild` theme). Use these components to assemble
on-brand pages, mocks and prototypes. They are cosmetic recreations — simplified
behaviour, pixel-accurate look — not the production code.

## Run it
Open `index.html`. It renders the home page as a working demo:
- **Audience-lens switch** (Thermal / Energy / Industrial / Research) re-tints the
  entire document and swaps the hero claim + lead copy.
- **Project bento** cards open a slide-in detail drawer.
- **Experience rail** — click a stop to change the role detail.
- **Contact** form has a fake submit state; scholar-link cards.

## Load order
React + ReactDOM + Babel (pinned), then `colors_and_type.css` + `kit.css`, then the
JSX files, then the inline `App`. Each JSX file exports its components to `window`
(separate Babel scopes don't share scope otherwise).

## Components
| File | Exports | Notes |
|------|---------|-------|
| `Bits.jsx` | `Button`, `Eyebrow`, `Tag`, `KpiTile`, `LensToggle`, `TypedCycle`, `LENSES` | Primitives. `Button` variants: `primary` / `secondary` / `ghost`, size `sm`. |
| `Header.jsx` | `StatusBanner`, `SiteHeader` | Pulsing-dot banner + sticky blurred mono nav. |
| `Hero.jsx` | `Hero`, `InstrumentPanel`, `HERO_COPY` | Asymmetric hero; right column is an animated CFD instrument SVG. |
| `SignalRail.jsx` | `SignalRail` | Telemetry KPI strip with a scan-line sweep. |
| `Projects.jsx` | `Projects`, `PROJECTS` | Bento grid (featured 2×2) + slide-in drawer. |
| `Experience.jsx` | `Experience`, `ROLES` | Selectable horizontal timeline rail. |
| `Contact.jsx` | `Contact`, `Footer`, `ScholarCard` | Scholar tiles, contact card, footer. |

## Conventions to preserve
- **Lens state lives in `App`** and is mirrored to `document.body.dataset.lens`,
  which re-tints `--green`. Keep one primary accent at a time.
- All **chrome text is mono uppercase**; prose is Inter. Eyebrows are amber.
- Buttons are `6px` radius, mono uppercase, lift on hover with an accent glow.
- The **instrument palette** (blue/teal/orange/amber on navy) is confined to the
  hero diagram and KPI tiles — never used on UI chrome.
- Diagrams come from `../../assets/thumb-*.svg`. Reference them; never redraw.

## Not included (intentionally blank)
The live site has interactive long-read case studies (Biot calculator, 3D reducer
viewer, animated CFD story panels) and a Sanity-backed admin editor. Those are
out of scope for a UI kit — stub or omit them rather than inventing new designs.
