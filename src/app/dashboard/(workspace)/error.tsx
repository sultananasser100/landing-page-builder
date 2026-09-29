"use client";

import { Button } from "@/components/ui/button";

// Error messages from Server Components are not shown; the digest lets the
// admin match the failure to server logs.
export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div role="alert" className="rounded-xl border px-6 py-12 text-center">
      <h1 className="text-lg font-semibold">We couldn&apos;t load your pages.</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Something went wrong on our side. Please try again.
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          Reference: {error.digest}
        </p>
      ) : null}
      <Button type="button" variant="outline" className="mt-6" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}
