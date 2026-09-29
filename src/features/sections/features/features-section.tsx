import { Container } from "../shared/container";
import { Icon } from "../shared/icons";
import { SectionHeading } from "../shared/section-heading";
import type { FeaturesData } from "./schema";

export function FeaturesSection({ id, data }: { id: string; data: FeaturesData }) {
  return (
    <section id={id} className="py-20 sm:py-24">
      <Container>
        <SectionHeading heading={data.heading} description={data.description} />
        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((item) => (
            <li key={item.id} className="rounded-xl border bg-card p-6 shadow-xs">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Icon name={item.icon} />
              </div>
              <h3 className="mt-5 text-base font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
