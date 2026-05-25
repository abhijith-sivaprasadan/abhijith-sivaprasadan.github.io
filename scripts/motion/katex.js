/**
 * KaTeX math rendering — lazy-loaded only on pages that have math.
 *
 * Markup conventions:
 *   - Inline:   <span class="math" data-math="\\frac{x}{y}"></span>  OR  $x^2$ in plain text
 *   - Display:  <div class="math math-display" data-math="...">  OR  $$...$$  blocks
 *
 * Pulls KaTeX from CDN (jsdelivr) only when needed.
 */

const KATEX_VERSION = "0.16.11";
const CDN_BASE = `https://cdn.jsdelivr.net/npm/katex@${KATEX_VERSION}/dist`;

let loaded = false;

async function loadKaTeX() {
  if (loaded || window.katex) return;
  loaded = true;
  await Promise.all([
    new Promise((resolve, reject) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `${CDN_BASE}/katex.min.css`;
      link.onload = resolve;
      link.onerror = reject;
      document.head.appendChild(link);
    }),
    new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `${CDN_BASE}/katex.min.js`;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    }),
  ]);
}

function renderInline(node) {
  if (!window.katex) return;
  const tex = node.dataset.math || node.textContent;
  if (!tex) return;
  try {
    window.katex.render(tex, node, {
      displayMode: node.classList.contains("math-display"),
      throwOnError: false,
      strict: "ignore",
    });
    node.classList.add("katex-ready");
  } catch (err) {
    console.warn("[katex] render failed:", err);
  }
}

function autoTagDollarSyntax(root) {
  // Find text nodes containing $...$ or $$...$$ and wrap them
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      // Skip if inside <code>, <pre>, <script>, <style>, .math
      if (!node.parentNode || !node.parentNode.closest) return NodeFilter.FILTER_REJECT;
      if (node.parentNode.closest("code, pre, script, style, .math, [data-no-math]")) {
        return NodeFilter.FILTER_REJECT;
      }
      return /\$\$?[^$]+\$\$?/.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  const targets = [];
  let node;
  while ((node = walker.nextNode())) targets.push(node);

  targets.forEach((textNode) => {
    const html = textNode.nodeValue
      .replace(/\$\$([\s\S]+?)\$\$/g, (_, m) => `<div class="math math-display" data-math="${escape(m)}"></div>`)
      .replace(/\$([^$\n]+?)\$/g, (_, m) => `<span class="math" data-math="${escape(m)}"></span>`);
    if (html === textNode.nodeValue) return;
    const tmp = document.createElement("span");
    tmp.innerHTML = html;
    textNode.parentNode.replaceChild(tmp, textNode);
  });
}

function escape(s) {
  return s.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function init() {
  // Skip if there's no math on the page
  autoTagDollarSyntax(document.body);
  const mathNodes = document.querySelectorAll(".math, [data-math]");
  if (!mathNodes.length) return null;

  try {
    await loadKaTeX();
    mathNodes.forEach(renderInline);
  } catch (err) {
    console.warn("[katex] load failed:", err);
    return null;
  }

  return { rerender: () => mathNodes.forEach(renderInline) };
}

export function destroy() {}
