import { Container } from "../shared/container";
import { SectionHeading } from "../shared/section-heading";
import type { TestimonialsData } from "./schema";

export function TestimonialsSection({
  id,
  data,
}: {
  id: string;
  data: TestimonialsData;
}) {
  return (
    <section id={id} className="border-y bg-muted/40 py-20 sm:py-24">
      <Container>
        <SectionHeading heading={data.heading} />
        <ul className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.items.map((item) => (
            <li key={item.id}>
              <figure className="flex h-full flex-col justify-between gap-6 rounded-xl border bg-card p-6 shadow-xs">
                <blockquote className="text-base leading-7 text-pretty">
                  <p>&ldquo;{item.quote}&rdquo;</p>
                </blockquote>
                <figcaption className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground"
                  >
                    {item.name.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="text-sm">
                    <span className="block font-semibold">{item.name}</span>
                    <span className="block text-muted-foreground">{item.role}</span>
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
