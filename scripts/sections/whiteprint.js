/* ============================================================
   FIELD — whiteprint.js  (Phase 3, LIVE site, vanilla JS)
   Puts case-study / research pages into "paper" reading mode with the
   dark-to-develop transition + reading-progress + copy-BibTeX.

   INSTALL
   -------
   1. Copy to scripts/sections/whiteprint.js, load with `defer`.
   2. Add whiteprint.css to the stylesheet pipeline.
   3. On case-study / research pages, set on the <body>:
        <body data-page-key="case-study" data-paper>
      and wrap the readable article in:
        <article class="paper-doc paper-develop"> ... </article>
      with a back bar:
        <div class="paper-bar"><a class="paper-back" href="../index.html">back to field</a></div>
        <div class="paper-progress"></div>
   This only adds presentation behaviour. No simulation/data touched.
   ============================================================ */
(function () {
  "use strict";

  function init() {
    var body = document.body;
    if (!body.hasAttribute("data-paper")) return;
    body.setAttribute("data-mode", "paper");

    var bar = document.querySelector(".paper-progress");
    if (bar) {
      var onScroll = function () {
        var h = document.documentElement;
        var max = h.scrollHeight - h.clientHeight || 1;
        h.style.setProperty("--read", Math.min(1, h.scrollTop / max).toFixed(3));
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }

    [].forEach.call(document.querySelectorAll(".cite-copy"), function (btn) {
      btn.addEventListener("click", function () {
        var cite = btn.closest(".cite");
        var pre = cite && cite.querySelector(".cite-bibtex");
        if (!pre) return;
        try {
          navigator.clipboard.writeText(pre.textContent);
          var text = btn.textContent;
          btn.textContent = "copied";
          setTimeout(function () { btn.textContent = text; }, 1600);
        } catch (e) {}
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
