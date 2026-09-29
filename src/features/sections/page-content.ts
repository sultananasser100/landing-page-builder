import { z } from "zod";

import { ctaDataSchema } from "./cta/schema";
import { faqDataSchema } from "./faq/schema";
import { featuresDataSchema } from "./features/schema";
import { footerDataSchema } from "./footer/schema";
import { heroDataSchema } from "./hero/schema";
import { pricingDataSchema } from "./pricing/schema";
import {
  idSchema,
  requiredText,
  uniqueIds,
  type ValidationMode,
} from "./shared/fields";
import { testimonialsDataSchema } from "./testimonials/schema";

export const SECTION_TYPES = [
  "hero",
  "features",
  "testimonials",
  "pricing",
  "faq",
  "cta",
  "footer",
] as const;

export const PAGE_LIMITS = {
  /** Draft pages may be empty; publishing needs at least one section. */
  sections: { draftMin: 0, publishMin: 1, max: 20 },
  metaTitle: 70,
  metaDescription: 160,
} as const;

function sectionSchema(mode: ValidationMode) {
  const section = <T extends (typeof SECTION_TYPES)[number], D extends z.ZodType>(
    type: T,
    data: D,
  ) => z.strictObject({ id: idSchema, type: z.literal(type), data });

  return z.discriminatedUnion("type", [
    section("hero", heroDataSchema(mode)),
    section("features", featuresDataSchema(mode)),
    section("testimonials", testimonialsDataSchema(mode)),
    section("pricing", pricingDataSchema(mode)),
    section("faq", faqDataSchema(mode)),
    section("cta", ctaDataSchema(mode)),
    section("footer", footerDataSchema(mode)),
  ]);
}

function pageContentSchema(mode: ValidationMode) {
  return z.strictObject({
    schemaVersion: z.literal(1),
    meta: z.strictObject({
      title: requiredText(mode, PAGE_LIMITS.metaTitle),
      description: requiredText(mode, PAGE_LIMITS.metaDescription),
    }),
    sections: z
      .array(sectionSchema(mode))
      .min(
        mode === "publish"
          ? PAGE_LIMITS.sections.publishMin
          : PAGE_LIMITS.sections.draftMin,
      )
      .max(PAGE_LIMITS.sections.max)
      .superRefine(uniqueIds),
  });
}

/** Content being edited: empty editable strings are allowed. */
export const draftPageContentSchema = pageContentSchema("draft");

/** Content that may be published and rendered publicly. */
export const publishPageContentSchema = pageContentSchema("publish");

export type PageContent = z.infer<typeof draftPageContentSchema>;
export type Section = PageContent["sections"][number];
export type SectionType = Section["type"];
export type SectionOfType<T extends SectionType> = Extract<Section, { type: T }>;
