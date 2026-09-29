import { cn } from "@/lib/utils";

export function SectionHeading({
  heading,
  description,
  className,
}: {
  heading: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-2xl text-center", className)}>
      <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {heading}
      </h2>
      {description ? (
        <p className="mt-4 text-lg text-pretty text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
