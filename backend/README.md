# Portfolio REST API

Node REST API for portfolio data with public read endpoints and protected admin write endpoints.

## Run locally

```powershell
cd E:\abhijith-sivaprasadan.github.io\backend
$env:ADMIN_API_TOKEN="change-this-local-token"
npm run dev
```

Open:

```text
http://127.0.0.1:3000/health
http://127.0.0.1:3000/api
http://127.0.0.1:3000/api/certifications
```

Run the static frontend separately from the repo root:

```powershell
cd E:\abhijith-sivaprasadan.github.io
python -m http.server 8000 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8000/admin.html` and paste the same `ADMIN_API_TOKEN` to edit records.

## Collections

```text
GET    /api/certifications
GET    /api/projects
GET    /api/experience
GET    /api/courses
GET    /api/skills
GET    /api/:collection/:id
GET    /api/content
GET    /api/admin/session
POST   /api/:collection
PUT    /api/:collection
PUT    /api/:collection/:id
PATCH  /api/:collection/:id
DELETE /api/:collection/:id
PUT    /api/content
```

Write requests require:

```text
Authorization: Bearer <ADMIN_API_TOKEN>
```

Google admin login can also authorize write requests:

```text
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

## Deploy

Deploy the `backend` folder to Render, Railway, Fly.io or another Node host.

Set environment variables:

```text
PORT=3000
HOST=0.0.0.0
ADMIN_API_TOKEN=<long-random-token>
FRONTEND_ORIGIN=https://abhijith-sivaprasadan.github.io
DATA_DIR=/var/data
FIREBASE_PROJECT_ID=<firebase-project-id>
ADMIN_EMAIL_HASHES=<sha256-admin-email-hash>
DATABASE_URL=<postgres-connection-url>
DATABASE_SSL=true
DATABASE_CONNECTION_TIMEOUT_MS=10000
```

`DATABASE_URL` is recommended for production. When it is set, the API stores all collections in Postgres and seeds empty database collections from the committed JSON files in `backend/data`.

`DATA_DIR` is only used when `DATABASE_URL` is not set. Without a database, the API writes to JSON files. On many hosts that filesystem is ephemeral, so production edits may disappear after restarts or redeploys.

`DATABASE_CONNECTION_TIMEOUT_MS` is optional and defaults to `10000`.

## Render blueprint

The repository root includes `render.yaml`. On Render, create a new Blueprint from this GitHub repository and Render will use the `backend` folder as the Node service root.

Set `FIREBASE_PROJECT_ID`, `ADMIN_EMAIL_HASHES`, and `DATABASE_URL` in Render before using the admin page in production. `ADMIN_API_TOKEN` remains available as a fallback for local testing or emergency admin access.

After Render is updated, open:

```text
https://abhijith-portfolio-api.onrender.com/health
```

The response should include:

```json
{
  "ok": true,
  "service": "portfolio-api",
  "storage": "postgres"
}
```
