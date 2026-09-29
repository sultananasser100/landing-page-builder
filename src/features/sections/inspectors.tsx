import type { ComponentType } from "react";

import type { IssueLookup } from "@/features/editor/fields/field-utils";
import type { SectionInspectorProps } from "@/features/editor/inspector-types";
import type { IssuePath } from "@/features/editor/validation";

import { CtaInspector } from "./cta/cta-inspector";
import { FaqInspector } from "./faq/faq-inspector";
import { FeaturesInspector } from "./features/features-inspector";
import { FooterInspector } from "./footer/footer-inspector";
import { HeroInspector } from "./hero/hero-inspector";
import type { Section, SectionType } from "./page-content";
import { PricingInspector } from "./pricing/pricing-inspector";
import { TestimonialsInspector } from "./testimonials/testimonials-inspector";

// Editor-only (rendered inside the client-side PageEditor). Exhaustive: every
// section type must have an inspector.
export const sectionInspectors: {
  [T in SectionType]: ComponentType<SectionInspectorProps<T>>;
} = {
  hero: HeroInspector,
  features: FeaturesInspector,
  testimonials: TestimonialsInspector,
  pricing: PricingInspector,
  faq: FaqInspector,
  cta: CtaInspector,
  footer: FooterInspector,
};

export function SectionInspector({
  section,
  basePath,
  issueFor,
  onChange,
}: {
  section: Section;
  basePath: IssuePath;
  issueFor: IssueLookup;
  onChange: (section: Section) => void;
}) {
  // As in renderers.tsx, TypeScript cannot correlate `section.type` with the
  // looked-up component; the mapped type above guarantees the pairing.
  const Inspector = sectionInspectors[section.type] as ComponentType<
    SectionInspectorProps<SectionType>
  >;
  return (
    <Inspector
      section={section}
      basePath={basePath}
      issueFor={issueFor}
      onChange={onChange as (section: Section) => void}
    />
  );
}
