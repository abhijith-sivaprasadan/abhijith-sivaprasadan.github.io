// Project — case study summary metadata. The frontend uses these to render
// the bento grid + project browser. Detailed case-study content stays in
// the static HTML files under projects/ for now (we don't migrate the
// whole site to a CMS-driven renderer in v4).
export default {
  name: "project",
  title: "Project",
  type: "document",
  fields: [
    { name: "title", title: "Title", type: "string", validation: (R) => R.required() },
    { name: "slug", title: "Slug", type: "slug", options: { source: "title" } },
    {
      name: "audienceTags",
      title: "Audience tags",
      type: "array",
      of: [{ type: "string" }],
      options: {
        list: [
          "Thermal & Fluid",
          "Energy Systems",
          "Industrial R&D",
          "Research",
        ],
        layout: "tags",
      },
    },
    { name: "order", title: "Display order", type: "number", initialValue: 100 },
    { name: "featured", title: "Featured on homepage?", type: "boolean", initialValue: false },
    {
      name: "tone",
      title: "Tone",
      type: "string",
      options: {
        list: ["thermal", "energy", "decarbonisation", "research", "methods"],
      },
    },
    {
      name: "bento",
      title: "Bento tile size",
      type: "string",
      options: {
        list: [
          { title: "Hero 2×2", value: "hero" },
          { title: "Wide 2×1", value: "wide" },
          { title: "Tall 1×2", value: "tall" },
          { title: "Square 1×1", value: "square" },
        ],
      },
      initialValue: "square",
    },
    { name: "summary", title: "One-line summary", type: "text", rows: 2 },
    {
      name: "thumbnail",
      title: "Thumbnail",
      type: "image",
      options: { hotspot: true },
    },
    {
      name: "caseStudyHref",
      title: "Case-study HTML href",
      type: "string",
      description: "Path under /projects/, e.g. siemens-thesis.html",
    },
    {
      name: "kpis",
      title: "KPIs (max 4)",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "value", type: "string", validation: (R) => R.required() },
            { name: "label", type: "string", validation: (R) => R.required() },
          ],
        },
      ],
      validation: (R) => R.max(4),
    },
    {
      name: "tags",
      title: "Skill tags",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    },
  ],
  orderings: [
    { title: "Display order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] },
    { title: "Featured first", name: "featured", by: [{ field: "featured", direction: "desc" }, { field: "order", direction: "asc" }] },
  ],
};
