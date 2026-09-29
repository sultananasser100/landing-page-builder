import { z } from "zod";

import {
  href,
  idSchema,
  itemList,
  LABEL_MAX_LENGTH,
  requiredText,
  type ValidationMode,
} from "../shared/fields";

export const PRICING_LIMITS = {
  heading: 80,
  description: 300,
  plans: { min: 1, max: 4 },
  planName: 40,
  price: 20,
  period: 20,
  planDescription: 160,
  features: { min: 0, max: 10 },
  feature: 80,
} as const;

export function pricingDataSchema(mode: ValidationMode) {
  return z.strictObject({
    heading: requiredText(mode, PRICING_LIMITS.heading),
    description: requiredText(mode, PRICING_LIMITS.description),
    plans: itemList(
      z.strictObject({
        id: idSchema,
        name: requiredText(mode, PRICING_LIMITS.planName),
        price: requiredText(mode, PRICING_LIMITS.price),
        period: requiredText(mode, PRICING_LIMITS.period),
        description: requiredText(mode, PRICING_LIMITS.planDescription),
        features: z
          .array(requiredText(mode, PRICING_LIMITS.feature))
          .max(PRICING_LIMITS.features.max),
        buttonLabel: requiredText(mode, LABEL_MAX_LENGTH),
        buttonHref: href(mode),
        highlighted: z.boolean(),
      }),
      PRICING_LIMITS.plans.min,
      PRICING_LIMITS.plans.max,
    ),
  });
}

export type PricingData = z.infer<ReturnType<typeof pricingDataSchema>>;
