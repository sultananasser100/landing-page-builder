import { describe, expect, it, jest } from "@jest/globals";
import { isValidElement, type ReactElement, type ReactNode } from "react";

import { updateItem } from "@/features/editor/item-list";
import { LinkField, OptionalLinkField } from "@/features/editor/fields/link-field";
import { ItemListField, StringListField } from "@/features/editor/fields/list-fields";
import { TextField } from "@/features/editor/fields/text-field";
import { CheckboxField } from "@/features/editor/fields/choice-fields";
import type { SectionInspectorProps } from "@/features/editor/inspector-types";

import { FeaturesInspector } from "./features/features-inspector";
import { FooterInspector } from "./footer/footer-inspector";
import { HeroInspector } from "./hero/hero-inspector";
import type { SectionOfType, SectionType } from "./page-content";
import { PricingInspector } from "./pricing/pricing-inspector";
import { samplePageContent } from "./sample-page";

// Without a DOM, these tests call the (hook-free) inspector components as
// functions and invoke the onChange callbacks on the elements they return,
// checking the section each edit produces.

type AnyElement = ReactElement<Record<string, unknown>>;

function findAll(node: ReactNode, match: (element: AnyElement) => boolean): AnyElement[] {
  const found: AnyElement[] = [];
  const visit = (current: ReactNode) => {
    if (Array.isArray(current)) {
      current.forEach(visit);
    } else if (isValidElement(current)) {
      const element = current as AnyElement;
      if (match(element)) found.push(element);
      visit(element.props.children as ReactNode);
    }
  };
  visit(node);
  return found;
}

function findOne(node: ReactNode, match: (element: AnyElement) => boolean): AnyElement {
  const [element, ...rest] = findAll(node, match);
  if (!element || rest.length > 0) throw new Error(`expected exactly one match, got ${rest.length + (element ? 1 : 0)}`);
  return element;
}

const byType = (type: unknown) => (element: AnyElement) => element.type === type;
const pathEndsWith =
  (...suffix: (string | number)[]) =>
  (element: AnyElement) => {
    const path = element.props.path as (string | number)[] | undefined;
    return !!path && suffix.every((part, i) => path[path.length - suffix.length + i] === part);
  };

function sampleSection<T extends SectionType>(type: T): SectionOfType<T> {
  const section = samplePageContent.sections.find((s) => s.type === type);
  if (!section) throw new Error(`no ${type}`);
  return structuredClone(section) as SectionOfType<T>;
}

function setup<T extends SectionType>(type: T) {
  const section = sampleSection(type);
  const onChange = jest.fn<(next: SectionOfType<T>) => void>();
  const props: SectionInspectorProps<T> = {
    section,
    basePath: ["sections", 0, "data"],
    issueFor: () => undefined,
    onChange,
  };
  const lastChange = () => {
    const call = onChange.mock.calls.at(-1);
    if (!call) throw new Error("onChange was not called");
    return call[0];
  };
  return { section, props, onChange, lastChange };
}

/**
 * Expands an ItemListField's `renderItem` for one item, wiring `update` the
 * same way ItemListField does (`updateItem` on the list, then its onChange).
 */
function renderListItem(list: AnyElement, index: number): ReactNode {
  const items = list.props.items as { id: string }[];
  const item = items[index]!;
  const onChange = list.props.onChange as (items: unknown[]) => void;
  const renderItem = list.props.renderItem as (
    item: unknown,
    index: number,
    update: (patch: object) => void,
  ) => ReactNode;
  return renderItem(item, index, (patch) => onChange(updateItem(items, item.id, patch)));
}

describe("hero inspector handlers", () => {
  it("removes the secondary button without touching other fields", () => {
    const { section, props, lastChange } = setup("hero");
    expect(section.data.secondaryButton).toBeDefined();

    const optional = findOne(HeroInspector(props), byType(OptionalLinkField));
    (optional.props.onChange as (value: undefined) => void)(undefined);

    const next = lastChange();
    expect(next.data.secondaryButton).toBeUndefined();
    expect(JSON.parse(JSON.stringify(next.data))).not.toHaveProperty("secondaryButton");
    expect(next).toEqual({
      ...section,
      data: { ...section.data, secondaryButton: undefined },
    });
  });

  it("adds an empty secondary button when absent", () => {
    const { section, props, lastChange } = setup("hero");
    const withoutSecondary = { ...section, data: { ...section.data, secondaryButton: undefined } };
    const optional = findOne(
      HeroInspector({ ...props, section: withoutSecondary }),
      byType(OptionalLinkField),
    );
    (optional.props.onChange as (value: object) => void)({ label: "", href: "" });

    expect(lastChange().data.secondaryButton).toEqual({ label: "", href: "" });
    expect(lastChange().data.heading).toBe(section.data.heading);
  });

  it("edits the primary button label and keeps its href", () => {
    const { section, props, lastChange } = setup("hero");
    const link = findOne(HeroInspector(props), (el) => el.type === LinkField);
    const labelField = findOne(
      LinkField(link.props as Parameters<typeof LinkField>[0]),
      (el) => el.type === TextField && pathEndsWith("primaryButton", "label")(el),
    );
    (labelField.props.onChange as (value: string) => void)("Try it free");

    expect(lastChange().data.primaryButton).toEqual({
      label: "Try it free",
      href: section.data.primaryButton.href,
    });
    expect(lastChange().data.secondaryButton).toEqual(section.data.secondaryButton);
    expect(lastChange().id).toBe(section.id);
    expect(lastChange().type).toBe("hero");
  });
});

describe("features inspector handlers", () => {
  it("editing one item's title preserves its other fields and the other items", () => {
    const { section, props, lastChange } = setup("features");
    const list = findOne(FeaturesInspector(props), byType(ItemListField));
    const title = findOne(renderListItem(list, 1), pathEndsWith("items", 1, "title"));
    (title.props.onChange as (value: string) => void)("Renamed feature");

    const next = lastChange();
    expect(next.data.items[1]).toEqual({ ...section.data.items[1], title: "Renamed feature" });
    expect(next.data.items.filter((_, i) => i !== 1)).toEqual(
      section.data.items.filter((_, i) => i !== 1),
    );
    expect(next.data.heading).toBe(section.data.heading);
    expect(next.data.description).toBe(section.data.description);
  });

  it("changing an icon keeps title and description", () => {
    const { section, props, lastChange } = setup("features");
    const list = findOne(FeaturesInspector(props), byType(ItemListField));
    const icon = findOne(renderListItem(list, 0), pathEndsWith("items", 0, "icon"));
    (icon.props.onChange as (value: string) => void)("rocket");

    expect(lastChange().data.items[0]).toEqual({ ...section.data.items[0], icon: "rocket" });
  });

  it("creates new items with a fresh id and empty fields", () => {
    const { props } = setup("features");
    const list = findOne(FeaturesInspector(props), byType(ItemListField));
    const createItem = list.props.createItem as () => { id: string };
    const a = createItem();
    const b = createItem();
    expect(a).toEqual({ id: a.id, icon: "zap", title: "", description: "" });
    expect(a.id).not.toBe(b.id);
  });

  it("passes the schema limits to the list", () => {
    const { props } = setup("features");
    const list = findOne(FeaturesInspector(props), byType(ItemListField));
    expect(list.props.bounds).toEqual({ min: 1, max: 12 });
  });
});

describe("pricing inspector handlers", () => {
  it("editing a plan's feature list keeps the plan's other fields", () => {
    const { section, props, lastChange } = setup("pricing");
    const list = findOne(PricingInspector(props), byType(ItemListField));
    const features = findOne(renderListItem(list, 1), byType(StringListField));
    (features.props.onChange as (values: string[]) => void)(["Only this"]);

    const next = lastChange();
    expect(next.data.plans[1]).toEqual({ ...section.data.plans[1], features: ["Only this"] });
    expect(next.data.plans[0]).toEqual(section.data.plans[0]);
    expect(next.data.plans[2]).toEqual(section.data.plans[2]);
  });

  it("toggling highlighted changes only that plan", () => {
    const { section, props, lastChange } = setup("pricing");
    const list = findOne(PricingInspector(props), byType(ItemListField));
    const checkbox = findOne(renderListItem(list, 0), byType(CheckboxField));
    (checkbox.props.onChange as (value: boolean) => void)(true);

    const next = lastChange();
    expect(next.data.plans[0]).toEqual({ ...section.data.plans[0], highlighted: true });
    // Multiple highlighted plans stay valid (the Team plan is already highlighted).
    expect(next.data.plans[1]!.highlighted).toBe(true);
  });

  it("passes the plan and feature limits", () => {
    const { props } = setup("pricing");
    const list = findOne(PricingInspector(props), byType(ItemListField));
    expect(list.props.bounds).toEqual({ min: 1, max: 4 });
    const features = findOne(renderListItem(list, 0), byType(StringListField));
    expect(features.props.bounds).toEqual({ min: 0, max: 10 });
    expect(features.props.maxLength).toBe(80);
  });
});

describe("footer inspector handlers", () => {
  it("editing a link's href keeps its label and the other links", () => {
    const { section, props, lastChange } = setup("footer");
    const list = findOne(FooterInspector(props), byType(ItemListField));
    const href = findOne(renderListItem(list, 2), pathEndsWith("links", 2, "href"));
    (href.props.onChange as (value: string) => void)("/faq");

    const next = lastChange();
    expect(next.data.links[2]).toEqual({ ...section.data.links[2], href: "/faq" });
    expect(next.data.links.filter((_, i) => i !== 2)).toEqual(
      section.data.links.filter((_, i) => i !== 2),
    );
    expect(next.data.brandName).toBe(section.data.brandName);
  });

  it("allows removing every link (minimum 0)", () => {
    const { props } = setup("footer");
    const list = findOne(FooterInspector(props), byType(ItemListField));
    expect(list.props.bounds).toEqual({ min: 0, max: 8 });
  });
});
