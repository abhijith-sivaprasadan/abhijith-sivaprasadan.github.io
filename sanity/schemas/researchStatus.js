// Singleton - current research-direction copy shown on research.html and
// reused for the PhD application footer.
export default {
  name: "researchStatus",
  title: "Research status",
  type: "document",
  __experimental_actions: ["update", "publish"],
  fields: [
    {
      name: "headline",
      title: "Headline",
      type: "string",
      validation: (R) => R.required().max(120),
    },
    { name: "headlineSv", title: "Headline (Swedish)", type: "string" },
    {
      name: "summary",
      title: "Summary",
      type: "text",
      rows: 4,
      description: "2–3 sentences describing the current research direction.",
      validation: (R) => R.max(700),
    },
    {
      name: "interests",
      title: "Interest areas",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "title", type: "string", validation: (R) => R.required() },
            { name: "copy", type: "text", rows: 3 },
            { name: "tags", type: "array", of: [{ type: "string" }], options: { layout: "tags" } },
          ],
        },
      ],
      validation: (R) => R.max(6),
    },
    {
      name: "applications",
      title: "Open PhD applications",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "title", type: "string", description: "e.g. 'KTH — Rocket Propulsion (PA-2026-1429)'" },
            { name: "status", type: "string", options: { list: ["draft", "submitted", "interview", "rejected", "accepted"] } },
            { name: "deadline", type: "date" },
            { name: "url", type: "url" },
            { name: "notes", type: "text", rows: 2 },
            { name: "visible", type: "boolean", initialValue: true, description: "Show on public research page?" },
          ],
        },
      ],
    },
  ],
};
