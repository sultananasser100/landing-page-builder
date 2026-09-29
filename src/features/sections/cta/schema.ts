import { z } from "zod";

import { linkSchema, requiredText, type ValidationMode } from "../shared/fields";

export function ctaDataSchema(mode: ValidationMode) {
  return z.strictObject({
    heading: requiredText(mode, 100),
    description: requiredText(mode, 300),
    button: linkSchema(mode),
  });
}

export type CtaData = z.infer<ReturnType<typeof ctaDataSchema>>;
