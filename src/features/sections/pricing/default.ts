import type { SectionOfType } from "../page-content";
import { createId } from "../shared/ids";

export function createPricingDefault(): SectionOfType<"pricing"> {
  return {
    id: createId(),
    type: "pricing",
    data: {
      heading: "Simple, transparent pricing",
      description: "Choose the plan that fits your needs.",
      plans: [
        {
          id: createId(),
          name: "Starter",
          price: "$0",
          period: "per month",
          description: "For individuals getting started.",
          features: ["Core features"],
          buttonLabel: "Get started",
          buttonHref: "#",
          highlighted: false,
        },
        {
          id: createId(),
          name: "Pro",
          price: "$29",
          period: "per month",
          description: "For growing teams.",
          features: ["Everything in Starter", "Priority support"],
          buttonLabel: "Get started",
          buttonHref: "#",
          highlighted: true,
        },
      ],
    },
  };
}
