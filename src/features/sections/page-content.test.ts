import { describe, expect, it } from "vitest";
import type { z } from "zod";

import {
  draftPageContentSchema,
  publishPageContentSchema,
  SECTION_TYPES,
  type PageContent,
  type Section,
  type SectionOfType,
  type SectionType,
} from "./page-content";
import { samplePageContent } from "./sample-page";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function without<T extends object, K extends keyof T>(value: T, key: K) {
  const copy = { ...value };
  delete copy[key];
  return copy;
}

function sampleSection<T extends SectionType>(type: T): SectionOfType<T> {
  const section = samplePageContent.sections.find((s) => s.type === type);
  if (!section) throw new Error(`Sample page has no ${type} section`);
  return clone(section) as SectionOfType<T>;
}

function pageWith(...sections: Section[]): PageContent {
  return { ...clone(samplePageContent), sections };
}

function issuePaths(result: z.ZodSafeParseResult<unknown>): string[] {
  return result.success ? [] : result.error.issues.map((i) => i.path.join("."));
}

const schemas = {
  draft: draftPageContentSchema,
  publish: publishPageContentSchema,
} as const;

describe("PageContent", () => {
  it("accepts valid content in both modes", () => {
    expect(draftPageContentSchema.safeParse(samplePageContent).success).toBe(true);
    expect(publishPageContentSchema.safeParse(samplePageContent).success).toBe(true);
  });

  it("requires schemaVersion 1", () => {
    for (const schema of Object.values(schemas)) {
      expect(
        schema.safeParse({ ...samplePageContent, schemaVersion: 2 }).success,
      ).toBe(false);
      const withoutVersion = without(samplePageContent, "schemaVersion");
      expect(schema.safeParse(withoutVersion).success).toBe(false);
    }
  });

  it("rejects unknown keys and unknown section types", () => {
    for (const schema of Object.values(schemas)) {
      expect(schema.safeParse({ ...samplePageContent, extra: true }).success).toBe(
        false,
      );
      const unknownType = pageWith({
        ...sampleSection("cta"),
        type: "video",
      } as unknown as Section);
      expect(schema.safeParse(unknownType).success).toBe(false);
    }
  });

  it("rejects non-object input", () => {
    for (const value of [null, undefined, "content", 1, []]) {
      expect(draftPageContentSchema.safeParse(value).success).toBe(false);
    }
  });

  it("enforces meta max lengths in both modes", () => {
    for (const schema of Object.values(schemas)) {
      const content = clone(samplePageContent);
      content.meta.title = "a".repeat(70);
      content.meta.description = "a".repeat(160);
      expect(schema.safeParse(content).success).toBe(true);
      content.meta.title = "a".repeat(71);
      expect(issuePaths(schema.safeParse(content))).toContain("meta.title");
    }
  });

  it("allows 0–20 sections in draft and 1–20 when publishing", () => {
    const empty = pageWith();
    expect(draftPageContentSchema.safeParse(empty).success).toBe(true);
    expect(publishPageContentSchema.safeParse(empty).success).toBe(false);

    const twenty = pageWith(
      ...Array.from({ length: 20 }, (_, i) => ({ ...sampleSection("cta"), id: `cta-${i}` })),
    );
    expect(publishPageContentSchema.safeParse(twenty).success).toBe(true);
    twenty.sections.push({ ...sampleSection("cta"), id: "cta-20" });
    expect(draftPageContentSchema.safeParse(twenty).success).toBe(false);
  });

  it("allows repeated section types with distinct ids", () => {
    const content = pageWith(
      { ...sampleSection("cta"), id: "cta-1" },
      { ...sampleSection("cta"), id: "cta-2" },
    );
    expect(publishPageContentSchema.safeParse(content).success).toBe(true);
  });

  it("rejects duplicate section ids", () => {
    const content = pageWith(
      { ...sampleSection("hero"), id: "same" },
      { ...sampleSection("cta"), id: "same" },
    );
    expect(issuePaths(draftPageContentSchema.safeParse(content))).toContain(
      "sections.1.id",
    );
  });

  it.each(["", "has space", "a/b", "é", "a".repeat(65)])(
    "rejects invalid section id %j",
    (id) => {
      const content = pageWith({ ...sampleSection("cta"), id });
      expect(draftPageContentSchema.safeParse(content).success).toBe(false);
    },
  );

  it("accepts ids made of letters, digits, hyphens and underscores", () => {
    const content = pageWith({
      ...sampleSection("cta"),
      id: "Ab_9-" + "x".repeat(59),
    });
    expect(publishPageContentSchema.safeParse(content).success).toBe(true);
  });
});

describe("draft vs publish strictness", () => {
  it("draft accepts empty required strings; publish rejects them", () => {
    const content = clone(samplePageContent);
    content.meta.title = "";
    const hero = content.sections[0] as SectionOfType<"hero">;
    hero.data.heading = "";
    hero.data.primaryButton = { label: "", href: "" };

    expect(draftPageContentSchema.safeParse(content).success).toBe(true);
    expect(issuePaths(publishPageContentSchema.safeParse(content))).toEqual(
      expect.arrayContaining([
        "meta.title",
        "sections.0.data.heading",
        "sections.0.data.primaryButton.label",
        "sections.0.data.primaryButton.href",
      ]),
    );
  });

  it("publish rejects whitespace-only required strings", () => {
    const content = clone(samplePageContent);
    content.meta.description = "   ";
    expect(draftPageContentSchema.safeParse(content).success).toBe(true);
    expect(issuePaths(publishPageContentSchema.safeParse(content))).toContain(
      "meta.description",
    );
  });

  it("publish does not trim or otherwise change stored values", () => {
    const content = clone(samplePageContent);
    content.meta.title = "  Padded title  ";
    const result = publishPageContentSchema.parse(content);
    expect(result.meta.title).toBe("  Padded title  ");
  });

  it("missing fields are rejected in both modes", () => {
    for (const schema of Object.values(schemas)) {
      const hero = sampleSection("hero");
      const data = without(hero.data, "heading");
      const content = pageWith({ ...hero, data } as unknown as Section);
      expect(issuePaths(schema.safeParse(content))).toContain(
        "sections.0.data.heading",
      );
    }
  });
});

describe("hero", () => {
  it("accepts a valid hero", () => {
    expect(publishPageContentSchema.safeParse(pageWith(sampleSection("hero"))).success).toBe(true);
  });

  it("allows eyebrow and secondaryButton to be omitted or empty when publishing", () => {
    const hero = sampleSection("hero");
    delete hero.data.eyebrow;
    delete hero.data.secondaryButton;
    expect(publishPageContentSchema.safeParse(pageWith(hero)).success).toBe(true);
    hero.data.eyebrow = "";
    expect(publishPageContentSchema.safeParse(pageWith(hero)).success).toBe(true);
  });

  it("requires a complete secondaryButton when present and publishing", () => {
    const hero = sampleSection("hero");
    hero.data.secondaryButton = { label: "", href: "" };
    expect(draftPageContentSchema.safeParse(pageWith(hero)).success).toBe(true);
    expect(issuePaths(publishPageContentSchema.safeParse(pageWith(hero)))).toEqual(
      expect.arrayContaining([
        "sections.0.data.secondaryButton.label",
        "sections.0.data.secondaryButton.href",
      ]),
    );
  });

  it("enforces max lengths", () => {
    const hero = sampleSection("hero");
    hero.data.eyebrow = "a".repeat(41);
    hero.data.heading = "a".repeat(101);
    hero.data.subheading = "a".repeat(301);
    hero.data.primaryButton.label = "a".repeat(31);
    expect(issuePaths(draftPageContentSchema.safeParse(pageWith(hero)))).toEqual(
      expect.arrayContaining([
        "sections.0.data.eyebrow",
        "sections.0.data.heading",
        "sections.0.data.subheading",
        "sections.0.data.primaryButton.label",
      ]),
    );
  });
});

describe("features", () => {
  function withItems(count: number) {
    const section = sampleSection("features");
    const template = section.data.items[0]!;
    section.data.items = Array.from({ length: count }, (_, i) => ({
      ...template,
      id: `item-${i}`,
    }));
    return pageWith(section);
  }

  it("allows 1–12 items in both modes", () => {
    for (const schema of Object.values(schemas)) {
      expect(schema.safeParse(withItems(0)).success).toBe(false);
      expect(schema.safeParse(withItems(1)).success).toBe(true);
      expect(schema.safeParse(withItems(12)).success).toBe(true);
      expect(schema.safeParse(withItems(13)).success).toBe(false);
    }
  });

  it("rejects unknown icons", () => {
    const section = sampleSection("features");
    (section.data.items[0] as { icon: string }).icon = "skull";
    expect(issuePaths(draftPageContentSchema.safeParse(pageWith(section)))).toContain(
      "sections.0.data.items.0.icon",
    );
  });

  it("rejects duplicate and invalid item ids", () => {
    const section = sampleSection("features");
    section.data.items[1]!.id = section.data.items[0]!.id;
    expect(issuePaths(draftPageContentSchema.safeParse(pageWith(section)))).toContain(
      "sections.0.data.items.1.id",
    );
    section.data.items[1]!.id = "not valid";
    expect(draftPageContentSchema.safeParse(pageWith(section)).success).toBe(false);
  });

  it("enforces max lengths", () => {
    const section = sampleSection("features");
    section.data.description = "a".repeat(301);
    section.data.items[0]!.title = "a".repeat(61);
    section.data.items[0]!.description = "a".repeat(201);
    expect(issuePaths(draftPageContentSchema.safeParse(pageWith(section)))).toEqual(
      expect.arrayContaining([
        "sections.0.data.description",
        "sections.0.data.items.0.title",
        "sections.0.data.items.0.description",
      ]),
    );
  });
});

describe("testimonials", () => {
  function withItems(count: number) {
    const section = sampleSection("testimonials");
    const template = section.data.items[0]!;
    section.data.items = Array.from({ length: count }, (_, i) => ({
      ...template,
      id: `t-${i}`,
    }));
    return pageWith(section);
  }

  it("allows 1–9 items", () => {
    expect(draftPageContentSchema.safeParse(withItems(0)).success).toBe(false);
    expect(publishPageContentSchema.safeParse(withItems(9)).success).toBe(true);
    expect(draftPageContentSchema.safeParse(withItems(10)).success).toBe(false);
  });

  it("requires quote, name and role when publishing", () => {
    const section = sampleSection("testimonials");
    Object.assign(section.data.items[0]!, { quote: "", name: "", role: "" });
    expect(draftPageContentSchema.safeParse(pageWith(section)).success).toBe(true);
    expect(issuePaths(publishPageContentSchema.safeParse(pageWith(section)))).toEqual(
      expect.arrayContaining([
        "sections.0.data.items.0.quote",
        "sections.0.data.items.0.name",
        "sections.0.data.items.0.role",
      ]),
    );
  });

  it("enforces the quote max length", () => {
    const section = sampleSection("testimonials");
    section.data.items[0]!.quote = "a".repeat(401);
    expect(draftPageContentSchema.safeParse(pageWith(section)).success).toBe(false);
  });
});

describe("pricing", () => {
  function withPlans(count: number) {
    const section = sampleSection("pricing");
    const template = section.data.plans[0]!;
    section.data.plans = Array.from({ length: count }, (_, i) => ({
      ...template,
      id: `plan-${i}`,
    }));
    return pageWith(section);
  }

  it("allows 1–4 plans", () => {
    expect(draftPageContentSchema.safeParse(withPlans(0)).success).toBe(false);
    expect(publishPageContentSchema.safeParse(withPlans(1)).success).toBe(true);
    expect(publishPageContentSchema.safeParse(withPlans(4)).success).toBe(true);
    expect(draftPageContentSchema.safeParse(withPlans(5)).success).toBe(false);
  });

  it("allows multiple highlighted plans", () => {
    const section = sampleSection("pricing");
    for (const plan of section.data.plans) plan.highlighted = true;
    expect(publishPageContentSchema.safeParse(pageWith(section)).success).toBe(true);
  });

  it("requires highlighted to be a boolean", () => {
    const section = sampleSection("pricing");
    (section.data.plans[0] as { highlighted: unknown }).highlighted = "yes";
    expect(draftPageContentSchema.safeParse(pageWith(section)).success).toBe(false);
  });

  it("allows 0–10 features of up to 80 characters", () => {
    const section = sampleSection("pricing");
    const plan = section.data.plans[0]!;
    plan.features = [];
    expect(publishPageContentSchema.safeParse(pageWith(section)).success).toBe(true);
    plan.features = Array.from({ length: 10 }, () => "a".repeat(80));
    expect(publishPageContentSchema.safeParse(pageWith(section)).success).toBe(true);
    plan.features.push("one too many");
    expect(draftPageContentSchema.safeParse(pageWith(section)).success).toBe(false);
    plan.features = ["a".repeat(81)];
    expect(draftPageContentSchema.safeParse(pageWith(section)).success).toBe(false);
  });

  it("allows empty features in draft but not when publishing", () => {
    const section = sampleSection("pricing");
    section.data.plans[0]!.features = [""];
    expect(draftPageContentSchema.safeParse(pageWith(section)).success).toBe(true);
    expect(issuePaths(publishPageContentSchema.safeParse(pageWith(section)))).toContain(
      "sections.0.data.plans.0.features.0",
    );
  });

  it("validates buttonHref", () => {
    const section = sampleSection("pricing");
    section.data.plans[0]!.buttonHref = "javascript:alert(1)";
    expect(issuePaths(draftPageContentSchema.safeParse(pageWith(section)))).toContain(
      "sections.0.data.plans.0.buttonHref",
    );
  });
});

describe("faq", () => {
  function withItems(count: number) {
    const section = sampleSection("faq");
    const template = section.data.items[0]!;
    section.data.items = Array.from({ length: count }, (_, i) => ({
      ...template,
      id: `q-${i}`,
    }));
    return pageWith(section);
  }

  it("allows 1–20 items", () => {
    expect(draftPageContentSchema.safeParse(withItems(0)).success).toBe(false);
    expect(publishPageContentSchema.safeParse(withItems(20)).success).toBe(true);
    expect(draftPageContentSchema.safeParse(withItems(21)).success).toBe(false);
  });

  it("enforces question and answer max lengths", () => {
    const section = sampleSection("faq");
    section.data.items[0]!.question = "a".repeat(151);
    section.data.items[0]!.answer = "a".repeat(801);
    expect(issuePaths(draftPageContentSchema.safeParse(pageWith(section)))).toEqual(
      expect.arrayContaining([
        "sections.0.data.items.0.question",
        "sections.0.data.items.0.answer",
      ]),
    );
  });
});

describe("cta", () => {
  it("requires heading, description and button when publishing", () => {
    const section = sampleSection("cta");
    section.data = { heading: "", description: "", button: { label: "", href: "" } };
    expect(draftPageContentSchema.safeParse(pageWith(section)).success).toBe(true);
    expect(issuePaths(publishPageContentSchema.safeParse(pageWith(section)))).toEqual(
      expect.arrayContaining([
        "sections.0.data.heading",
        "sections.0.data.description",
        "sections.0.data.button.label",
        "sections.0.data.button.href",
      ]),
    );
  });

  it("rejects a missing button", () => {
    const section = sampleSection("cta");
    const data = without(section.data, "button");
    expect(
      draftPageContentSchema.safeParse(pageWith({ ...section, data } as unknown as Section))
        .success,
    ).toBe(false);
  });
});

describe("footer", () => {
  function withLinks(count: number) {
    const section = sampleSection("footer");
    section.data.links = Array.from({ length: count }, (_, i) => ({
      id: `link-${i}`,
      label: "Link",
      href: "/about",
    }));
    return pageWith(section);
  }

  it("allows 0–8 links", () => {
    expect(publishPageContentSchema.safeParse(withLinks(0)).success).toBe(true);
    expect(publishPageContentSchema.safeParse(withLinks(8)).success).toBe(true);
    expect(draftPageContentSchema.safeParse(withLinks(9)).success).toBe(false);
  });

  it("allows tagline to be omitted, requires brandName and copyright when publishing", () => {
    const section = sampleSection("footer");
    delete section.data.tagline;
    section.data.brandName = "";
    section.data.copyright = "";
    expect(draftPageContentSchema.safeParse(pageWith(section)).success).toBe(true);
    expect(issuePaths(publishPageContentSchema.safeParse(pageWith(section)))).toEqual([
      "sections.0.data.brandName",
      "sections.0.data.copyright",
    ]);
  });

  it("rejects duplicate link ids", () => {
    const content = withLinks(2);
    const footer = content.sections[0] as SectionOfType<"footer">;
    footer.data.links[1]!.id = "link-0";
    expect(issuePaths(draftPageContentSchema.safeParse(content))).toContain(
      "sections.0.data.links.1.id",
    );
  });
});

describe("URL validation in content", () => {
  function withCtaHref(value: string) {
    const section = sampleSection("cta");
    section.data.button.href = value;
    return pageWith(section);
  }

  it.each(["javascript:alert(1)", "JAVASCRIPT:alert(1)", "data:text/html,x", "//evil.com"])(
    "rejects %j in both modes",
    (value) => {
      for (const schema of Object.values(schemas)) {
        expect(issuePaths(schema.safeParse(withCtaHref(value)))).toContain(
          "sections.0.data.button.href",
        );
      }
    },
  );

  it.each(["https://example.com", "http://example.com", "mailto:a@example.com", "#pricing", "/signup"])(
    "accepts %j in both modes",
    (value) => {
      for (const schema of Object.values(schemas)) {
        expect(schema.safeParse(withCtaHref(value)).success).toBe(true);
      }
    },
  );

  it("rejects unsafe URLs in every link field", () => {
    const content = clone(samplePageContent);
    const bad = "javascript:alert(1)";
    for (const section of content.sections) {
      if (section.type === "hero") {
        section.data.primaryButton.href = bad;
        section.data.secondaryButton!.href = bad;
      }
      if (section.type === "pricing") section.data.plans[0]!.buttonHref = bad;
      if (section.type === "cta") section.data.button.href = bad;
      if (section.type === "footer") section.data.links[0]!.href = bad;
    }
    const paths = issuePaths(draftPageContentSchema.safeParse(content));
    expect(paths.filter((p) => /href$/i.test(p))).toHaveLength(5);
  });
});

it("covers every section type", () => {
  expect(new Set(samplePageContent.sections.map((s) => s.type))).toEqual(
    new Set(SECTION_TYPES),
  );
});
