import type { VariantProps } from "class-variance-authority";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * A link styled as a button. `href` must already have passed the page content
 * schema's safe-URL validation.
 */
export function ButtonLink({
  href,
  variant = "default",
  size = "lg",
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
} & VariantProps<typeof buttonVariants>) {
  return (
    <a href={href} className={cn(buttonVariants({ variant, size }), className)}>
      {children}
    </a>
  );
}
