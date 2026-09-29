import { z } from "zod";

import {
  idSchema,
  itemList,
  requiredText,
  type ValidationMode,
} from "../shared/fields";

export const TESTIMONIALS_LIMITS = {
  heading: 80,
  items: { min: 1, max: 9 },
  quote: 400,
  name: 60,
  role: 80,
} as const;

export function testimonialsDataSchema(mode: ValidationMode) {
  return z.strictObject({
    heading: requiredText(mode, TESTIMONIALS_LIMITS.heading),
    items: itemList(
      z.strictObject({
        id: idSchema,
        quote: requiredText(mode, TESTIMONIALS_LIMITS.quote),
        name: requiredText(mode, TESTIMONIALS_LIMITS.name),
        role: requiredText(mode, TESTIMONIALS_LIMITS.role),
      }),
      TESTIMONIALS_LIMITS.items.min,
      TESTIMONIALS_LIMITS.items.max,
    ),
  });
}

export type TestimonialsData = z.infer<
  ReturnType<typeof testimonialsDataSchema>
>;
