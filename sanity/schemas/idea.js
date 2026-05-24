// Idea — short research/engineering ideas, like a public lab notebook.
module.exports = {
  name: "idea",
  title: "Idea",
  type: "document",
  fields: [
    { name: "title", title: "Title", type: "string", validation: (R) => R.required().max(120) },
    { name: "slug", title: "Slug", type: "slug", options: { source: "title", maxLength: 96 } },
    { name: "date", title: "Date", type: "datetime", initialValue: () => new Date().toISOString() },
    {
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Seed (rough)", value: "seed" },
          { title: "Sketch (drafted)", value: "sketch" },
          { title: "Active (working on it)", value: "active" },
          { title: "Parked", value: "parked" },
          { title: "Done", value: "done" },
        ],
        layout: "dropdown",
      },
      initialValue: "seed",
    },
    {
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    },
    {
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          "Thermal-fluid",
          "Energy systems",
          "Industrial R&D",
          "Research method",
          "Side / curious",
        ],
      },
    },
    {
      name: "summary",
      title: "One-liner",
      type: "text",
      rows: 2,
      validation: (R) => R.max(220),
    },
    {
      name: "body",
      title: "Body",
      type: "array",
      of: [
        { type: "block" },
        { type: "image", options: { hotspot: true } },
      ],
    },
    {
      name: "links",
      title: "Related links",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "label", type: "string" },
            { name: "url", type: "url" },
          ],
        },
      ],
    },
    {
      name: "visibility",
      title: "Visibility",
      type: "string",
      options: { list: ["public", "draft", "private"] },
      initialValue: "draft",
    },
  ],
  orderings: [{ title: "Newest first", name: "dateDesc", by: [{ field: "date", direction: "desc" }] }],
};
