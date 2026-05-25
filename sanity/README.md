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

**Important:** run `npm install` before using the Studio commands. The
install step applies a small compatibility patch to the installed
`yargs@16.2.0` package, marking its package scope as CommonJS so Sanity's
CommonJS CLI bundle can load `yargs/yargs` on recent Node releases. All
Sanity commands have an `npm run ...` equivalent: `build`, `deploy`,
`deploy-graphql`, `login`, `start`.

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

## Why the yargs postinstall patch?

The Sanity v3.99 CLI bootstrap currently hits an interoperability edge case
on recent Node releases:

1. Sanity's CommonJS CLI bundle requires `yargs/yargs`.
2. The installed `yargs@16.2.0` export maps that subpath to its extensionless
   `./yargs` file while its package declares `"type": "module"`.
3. Node therefore refuses the CommonJS `require()` with `ERR_REQUIRE_ESM`.

Fix: the override pins `yargs` to `16.2.0`, and `postinstall` runs
`scripts/patch-yargs.cjs`, changing the installed package declaration to
`"type": "commonjs"`. This is an installed-dependency compatibility patch;
it does not edit Sanity source or any content in the dataset.

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
npm run dev
```

You can confirm the patch without starting the Studio:

```powershell
Select-String -Path node_modules\yargs\package.json -Pattern '"type"'
```

The result should contain `"type": "commonjs"`.

### Node version

The compatibility patch is intended for current Node releases, including
Node 25. If a future Sanity/yargs update removes the issue, this script can
be deleted along with the `yargs` override.

## If you ran `npm audit fix --force` (recovery)

That command will downgrade `sanity` to v2.36.6, which is incompatible
with our v3 schemas + config. Recovery:

```bash
cd sanity
rm -rf node_modules package-lock.json
# (Windows PowerShell: Remove-Item -Recurse -Force node_modules, package-lock.json)
npm install
npm run dev
```

The package.json pins `sanity@^3.99.0` so a fresh install will land on the
right major.

## Daily use

```bash
cd sanity
npm run dev             # local
npm run deploy          # publish to <slug>.sanity.studio (free hosted)
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
npm exec sanity -- dataset export production backup.tar.gz
```

Gets you a complete archive of all documents + assets. From there, plain
JSON generation is trivial.
