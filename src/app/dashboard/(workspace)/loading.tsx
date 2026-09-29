import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <p className="sr-only" role="status">
        Loading pages…
      </p>
      <Skeleton className="h-8 w-28" />
      <Skeleton className="h-4 w-40" />
      <div className="divide-y rounded-xl border bg-card">
        {[0, 1, 2].map((row) => (
          <div key={row} className="space-y-2 p-4 sm:p-5">
            <Skeleton className="h-5 w-48 max-w-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-64 max-w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
