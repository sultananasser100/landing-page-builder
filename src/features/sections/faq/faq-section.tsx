import { Container } from "../shared/container";
import { Icon } from "../shared/icons";
import { SectionHeading } from "../shared/section-heading";
import type { FaqData } from "./schema";

export function FaqSection({ id, data }: { id: string; data: FaqData }) {
  return (
    <section id={id} className="py-20 sm:py-24">
      <Container className="max-w-3xl">
        <SectionHeading heading={data.heading} />
        {/* Native <details> keeps the accordion working without client JS. */}
        <div className="mt-12 divide-y border-y">
          {data.items.map((item) => (
            <details key={item.id} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-medium [&::-webkit-details-marker]:hidden">
                {item.question}
                <Icon
                  name="chevron-down"
                  className="size-4 text-muted-foreground group-open:rotate-180"
                />
              </summary>
              <p className="mt-3 leading-7 whitespace-pre-line text-muted-foreground">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
