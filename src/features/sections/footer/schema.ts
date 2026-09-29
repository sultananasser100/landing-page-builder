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

export const FOOTER_LIMITS = {
  brandName: 60,
  tagline: 160,
  links: { min: 0, max: 8 },
  copyright: 100,
} as const;

export function footerDataSchema(mode: ValidationMode) {
  return z.strictObject({
    brandName: requiredText(mode, FOOTER_LIMITS.brandName),
    tagline: optionalText(FOOTER_LIMITS.tagline),
    links: itemList(
      z.strictObject({
        id: idSchema,
        label: requiredText(mode, LABEL_MAX_LENGTH),
        href: href(mode),
      }),
      FOOTER_LIMITS.links.min,
      FOOTER_LIMITS.links.max,
    ),
    copyright: requiredText(mode, FOOTER_LIMITS.copyright),
  });
}

export type FooterData = z.infer<ReturnType<typeof footerDataSchema>>;
