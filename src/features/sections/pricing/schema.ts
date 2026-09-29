import { z } from "zod";

import {
  href,
  idSchema,
  itemList,
  LABEL_MAX_LENGTH,
  requiredText,
  type ValidationMode,
} from "../shared/fields";

export function pricingDataSchema(mode: ValidationMode) {
  return z.strictObject({
    heading: requiredText(mode, 80),
    description: requiredText(mode, 300),
    plans: itemList(
      z.strictObject({
        id: idSchema,
        name: requiredText(mode, 40),
        price: requiredText(mode, 20),
        period: requiredText(mode, 20),
        description: requiredText(mode, 160),
        features: z.array(requiredText(mode, 80)).max(10),
        buttonLabel: requiredText(mode, LABEL_MAX_LENGTH),
        buttonHref: href(mode),
        highlighted: z.boolean(),
      }),
      1,
      4,
    ),
  });
}

export type PricingData = z.infer<ReturnType<typeof pricingDataSchema>>;
