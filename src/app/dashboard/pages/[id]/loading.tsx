import { Skeleton } from "@/components/ui/skeleton";

export default function EditorLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col lg:h-dvh" aria-busy="true">
      <p className="sr-only" role="status">
        Loading editor…
      </p>
      <div className="flex items-center gap-6 border-b px-4 py-3">
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-5 w-48 max-w-full" />
      </div>
      <div className="flex-1 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)_24rem]">
        <div className="hidden space-y-2 border-r p-3 lg:block">
          {[0, 1, 2, 3, 4].map((row) => (
            <Skeleton key={row} className="h-10 w-full" />
          ))}
        </div>
        <div className="bg-muted/40 p-3 sm:p-6">
          <Skeleton className="h-96 w-full" />
        </div>
        <div className="hidden space-y-4 border-l p-4 lg:block">
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
