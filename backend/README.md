# Portfolio REST API

Dependency-free Node REST API for the portfolio data.

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
POST   /api/:collection
PUT    /api/:collection/:id
PATCH  /api/:collection/:id
DELETE /api/:collection/:id
```

Write requests require:

```text
Authorization: Bearer <ADMIN_API_TOKEN>
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
```

`DATA_DIR` is optional. Without it, the API writes to `backend/data`. On many hosts that filesystem is ephemeral, so production edits may disappear after restarts or redeploys unless you attach persistent storage or move the data to a database.

## Render blueprint

The repository root includes `render.yaml`. On Render, create a new Blueprint from this GitHub repository and Render will use the `backend` folder as the Node service root.
