import { describe, expect, it } from "@jest/globals";
import { renderToStaticMarkup } from "react-dom/server";

import NewPageError from "./error";
import NewPageLoading from "./loading";

describe("new page loading state", () => {
  const html = renderToStaticMarkup(<NewPageLoading />);

  it("announces that the new page form is loading, not the pages list", () => {
    expect(html).toMatch(/role="status"[^>]*>Loading the new page form…</);
    expect(html).not.toContain("Loading pages");
  });

  it("is marked busy and has no heading of its own", () => {
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toMatch(/<h[1-6]/);
  });
});

describe("new page error state", () => {
  const render = (error: Error & { digest?: string }) =>
    renderToStaticMarkup(<NewPageError error={error} retry={() => {}} />);

  it("refers to the new page screen, not the pages list", () => {
    const html = render(new Error("boom"));
    expect(html).toContain('role="alert"');
    expect(html).toMatch(/<h1[^>]*>We couldn&#x27;t open the new page screen\.<\/h1>/);
    expect(html).not.toContain("load your pages");
  });

  it("offers Try again and a link back to the pages list", () => {
    const html = render(new Error("boom"));
    expect(html).toContain("Try again");
    expect(html).toMatch(/<a [^>]*href="\/dashboard"[^>]*>Back to pages<\/a>/);
  });

  it("shows only the digest reference, never the error message", () => {
    const html = render(Object.assign(new Error("secret-detail"), { digest: "abc123" }));
    expect(html).toContain("Reference: abc123");
    expect(html).not.toContain("secret-detail");
    expect(render(new Error("secret-detail"))).not.toContain("Reference:");
  });
});
