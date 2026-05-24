# Sanity CMS for the portfolio

Lightweight headless CMS for the dynamic content of the portfolio. Lives in a
separate folder so the static site stays buildable without any Node
dependencies.

## What lives in the CMS

| Schema | What it controls |
|---|---|
| `lookingFor` (singleton) | The "Looking for…" status banner that appears on every page. |
| `researchStatus` (singleton) | Research headline + summary on `research.html`, open PhD application tracker. |
| `idea` | Public research/engineering ideas (lab notebook style). |
| `project` | Project metadata for the bento grid (title, KPIs, audience tags, bento size). |
| `testimonial` | Recommendation excerpts and full letters. |

## One-time setup

**Project already created:** `4lmq2x2j` (dataset `production`).
The frontend and Studio config are hard-coded to point at it.

Just install dependencies and run:

```bash
cd sanity
npm install
npx sanity login        # one-time browser login to sanity.io
npx sanity dev          # local Studio at http://localhost:3333
```

That's it.  **Do NOT run `npm create sanity@latest`** in this folder — the
scaffold already exists and re-running create-sanity will fight with our
schemas.

If you ever need to bootstrap a fresh Studio from scratch (e.g. to compare
against the current Sanity defaults), do it in a SIBLING folder so it
doesn't clobber ours:

```bash
cd ..
npm create sanity@latest -- --project=4lmq2x2j --dataset=production --template=clean --output-path=./sanity-fresh --yes
```

Note the `=` in `--project=…` — the bare-space syntax (`--project 4lmq2x2j`)
is parsed as positional args by npm and the CLI rejects it.

## Why CommonJS + pinned yargs?

Two compounding issues with the Sanity v3.99 CLI bootstrap:

1. **`"type": "module"` in package.json broke yargs.** The Sanity CLI's
   bundled yargs is CJS, but a `type: module` package makes Node load it
   as ESM. → Removed `type: module`; the config + schemas now use
   `module.exports`.
2. **yargs v18+ broke the `require('yargs/yargs')` entry path.** @sanity/cli
   3.99 uses yargs through that legacy path, but newer yargs (18+) is
   ESM-first and the path doesn't resolve as CJS. → Added
   `"overrides": { "yargs": "^17.7.2" }` in package.json to force the
   CJS-compatible 17.x line of yargs across the dep tree.

If you ever see this error again:
```
ReferenceError: require is not defined in ES module scope
    at file:///…/node_modules/yargs/yargs:…
```

Run:
```bash
cd sanity
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue
npm install
```

The override + the CommonJS config together fix it. If a future Sanity CLI
ships a clean yargs path, we can drop the override.

## If you ran `npm audit fix --force` (recovery)

That command will downgrade `sanity` to v2.36.6, which is incompatible
with our v3 schemas + config. Recovery:

```bash
cd sanity
rm -rf node_modules package-lock.json
# (Windows PowerShell: Remove-Item -Recurse -Force node_modules, package-lock.json)
npm install
npx sanity dev
```

The package.json pins `sanity@^3.99.0` so a fresh install will land on the
right major.

## Daily use

```bash
cd sanity
npx sanity dev          # local
npx sanity deploy       # publish to <slug>.sanity.studio (free hosted)
```

## Frontend behaviour

- **Static fallback always works.** If Sanity is unreachable, the static
  HTML in `index.html`, `research.html` etc. stays in place.
- **CMS-driven regions** are marked with these data attributes:
  - `[data-cms-ideas]` — public ideas list container.
  - `[data-cms-research-status]` — research.html hero region.
  - `[data-cms-testimonials]` — the `.testimonials-grid` on `index.html`.
- **Looking-for banner** is hydrated through `window.PORTFOLIO_LOOKING_FOR`.

## Free-tier ceiling (May 2026)

The portfolio is well within the Sanity free tier:

- 3 users (1 is what we use)
- 10,000 documents
- 1M API CDN requests/month
- 100 GB asset bandwidth/month

## Migrating off Sanity later (escape hatch)

```bash
npx sanity dataset export production backup.tar.gz
```

Gets you a complete archive of all documents + assets. From there, plain
JSON generation is trivial.
