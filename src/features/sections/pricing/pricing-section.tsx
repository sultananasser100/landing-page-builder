import { cn } from "@/lib/utils";

import { ButtonLink } from "../shared/button-link";
import { Container } from "../shared/container";
import { Icon } from "../shared/icons";
import { SectionHeading } from "../shared/section-heading";
import type { PricingData } from "./schema";

// Full class names so Tailwind can detect them.
const GRID_COLUMNS: Record<number, string> = {
  1: "max-w-md",
  2: "max-w-4xl md:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "md:grid-cols-2 lg:grid-cols-4",
};

export function PricingSection({ id, data }: { id: string; data: PricingData }) {
  return (
    <section id={id} className="py-20 sm:py-24">
      <Container>
        <SectionHeading heading={data.heading} description={data.description} />
        <ul
          className={cn(
            "mx-auto mt-14 grid gap-6",
            GRID_COLUMNS[data.plans.length],
          )}
        >
          {data.plans.map((plan) => (
            <li
              key={plan.id}
              className={cn(
                "flex flex-col rounded-2xl border bg-card p-8 shadow-xs",
                plan.highlighted && "border-primary shadow-lg ring-1 ring-primary",
              )}
            >
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              <p className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight">
                  {plan.price}
                </span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </p>
              {plan.features.length > 0 ? (
                <ul className="mt-8 space-y-3 text-sm">
                  {plan.features.map((feature, index) => (
                    // Features are plain strings without ids; order is stable.
                    <li key={index} className="flex gap-3">
                      <Icon name="check" className="mt-0.5 size-4" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-auto pt-8">
                <ButtonLink
                  href={plan.buttonHref}
                  variant={plan.highlighted ? "default" : "outline"}
                  className="w-full"
                >
                  {plan.buttonLabel}
                </ButtonLink>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
