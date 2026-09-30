import { sectionDefinitions } from "@/features/sections/definitions";
import { SECTION_TYPES, type PageContent } from "@/features/sections/page-content";

import { TEMPLATE_IDS, type TemplateId } from "./template-ids";

// Templates are only used when a page is created; they are code, not database
// records. Each one builds a new draft `PageContent` with fresh ids from the
// existing section defaults.

export type Template = {
  id: TemplateId;
  name: string;
  description: string;
  /** Returns new content on every call; it passes draft validation. */
  createContent: () => PageContent;
};

function emptyMeta(): PageContent["meta"] {
  return { title: "", description: "" };
}

export const templates: { [Id in TemplateId]: Template & { id: Id } } = {
  blank: {
    id: "blank",
    name: "Blank",
    description: "Start with an empty page.",
    createContent: () => ({ schemaVersion: 1, meta: emptyMeta(), sections: [] }),
  },
  saas: {
    id: "saas",
    name: "SaaS landing page",
    description:
      "Hero, features, testimonials, pricing, FAQ, call to action and footer sections.",
    createContent: () => ({
      schemaVersion: 1,
      meta: emptyMeta(),
      sections: SECTION_TYPES.map((type) => sectionDefinitions[type].createDefault()),
    }),
  },
};

/** What the New page form needs to show each template. */
export type TemplateOption = Pick<Template, "id" | "name" | "description">;

export const templateOptions: TemplateOption[] = TEMPLATE_IDS.map((id) => ({
  id,
  name: templates[id].name,
  description: templates[id].description,
}));
