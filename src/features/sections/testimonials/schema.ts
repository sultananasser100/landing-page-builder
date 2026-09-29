import { z } from "zod";

import {
  idSchema,
  itemList,
  requiredText,
  type ValidationMode,
} from "../shared/fields";

export function testimonialsDataSchema(mode: ValidationMode) {
  return z.strictObject({
    heading: requiredText(mode, 80),
    items: itemList(
      z.strictObject({
        id: idSchema,
        quote: requiredText(mode, 400),
        name: requiredText(mode, 60),
        role: requiredText(mode, 80),
      }),
      1,
      9,
    ),
  });
}

export type TestimonialsData = z.infer<
  ReturnType<typeof testimonialsDataSchema>
>;
