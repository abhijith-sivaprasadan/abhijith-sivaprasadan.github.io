# Sanity CMS for the portfolio

Lightweight headless CMS for the dynamic content of the portfolio. Lives in a
separate folder so the static site stays buildable without any Node
dependencies — you only need this if you want to edit content through a UI
instead of editing HTML.

## What lives in the CMS

| Schema | What it controls |
|---|---|
| `lookingFor` (singleton) | The "Looking for…" status banner that appears on every page. |
| `researchStatus` (singleton) | Research headline + summary on `research.html`, open PhD application tracker. |
| `idea` | Public research/engineering ideas (lab notebook style). Rendered into any container with `data-cms-ideas`. |
| `project` | Project metadata for the bento grid (title, KPIs, audience tags, bento size). Detailed case studies still live as static HTML. |
| `testimonial` | Recommendation excerpts and full letters; rendered into `.testimonials-grid[data-cms-testimonials]`. |

All schemas have a `visible` / `visibility` flag so drafts stay hidden.

## One-time setup

**Project already created:** `4lmq2x2j` (dataset `production`). The frontend
and Studio config are already pointing at it.

If you want to bootstrap a fresh local install of the Studio:

```bash
cd sanity
npm create sanity@latest -- --project 4lmq2x2j --dataset production --template clean
# Accept defaults; the existing sanity.config.js + schemas/ override the template files.
npm install
```

Or if you already have the Studio cloned:

```bash
cd sanity
npm install
```

That's it — the project ID is hard-coded in `sanity/sanity.config.js` and in
`scripts/public-config.js`, so the frontend will start pulling from this
Sanity project as soon as you publish your first document.

## Daily use

```bash
# Run the Studio locally on http://localhost:3333
npx sanity dev

# Deploy the Studio to <project-slug>.sanity.studio (free hosted Studio URL)
npx sanity deploy
```

The Studio is your admin UI — log in with the same Sanity account, edit the
singletons and document lists, hit Publish. The portfolio frontend re-renders
on the next page load (or immediately via the `cms:ready` motion-bus event).

## Frontend behaviour

- **Static fallback always works.** If `PORTFOLIO_CMS_CONFIG.projectId` is the
  placeholder, the CMS hydrator logs an info message and the static HTML
  stays in place. Nothing breaks.
- **CMS-driven regions** are marked with these data attributes:
  - `[data-cms-ideas]` — any container you want the public ideas list rendered into.
  - `[data-cms-research-status]` — the `research.html` hero region.
  - `[data-cms-testimonials]` — the `.testimonials-grid` on `index.html`.
- **Looking-for banner** is hydrated through `window.PORTFOLIO_LOOKING_FOR`,
  which the CMS hydrator sets before the banner script reads it.

## Free-tier ceiling

The portfolio is well within the Sanity free tier:

- 3 users (1 is what we use)
- 10,000 documents (a few dozen at most)
- 1M API CDN requests/month (every page load = a few cached queries)
- 100 GB asset bandwidth/month (we mostly use static assets from the repo,
  not Sanity-hosted images)

If you cross any of these, Sanity warns you on the dashboard before charging.

## Migrating off Sanity later (escape hatch)

Every CMS document has a stable `_id`. If you ever want to migrate off
Sanity, run `npx sanity dataset export production backup.tar.gz` to get a
complete archive of all documents + assets. From there, plain JSON
generation is trivial.
