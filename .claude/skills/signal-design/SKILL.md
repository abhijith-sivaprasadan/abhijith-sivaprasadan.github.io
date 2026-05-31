---
name: signal-design
description: Use this skill to generate well-branded interfaces and assets for Abhijith Sivaprasadan's "Signal" portfolio brand — a dark scientific-instrument aesthetic for a thermal-fluid / energy-systems engineer — either for production or throwaway prototypes/mocks/decks. Contains essential design guidelines, colors, type, fonts, assets, and a website UI kit for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files
(`colors_and_type.css` for tokens, `ui_kits/website/` for components, `assets/` for
the logo and instrument diagrams, `preview/` for specimen cards).

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets
out and create static HTML files for the user to view — always `@import` or link
`colors_and_type.css` first so the tokens are available. If working on production
code, copy assets and read the rules here to become an expert in designing with this
brand.

Key brand reminders: one accent at a time (sage `--green`, re-tinted per audience
lens); JetBrains Mono UPPERCASE for all chrome and Inter for prose; amber eyebrows;
small technical radii (6px buttons); hairline borders; CFD/thermal instrument
diagrams as the signature imagery; no emoji, no icon font, British/European spelling,
evidence-first voice that quantifies instead of using adjectives.

If the user invokes this skill without any other guidance, ask them what they want to
build or design, ask a few focused questions, and act as an expert designer who
outputs HTML artifacts _or_ production code, depending on the need.

---

## ⛔ HARD BOUNDARIES — never touch the simulation / computation layer

This skill is a **presentation / design layer only**. When working inside the real
portfolio repository (`abhijith-sivaprasadan.github.io`), you may add or edit
**markup, styling, layout, copy, and front-end presentation**. You must **NOT**
modify, refactor, "optimise", or regenerate any of the following — they are the
engineering substance of the site and are validated by hand:

- **Simulation / numerical code & data** — anything under or named like
  `*.py`, `*.m`, CFD/CHT solvers, MILP/optimisation models, forecasting pipelines,
  notebooks, mesh/case files, solver configs.
- **Project & content data** — `api/*.json`, `projects/*` case-study source data,
  any computed results, KPI numbers, validation figures, mesh-independence tables,
  Biot/Mach/temperature values, ECTS/credit counts, document IDs (e.g. TRITA-ITM-EX 2026:14).
- **The instrument diagram SVGs' underlying numbers** — you may restyle their
  *frame/caption*, never alter the plotted data, labels, or values inside them.
- **Build/deploy, backend, and CMS logic** — Node backend, Sanity schema, CI config.

**The rule:** never invent, "round", or re-derive a number, result, or scientific
claim. If a value is wrong or missing, **flag it to the user and stop** — do not
guess. Treat all simulation outputs and figures as ground truth that only the
author changes.

When in doubt about whether a file is "design" or "substance", ask before editing.
Prefer **adding** presentation files over editing existing engineering files.

## Installing this as a Claude Code skill
Drop this whole folder into your repo (or your user skills dir):
```
<repo>/.claude/skills/signal-design/
```
Then in Claude Code: `/signal-design` (or just ask to "design with the Signal
system"). The boundaries above travel with the skill, so any design session stays
on the presentation layer and leaves your simulations untouched. See
`INSTALL.md` for the full push/commit workflow.
