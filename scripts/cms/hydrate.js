/**
 * CMS hydration — pulls CMS content and replaces matching site regions.
 *
 * Non-destructive: if Sanity isn't configured, static HTML stays in place.
 * Each hydrator is wrapped in a try/catch so one CMS error never breaks
 * the rest of the page.
 *
 * Loaded by motion/index.js when PORTFOLIO_CMS_CONFIG is set.
 */

import { sanityFetch, imageUrl, cmsConfigured } from "./sanity-client.js";

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

// ───────────────────────────────────────────────────────────────────────
// Looking-for banner
// ───────────────────────────────────────────────────────────────────────
async function hydrateLookingFor() {
  const doc = await sanityFetch(`*[_id=="looking-for-singleton"][0]`);
  if (!doc?.active || !doc?.message) return;
  if (doc.expiresAt && new Date(doc.expiresAt) < new Date()) return;

  // Expose to motion/looking-for.js (it reads window.PORTFOLIO_LOOKING_FOR first)
  const locale = document.documentElement.dataset.locale || "en";
  const text = (locale === "sv" && doc.messageSv) || doc.message;
  window.PORTFOLIO_LOOKING_FOR = text;

  // Re-render if the banner already mounted
  const existing = document.querySelector(".looking-for-banner .status-text");
  if (existing) existing.innerHTML = text;
}

// ───────────────────────────────────────────────────────────────────────
// Ideas — replaces the static idea list on /ideas.html if a container exists
// ───────────────────────────────────────────────────────────────────────
async function hydrateIdeas() {
  const host = document.querySelector("[data-cms-ideas]");
  if (!host) return;
  const ideas = await sanityFetch(
    `*[_type=="idea" && visibility=="public"] | order(date desc) {
      _id, title, slug, date, status, summary, category, tags
    }`
  );
  if (!ideas || !ideas.length) return;

  host.innerHTML = ideas.map((idea) => `
    <article class="idea-card" data-status="${escapeHtml(idea.status)}">
      <header>
        <p class="eyebrow">${escapeHtml(idea.category || "Idea")} · ${escapeHtml(idea.status)}</p>
        <h3>${escapeHtml(idea.title)}</h3>
        <time datetime="${escapeHtml(idea.date)}">${new Date(idea.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</time>
      </header>
      ${idea.summary ? `<p>${escapeHtml(idea.summary)}</p>` : ""}
      ${idea.tags?.length ? `<div class="tag-row">${idea.tags.map((t) => `<span>${escapeHtml(t)}</span>`).join("")}</div>` : ""}
    </article>
  `).join("");
  host.classList.add("is-cms-hydrated");
}

// ───────────────────────────────────────────────────────────────────────
// Research status — replaces inline copy on /research.html
// ───────────────────────────────────────────────────────────────────────
async function hydrateResearchStatus() {
  const host = document.querySelector("[data-cms-research-status]");
  if (!host) return;
  const doc = await sanityFetch(`*[_id=="research-status-singleton"][0]`);
  if (!doc) return;

  const locale = document.documentElement.dataset.locale || "en";
  const headline = (locale === "sv" && doc.headlineSv) || doc.headline;
  const summary = doc.summary || "";

  host.querySelector("h1").textContent = headline;
  const summaryNode = host.querySelector(".hero-text");
  if (summaryNode) summaryNode.textContent = summary;

  // Render open applications, if any
  if (doc.applications?.length) {
    const visible = doc.applications.filter((a) => a.visible !== false);
    if (visible.length) {
      const ul = document.createElement("ul");
      ul.className = "open-applications";
      ul.innerHTML = visible.map((a) => `
        <li data-status="${escapeHtml(a.status || "draft")}">
          <strong>${escapeHtml(a.title || "Application")}</strong>
          ${a.deadline ? `<span class="meta">Deadline: ${escapeHtml(a.deadline)}</span>` : ""}
          ${a.url ? `<a href="${escapeHtml(a.url)}" target="_blank" rel="noopener">View posting</a>` : ""}
        </li>
      `).join("");
      host.appendChild(ul);
    }
  }
  host.classList.add("is-cms-hydrated");
}

// ───────────────────────────────────────────────────────────────────────
// Testimonials — hydrate the .testimonials-grid if present
// ───────────────────────────────────────────────────────────────────────
async function hydrateTestimonials() {
  const grid = document.querySelector(".testimonials-grid[data-cms-testimonials]");
  if (!grid) return;
  const docs = await sanityFetch(
    `*[_type=="testimonial" && visible == true] | order(order asc) {
      _id, author, role, date, letterheadOrg, excerpt, authorPhoto, linkedinUrl
    }`
  );
  if (!docs || !docs.length) return;

  grid.innerHTML = docs.map((d) => {
    const photo = imageUrl(d.authorPhoto, { w: 96, h: 96, fit: "crop" });
    return `
      <article class="testimonial-card">
        ${photo ? `<img class="testimonial-photo" src="${photo}" alt="${escapeHtml(d.author)}" loading="lazy" width="48" height="48" />` : ""}
        <p class="testimonial-body">${escapeHtml(d.excerpt)}</p>
        <div class="testimonial-author">
          <strong>${escapeHtml(d.author)}</strong>
          <span>${[d.role, d.letterheadOrg, d.date].filter(Boolean).map(escapeHtml).join(" · ")}</span>
          ${d.linkedinUrl ? `<a href="${escapeHtml(d.linkedinUrl)}" target="_blank" rel="noopener">LinkedIn</a>` : ""}
        </div>
      </article>
    `;
  }).join("");
  grid.classList.add("is-cms-hydrated");
}

// ───────────────────────────────────────────────────────────────────────
// Entry point
// ───────────────────────────────────────────────────────────────────────
export async function init(ctx) {
  if (!cmsConfigured()) {
    console.info("[cms] not configured — using static fallback content. See sanity/README.md to set up Sanity.");
    return null;
  }

  await Promise.allSettled([
    hydrateLookingFor(),
    hydrateIdeas(),
    hydrateResearchStatus(),
    hydrateTestimonials(),
  ]);

  ctx?.bus?.emit?.("cms:ready", {});
  return { reload: () => init(ctx) };
}

export function destroy() {}
