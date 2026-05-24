/**
 * Sanity Studio configuration for Abhijith Sivaprasadan's portfolio.
 *
 * Setup instructions:
 *   1. cd sanity
 *   2. npm install
 *   3. Sign in / sign up at https://www.sanity.io  (free tier)
 *   4. npx sanity init  -> select "Create new project" -> name "abhijith-portfolio"
 *      -> dataset "production" (use defaults).  This writes a `.env` you can ignore
 *      since we declare projectId/dataset directly below.
 *   5. Replace PROJECT_ID below with the value Sanity gives you.
 *   6. npx sanity dev  -> studio runs locally on http://localhost:3333
 *      npx sanity deploy  -> hosted at https://abhijith-portfolio.sanity.studio
 *
 * Free tier (May 2026):
 *   - 3 users
 *   - 10k documents
 *   - 1M API CDN requests / month
 *   - 100GB asset bandwidth / month
 *   This is comfortably within "1 user" portfolio needs.
 */
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";

import idea from "./schemas/idea";
import project from "./schemas/project";
import researchStatus from "./schemas/researchStatus";
import testimonial from "./schemas/testimonial";
import lookingFor from "./schemas/lookingFor";

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
