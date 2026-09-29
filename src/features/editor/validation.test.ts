import { describe, expect, it } from "@jest/globals";

import { sectionDefinitions } from "@/features/sections/definitions";
import type { PageContent, SectionOfType } from "@/features/sections/page-content";
import { samplePageContent } from "@/features/sections/sample-page";

import {
  countIssues,
  issueAt,
  pathKey,
  sectionIdsWithErrors,
  validateContent,
} from "./validation";

function sample(): PageContent {
  return structuredClone(samplePageContent);
}

function hero(content: PageContent) {
  return content.sections[0] as SectionOfType<"hero">;
}

describe("validateContent", () => {
  it("reports nothing for publishable content", () => {
    expect(validateContent(sample())).toEqual({ errors: [], publishIssues: [] });
  });

  it("reports empty required fields as needed to publish, not as errors", () => {
    const content = sample();
    hero(content).data.heading = "";
    content.meta.title = "   ";

    const result = validateContent(content);
    expect(result.errors).toEqual([]);
    expect(result.publishIssues).toEqual(
      expect.arrayContaining([
        { path: ["sections", 0, "data", "heading"], message: "Required to publish", severity: "publish" },
        { path: ["meta", "title"], message: "Required to publish", severity: "publish" },
      ]),
    );
  });

  it("reports unsafe URLs as errors only once", () => {
    const content = sample();
    hero(content).data.primaryButton.href = "javascript:alert(1)";

    const result = validateContent(content);
    expect(result.errors).toEqual([
      {
        path: ["sections", 0, "data", "primaryButton", "href"],
        message: "Must be an https:, http: or mailto: URL, a #anchor or a /path",
        severity: "error",
      },
    ]);
    expect(result.publishIssues).toEqual([]);
  });

  it("reports an empty href as needed to publish", () => {
    const content = sample();
    hero(content).data.primaryButton.href = "";
    const result = validateContent(content);
    expect(result.errors).toEqual([]);
    expect(issueAt(result, ["sections", 0, "data", "primaryButton", "href"])?.severity).toBe(
      "publish",
    );
  });

  it("describes length limits in plain language", () => {
    const content = sample();
    hero(content).data.heading = "a".repeat(101);
    expect(validateContent(content).errors[0]?.message).toBe("Must be at most 100 characters");
  });

  it("asks for at least one section before publishing", () => {
    const result = validateContent({ ...sample(), sections: [] });
    expect(result.errors).toEqual([]);
    expect(result.publishIssues).toEqual([
      { path: ["sections"], message: "Add at least one section to publish", severity: "publish" },
    ]);
  });

  it("accepts every section default as a draft", () => {
    const content: PageContent = {
      schemaVersion: 1,
      meta: { title: "", description: "" },
      sections: Object.values(sectionDefinitions).map((d) => d.createDefault()),
    };
    expect(validateContent(content).errors).toEqual([]);
  });

  it("never includes field values in messages", () => {
    const content = sample();
    hero(content).data.primaryButton.href = "javascript:secret-value";
    hero(content).data.heading = "secret-heading".repeat(10);
    const messages = validateContent(content).errors.map((issue) => issue.message).join(" ");
    expect(messages).not.toContain("secret");
  });
});

describe("sectionIdsWithErrors", () => {
  it("lists only sections with draft errors, by id", () => {
    const content = sample();
    hero(content).data.primaryButton.href = "javascript:x"; // error in "hero"
    const faq = content.sections.find((s) => s.type === "faq")!;
    if (faq.type !== "faq") throw new Error("expected faq");
    faq.data.heading = ""; // publish-only issue: still previewable
    content.meta.title = ""; // not a section

    const ids = sectionIdsWithErrors(content, validateContent(content));
    expect([...ids]).toEqual(["hero"]);
  });

  it("is empty for valid drafts", () => {
    const content = sample();
    expect(sectionIdsWithErrors(content, validateContent(content)).size).toBe(0);
  });
});

describe("issueAt and countIssues", () => {
  it("finds issues by exact path, preferring errors", () => {
    const content = sample();
    hero(content).data.heading = "";
    hero(content).data.primaryButton.href = "javascript:x";
    const result = validateContent(content);

    expect(issueAt(result, ["sections", 0, "data", "heading"])?.severity).toBe("publish");
    expect(issueAt(result, ["sections", 0, "data", "primaryButton", "href"])?.severity).toBe(
      "error",
    );
    expect(issueAt(result, ["sections", 0, "data"])).toBeUndefined();
  });

  it("counts issues per section and in total", () => {
    const content = sample();
    hero(content).data.heading = "";
    hero(content).data.subheading = "";
    hero(content).data.primaryButton.href = "javascript:x";
    const result = validateContent(content);

    expect(countIssues(result, ["sections", 0])).toEqual({ errors: 1, publish: 2 });
    expect(countIssues(result, ["sections", 1])).toEqual({ errors: 0, publish: 0 });
    expect(countIssues(result, [])).toEqual({ errors: 1, publish: 2 });
  });

  it("builds stable path keys", () => {
    expect(pathKey(["sections", 2, "data", "items", 0, "title"])).toBe(
      "sections.2.data.items.0.title",
    );
  });
});
