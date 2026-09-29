import type { SectionOfType } from "../page-content";
import { createId } from "../shared/ids";

export function createFeaturesDefault(): SectionOfType<"features"> {
  return {
    id: createId(),
    type: "features",
    data: {
      heading: "Everything you need",
      description: "Highlight the capabilities that matter most to your customers.",
      items: [
        {
          id: createId(),
          icon: "zap",
          title: "Fast",
          description: "Describe a key benefit in a short sentence.",
        },
        {
          id: createId(),
          icon: "shield",
          title: "Secure",
          description: "Describe a key benefit in a short sentence.",
        },
        {
          id: createId(),
          icon: "sparkles",
          title: "Simple",
          description: "Describe a key benefit in a short sentence.",
        },
      ],
    },
  };
}
