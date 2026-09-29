import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { sectionDefinitions } from "./definitions";
import { SECTION_TYPES } from "./page-content";
import { PageRenderer } from "./page-renderer";
import { samplePageContent } from "./sample-page";

describe("PageRenderer", () => {
  it("renders every section of the sample page", () => {
    const html = renderToStaticMarkup(<PageRenderer content={samplePageContent} />);

    expect(html).toContain("<h1");
    expect(html).toContain("Plan less. Ship more.");
    expect(html).toContain("Connected roadmaps");
    expect(html).toContain("Maya Okafor");
    expect(html).toContain("per user / month");
    expect(html).toContain("<details");
    expect(html).toContain("Give your team a calmer way to plan");
    expect(html).toContain("<footer");
    expect(html).toContain('href="mailto:sales@example.com"');
    for (const section of samplePageContent.sections) {
      expect(html).toContain(`id="${section.id}"`);
    }
  });

  it("renders sections in order", () => {
    const html = renderToStaticMarkup(<PageRenderer content={samplePageContent} />);
    const positions = samplePageContent.sections.map((s) => html.indexOf(`id="${s.id}"`));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("escapes content rather than rendering it as HTML", () => {
    const content = structuredClone(samplePageContent);
    const hero = content.sections[0]!;
    if (hero.type !== "hero") throw new Error("expected hero first");
    hero.data.heading = "<script>alert(1)</script>";
    const html = renderToStaticMarkup(<PageRenderer content={content} />);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it.each(SECTION_TYPES)("renders the %s default", (type) => {
    const section = sectionDefinitions[type].createDefault();
    const html = renderToStaticMarkup(
      <PageRenderer
        content={{ schemaVersion: 1, meta: { title: "", description: "" }, sections: [section] }}
      />,
    );
    expect(html).toContain(`id="${section.id}"`);
  });
});
