# Abhijith Sivaprasadan Portfolio

Static GitHub Pages portfolio for thermal-fluid engineering, gas turbine CFD/CHT, test instrumentation, energy management and energy systems modelling applications.

## Local editing

Open this folder in VS Code and edit:

- `index.html` for the homepage
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

Use Google sign-in or paste the same `ADMIN_API_TOKEN` value into the admin page to create, update and delete backend records. Public "Manage" links use hashes such as `admin.html#projects` so the admin page opens the relevant collection after connecting.

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
