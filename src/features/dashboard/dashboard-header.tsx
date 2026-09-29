import Link from "next/link";

import { LogoutButton } from "@/features/auth/logout-button";

export function DashboardHeader() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/dashboard"
          className="truncate text-sm font-semibold focus-visible:rounded-sm focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          Landing Page Builder
        </Link>
        <LogoutButton />
      </div>
    </header>
  );
}
