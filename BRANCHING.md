# Branching Strategy

This repo uses a small environment-branch workflow for the portfolio frontend and REST API backend.

## Long-lived branches

| Branch | Purpose | Deploy target |
| --- | --- | --- |
| `main` | Production-ready code. GitHub Pages and Render should deploy from here. | Production |
| `beta` | Pre-production validation branch for changes that are ready for final testing. | Optional beta/staging deployment |
| `dev` | Integration branch for active work before beta testing. | Optional development deployment |

## Short-lived branches

Create these from `dev` unless the branch is a production hotfix.

| Pattern | Use |
| --- | --- |
| `feature/<short-name>` | New public UI, backend, admin or content features |
| `fix/<short-name>` | Non-urgent bug fixes |
| `hotfix/<short-name>` | Urgent production fixes, branched from `main` |
| `special/<short-name>` | One-off experiments, migrations, design spikes or risky work |

## Flow

Normal work:

```text
feature/* -> dev -> beta -> main
```

Production hotfix:

```text
hotfix/* -> main
hotfix/* -> dev
hotfix/* -> beta
```

Special cases:

```text
special/* -> dev
```

Only merge a `special/*` branch when the experiment is meant to become real product work. Otherwise delete it after review.

## Rules

- Keep `main` deployable at all times.
- Do not commit directly to `main` for normal work.
- Require CI before merging into `main`, `beta`, or `dev`.
- Use pull requests for `dev -> beta` and `beta -> main` when working through GitHub.
- Delete short-lived branches after merge.
- Put secrets only in Render/Firebase/GitHub settings, never in branches.
- If a backend data change must go live immediately, treat it as a hotfix.

## Protection

Recommended GitHub branch protection:

| Branch | Rules |
| --- | --- |
| `main` | Require pull request, require CI, block force pushes, block deletion |
| `beta` | Require pull request, require CI |
| `dev` | Require CI |

See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment environment details and production database persistence.

## Local commands

Start a feature:

```powershell
git checkout dev
git pull origin dev
git checkout -b feature/project-card-preview
```

Promote to beta:

```powershell
git checkout beta
git pull origin beta
git merge dev
git push origin beta
```

Promote to production:

```powershell
git checkout main
git pull origin main
git merge beta
git push origin main
```

Create an urgent production fix:

```powershell
git checkout main
git pull origin main
git checkout -b hotfix/admin-save-error
```
