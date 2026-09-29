import type { SectionOfType } from "../page-content";
import { createId } from "../shared/ids";

export function createHeroDefault(): SectionOfType<"hero"> {
  return {
    id: createId(),
    type: "hero",
    data: {
      eyebrow: "",
      heading: "A clear headline for your product",
      subheading:
        "Explain in a sentence or two who this is for and the problem it solves.",
      primaryButton: { label: "Get started", href: "#" },
    },
  };
}
