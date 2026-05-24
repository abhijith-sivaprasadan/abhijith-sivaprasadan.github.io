/**
 * Sanity Studio configuration for Abhijith Sivaprasadan's portfolio.
 *
 * Project: 4lmq2x2j  Dataset: production
 * Free tier: 3 users / 10k docs / 1M CDN req per month (May 2026).
 *
 * Run locally:
 *   cd sanity
 *   npm install
 *   npx sanity dev          → http://localhost:3333
 *   npx sanity deploy       → <slug>.sanity.studio (free hosted)
 *
 * The file is intentionally CommonJS to avoid the ESM/CJS conflict
 * between this package and the `sanity` CLI's internal yargs binary.
 */
const { defineConfig } = require("sanity");
const { structureTool } = require("sanity/structure");
const { visionTool } = require("@sanity/vision");

const idea = require("./schemas/idea");
const project = require("./schemas/project");
const researchStatus = require("./schemas/researchStatus");
const testimonial = require("./schemas/testimonial");
const lookingFor = require("./schemas/lookingFor");

const PROJECT_ID = "4lmq2x2j";
const DATASET = "production";

module.exports = defineConfig({
  name: "abhijith-portfolio",
  title: "Abhijith Sivaprasadan — Portfolio CMS",
  projectId: PROJECT_ID,
  dataset: DATASET,

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Portfolio content")
          .items([
            S.listItem()
              .title("Looking for (status banner)")
              .child(S.editor().schemaType("lookingFor").documentId("looking-for-singleton")),
            S.listItem()
              .title("Research status")
              .child(S.editor().schemaType("researchStatus").documentId("research-status-singleton")),
            S.divider(),
            S.documentTypeListItem("idea").title("Ideas"),
            S.documentTypeListItem("project").title("Projects"),
            S.documentTypeListItem("testimonial").title("Testimonials"),
          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: [idea, project, researchStatus, testimonial, lookingFor],
  },
});
