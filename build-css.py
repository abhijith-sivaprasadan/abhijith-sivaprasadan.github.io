#!/usr/bin/env python3
"""Bundle the modular v4 stylesheets into a single styles/v4.css.

Why: v4.css previously used a 23-deep @import chain. Browsers must download and
parse v4.css before they can even discover those imports, then fetch them — a
render-blocking waterfall that delays first paint / LCP. Concatenating them into
one file removes the waterfall (1 request instead of 24) with identical cascade.

The modular files in styles/sections/ and styles/components/ remain the SOURCE
OF TRUTH. After editing any of them, re-run:  python build-css.py
"""
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
STYLES = os.path.join(ROOT, "styles")
OUT = os.path.join(STYLES, "v4.css")

# (relative path under styles/, media-query or None) — order = cascade order.
PARTS = [
    ("tokens.css", None),
    ("base.css", None),
    ("sections/typography.css", None),
    ("sections/hero.css", None),
    ("components/form.css", None),
    ("components/modal.css", None),
    ("components/reading-progress.css", None),
    ("components/scholar-card.css", None),
    ("components/looking-for.css", None),
    ("components/biot-calculator.css", None),
    ("components/i18n-toggle.css", None),
    ("components/bootup.css", None),
    ("components/bento-previews.css", None),
    ("components/content-visibility.css", None),
    ("components/reducer-3d.css", None),
    ("sections/scrollytelling.css", None),
    ("sections/evidence-map.css", None),
    ("sections/projects.css", None),
    ("sections/skills.css", None),
    ("sections/experience.css", None),
    ("sections/research-mindmap.css", None),
    ("sections/testimonials.css", None),
    ("print.css", "print"),
]

HEADER = (
    "/* ============================================================\n"
    " * v4.css — GENERATED BUNDLE. Do NOT edit directly.\n"
    " * Source of truth = the modular files in styles/sections/ and\n"
    " * styles/components/. After editing any of them, re-run:\n"
    " *     python build-css.py\n"
    " * Bundling avoids the render-blocking import-chain waterfall.\n"
    " * ============================================================ */\n\n"
)

def main():
    chunks = [HEADER]
    for rel, media in PARTS:
        path = os.path.join(STYLES, rel.replace("/", os.sep))
        with open(path, encoding="utf-8") as fh:
            css = fh.read().strip("\n")
        chunks.append("/* ---- %s ---- */\n" % rel)
        if media:
            chunks.append("@media %s {\n%s\n}\n" % (media, css))
        else:
            chunks.append(css + "\n")
        chunks.append("\n")
    out = "\n".join(chunks)
    with open(OUT, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(out)
    print("Bundled %d stylesheets -> styles/v4.css (%d bytes)" % (len(PARTS), len(out)))

if __name__ == "__main__":
    main()
