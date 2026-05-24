# v4 Verification + Handoff Runbook

Branch: `feat/v4-research-grade-bold`
Current cache version: `?v=20260525-v4-w6`

This document is a checklist for the runtime verification that can't run
inside the assistant environment, plus everything that still needs
human configuration (Sanity, Cal.com, ORCID, Scholar URLs, etc.).

---

## 1. Static checks — already passing ✅

- [x] All 30 v4 JS modules pass `node --check`
- [x] All 5 Sanity schemas valid
- [x] `cv.json` is valid JSON
- [x] `sw.js` syntactically clean
- [x] No duplicate IDs in the autoload subsystem list

---

## 2. Runtime checks you need to run

### 2.1 Local smoke test (5 minutes)
```bash
# From repo root, with Python (or any static server):
python -m http.server 5173
# Then open http://localhost:5173 in Chrome
```

Walk through:
- [ ] Hero — does the fluid sim render? (Either Eulerian or particle.)
- [ ] Toggle home-mode (Thermal/Energy/Decarb/Research) — does the
      fluid sim re-mode, obstacles change?
- [ ] Theme toggle — does the radial wipe play? Charts repaint?
- [ ] Scroll the homepage — does the scrollytelling thesis section pin
      and play through the 5 beats?
- [ ] Open `projects/siemens-thesis.html` — does the 3D reducer viewer
      render? Drag it. Click the toggle pill. Press T.
- [ ] Reading-progress bar on case studies — does it track scroll?
- [ ] EN | SV toggle — does Swedish kick in?
- [ ] Service Worker — second load offline (Chrome DevTools → Network →
      Offline) should still show pages from cache.

### 2.2 Lighthouse audit
```bash
# In Chrome DevTools → Lighthouse → Analyze
```
Targets:
- [ ] Performance ≥ 85
- [ ] Accessibility ≥ 95
- [ ] Best Practices ≥ 95
- [ ] SEO ≥ 95

If Performance < 85:
- Disable the fluid sim (set `data-motion-fluid-sim` to a non-existent
  attribute on body for testing) and re-measure. The fluid sim is the
  most expensive feature; we can dial back the grid or disable on
  low-end devices.

### 2.3 axe DevTools accessibility scan
```bash
# Install: https://www.deque.com/axe/devtools/
# Run on every page type:
#   - Homepage
#   - Siemens thesis case study
#   - Research page
#   - Projects index
```
Targets:
- [ ] Zero serious or critical issues
- [ ] Moderate issues triaged

### 2.4 Browser matrix
- [ ] Chrome latest (this is the dev target)
- [ ] Firefox latest — confirm view-transitions fallback path works
      (View Transitions is partially supported)
- [ ] Safari latest — same; Service Worker should still cache
- [ ] Edge latest

### 2.5 Mobile pass
- [ ] Chrome DevTools mobile preset (iPhone 14 Pro, Galaxy S22)
- [ ] Touch targets ≥ 44×44 px on nav, CTAs, bento tiles
- [ ] Scroll-rail hidden on < 980 px
- [ ] Custom cursor disabled on touch (motion-touch class on `<html>`)
- [ ] Scrollytelling collapses gracefully (currently stacks beats)

### 2.6 Reduced-motion pass
- macOS: System Settings → Accessibility → Display → Reduce Motion ✅
- Windows: Settings → Accessibility → Visual effects → Animations OFF

With reduced motion on:
- [ ] Hero fluid sim renders a static frame and freezes (or doesn't render)
- [ ] No magnetic pull on buttons
- [ ] No entrance bootup overlay; pages land instantly
- [ ] Scrollytelling shows final beat statically
- [ ] Bento previews are hidden
- [ ] Custom cursor disabled
- [ ] Audio never auto-plays

### 2.7 Audio engine check
- [ ] Audio toggle in the nav is OFF by default
- [ ] Clicking it plays a small confirmation chime
- [ ] Hover over a CTA — quick tick
- [ ] Mode switch — drone tone keyed to mode
- [ ] Theme toggle — whoosh
- [ ] Form submit — rising sweep + chime
- [ ] Chrome DevTools → Console → no autoplay-policy warnings

---

## 3. Configuration still required

These items work today with placeholders. Replace before going live.

### 3.1 Sanity CMS — to enable the editing UI
```bash
cd sanity
npm install
npx sanity init
# → choose "Create new project" → name "abhijith-portfolio"
# → dataset "production"
```
Then edit two files:
- `sanity/sanity.config.js` → replace `REPLACE_WITH_SANITY_PROJECT_ID`
- `scripts/public-config.js` → replace `REPLACE_WITH_SANITY_PROJECT_ID`
  inside `PORTFOLIO_CMS_CONFIG`

Run the Studio:
```bash
cd sanity
npx sanity dev          # local at http://localhost:3333
npx sanity deploy       # hosted at <slug>.sanity.studio (free)
```

### 3.2 Cal.com booking slot
- Sign up at https://cal.com (free)
- Replace placeholder URL in `index.html` (search for `cal.com/abhijithsivaprasadan/20min`)

### 3.3 ORCID + Google Scholar profiles
- Register at https://orcid.org (free, ~5 min)
- Create a Google Scholar profile (free)
- Replace placeholder URLs in:
  - `research.html` (scholar-card-grid section, data-orcid-placeholder
    + data-scholar-placeholder cards)
  - `index.html` (Person schema `sameAs` array)
  - `cv.json` (sameAs + `_meta` if needed)
  - `projects/siemens-thesis.html` (ResearchProject schema)

### 3.4 KTH profile slug
- Replace `kth.se/profile/asivap` in `research.html` with your actual
  KTH profile URL.

### 3.5 Author photos for testimonials
- The letter-viewer dialog has a slot for author photos. Currently
  blank. Once you have Sanity set up, upload photos through the Studio's
  `testimonial` documents.

### 3.6 Replace the citation_author year if the actual defence is in 2026
- `projects/siemens-thesis.html` — citation_publication_date is set
  to 2026.
- `cv.json` and the ResearchProject schema use the same.
- Update if the actual KTH DiVA publication metadata differs.

---

## 4. What was actually built (final tally)

### Motion modules — 18 in `scripts/motion/`
audio.js · chips.js · cursor.js · entrance.js · fluid-sim.js ·
fluid-sim-eulerian.js · fluid-sim-worker.js · i18n.js · index.js
(bootstrap) · katex.js · looking-for.js · reading-progress.js ·
scroll-rail.js · scrollytelling.js · springs.js · sw-register.js ·
theme-wipe.js · transitions.js

### Section modules — 10 in `scripts/sections/`
bento-previews.js · bento-projects.js · biot-calculator.js ·
cinematic-timeline.js · evidence-graph.js · letter-viewer.js ·
reducer-3d-viewer.js · research-mindmap.js · skill-radar.js ·
step-form.js

### CMS client — 2 in `scripts/cms/`
sanity-client.js (SDK-free Sanity query client) ·
hydrate.js (region hydrator for Looking-for, ideas, research, testimonials)

### Sanity Studio — `sanity/`
- Config + 5 schemas (idea, project, researchStatus, testimonial, lookingFor)
- package.json (sanity 3.55, react 18.3, styled-components 6.1)
- README.md (setup + daily-use instructions)

### CSS layer — `styles/` (24 files)
- v4.css (manifest)
- tokens.css, base.css, print.css, motion.css
- components/ (11 files): bento-previews, biot-calculator, bootup,
  content-visibility, form, i18n-toggle, looking-for, modal,
  reading-progress, reducer-3d, scholar-card
- sections/ (8 files): evidence-map, experience, projects,
  research-mindmap, scrollytelling, skills, testimonials, typography
- scenes/ + modes/ — directories present, not yet populated (planned
  for incremental migration of legacy scene-specific rules)

### Service Worker
- sw.js with network-first HTML, cache-first assets, cache-first CDN.
- Shell precache + runtime cache, version-keyed cleanup.

### Schema.org + SEO
- Person schema enriched (givenName, image, languages, alumniOf array,
  worksFor, full knowsAbout).
- ResearchProject + Thesis schemas on siemens-thesis.html.
- citation_* meta tags for Google Scholar indexing.
- /cv.json machine-readable Person/CV endpoint.

### i18n
- en + sv locale system, data-i18n-sv attributes on nav + hero kicker.
- Dictionary + browser-language detection + localStorage persistence.

### Typography
- Inter Variable + JetBrains Mono.
- Variable-weight axis on heading hover (540 → 640).
- 1.250 modular scale.

---

## 5. Out of scope (intentional)

- AVIF image generation: deferred (heavy compute, marginal gain over WebP).
- Critical CSS inlining: deferred (needs build step; v4.css imports are
  already small enough to inline manually if needed).
- WebAssembly OpenFOAM solver: out of scope for this push; would be a
  multi-week project on its own.
- Full migration of styles.css into the modular layer: the additive layer
  works; full migration is a separate refactor.
- Color-blind palette audit: not run.

---

## 6. Rollback plan

If something breaks badly on the live site:

```bash
git checkout feat/v4-research-grade-bold
git revert <bad-commit>
git push origin feat/v4-research-grade-bold
```

Or, to instantly remove the v4 layer while keeping all the new files:

In every HTML file, change:
```html
<link rel="stylesheet" href="styles/v4.css?v=..." />
```
to:
```html
<!-- <link rel="stylesheet" href="styles/v4.css?v=..." /> -->
```

The site reverts to the v3 visual + interaction layer instantly because
the v4 layer is purely additive.
