import { z } from "zod";

import {
  linkSchema,
  optionalText,
  requiredText,
  type ValidationMode,
} from "../shared/fields";

export function heroDataSchema(mode: ValidationMode) {
  return z.strictObject({
    eyebrow: optionalText(40),
    heading: requiredText(mode, 100),
    subheading: requiredText(mode, 300),
    primaryButton: linkSchema(mode),
    secondaryButton: linkSchema(mode).optional(),
  });
}

export type HeroData = z.infer<ReturnType<typeof heroDataSchema>>;
