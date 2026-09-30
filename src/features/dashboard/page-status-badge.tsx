import { Badge } from "@/components/ui/badge";
import type { PageStatus } from "@/features/pages/admin-queries";

const LABELS: Record<PageStatus, string> = {
  published: "Published",
  "unpublished-changes": "Unpublished changes",
  draft: "Draft",
};

const VARIANTS: Record<PageStatus, "default" | "secondary" | "outline"> = {
  published: "default",
  "unpublished-changes": "secondary",
  draft: "outline",
};

/** Status shown as text, not colour alone. */
export function PageStatusBadge({ status }: { status: PageStatus }) {
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>;
}
