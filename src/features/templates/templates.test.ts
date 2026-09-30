import { describe, expect, it } from "@jest/globals";

import { sectionDefinitions } from "@/features/sections/definitions";
import {
  draftPageContentSchema,
  publishPageContentSchema,
  SECTION_TYPES,
  type PageContent,
} from "@/features/sections/page-content";

import { DEFAULT_TEMPLATE_ID, TEMPLATE_IDS } from "./template-ids";
import { templateOptions, templates } from "./templates";

/** Every `id` string in a value (section ids and item ids). */
function collectIds(value: unknown, ids: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const child of value) collectIds(child, ids);
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (key === "id" && typeof child === "string") ids.push(child);
      else collectIds(child, ids);
    }
  }
  return ids;
}

function stripIds(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripIds);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== "id")
        .map(([key, child]) => [key, stripIds(child)]),
    );
  }
  return value;
}

describe("templates", () => {
  it("offers exactly Blank and SaaS landing page, with Blank as the default", () => {
    expect(TEMPLATE_IDS).toEqual(["blank", "saas"]);
    expect(DEFAULT_TEMPLATE_ID).toBe("blank");
    expect(templateOptions.map((option) => option.name)).toEqual(["Blank", "SaaS landing page"]);
  });

  it("exposes only id, name and description as options", () => {
    for (const option of templateOptions) {
      expect(Object.keys(option).sort()).toEqual(["description", "id", "name"]);
    }
  });

  it.each(TEMPLATE_IDS)("%s creates content that passes the draft schema", (id) => {
    const result = draftPageContentSchema.safeParse(templates[id].createContent());
    expect(result.error?.issues ?? []).toEqual([]);
  });

  it("Blank has no sections and empty meta", () => {
    expect(templates.blank.createContent()).toEqual({
      schemaVersion: 1,
      meta: { title: "", description: "" },
      sections: [],
    });
  });

  it("SaaS has one section of every type, in section order, with empty meta", () => {
    const content = templates.saas.createContent();
    expect(content.sections.map((section) => section.type)).toEqual([...SECTION_TYPES]);
    expect(content.meta).toEqual({ title: "", description: "" });
  });

  it("SaaS sections are the existing section defaults", () => {
    for (const section of templates.saas.createContent().sections) {
      const fresh = sectionDefinitions[section.type].createDefault();
      expect(stripIds(section)).toEqual(stripIds(fresh));
    }
  });

  it("SaaS becomes publishable once the page meta is filled in", () => {
    const content: PageContent = templates.saas.createContent();
    content.meta = { title: "Title", description: "Description" };
    const result = publishPageContentSchema.safeParse(content);
    expect(result.error?.issues ?? []).toEqual([]);
  });

  it.each(TEMPLATE_IDS)("%s creates unique, fresh ids on every call", (id) => {
    const first = collectIds(templates[id].createContent());
    const second = collectIds(templates[id].createContent());
    expect(new Set(first).size).toBe(first.length);
    expect(first.filter((value) => second.includes(value))).toEqual([]);
  });
});
