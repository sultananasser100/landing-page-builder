import { sectionDefinitions } from "@/features/sections/definitions";
import type { Section } from "@/features/sections/page-content";

/** The section's type label, e.g. "Call to action". */
export function sectionLabel(section: Section): string {
  return sectionDefinitions[section.type].label;
}

/** A short excerpt identifying the section in the outline (display only). */
export function sectionSummary(section: Section): string {
  switch (section.type) {
    case "hero":
    case "features":
    case "testimonials":
    case "pricing":
    case "faq":
    case "cta":
      return section.data.heading.trim();
    case "footer":
      return section.data.brandName.trim();
  }
}
