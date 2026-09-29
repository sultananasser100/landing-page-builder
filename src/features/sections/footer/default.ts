import type { SectionOfType } from "../page-content";
import { createId } from "../shared/ids";

export function createFooterDefault(): SectionOfType<"footer"> {
  return {
    id: createId(),
    type: "footer",
    data: {
      brandName: "Your brand",
      tagline: "",
      links: [],
      copyright: "© Your company. All rights reserved.",
    },
  };
}
