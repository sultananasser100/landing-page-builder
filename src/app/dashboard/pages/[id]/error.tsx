"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

// Error messages from Server Components are not shown; the digest lets the
// admin match the failure to server logs.
export default function EditorError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <div role="alert">
        <h1 className="text-lg font-semibold">We couldn&apos;t open the editor.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our side. Please try again.
        </p>
        {error.digest ? (
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            Reference: {error.digest}
          </p>
        ) : null}
      </div>
      <div className="mt-6 flex items-center gap-3">
        <Button type="button" variant="outline" onClick={() => retry()}>
          Try again
        </Button>
        <Link
          href="/dashboard"
          className="text-sm font-medium underline-offset-4 hover:underline"
        >
          Back to pages
        </Link>
      </div>
    </main>
  );
}
