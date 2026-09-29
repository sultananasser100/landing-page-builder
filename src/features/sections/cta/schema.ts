import { z } from "zod";

import { linkSchema, requiredText, type ValidationMode } from "../shared/fields";

export const CTA_LIMITS = {
  heading: 100,
  description: 300,
} as const;

export function ctaDataSchema(mode: ValidationMode) {
  return z.strictObject({
    heading: requiredText(mode, CTA_LIMITS.heading),
    description: requiredText(mode, CTA_LIMITS.description),
    button: linkSchema(mode),
  });
}

export type CtaData = z.infer<ReturnType<typeof ctaDataSchema>>;
