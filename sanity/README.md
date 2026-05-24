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
npm run login        # one-time browser login to sanity.io
npm run dev          # local Studio at http://localhost:3333
```

**Important:** use `npm run dev`, NOT bare `npx sanity dev`. The npm script
wraps the sanity binary with `cross-env NODE_OPTIONS=
"--no-experimental-require-module"` which disables Node 22+'s new
synchronous-require-of-ESM behavior. Without that flag, the Sanity CLI
crashes inside its bundled yargs (`require is not defined in ES module
scope`). All Sanity commands have an `npm run …` equivalent: `build`,
`deploy`, `deploy-graphql`, `login`, `start`.

**Do NOT run `npm create sanity@latest`** in this folder — the scaffold
already exists and re-running create-sanity will fight with our schemas.

If you ever need to bootstrap a fresh Studio from scratch (e.g. to compare
against the current Sanity defaults), do it in a SIBLING folder so it
doesn't clobber ours:

```bash
cd ..
npm create sanity@latest -- --project=4lmq2x2j --dataset=production --template=clean --output-path=./sanity-fresh --yes
```

Note the `=` in `--project=…` — the bare-space syntax (`--project 4lmq2x2j`)
is parsed as positional args by npm and the CLI rejects it.

## Why CommonJS + pinned yargs 16?

Three compounding issues with the Sanity v3.99 CLI bootstrap on Node 22+:

1. **`"type": "module"` in package.json broke yargs.** Removed.
2. **yargs 17 has a dual-package layout that Node 22 mis-resolves.** yargs
   17's `package.json` has `"type": "module"` and uses an `exports`
   condition to map `require('yargs/yargs')` to an extensionless file
   `yargs/yargs`. In Node 22+, that extensionless file is treated as ESM
   despite being reached through the CJS `require` condition — yargs'
   own code inside breaks with `require is not defined in ES module scope`.
3. **yargs 18+ is fully ESM-first and would break the require path entirely.**

Fix: pin yargs to the last pre-dual-package release (16.2.0) via both a
direct dependency AND an override. yargs 16 ships a single `yargs.js`
(with explicit extension), no `"type": "module"` in its package.json,
so Node 22+ resolves it as CJS unambiguously.

If you ever see the error again:
```
ReferenceError: require is not defined in ES module scope
    at file:///…/node_modules/yargs/yargs:…
```

Run:
```powershell
cd sanity
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue
npm install
npx sanity dev
```

### Escape hatch if it still fails

The Node CLI flag `--no-experimental-require-module` reverts to the
older module-resolution behavior. Try:

```powershell
$env:NODE_OPTIONS="--no-experimental-require-module"
npx sanity dev
```

(Bash / macOS: `NODE_OPTIONS=--no-experimental-require-module npx sanity dev`)

If that works but you don't want to set the env var every time, edit
`sanity/package.json` and prepend the dev script with the flag:

```json
"scripts": {
  "dev": "cross-env NODE_OPTIONS=\"--no-experimental-require-module\" sanity dev"
}
```

(requires `npm i -D cross-env`).

### Node version

Tested with Node 22.x. If you're on a much newer Node (24+) and the issue
returns, try `nvm install 20 && nvm use 20` to fall back to the older
loader.

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
