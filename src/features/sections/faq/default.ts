import type { SectionOfType } from "../page-content";
import { createId } from "../shared/ids";

export function createFaqDefault(): SectionOfType<"faq"> {
  return {
    id: createId(),
    type: "faq",
    data: {
      heading: "Frequently asked questions",
      items: [
        {
          id: createId(),
          question: "What is a common question?",
          answer: "Answer it clearly and briefly.",
        },
      ],
    },
  };
}
