import { Badge } from "@/components/ui/badge";
import type { PageStatus } from "@/features/pages/admin-queries";

const LABELS: Record<PageStatus, string> = {
  published: "Published",
  draft: "Draft",
};

/** Status shown as text, not colour alone. */
export function PageStatusBadge({ status }: { status: PageStatus }) {
  return (
    <Badge variant={status === "published" ? "default" : "outline"}>
      {LABELS[status]}
    </Badge>
  );
}
