// Testimonial / recommendation letter — content for the testimonials section
// and the letter-viewer modal.
export default {
  name: "testimonial",
  title: "Testimonial",
  type: "document",
  fields: [
    { name: "author", title: "Author", type: "string", validation: (R) => R.required() },
    { name: "role", title: "Author role / context", type: "string" },
    { name: "date", title: "Letter date", type: "date" },
    { name: "letterheadOrg", title: "Letterhead organisation", type: "string" },

    { name: "excerpt", title: "Excerpt", type: "text", rows: 3, validation: (R) => R.required() },
    {
      name: "body",
      title: "Full letter (rich text)",
      type: "array",
      of: [{ type: "block" }],
      description: "Used by the letter-viewer modal when the visitor clicks 'View excerpt'.",
    },
    {
      name: "authorPhoto",
      title: "Author photo (optional)",
      type: "image",
      options: { hotspot: true },
    },
    { name: "linkedinUrl", title: "LinkedIn URL", type: "url" },
    { name: "letterPdf", title: "Full letter PDF", type: "file" },
    { name: "order", title: "Display order", type: "number", initialValue: 100 },
    { name: "visible", title: "Show on site?", type: "boolean", initialValue: true },
  ],
  orderings: [
    { title: "Display order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] },
  ],
};
