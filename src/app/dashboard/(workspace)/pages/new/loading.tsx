import { Skeleton } from "@/components/ui/skeleton";

export default function NewPageLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <p className="sr-only" role="status">
        Loading the new page form…
      </p>
      <Skeleton className="h-8 w-36" />
      <div className="max-w-xl space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
