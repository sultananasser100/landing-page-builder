import type { Metadata } from "next";

import { LogoutButton } from "@/features/auth/logout-button";
import { requireAdmin } from "@/features/auth/session";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

// Phase 3 placeholder: the protected destination after sign-in.
// Replaced by the real dashboard in Phase 4.
export default async function DashboardPage() {
  await requireAdmin();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground">Signed in as admin.</p>
      <div>
        <LogoutButton />
      </div>
    </main>
  );
}
