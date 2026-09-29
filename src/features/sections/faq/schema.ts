import { z } from "zod";

import {
  idSchema,
  itemList,
  requiredText,
  type ValidationMode,
} from "../shared/fields";

export function faqDataSchema(mode: ValidationMode) {
  return z.strictObject({
    heading: requiredText(mode, 80),
    items: itemList(
      z.strictObject({
        id: idSchema,
        question: requiredText(mode, 150),
        answer: requiredText(mode, 800),
      }),
      1,
      20,
    ),
  });
}

export type FaqData = z.infer<ReturnType<typeof faqDataSchema>>;
