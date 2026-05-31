# Installing & pushing the Signal design system as a Claude Code skill

This folder is both a **design system** and a ready-to-use **Claude Code skill**.
The goal: let Claude (Code) design *with* your brand, while never touching your
simulation code or data.

---

## 1. Where it goes

Pick one:

- **Project skill** (recommended — travels with the repo, available to anyone who
  clones it):
  ```
  abhijith-sivaprasadan.github.io/.claude/skills/signal-design/
  ```
- **Personal skill** (available in every project on your machine, not committed):
  ```
  ~/.claude/skills/signal-design/
  ```

Copy the entire contents of this download (README.md, SKILL.md, INSTALL.md,
`colors_and_type.css`, `assets/`, `preview/`, `ui_kits/`) into that folder.

## 2. Push it (project-skill route)

From the repo root:
```bash
mkdir -p .claude/skills/signal-design
cp -R /path/to/this-download/* .claude/skills/signal-design/

git add .claude/skills/signal-design
git commit -m "Add Signal design-system skill (presentation layer only)"
git push
```
Because it lives under `.claude/skills/`, it ships with the repo but is **inert** —
it never runs or alters anything on its own. It only activates when you invoke it
in a Claude Code session.

> Prefer to keep it out of the public site build? Add `/.claude/` to `.gitignore`
> and use the personal-skill route instead, or keep the skill in a separate private
> branch/repo.

## 3. Use it

In Claude Code, inside the repo:
```
/signal-design
```
or simply: *"Design a new project card using the Signal system."*

Claude will read `SKILL.md` → `README.md`, pick up the tokens and UI kit, and
produce on-brand markup/CSS.

---

## 4. The guardrail (why your simulations are safe)

`SKILL.md` contains a **HARD BOUNDARIES** section that tells Claude this is a
presentation/design layer only. It is instructed to **never** modify:

- simulation / numerical code (`*.py`, `*.m`, solvers, optimisation, notebooks,
  mesh/case/solver configs),
- computed data & results (`api/*.json`, KPI numbers, validation figures, the
  values inside instrument diagrams, document IDs),
- backend / CMS / build logic,

and to **never invent or re-derive a number** — if something looks wrong, it flags
and stops rather than guessing. It prefers *adding* presentation files over editing
engineering files.

For extra safety you can reinforce this at the repo level — e.g. a `CLAUDE.md` at
the repo root:
```markdown
# Repo rules
The Signal skill in .claude/skills/signal-design is design-only.
Never edit simulation code, *.py/*.m, api/*.json data, computed results,
or the numbers inside diagrams. Markup, styling, layout and copy only.
Flag wrong/missing numbers — never invent them.
```

---

## What's in the skill

| Path | What it is |
|------|------------|
| `SKILL.md` | Skill manifest + hard boundaries (read first by Claude). |
| `README.md` | Full brand guide: context, content & visual foundations, iconography. |
| `colors_and_type.css` | All color + type tokens. Link/import this first. |
| `assets/` | Logo, headshot, and the instrument-diagram SVGs. |
| `ui_kits/website/` | High-fidelity React recreation of the site (components + demo). |
| `preview/` | Specimen cards (color, type, components, spacing, brand). |
