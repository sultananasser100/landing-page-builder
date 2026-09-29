import { z } from "zod";

import {
  idSchema,
  itemList,
  requiredText,
  type ValidationMode,
} from "../shared/fields";
import type { IconName } from "../shared/icons";

export const FEATURE_ICONS = [
  "zap",
  "shield",
  "sparkles",
  "rocket",
  "chart-column",
  "users",
  "lock",
  "globe",
  "clock",
  "layers",
  "message-square",
  "circle-check",
] as const satisfies readonly IconName[];

export const FEATURES_LIMITS = {
  heading: 80,
  description: 300,
  items: { min: 1, max: 12 },
  itemTitle: 60,
  itemDescription: 200,
} as const;

export function featuresDataSchema(mode: ValidationMode) {
  return z.strictObject({
    heading: requiredText(mode, FEATURES_LIMITS.heading),
    description: requiredText(mode, FEATURES_LIMITS.description),
    items: itemList(
      z.strictObject({
        id: idSchema,
        icon: z.enum(FEATURE_ICONS),
        title: requiredText(mode, FEATURES_LIMITS.itemTitle),
        description: requiredText(mode, FEATURES_LIMITS.itemDescription),
      }),
      FEATURES_LIMITS.items.min,
      FEATURES_LIMITS.items.max,
    ),
  });
}

export type FeaturesData = z.infer<ReturnType<typeof featuresDataSchema>>;
