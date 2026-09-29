import { ButtonLink } from "../shared/button-link";
import { Container } from "../shared/container";
import type { CtaData } from "./schema";

export function CtaSection({ id, data }: { id: string; data: CtaData }) {
  return (
    <section id={id} className="py-20 sm:py-24">
      <Container>
        <div className="rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground sm:px-16">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {data.heading}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-pretty text-primary-foreground/80">
            {data.description}
          </p>
          <ButtonLink href={data.button.href} variant="secondary" className="mt-8">
            {data.button.label}
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
