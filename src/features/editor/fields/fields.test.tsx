import { describe, expect, it } from "@jest/globals";
import { renderToStaticMarkup } from "react-dom/server";

import type { EditorIssue } from "../validation";
import { CheckboxField, IconField } from "./choice-fields";
import { describedBy, fieldId, humanize } from "./field-utils";
import { LinkField, OptionalLinkField } from "./link-field";
import { ItemListField, StringListField } from "./list-fields";
import { TextField } from "./text-field";

const noop = () => {};
const noIssues = () => undefined;
const error: EditorIssue = { path: [], message: "Must be a safe URL", severity: "error" };
const publish: EditorIssue = { path: [], message: "Required to publish", severity: "publish" };

describe("field utils", () => {
  it("builds ids from content paths", () => {
    expect(fieldId(["sections", 2, "data", "heading"])).toBe("field-sections-2-data-heading");
  });

  it("joins only present ids", () => {
    expect(describedBy("a", undefined, false, "b")).toBe("a b");
    expect(describedBy(undefined)).toBeUndefined();
  });

  it("humanizes option values", () => {
    expect(humanize("chart-column")).toBe("Chart column");
    expect(humanize("zap")).toBe("Zap");
  });
});

describe("TextField", () => {
  const path = ["sections", 0, "data", "heading"];

  it("labels the input and shows a character counter with maxLength", () => {
    const html = renderToStaticMarkup(
      <TextField path={path} label="Heading" value="Hello" maxLength={100} onChange={noop} />,
    );
    expect(html).toContain('<label for="field-sections-0-data-heading"');
    expect(html).toContain('id="field-sections-0-data-heading"');
    expect(html).toContain('maxLength="100"');
    expect(html).toContain('value="Hello"');
    expect(html).toContain("5/100");
    expect(html).toContain('aria-describedby="field-sections-0-data-heading-count"');
    expect(html).not.toContain('aria-invalid="true"');
  });

  it("marks optional fields in text", () => {
    const html = renderToStaticMarkup(
      <TextField path={path} label="Eyebrow" value="" maxLength={40} optional onChange={noop} />,
    );
    expect(html).toContain("(optional)");
  });

  it("renders a textarea when multiline", () => {
    const html = renderToStaticMarkup(
      <TextField path={path} label="Answer" value="x" maxLength={800} multiline onChange={noop} />,
    );
    expect(html).toContain("<textarea");
    expect(html).not.toContain("<input");
  });

  it("links errors to the control and marks it invalid", () => {
    const html = renderToStaticMarkup(
      <TextField
        path={path}
        label="Link"
        value="javascript:x"
        maxLength={2048}
        hint="https:// …"
        issue={error}
        onChange={noop}
      />,
    );
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain(
      'aria-describedby="field-sections-0-data-heading-hint field-sections-0-data-heading-count field-sections-0-data-heading-message"',
    );
    expect(html).toContain('id="field-sections-0-data-heading-message"');
    expect(html).toContain("Error: Must be a safe URL");
  });

  it("shows publish requirements without marking the field invalid", () => {
    const html = renderToStaticMarkup(
      <TextField path={path} label="Heading" value="" maxLength={100} issue={publish} onChange={noop} />,
    );
    expect(html).toContain("Required to publish");
    expect(html).not.toContain('aria-invalid="true"');
    expect(html).not.toContain("Error:");
  });
});

describe("LinkField and OptionalLinkField", () => {
  const path = ["sections", 0, "data", "primaryButton"];

  it("groups label and link in a fieldset with the URL hint", () => {
    const html = renderToStaticMarkup(
      <LinkField
        path={path}
        legend="Primary button"
        value={{ label: "Start", href: "#pricing" }}
        issueFor={noIssues}
        onChange={noop}
      />,
    );
    expect(html).toMatch(/<fieldset[^>]*><legend[^>]*>Primary button<\/legend>/);
    expect(html).toContain('id="field-sections-0-data-primaryButton-label"');
    expect(html).toContain('id="field-sections-0-data-primaryButton-href"');
    expect(html).toContain('maxLength="30"');
    expect(html).toContain('maxLength="2048"');
    expect(html).toContain('inputMode="url"');
  });

  it("offers to add an optional link when absent, and to remove it when present", () => {
    const absent = renderToStaticMarkup(
      <OptionalLinkField
        path={path}
        legend="Secondary button"
        value={undefined}
        issueFor={noIssues}
        onChange={noop}
      />,
    );
    expect(absent).toContain("Add secondary button");
    expect(absent).not.toContain("<input");

    const present = renderToStaticMarkup(
      <OptionalLinkField
        path={path}
        legend="Secondary button"
        value={{ label: "", href: "" }}
        issueFor={noIssues}
        onChange={noop}
      />,
    );
    expect(present).toContain("Secondary button (optional)");
    expect(present).toContain("Remove secondary button");
  });
});

describe("choice fields", () => {
  it("renders the icon options with the selected value", () => {
    const html = renderToStaticMarkup(
      <IconField
        path={["icon"]}
        label="Icon"
        value="zap"
        options={["zap", "chart-column"] as const}
        onChange={noop}
      />,
    );
    expect(html).toContain('<select id="field-icon"');
    expect(html).toContain('<option value="zap" selected="">Zap</option>');
    expect(html).toContain('<option value="chart-column">Chart column</option>');
    expect(html).toContain('aria-hidden="true"');
  });

  it("renders a labelled checkbox", () => {
    const html = renderToStaticMarkup(
      <CheckboxField path={["highlighted"]} label="Highlight" checked onChange={noop} />,
    );
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('checked=""');
    expect(html).toContain('<label for="field-highlighted"');
  });
});

describe("ItemListField", () => {
  type Item = { id: string; title: string };
  const items: Item[] = [
    { id: "a", title: "A" },
    { id: "b", title: "B" },
  ];

  function render(list: Item[], bounds = { min: 1, max: 3 }, issue?: EditorIssue) {
    return renderToStaticMarkup(
      <ItemListField
        path={["items"]}
        legend="Features"
        noun="Feature"
        plural="features"
        items={list}
        bounds={bounds}
        issue={issue}
        createItem={() => ({ id: "new", title: "" })}
        onChange={noop}
        renderItem={(item) => <span>{item.title}</span>}
      />,
    );
  }

  it("renders each item as a numbered fieldset with a remove button", () => {
    const html = render(items);
    expect(html).toContain('data-item-id="a"');
    expect(html).toContain(">Feature 1</legend>");
    expect(html).toContain(">Feature 2</legend>");
    expect(html).toContain("Remove feature 2");
    expect(html).toContain("2 of 3 features");
  });

  it("disables Add at the maximum and Remove at the minimum", () => {
    const full = render([...items, { id: "c", title: "C" }]);
    expect(full).toMatch(/<button[^>]*disabled=""[^>]*data-add-item=""/);
    expect(full).toContain("Maximum of 3 features reached");

    const single = render([items[0]!]);
    expect(single).toMatch(/<button[^>]*disabled=""[^>]*>Remove/);
  });

  it("shows list-level issues", () => {
    expect(render([], { min: 1, max: 3 }, publish)).toContain("Required to publish");
  });
});

describe("StringListField", () => {
  it("renders one text field per value with accessible remove buttons", () => {
    const html = renderToStaticMarkup(
      <StringListField
        path={["features"]}
        legend="Plan features"
        noun="Feature"
        plural="features"
        values={["One", "Two"]}
        bounds={{ min: 0, max: 10 }}
        maxLength={80}
        issueFor={noIssues}
        onChange={noop}
      />,
    );
    expect(html).toContain('id="field-features-0"');
    expect(html).toContain('id="field-features-1"');
    expect(html).toContain('maxLength="80"');
    expect(html).toContain('<span class="sr-only"> feature 2</span>');
    expect(html).toContain("2 of 10 features");
  });
});
