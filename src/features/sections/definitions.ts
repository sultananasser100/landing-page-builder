import { createCtaDefault } from "./cta/default";
import { createFaqDefault } from "./faq/default";
import { createFeaturesDefault } from "./features/default";
import { createFooterDefault } from "./footer/default";
import { createHeroDefault } from "./hero/default";
import type { SectionOfType, SectionType } from "./page-content";
import { createPricingDefault } from "./pricing/default";
import { createTestimonialsDefault } from "./testimonials/default";

export type SectionDefinition<T extends SectionType> = {
  type: T;
  label: string;
  /** Returns a new section with fresh ids that passes draft validation. */
  createDefault: () => SectionOfType<T>;
};

// The mapped type makes this exhaustive: adding a section type without a
// definition is a type error.
export const sectionDefinitions: {
  [T in SectionType]: SectionDefinition<T>;
} = {
  hero: { type: "hero", label: "Hero", createDefault: createHeroDefault },
  features: {
    type: "features",
    label: "Features",
    createDefault: createFeaturesDefault,
  },
  testimonials: {
    type: "testimonials",
    label: "Testimonials",
    createDefault: createTestimonialsDefault,
  },
  pricing: {
    type: "pricing",
    label: "Pricing",
    createDefault: createPricingDefault,
  },
  faq: { type: "faq", label: "FAQ", createDefault: createFaqDefault },
  cta: { type: "cta", label: "Call to action", createDefault: createCtaDefault },
  footer: { type: "footer", label: "Footer", createDefault: createFooterDefault },
};
