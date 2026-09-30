import { describe, expect, it } from "@jest/globals";
import { renderToStaticMarkup } from "react-dom/server";

import type { DashboardPage } from "@/features/pages/admin-queries";

import { PageStatusBadge } from "./page-status-badge";
import { PagesList } from "./pages-list";

const published: DashboardPage = {
  id: "p1",
  name: "Sample SaaS page",
  slug: "sample",
  status: "published",
  publishedAt: new Date("2026-09-27T08:00:00Z"),
  updatedAt: new Date("2026-09-29T10:05:00Z"),
};

const draft: DashboardPage = {
  id: "p2",
  name: "Agency draft",
  slug: "agency",
  status: "draft",
  publishedAt: null,
  updatedAt: new Date("2026-09-28T09:00:00Z"),
};

const withChanges: DashboardPage = {
  id: "p3",
  name: "Edited after publishing",
  slug: "edited",
  status: "unpublished-changes",
  publishedAt: new Date("2026-09-26T08:00:00Z"),
  updatedAt: new Date("2026-09-29T11:00:00Z"),
};

function render(pages: DashboardPage[]) {
  return renderToStaticMarkup(<PagesList pages={pages} />);
}

describe("PageStatusBadge", () => {
  it.each([
    ["published", "Published"],
    ["unpublished-changes", "Unpublished changes"],
    ["draft", "Draft"],
  ] as const)("labels %s pages as %s", (status, label) => {
    expect(renderToStaticMarkup(<PageStatusBadge status={status} />)).toContain(
      `>${label}</span>`,
    );
  });
});

describe("PagesList with unpublished changes", () => {
  it("shows the badge, both dates, and a live link (the published version is live)", () => {
    const html = render([withChanges]);
    expect(html).toContain(">Unpublished changes</span>");
    expect(html).toContain("Sep 29, 2026, 11:00 AM UTC");
    expect(html).toContain("Sep 26, 2026, 8:00 AM UTC");
    expect(html).toContain("Published <time");
    expect(html).toContain('href="/p/edited"');
    expect(html).toContain("View live");
  });

  it("counts it as published in the summary", () => {
    expect(render([published, withChanges, draft])).toContain("3 pages · 2 published");
  });
});

describe("PagesList", () => {
  it("shows an empty state without a list when there are no pages", () => {
    const html = render([]);
    expect(html).toContain("No pages yet");
    expect(html).not.toContain("<ul");
    expect(html).not.toContain("published");
  });

  it("summarises the page counts from the list itself", () => {
    expect(render([published, draft])).toContain("2 pages · 1 published");
    expect(render([draft])).toContain("1 page · 0 published");
  });

  it("renders one list item per page in the given order", () => {
    const html = render([published, draft]);
    expect(html.match(/<li/g)).toHaveLength(2);
    expect(html.indexOf("Sample SaaS page")).toBeLessThan(html.indexOf("Agency draft"));
  });

  it("shows each page's name, status, public path and UTC dates", () => {
    const html = render([published, draft]);

    expect(html).toContain("<h2");
    expect(html).toContain("/p/sample");
    expect(html).toContain("/p/agency");
    expect(html).toContain(">Published</span>");
    expect(html).toContain(">Draft</span>");
    expect(html).toContain(
      '<time dateTime="2026-09-29T10:05:00.000Z">Sep 29, 2026, 10:05 AM UTC</time>',
    );
    expect(html).toContain(
      '<time dateTime="2026-09-27T08:00:00.000Z">Sep 27, 2026, 8:00 AM UTC</time>',
    );
  });

  it("only shows the published date for published pages", () => {
    expect(render([draft])).not.toContain("Published <time");
  });

  it("links to the live page only when published, in a new tab with an accessible name", () => {
    const publishedHtml = render([published]);
    expect(publishedHtml).toContain('href="/p/sample"');
    expect(publishedHtml).toContain('target="_blank"');
    expect(publishedHtml).toContain('rel="noopener noreferrer"');
    expect(publishedHtml).toContain(
      "View live<span class=\"sr-only\">: Sample SaaS page (opens in a new tab)</span>",
    );

    const draftHtml = render([draft]);
    expect(draftHtml).not.toContain('href="/p/agency"');
    expect(draftHtml).not.toContain('target="_blank"');
    expect(draftHtml).not.toContain("View live");
  });

  it("links every page to its editor with an accessible name", () => {
    const html = render([published, draft]);
    expect(html).toMatch(
      /<a [^>]*href="\/dashboard\/pages\/p1"[^>]*>Edit<span class="sr-only"> Sample SaaS page<\/span><\/a>/,
    );
    expect(html).toMatch(
      /<a [^>]*href="\/dashboard\/pages\/p2"[^>]*>Edit<span class="sr-only"> Agency draft<\/span><\/a>/,
    );
  });

  it("escapes page names and slugs", () => {
    const html = render([
      { ...published, name: "<script>alert(1)</script>", slug: "a<b" },
    ]);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("/p/a&lt;b");
  });
});
