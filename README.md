# Abhijith Sivaprasadan Portfolio

Static GitHub Pages portfolio for thermal-fluid engineering, gas turbine CFD/CHT, test instrumentation, energy management and energy systems modelling applications.

## Academic homepage, application tracks and skill evidence — August 2026

The landing page now leads with research interests, the published KTH/Siemens thesis, six selected research-software projects, experience, education, and direct GitHub/LinkedIn/CV links. Eight [skill dossiers](skills/index.html) group related public projects, roles, coursework, certifications and supporting resources. Duplicate imported project records are consolidated by case-study URL. No self-assessed scores are shown.

The separate [Choose a track](tracks/index.html) layer offers five stable application endpoints. Each has a distinct introduction, curated project selection, ordered professional experience, relevant skill dossiers, education and public supporting resources. The homepage remains the full overview. Share a track's URL directly; the recipient does not need to select a filter or have a saved preference.

| Track | Shareable endpoint | Focus |
| --- | --- | --- |
| General | [/tracks/general.html](https://abhijith-sivaprasadan.github.io/tracks/general.html) | Cross-disciplinary engineering overview |
| Thermal Engineering | [/tracks/thermal.html](https://abhijith-sivaprasadan.github.io/tracks/thermal.html) | CFD/CHT, instrumentation and thermal methods |
| Energy Modelling | [/tracks/energy-modelling.html](https://abhijith-sivaprasadan.github.io/tracks/energy-modelling.html) | Power, heat, flexibility, optimisation and industrial energy |
| Software | [/tracks/software.html](https://abhijith-sivaprasadan.github.io/tracks/software.html) | QBurst backend experience and public engineering software |
| Research / PhD | [/tracks/research.html](https://abhijith-sivaprasadan.github.io/tracks/research.html) | Research interests, thesis, publications and methods |

Live Lens, Evidence Lens, radar, the old stateful track-filter runtime, canvas simulations, CMS/API hydration and the legacy `site.js`/motion stack are **intentionally not loaded on the homepage, track pages or skill pages**. This is documented in the generated HTML. Legacy modules remain for existing pages and recovery through version history. Track selection uses ordinary page links, not the old lens/filter system. Core content and navigation are static and work without JavaScript. A small script handles theme preference and one-shot native entrance animations, observed only until each element enters the viewport. Reduced-motion preferences bypass/cancel these animations; there are no continuous animation loops or scroll handlers. No external fonts or frameworks are requested by these pages.

These pages use a modern, research-focused light/dark theme in `styles/academic.css`: strong sans-serif typography, soft cards, a translucent header, smooth anchor navigation and restrained hover/reveal transitions. This is independent of the legacy design tokens below. Existing detailed case studies remain intact. The project capabilities and scientific claims are unchanged; coursework, internships, exploratory tools and validated results must remain distinguishable.

### Editing and validation

- Edit homepage/page templates in `scripts/build-academic.cjs`, not generated HTML.
- Edit skill relationships in `scripts/data/skill-evidence.cjs`. Project, course, experience and certification text comes from the corresponding public `api/*.json` indexes. The structural-FEA case study has a documented supplemental record until included in that project index.
- Edit track introductions, public-record selections and supporting links in `scripts/data/portfolio-tracks.cjs`. Keep URLs stable for applications. Do not add employer-specific or private documents as generic track resources; the software track deliberately links to professional evidence and public code rather than an unrelated CV.
- Rebuild with `node scripts/build-academic.cjs` whenever those source records change.
- Run `node scripts/build-academic.cjs --check`, `node scripts/validate-academic.cjs`, and `node scripts/validate-static.cjs`. CI runs all three.
- Check the homepage, track directory, track pages and a skill page at desktop and mobile widths, in light and dark modes. Verify keyboard navigation, selected-track state, section links and case-study links. The regression script checks all five track selections, distinct metadata, navigation, fragments and scientific-limitations copy.
- Publish via a focused branch and pull request, wait for CI, merge, and verify the GitHub Pages deployment. Do not stage scratch/private files such as `profile_snapshot.md`.

## Latest project delivery — GB-FLEXABM v0.3

The [GB-FLEXABM case study](projects/gb-flexabm.html) now documents 804 pinned Elexon training responses and the actual failed price/generation coverage gates, alongside bounded ERA5 acquisition and the local GUI. No training price year is complete; legacy archive access or a reviewed missingness policy is required before fitting. The full historical bundle, weather conversion, institutions and independent evaluation remain pending. S3–S5 utilities are not presented as completed empirical stages, and the original v0.1 reference results remain unchanged. See the [source findings and unresolved decision](https://github.com/abhijith-sivaprasadan/gb-flexabm/blob/main/docs/MARKET_DATA.md) and [complete data checklist](https://github.com/abhijith-sivaprasadan/gb-flexabm/blob/main/docs/HISTORICAL_DATA.md).

The GUI runs locally (`uv run --locked --extra gui gbflex gui` in the model repository); GitHub Pages does not execute Python. Each future project milestone must update its model README, this portfolio README, the case study and relevant discovery summaries, then pass checks and be pushed with CI/Pages publication verified. See `AGENTS.md`.

## Design system tokens (UI lock)

Use these defaults when adding or editing UI so pages stay visually consistent:

- Color system:
  - Primary accent: `#1f4f73`
  - Secondary accent: `#2f6b83`
  - Surface dark: `#121820`
  - Border dark: `rgba(255,255,255,0.09)`
- Radius and container:
  - Global radius: `16px`
  - Max content width: `1120px`
- Spacing rhythm:
  - `--space-1: 8px`
  - `--space-2: 12px`
  - `--space-3: 16px`
  - `--space-4: 20px`
  - `--space-5: 28px`
  - `--space-6: 40px`
  - `--space-7: 56px`
- Typography:
  - `h1`: `clamp(2.05rem, 3.6vw, 3.1rem)`
  - `h2`: `clamp(1.55rem, 2.5vw, 2.2rem)`
  - `h3`: `clamp(1.08rem, 1.6vw, 1.22rem)`
  - Body text: `1rem` with line-height around `1.58–1.62`
- Thumbnail spec:
  - Aspect ratio: `16:9`
  - Use `object-fit: cover`
  - Keep a single frame style: dark panel + subtle border + monospace labels
  - Avoid rainbow accents; use primary/secondary with one support highlight only

## Local editing

Open this folder in VS Code and edit:

- `scripts/build-academic.cjs` for the generated academic homepage and skill pages
- `styles/academic.css` for the homepage and skill-page theme
- `styles.css` for styling
- `projects/*.html` for individual project case studies
- `experience/*.html` for individual experience pages
- `api/certifications.json` for the read-only certifications data endpoint
- `backend/data/*.json` for REST API-backed editable data
- `admin.html` for the backend record editor
- `downloads/` for role-specific CV PDFs. The homepage expects title-led CV cards for gas turbine CFD, test/instrumentation, energy coordination and PhD tracks.
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
