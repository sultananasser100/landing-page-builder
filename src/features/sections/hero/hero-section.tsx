import { ButtonLink } from "../shared/button-link";
import { Container } from "../shared/container";
import type { HeroData } from "./schema";

export function HeroSection({ id, data }: { id: string; data: HeroData }) {
  return (
    <section
      id={id}
      className="border-b bg-gradient-to-b from-muted/70 to-background py-24 sm:py-32"
    >
      <Container className="flex flex-col items-center text-center">
        {data.eyebrow ? (
          <p className="mb-6 rounded-full border bg-background px-3 py-1 text-sm font-medium text-muted-foreground">
            {data.eyebrow}
          </p>
        ) : null}
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
          {data.heading}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-pretty text-muted-foreground sm:text-xl">
          {data.subheading}
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={data.primaryButton.href}>
            {data.primaryButton.label}
          </ButtonLink>
          {data.secondaryButton ? (
            <ButtonLink href={data.secondaryButton.href} variant="outline">
              {data.secondaryButton.label}
            </ButtonLink>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
