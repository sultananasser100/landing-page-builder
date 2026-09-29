import type { SectionOfType } from "../page-content";
import { createId } from "../shared/ids";

export function createTestimonialsDefault(): SectionOfType<"testimonials"> {
  return {
    id: createId(),
    type: "testimonials",
    data: {
      heading: "What our customers say",
      items: [
        {
          id: createId(),
          quote: "Share a short quote from a happy customer.",
          name: "Customer name",
          role: "Role, Company",
        },
      ],
    },
  };
}
