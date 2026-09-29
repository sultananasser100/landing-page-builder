import { z } from "zod";

import {
  href,
  idSchema,
  itemList,
  LABEL_MAX_LENGTH,
  optionalText,
  requiredText,
  type ValidationMode,
} from "../shared/fields";

export function footerDataSchema(mode: ValidationMode) {
  return z.strictObject({
    brandName: requiredText(mode, 60),
    tagline: optionalText(160),
    links: itemList(
      z.strictObject({
        id: idSchema,
        label: requiredText(mode, LABEL_MAX_LENGTH),
        href: href(mode),
      }),
      0,
      8,
    ),
    copyright: requiredText(mode, 100),
  });
}

export type FooterData = z.infer<ReturnType<typeof footerDataSchema>>;
