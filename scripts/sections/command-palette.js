/* ============================================================
   FIELD — command-palette.js  (Phase 2, LIVE site, vanilla JS)
   A universal ⌘K / Ctrl-K palette. No framework. Self-mounting.

   INSTALL
   -------
   1. Copy this file to scripts/sections/command-palette.js
   2. Add to every page (or inject via site.js):
        <script src="scripts/sections/command-palette.js" defer></script>
   3. Add field-welcome.css (ships alongside) for styling.
   It indexes the site's own api/*.json so results stay data-driven.
   Presentation/navigation only — touches no simulation code or data.
   ============================================================ */
(function () {
  "use strict";
  var BASE = location.pathname.indexOf("/projects/") > -1 || location.pathname.indexOf("/experience/") > -1 ? ".." : ".";
  var items = [];          // {type,label,hint,href}
  var open = false, sel = 0, root, input, list;

  function add(type, label, hint, href) { items.push({ type: type, label: label, hint: hint, href: href }); }

  // static fallbacks always available
  function seedStatic() {
    add("Section", "Home", "the index", BASE + "/index.html");
    add("Action", "Download CV", "PDF", BASE + "/downloads/Abhijith_CV_PhD_Academic.pdf");
    add("Action", "Contact", "get in touch", BASE + "/index.html#contact");
  }

  function loadJSON() {
    // projects
    fetch(BASE + "/api/projects.json").then(function (r) { return r.json(); }).then(function (d) {
      (d.projects || d || []).forEach(function (p) {
        if (!p || !p.id) return;
        add("Project", p.title || p.id, (p.category || "") + (p.year ? " · " + p.year : ""), BASE + "/projects/" + p.id + ".html");
      });
      render();
    }).catch(function () {});
    // experience (optional)
    fetch(BASE + "/api/linkedin-experience.json").then(function (r) { return r.json(); }).then(function (d) {
      (d.experience || d || []).forEach(function (e) {
        var org = e.company || e.org || e.title; if (!org) return;
        add("Experience", org, e.role || e.title || "", e.url || (BASE + "/index.html#experience"));
      });
      render();
    }).catch(function () {});
  }

  function build() {
    root = document.createElement("div");
    root.className = "fcmd-backdrop";
    root.innerHTML =
      '<div class="fcmd" role="dialog" aria-label="Search">' +
      '<div class="fcmd-input"><svg viewBox="0 0 18 18" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.4"/><path d="M12 12l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' +
      '<input type="text" placeholder="Jump to a project, method, page…" aria-label="Search" /><kbd>esc</kbd></div>' +
      '<div class="fcmd-results"></div>' +
      '<div class="fcmd-foot"><span><kbd>↑↓</kbd> navigate</span><span><kbd>↵</kbd> open</span><span><kbd>esc</kbd> close</span></div>' +
      "</div>";
    document.body.appendChild(root);
    input = root.querySelector("input");
    list = root.querySelector(".fcmd-results");
    root.addEventListener("click", function (e) { if (e.target === root) close(); });
    input.addEventListener("input", function () { sel = 0; render(); });
    input.addEventListener("keydown", onKey);
  }

  function filtered() {
    var q = (input.value || "").trim().toLowerCase();
    if (!q) return items;
    return items.filter(function (it) { return (it.label + " " + it.hint + " " + it.type).toLowerCase().indexOf(q) > -1; });
  }

  function render() {
    if (!open || !list) return;
    var fs = filtered(), groups = {}, order = [];
    fs.forEach(function (it) { if (!groups[it.type]) { groups[it.type] = []; order.push(it.type); } groups[it.type].push(it); });
    var html = "", idx = -1;
    if (!fs.length) html = '<div class="fcmd-empty">No matches</div>';
    order.forEach(function (type) {
      html += '<div class="fcmd-group-label">' + type + "</div>";
      groups[type].forEach(function (it) {
        idx++;
        html += '<button class="fcmd-item' + (idx === sel ? " on" : "") + '" data-href="' + it.href + '" data-i="' + idx + '">' +
          '<span class="fcmd-dot"></span><span class="fcmd-label">' + it.label + '</span><span class="fcmd-hint">' + it.hint + "</span></button>";
      });
    });
    list.innerHTML = html;
    [].forEach.call(list.querySelectorAll(".fcmd-item"), function (b) {
      b.addEventListener("mouseenter", function () { sel = +b.dataset.i; paint(); });
      b.addEventListener("click", function () { location.href = b.dataset.href; });
    });
  }
  function paint() {
    [].forEach.call(list.querySelectorAll(".fcmd-item"), function (b) {
      b.classList.toggle("on", +b.dataset.i === sel);
    });
  }
  function onKey(e) {
    var n = list.querySelectorAll(".fcmd-item").length;
    if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(sel + 1, n - 1); paint(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(sel - 1, 0); paint(); }
    else if (e.key === "Enter") { var b = list.querySelector('.fcmd-item[data-i="' + sel + '"]'); if (b) location.href = b.dataset.href; }
    else if (e.key === "Escape") { close(); }
  }
  function show() { open = true; sel = 0; root.classList.add("show"); input.value = ""; render(); setTimeout(function () { input.focus(); }, 30); }
  function close() { open = false; root.classList.remove("show"); }

  function init() {
    seedStatic(); build(); loadJSON(); render();
    window.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); open ? close() : show(); }
    });
    // any element with [data-fcmd-open] (e.g. the header Search button / hero box) opens it
    document.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest("[data-fcmd-open]");
      if (t) { e.preventDefault(); show(); }
    });
    window.FieldCmd = { open: show, close: close };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
