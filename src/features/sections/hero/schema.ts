import { z } from "zod";

import {
  linkSchema,
  optionalText,
  requiredText,
  type ValidationMode,
} from "../shared/fields";

export const HERO_LIMITS = {
  eyebrow: 40,
  heading: 100,
  subheading: 300,
} as const;

export function heroDataSchema(mode: ValidationMode) {
  return z.strictObject({
    eyebrow: optionalText(HERO_LIMITS.eyebrow),
    heading: requiredText(mode, HERO_LIMITS.heading),
    subheading: requiredText(mode, HERO_LIMITS.subheading),
    primaryButton: linkSchema(mode),
    secondaryButton: linkSchema(mode).optional(),
  });
}

export type HeroData = z.infer<ReturnType<typeof heroDataSchema>>;
