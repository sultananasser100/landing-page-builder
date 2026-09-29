import Link from "next/link";

export default function EditorNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-muted-foreground">
        This page doesn’t exist or may have been removed.
      </p>
      <Link
        href="/dashboard"
        className="text-sm font-medium underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        Back to pages
      </Link>
    </main>
  );
}
