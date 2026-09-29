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

export function featuresDataSchema(mode: ValidationMode) {
  return z.strictObject({
    heading: requiredText(mode, 80),
    description: requiredText(mode, 300),
    items: itemList(
      z.strictObject({
        id: idSchema,
        icon: z.enum(FEATURE_ICONS),
        title: requiredText(mode, 60),
        description: requiredText(mode, 200),
      }),
      1,
      12,
    ),
  });
}

export type FeaturesData = z.infer<ReturnType<typeof featuresDataSchema>>;
