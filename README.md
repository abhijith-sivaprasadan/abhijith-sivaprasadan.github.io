# Abhijith Sivaprasadan Portfolio

Static GitHub Pages portfolio for thermal-fluid engineering, gas turbine CFD/CHT, test instrumentation, energy management and energy systems modelling applications.

## Work-first portfolio, application tracks and skill evidence — October 2026

The landing page now reflects completion of the KTH M.Sc. Sustainable Energy Engineering programme and the latest evidence base: the published KTH/Siemens thesis, Kerala2040 power-system resilience research, TES Discharge Screen, OpenSteamOpt and other research-software projects. Nuclear energy is presented as an emerging research direction rather than an established specialisation. A dedicated CET 2026 conference landing page provides a fast QR-friendly overview and routes visitors into the detailed portfolio. Eight [skill dossiers](skills/index.html) group related public projects, roles, coursework, certifications and supporting resources. Duplicate imported project records are consolidated by case-study URL. No self-assessed scores are shown.

The separate [Choose a track](tracks/index.html) layer offers five stable application endpoints. Each has a distinct introduction, curated project selection, ordered professional experience, relevant skill dossiers, education and public supporting resources. The homepage remains the full overview. Share a track's URL directly; the recipient does not need to select a filter or have a saved preference.

| Track | Shareable endpoint | Focus |
| --- | --- | --- |
| General | [/tracks/general.html](https://abhijith-sivaprasadan.github.io/tracks/general.html) | Cross-disciplinary engineering overview |
| Thermal Engineering | [/tracks/thermal.html](https://abhijith-sivaprasadan.github.io/tracks/thermal.html) | CFD/CHT, instrumentation and thermal methods |
| Energy Modelling | [/tracks/energy-modelling.html](https://abhijith-sivaprasadan.github.io/tracks/energy-modelling.html) | Power, heat, flexibility, optimisation and industrial energy |
| Software | [/tracks/software.html](https://abhijith-sivaprasadan.github.io/tracks/software.html) | QBurst backend experience and public engineering software |
| Research / PhD | [/tracks/research.html](https://abhijith-sivaprasadan.github.io/tracks/research.html) | Research interests, thesis, publications and methods |

Live Lens, Evidence Lens, the old scored radar, the decorative field atlas, the old stateful track-filter runtime, canvas simulations, CMS/API hydration and the legacy `site.js`/motion stack are **intentionally not loaded on the homepage, track pages or skill pages**. The replacement radar is ordinary SVG navigation. Its five axes count explicit selected work examples in `scripts/data/track-radar.cjs`; each row expands to list those examples. The outer ring uses the largest count across all tracks, so track comparisons share the same scale. These are curated coverage counts, not proficiency ratings or the complete record. SVG labels and the expanded rows link to skill dossiers with related work and education; the software backend axis links to the QBurst role. A small script handles theme preference, entrance motion, the active section marker and keyboard-operable track tabs. There is no autoplay timer, canvas, animation-frame loop or scroll listener on these pages. Reduced-motion preferences remove nonessential motion. No external fonts or frameworks are requested by these pages.

The homepage opens with a personal engineering statement and an interactive five-track radar for General, Thermal, Energy Modelling, Software and Research/PhD applications. Each track offers clickable skill labels, inspectable work examples, its shareable endpoint and matching CV. Selected projects follow, then the separate application-track directory, research interests, skill dossiers, experience, education and direct contact. Keyboard-operable tabs use short, cancellable fades; image hover, entrance and native page/theme transitions provide motion without autoplay. Small screens stack the radar and project cards, wrap track controls and retain touch-friendly navigation. `styles/portfolio.css` supplies a shared warm cream, forest and terracotta palette, serif display typography and restrained surfaces over the structural layouts in `styles/academic.css`. Existing scientific claims remain unchanged; coursework, internships, exploratory tools and validated results remain distinguishable.

All 35 canonical projects and ten public experience records have dedicated vector covers. They use coordinated isometric engineering scenes with project-specific titles and concepts, including hydro/network infrastructure, heat-transfer geometries, storage systems, steam plants, software interfaces, structural screening and mechanical designs. `scripts/data/portfolio-art.cjs` is the art manifest and `scripts/build-portfolio-art.cjs` generates 84 covers and compatibility assets. Illustrations are explicitly labelled as concepts; original laboratory photographs, meshes, scientific figures and measured-result evidence stay in the case studies. Public project/experience indexes, static library cards, skill dossiers, track pages and experience pages use the same covers. The first project card's grid sizing is corrected to prevent image/text overlap.

CV routing is explicit: General, Energy Modelling and Software use the modelling CV; Thermal Engineering uses the thermal/process CV; Research/PhD uses the research CV. The public CV metadata and legacy research/energy entry points use the same three files.

## Unified public endpoints — October 2026

All 50 older public endpoints and 16 generated homepage, track and skill pages load the same `styles/portfolio.css` art direction. The legacy endpoints retain structural compatibility through `styles/unified.css` and `scripts/unified-shell.js`. Navigation consistently exposes Work, Research, Experience, Expertise, Tracks and Contact. Flat editorial headers, consistent spacing, light/dark themes, native transitions and responsive controls replace the competing hero grids and decorative orbital elements. Authored content and specialist charts are preserved. Mobile navigation is horizontally scrollable rather than compressed. The 11 long-form research case studies retain a focused dual-theme reading system: a warm white-paper surface in light mode and a high-contrast dark-paper surface in dark mode, including coordinated panels, tables, figures, equations and citations. `scripts/public-config.js` loads the legacy layer before the portfolio stylesheet; `404.html` loads it directly. The conference microsite and standalone scientific chart assets retain their specialist layouts.

The legacy Live Lens, Evidence Lens, skill radar, ambient canvas, audio and CMS hydration subsystems remain intentionally excluded from the public motion autoloader. Useful bounded interactions—page transitions, reading progress, mathematics, the Biot calculator, language controls and the reducer viewer—remain available. The unified shell adds cancellable one-shot entrance motion and fine-pointer card lighting; both respect reduced-motion preferences and add no continuous scroll work.

The Siemens experience chronology is maintained across the homepage, experience detail, case study, CET profile, skill dossiers and application tracks: the measurement chain was commissioned for a planned campaign up to 700°C, but heater failure occurred before high-temperature testing began. The same clause is maintained in `api/linkedin-experience.json` and `backend/data/experience.json`. `scripts/validate-unified-ui.cjs` rejects wording that implies a completed or interrupted campaign, so generated pages cannot restore the obsolete claim.

### Editing and validation

- Edit homepage/page templates in `scripts/build-academic.cjs`, not generated HTML.
- Edit skill relationships in `scripts/data/skill-evidence.cjs`. Project, course, experience and certification text comes from the corresponding public `api/*.json` indexes. The structural-FEA case study has a documented supplemental record until included in that project index.
- Edit track introductions, public-record selections and supporting links in `scripts/data/portfolio-tracks.cjs`. Keep URLs stable for applications. Do not add employer-specific or private documents as generic track resources. The software track uses the public modelling CV alongside professional evidence and public code.
- Rebuild with `node scripts/build-academic.cjs` whenever those source records change.
- Rebuild concept covers with `node scripts/build-portfolio-art.cjs`; use `--sync-covers` only when migrating public record image paths. Run `node scripts/build-portfolio-art.cjs --check` to verify the art manifest covers all projects/roles and generated assets are current. CI runs this check.
- Run `node scripts/build-academic.cjs --check`, `node scripts/validate-academic.cjs`, and `node scripts/validate-static.cjs`. CI runs all three.
- Run `node scripts/validate-unified-ui.cjs` after changing the shared legacy shell, public endpoint inventory, motion autoload list or Siemens experience wording.
- Check the homepage, track directory, track pages and a skill page at desktop and mobile widths, in light and dark modes. Verify keyboard navigation, selected-track state, section links and case-study links. The regression script checks all five track selections, distinct metadata, navigation, fragments and scientific-limitations copy.
- Publish via a focused branch and pull request, wait for CI, merge, and verify the GitHub Pages deployment. Do not stage scratch/private files such as `profile_snapshot.md`.

## Latest project delivery — OpenSteamOpt v0.1

The [OpenSteamOpt case study](projects/opensteamopt.html) is now directly visible from the landing page and project library. The separate MIT-licensed repository combines a two-boiler HP/MP steam-and-power plant, carbon-aware Pyomo/HiGHS scheduling, an OpenModelica FMI 2.0 Co-Simulation path, a transparent Python shadow twin and a local Streamlit advisory GUI. Its locked acceptance record is 29 passing tests, clean Ruff/mypy checks, byte-identical replay of all 12 reference files and a real 1,441-sample FMU integration run. The synthetic scenario differences are software regression evidence—not plant-savings claims. It is independent, not an ABB product or OPTIMAX clone, and has no DCS/OPC UA or live actuator connection. See the [source, evidence and reproduction instructions](https://github.com/abhijith-sivaprasadan/opensteamopt#readme).

The GUI runs locally (`uv sync --all-extras --frozen`, then `uv run streamlit run app_streamlit.py`); GitHub Pages hosts the static case study, not the Python application.

## GB-FLEXABM v0.3 data-acquisition delivery

The [GB-FLEXABM case study](projects/gb-flexabm.html) now documents 175 additional public source files acquired, mechanically extracted and rehashed (443.50 MiB), alongside 804 pinned Elexon responses, bounded ERA5 acquisition and the local GUI. The collection includes 114 carbon-auction reports, fuel/CPI/FX, costs, fleet and policy references. No APXMIDP training year is complete; IMRP starts in June 2016 and has not replaced that target or changed the study split. Raw inputs remain local, and later-period extraction/current revisions are disclosed as prior exposure. Semantic normalization, historical fleet/support reconciliation, weather conversion and the price-target decision remain S2 work; S3–S5 empirical stages are not complete. Original v0.1 results remain unchanged. See the [public-input inventory and limitations](https://github.com/abhijith-sivaprasadan/gb-flexabm/blob/main/docs/PUBLIC_INPUTS.md), [market-source findings](https://github.com/abhijith-sivaprasadan/gb-flexabm/blob/main/docs/MARKET_DATA.md) and [data checklist](https://github.com/abhijith-sivaprasadan/gb-flexabm/blob/main/docs/HISTORICAL_DATA.md).

The GUI runs locally (`uv run --locked --extra gui gbflex gui` in the model repository); GitHub Pages does not execute Python. Each future project milestone must update its model README, this portfolio README, the case study and relevant discovery summaries, then pass checks and be pushed with CI/Pages publication verified. See `AGENTS.md`.

## Shared portfolio design tokens

Use these defaults when adding or editing UI so pages stay visually consistent:

- Color system:
  - Light page / surface / ink: `#f6f3ec` / `#fffcf6` / `#202a29`
  - Light accent / supporting tint: `#9c421f` / `#e9ece2`
  - Dark page / surface / ink: `#151d1e` / `#202b2c` / `#f5efe2`
  - Dark accent / border: `#ffb68a` / `#3d4b48`
- Radius and container:
  - Card radius: `8–12px`; flat header and section dividers
  - Max content width: `1240px`; mobile gutters: `20px`
- Spacing rhythm:
  - `--space-1: 8px`
  - `--space-2: 12px`
  - `--space-3: 16px`
  - `--space-4: 20px`
  - `--space-5: 28px`
  - `--space-6: 40px`
  - `--space-7: 56px`
- Typography:
  - Display: Georgia / Times New Roman serif; body: system sans
  - Homepage headline: `clamp(3.8rem, 6.7vw, 6.5rem)`; mobile override in `portfolio.css`
  - Section headings: `clamp(2.1rem, 3.8vw, 3.4rem)`
  - Body text: `1rem` with line-height around `1.58–1.62`
- Thumbnail spec:
  - Aspect ratio: `16:9`
  - Use `object-fit: cover`
  - Use actual project imagery with descriptive alt text and a subtle border
  - Avoid rainbow accents; use primary/secondary with one support highlight only

## Local editing

Open this folder in VS Code and edit:

- `scripts/build-academic.cjs` for the generated academic homepage and skill pages
- `styles/portfolio.css` for the shared portfolio theme; `styles/academic.css` for generated-page layout primitives
- `styles.css` for styling
- `projects/*.html` for individual project case studies
- `experience/*.html` for individual experience pages
- `api/certifications.json` for the read-only certifications data endpoint
- `backend/data/*.json` for REST API-backed editable data
- `admin.html` for the backend record editor
- `downloads/` for the three public track CVs: modelling, thermal/process and research.
- `assets/thumb-*.svg` for project visuals and data-rich thumbnail figures

## Static API

GitHub Pages serves static JSON files, so profile data is exposed through read-only endpoints:

```text
/api/certifications.json
/api/linkedin-projects.json
/api/linkedin-experience.json
/api/courses.json
/api/skills.json
```

The About page fetches this JSON and renders the certifications client-side.

## REST API backend

A real Node REST API now lives in `backend/`. It is separate from GitHub Pages because GitHub Pages can only host static files.

You do not need to buy a domain for this. You can deploy the backend on a platform such as Render, Railway or Fly.io and use the provider URL, then point the GitHub Pages frontend at that URL.

Backend collections:

```text
GET    /api/certifications
GET    /api/projects
GET    /api/experience
GET    /api/courses
GET    /api/skills
GET    /api/content
GET    /api/admin/session
POST   /api/:collection
PUT    /api/:collection
PUT    /api/:collection/:id
PATCH  /api/:collection/:id
DELETE /api/:collection/:id
PUT    /api/content
```

Write requests require this header:

```text
Authorization: Bearer <ADMIN_API_TOKEN>
```

The same write endpoints also accept a Firebase Google ID token when the backend has `FIREBASE_PROJECT_ID` and admin email hashes configured.

## Localhost setup

Serve the folder over HTTP before testing API-backed sections. Browser `fetch()` calls usually fail when opening `about.html` directly from `file://`.

```powershell
cd E:\abhijith-sivaprasadan.github.io
python -m http.server 8000 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:8000/
http://127.0.0.1:8000/about.html
http://127.0.0.1:8000/api/certifications.json
```

Stop the server with `Ctrl+C` in the terminal that started it.

To run the REST API locally, open a second terminal:

```powershell
cd E:\abhijith-sivaprasadan.github.io\backend
$env:ADMIN_API_TOKEN="change-this-local-token"
$env:FRONTEND_ORIGIN="http://127.0.0.1:8000"
npm run dev
```

Backend URLs:

```text
http://127.0.0.1:3000/health
http://127.0.0.1:3000/api
http://127.0.0.1:3000/api/certifications
```

To make the frontend read from the REST API instead of static JSON:

```powershell
Copy-Item scripts/config.example.js scripts/config.js
```

Then set this in `scripts/config.js`:

```js
globalThis.PORTFOLIO_API_BASE_URL = "http://127.0.0.1:3000";
```

The live GitHub Pages site reads its production API URL from `scripts/public-config.js`.

Open the admin editor at:

```text
http://127.0.0.1:8000/admin.html
```

Use Google sign-in or paste the same `ADMIN_API_TOKEN` value into the admin page to create, update and delete backend records. The admin editor supports hashes such as `admin.html#projects` so you can open a specific collection directly.

## Admin login setup

The admin editor can use Firebase Google sign-in. The backend verifies the Google ID token before allowing insert, update, delete or full-collection write operations.

1. Create a Firebase project.
2. In Firebase Authentication, enable Google as a sign-in provider.
3. Add authorized domains:
   - `localhost`
   - `127.0.0.1`
   - `abhijith-sivaprasadan.github.io`
4. Copy the web app config from Firebase project settings.
5. Set these Render backend environment variables:
   - `FIREBASE_PROJECT_ID`
   - `ADMIN_EMAIL_HASHES`
6. Copy the example config for local testing:

```powershell
Copy-Item scripts/config.example.js scripts/config.js
```

7. Edit `scripts/config.js` and fill `globalThis.PORTFOLIO_AUTH_CONFIG`.
8. Generate the SHA-256 hash of each admin email and add it to backend `ADMIN_EMAIL_HASHES`:

```powershell
node -e "crypto.subtle.digest('SHA-256', new TextEncoder().encode('your.email@example.com'.toLowerCase())).then(b=>console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')))"
```

`scripts/config.js` is ignored by git, so local Firebase config is not committed by accident. Firebase web config is not a private server secret, but commit it deliberately only if you want Google admin login enabled on GitHub Pages:

```powershell
git add -f scripts/config.js
```

## Publish

Commit and push the frontend/backend repo:

```powershell
git add .
git commit -m "Update portfolio"
git push origin main
```

GitHub Pages URL:

```text
https://abhijith-sivaprasadan.github.io
```

## Deploy the REST API

The repo includes `render.yaml`, so Render can create the backend from the repository.

1. Push this repo to GitHub.
2. In Render, choose **New** > **Blueprint**.
3. Connect `abhijith-sivaprasadan/abhijith-sivaprasadan.github.io`.
4. Render will detect `render.yaml` and create `abhijith-portfolio-api`.
5. After deploy, copy the service URL, for example:

```text
https://abhijith-portfolio-api.onrender.com
```

6. Put that URL in `scripts/public-config.js` for the public GitHub Pages site:

```js
globalThis.PORTFOLIO_API_BASE_URL = "https://abhijith-portfolio-api.onrender.com";
```

7. Open `admin.html`, use the backend URL and the generated `ADMIN_API_TOKEN` from Render environment variables.

The current backend stores edits in JSON files. That is good for localhost and simple demos. For production editing that must survive restarts/redeploys, add persistent storage later with a Render disk, Supabase, Neon Postgres or another database.


### CET 2026 conference landing page

`/cet2026/` is a mobile-first TL;DR profile for QR/NFC sharing at CET 2026. It summarizes the work and routes visitors to the main portfolio, skill dossiers, application tracks, research statement, detailed project case studies, GitHub and LinkedIn rather than duplicating the full evidence base.
