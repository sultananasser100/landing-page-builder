import { z } from "zod";

import {
  idSchema,
  itemList,
  requiredText,
  type ValidationMode,
} from "../shared/fields";

export const FAQ_LIMITS = {
  heading: 80,
  items: { min: 1, max: 20 },
  question: 150,
  answer: 800,
} as const;

export function faqDataSchema(mode: ValidationMode) {
  return z.strictObject({
    heading: requiredText(mode, FAQ_LIMITS.heading),
    items: itemList(
      z.strictObject({
        id: idSchema,
        question: requiredText(mode, FAQ_LIMITS.question),
        answer: requiredText(mode, FAQ_LIMITS.answer),
      }),
      FAQ_LIMITS.items.min,
      FAQ_LIMITS.items.max,
    ),
  });
}

export type FaqData = z.infer<ReturnType<typeof faqDataSchema>>;
