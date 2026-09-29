import { CtaSection } from "./cta/cta-section";
import { FaqSection } from "./faq/faq-section";
import { FeaturesSection } from "./features/features-section";
import { FooterSection } from "./footer/footer-section";
import { HeroSection } from "./hero/hero-section";
import type { Section, SectionOfType, SectionType } from "./page-content";
import { PricingSection } from "./pricing/pricing-section";
import { TestimonialsSection } from "./testimonials/testimonials-section";

type SectionRenderer<T extends SectionType> = (props: {
  id: string;
  data: SectionOfType<T>["data"];
}) => React.ReactNode;

// Exhaustive: every section type must have a renderer.
export const sectionRenderers: { [T in SectionType]: SectionRenderer<T> } = {
  hero: HeroSection,
  features: FeaturesSection,
  testimonials: TestimonialsSection,
  pricing: PricingSection,
  faq: FaqSection,
  cta: CtaSection,
  footer: FooterSection,
};

export function RenderSection({ section }: { section: Section }) {
  // TypeScript cannot correlate `section.type` with `section.data` through the
  // lookup, so widen the renderer; the mapped type above guarantees the pairing.
  const Renderer = sectionRenderers[section.type] as SectionRenderer<SectionType>;
  return <Renderer id={section.id} data={section.data} />;
}
