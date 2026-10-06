# Portfolio design freeze — 6 October 2026

## Maintained direction

Cream backgrounds, forest surfaces, rust accents, serif display headings and readable sans-serif body text. The shared header, navigation, track selector, project cards, skill dossiers and paper palettes form the baseline. Preserve the existing research/engineering narrative and evidence boundaries.

## Release changes

- Fixed General/Software radar overlap: removed negative text margins and separated track subtitles from the longer professional-experience note. Panels use normal flow and explicit gaps.
- Replaced uneven track buttons with one overview row and four equal track choices, each with a purpose label.
- Put the radar explanation in an accessible disclosure; skill evidence stays one interaction away.
- Enlarged mobile radar labels and used font-relative multiline spacing. Assessment values are unchanged.
- Unified header navigation appearance and current-page states. All six destinations are visible on narrow screens, with 44px targets.
- Stack the hero at tablet widths so the chart retains usable space. Evidence summaries wrap without colliding.
- Replaced blurred entrance motion with shorter opacity/translation transitions; retained reduced-motion handling.
- Retired the redundant reading-mode toolbar on paper pages. Preserved both paper themes.
- Made the experience timeline keyboard-focusable for horizontal scrolling. Removed the empty image source from the thesis media dialog; its image is supplied when opened.
- Refreshed shared asset URLs and service-worker version for deployment.

## Verification

Local browser review covered 320px and 390px phones, 768px tablet, and 1440px desktop. At 320px all five radar panels were checked for overlapping child blocks, clipped chart labels, page overflow and tab target size. Software evidence expansion and the End-key tab shortcut worked. The Backend systems chart link opened the software skill dossier with Skills selected in the header.

Representative mobile routes: homepage, project library, experience index, QBurst role, Siemens thesis, TES research paper, research statement, About, courses, Software track and software skill dossier. No page-level horizontal overflow was observed. Wide evidence tables/timelines may scroll inside their own containers.

Light-mode text contrast against the shared surface: main text 14.39:1, muted text 6.08:1, accent links 6.38:1. Light and dark paper surfaces were visually inspected. Theme switching and readable focus/current states were reviewed. Reduced-motion handling remains covered by source validation; no claim of a full assistive-technology certification is made.

Required release checks:

```
node scripts/build-academic.cjs --check
node scripts/validate-academic.cjs
node scripts/validate-unified-ui.cjs
node scripts/validate-static.cjs
node scripts/build-portfolio-art.cjs --check
git diff --check
```

Static validation covers 98 HTML pages, 71 JavaScript files and 23 JSON files. Generation checks cover 16 academic pages and 84 illustrations. Shared-shell checks cover 50 older endpoints.

## Change policy

Continue content and factual corrections through source data/generators. Keep all five shareable tracks, source links, mobile behaviour and paper contrast intact. Before changing shared layout, reproduce the issue at relevant widths and repeat the affected browser checks. Do not reintroduce decorative dashboards or global animation frameworks without a new design decision. Publish through a reviewed PR, passing CI and verified Pages deployment. Keep private source profiles and attachments out of Git.
