import type { SectionOfType } from "../page-content";
import { createId } from "../shared/ids";

export function createCtaDefault(): SectionOfType<"cta"> {
  return {
    id: createId(),
    type: "cta",
    data: {
      heading: "Ready to get started?",
      description: "Tell visitors what to do next.",
      button: { label: "Get started", href: "#" },
    },
  };
}
