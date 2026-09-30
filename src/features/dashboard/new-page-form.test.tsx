import { describe, expect, it, jest } from "@jest/globals";
import { renderToStaticMarkup } from "react-dom/server";

import { templateOptions } from "@/features/templates/templates";

import { NewPageForm } from "./new-page-form";

// The form imports a Server Action; only its rendering is tested here.
jest.mock("@/features/pages/actions", () => ({ createPageFromTemplate: jest.fn() }));

describe("NewPageForm", () => {
  const html = renderToStaticMarkup(<NewPageForm templates={templateOptions} />);

  it("has labelled name and slug fields with the approved limits", () => {
    expect(html).toMatch(/<label[^>]*for="name"[^>]*>Page name<\/label>/);
    expect(html).toMatch(/<input[^>]*id="name"[^>]*maxLength="100"/);
    expect(html).toMatch(/<label[^>]*for="slug"[^>]*>URL slug<\/label>/);
    expect(html).toMatch(/<input[^>]*id="slug"[^>]*maxLength="60"/);
  });

  it("lists every template as a radio, with Blank selected", () => {
    expect(html).toContain("<legend");
    expect(html.match(/type="radio"/g)).toHaveLength(2);
    expect(html).toContain("Blank");
    expect(html).toContain("SaaS landing page");
    const radios = html.match(/<input[^>]*type="radio"[^>]*>/g) ?? [];
    const checked = radios.filter((radio) => radio.includes('checked=""'));
    expect(checked).toHaveLength(1);
    expect(checked[0]).toContain('value="blank"');
  });

  it("shows no errors initially", () => {
    expect(html).not.toContain('role="alert"');
  });

  it("offers Create page and a Cancel link back to the dashboard", () => {
    expect(html).toContain("Create page");
    expect(html).toMatch(/<a [^>]*href="\/dashboard"[^>]*>Cancel<\/a>/);
  });
});
