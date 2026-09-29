import { describe, expect, it } from "@jest/globals";
import { renderToStaticMarkup } from "react-dom/server";

import { DashboardHeader } from "./dashboard-header";

describe("DashboardHeader", () => {
  it("renders a header with a home link and a sign-out form", () => {
    const html = renderToStaticMarkup(<DashboardHeader />);

    expect(html).toMatch(/^<header/);
    expect(html).toMatch(/<a [^>]*href="\/dashboard"[^>]*>Landing Page Builder<\/a>/);
    expect(html).toContain("<form");
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*>Sign out<\/button>/);
  });
});
