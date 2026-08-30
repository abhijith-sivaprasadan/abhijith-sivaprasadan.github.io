# Publishing review — 30 August 2026

## Scope and checks

Reviewed the existing FIELD redesign and new ThermoTwin case study for publishing
to the GitHub Pages `main` branch. Preserved existing design work.

- `node scripts/validate-static.cjs`: 76 HTML files checked for local links,
  60 JavaScript files checked for syntax, and 23 JSON files parsed successfully.
- Added this broader check to CI and included `field-redesign` in CI triggers.
- Browser smoke checks: homepage rendered, audience lens changed the heading and
  selected state, project search found ThermoTwin after updating the search index
  and cache version, and the case-study page rendered its verification caveat.
- No console errors observed during the homepage audience-lens smoke check.
- `git diff --check` passed. GitHub showed no open issues or pull requests in
  the portfolio or ThermoTwin repositories at review time.
- Confirmed GitHub Pages publishes the root of `main`; no hosting migration.

## Corrections

- Published-source links replace ThermoTwin's stale “coming soon” text.
- Added ThermoTwin to the search JSON, sitemap, and project thumbnail mapping.
- Qualified historical simulator charts/numbers and removed tagged-release wording.
- Fixed nested-page status-banner links and checked the admin script as an ES module.
- Refreshed frontend cache versions and made the project search index bypass cache.

## Remaining work and excluded files

- `profile_snapshot.md` remains untracked and unpublished: it conflicts with the
  portfolio's degree institution/dates and contains unsupported numerical claims.
  The owner should reconcile this draft with primary records before using it.
- This was a smoke test, not exhaustive visual, accessibility, security, or
  cross-browser acceptance testing. Contact submission, admin writes, external
  CMS authentication, and production backend deployment were not exercised.
- Historical report and CV claims still need evidence-by-evidence human review;
  portfolio publication does not certify the underlying engineering models.
- ThermoTwin's Linux CI passed for `026eb6e`; its own `docs/COMMIT_REVIEW.md`
  records remaining GUI, dependency setup, fpm, report and external-validation work.

Generated binaries/debug outputs in ThermoTwin remain local; the portfolio includes
only the curated case-study image set. No external messages or forms were submitted.
