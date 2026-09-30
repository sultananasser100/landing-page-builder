import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "@jest/globals";

import { sectionDefinitions } from "./definitions";
import { SECTION_TYPES, type PageContent, type Section } from "./page-content";
import { PageRenderer } from "./page-renderer";
import { samplePageContent } from "./sample-page";

function pageOf(sections: Section[]): PageContent {
  return { schemaVersion: 1, meta: { title: "", description: "" }, sections };
}

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
    for (const type of SECTION_TYPES) {
      expect(html).toContain(`id="${type}"`);
    }
  });

  it("renders sections in order", () => {
    const html = renderToStaticMarkup(<PageRenderer content={samplePageContent} />);
    const positions = samplePageContent.sections.map((s) => html.indexOf(`id="${s.type}"`));
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

  it.each(SECTION_TYPES)("renders the %s default with a type-based anchor", (type) => {
    const section = sectionDefinitions[type].createDefault();
    const html = renderToStaticMarkup(<PageRenderer content={pageOf([section])} />);
    expect(html).toContain(`id="${type}"`);
    // The stored UUID is never used as the DOM id.
    expect(html).not.toContain(`id="${section.id}"`);
  });

  it("gives UUID-backed sections a target for #anchor links (Hero to Features)", () => {
    const hero = sectionDefinitions.hero.createDefault();
    const features = sectionDefinitions.features.createDefault();
    hero.data.primaryButton.href = "#features";

    const html = renderToStaticMarkup(<PageRenderer content={pageOf([hero, features])} />);

    expect(html).toContain('href="#features"');
    expect(html).toMatch(/<section id="features"/);
    expect(html.match(/id="features"/g)).toHaveLength(1);
  });

  it("uses numbered anchors for repeated section types", () => {
    const html = renderToStaticMarkup(
      <PageRenderer
        content={pageOf([
          sectionDefinitions.features.createDefault(),
          sectionDefinitions.features.createDefault(),
          sectionDefinitions.features.createDefault(),
        ])}
      />,
    );
    expect(html).toMatch(/<section id="features"/);
    expect(html).toContain('id="features-2"');
    expect(html).toContain('id="features-3"');
  });

  it("does not change stored section ids", () => {
    const content = pageOf([sectionDefinitions.hero.createDefault()]);
    const before = JSON.stringify(content);
    renderToStaticMarkup(<PageRenderer content={content} />);
    expect(JSON.stringify(content)).toBe(before);
  });
});
