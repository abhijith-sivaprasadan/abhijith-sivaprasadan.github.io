/**
 * Lightweight Sanity client — no SDK dependency.
 *
 * Reads PROJECT_ID + DATASET from globalThis.PORTFOLIO_CMS_CONFIG (set by
 * scripts/public-config.js if you configure them). If unconfigured, every
 * fetch returns null and the static HTML stays in place.
 *
 * Queries hit the CDN (apicdn.sanity.io) which is free + cached and well
 * within the 1M req/month free tier.
 *
 * Usage:
 *   import { sanityFetch, cmsConfigured } from "./sanity-client.js";
 *   const ideas = await sanityFetch(`*[_type=="idea" && visibility=="public"] | order(date desc)`);
 */

const API_VERSION = "2024-01-01";

export function cmsConfigured() {
  const cfg = globalThis.PORTFOLIO_CMS_CONFIG;
  return Boolean(cfg?.projectId && cfg?.dataset && cfg.projectId !== "REPLACE_WITH_SANITY_PROJECT_ID");
}

export async function sanityFetch(groq, params = {}) {
  if (!cmsConfigured()) return null;
  const { projectId, dataset } = globalThis.PORTFOLIO_CMS_CONFIG;

  const search = new URLSearchParams();
  search.set("query", groq);
  for (const [k, v] of Object.entries(params)) {
    search.set(`$${k}`, JSON.stringify(v));
  }
  const url = `https://${projectId}.apicdn.sanity.io/v${API_VERSION}/data/query/${dataset}?${search}`;

  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) {
      console.warn("[sanity] non-2xx:", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    return data.result;
  } catch (err) {
    console.warn("[sanity] fetch failed:", err);
    return null;
  }
}

export function imageUrl(image, params = {}) {
  if (!image?.asset?._ref || !cmsConfigured()) return null;
  const { projectId, dataset } = globalThis.PORTFOLIO_CMS_CONFIG;
  // _ref format: image-abcdef-1024x768-jpg
  const ref = image.asset._ref;
  const m = ref.match(/^image-(.+?)-(\d+)x(\d+)-(\w+)$/);
  if (!m) return null;
  const [, id, w, h, ext] = m;
  const search = new URLSearchParams(params);
  const qs = search.toString();
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${id}-${w}x${h}.${ext}${qs ? "?" + qs : ""}`;
}
