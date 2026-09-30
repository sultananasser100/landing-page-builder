"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

// Error messages from Server Components are not shown; the digest lets the
// admin match the failure to server logs.
export default function NewPageError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div role="alert" className="rounded-xl border px-6 py-12 text-center">
      <h1 className="text-lg font-semibold">We couldn&apos;t open the new page screen.</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Something went wrong on our side. Please try again.
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          Reference: {error.digest}
        </p>
      ) : null}
      <div className="mt-6 flex items-center justify-center gap-3">
        <Button type="button" variant="outline" onClick={() => retry()}>
          Try again
        </Button>
        <Link
          href="/dashboard"
          className="text-sm font-medium underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          Back to pages
        </Link>
      </div>
    </div>
  );
}
