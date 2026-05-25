/**
 * Sanity Studio configuration for Abhijith Sivaprasadan's portfolio.
 *
 * Project: 4lmq2x2j  Dataset: production
 * Free tier: 3 users / 10k docs / 1M CDN req per month (May 2026).
 *
 * Run locally:
 *   cd sanity
 *   npm install
 *   npm run dev          -> http://localhost:3333
 *   npm run deploy       -> <slug>.sanity.studio (free hosted)
 *
 * This config is ESM because Sanity Studio imports it as the application's
 * default export. The yargs compatibility patch operates inside node_modules.
 */
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";

import idea from "./schemas/idea.js";
import project from "./schemas/project.js";
import researchStatus from "./schemas/researchStatus.js";
import testimonial from "./schemas/testimonial.js";
import lookingFor from "./schemas/lookingFor.js";

const PROJECT_ID = "4lmq2x2j";
const DATASET = "production";

export default defineConfig({
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
