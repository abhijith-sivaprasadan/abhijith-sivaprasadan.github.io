# Deployment

This repository is split into a static frontend and a Node REST API backend.

## Environments

| Branch | Purpose | Deployment |
| --- | --- | --- |
| `main` | Production | GitHub Pages frontend and production Render API |
| `beta` | Pre-production review | Optional beta frontend/API for final checks before production |
| `dev` | Integration | Optional dev frontend/API for active changes |
| `feature/*` | Short-lived work | Open a pull request into `dev` |
| `fix/*` | Short-lived fixes | Open a pull request into `dev`, `beta`, or `main` depending on urgency |
| `hotfix/*` | Production fixes | Open a pull request directly into `main`, then back-merge to `beta` and `dev` |
| `special/*` | Experiments or one-off variants | Keep separate until the work is ready for a normal branch |

## Promotion Flow

1. Build new changes on `feature/<name>` or `fix/<name>`.
2. Merge to `dev` after CI passes.
3. Promote `dev` to `beta` when the website and admin API are ready for review.
4. Promote `beta` to `main` for production.
5. After a production hotfix, merge `main` back into `beta` and `dev`.

## Production Persistence

The backend uses JSON files locally by default. In production, set `DATABASE_URL` to a Postgres database so admin edits survive Render restarts and redeploys.

Required Render environment variables:

```text
DATABASE_URL=<postgres-connection-url>
DATABASE_SSL=true
FIREBASE_PROJECT_ID=abhijith-sivaprasadan
ADMIN_EMAIL_HASHES=<comma-separated-sha256-email-hashes>
FRONTEND_ORIGIN=https://abhijith-sivaprasadan.github.io
```

When `DATABASE_URL` is present, the API stores every collection in Postgres. On first read, it seeds missing database collections from the committed JSON files in `backend/data`.

## Branch Protection

Configure these rules in GitHub repository settings:

| Branch | Recommended Rules |
| --- | --- |
| `main` | Require pull request, require CI, block force pushes, block deletion |
| `beta` | Require pull request and CI |
| `dev` | Require CI before merge |

GitHub CLI is not installed in this workspace, so these repository settings must be applied in GitHub unless a token-enabled CLI is added later.
