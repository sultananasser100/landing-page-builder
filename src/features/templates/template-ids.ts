export const TEMPLATE_IDS = ["blank", "saas"] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const DEFAULT_TEMPLATE_ID: TemplateId = "blank";
