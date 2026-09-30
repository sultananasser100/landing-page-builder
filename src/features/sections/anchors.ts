import type { Section } from "./page-content";

/**
 * DOM ids for a page's sections, in order, so links such as `#features` work.
 * The anchor is the section type; a repeated type gets `-2`, `-3`, … (first
 * `features`, then `features-2`). Stored section ids are UUIDs and are not
 * used here; they stay the stable identity for editing and reordering.
 *
 * An anchor can only clash with a type-plus-number anchor of another section
 * if types were named that way; the section types are fixed, so they cannot.
 */
export function sectionAnchors(sections: readonly Pick<Section, "type">[]): string[] {
  const seen = new Map<string, number>();
  return sections.map(({ type }) => {
    const count = (seen.get(type) ?? 0) + 1;
    seen.set(type, count);
    return count === 1 ? type : `${type}-${count}`;
  });
}
