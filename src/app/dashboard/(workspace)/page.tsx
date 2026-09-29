import type { Metadata } from "next";

import { requireAdmin } from "@/features/auth/session";
import { PagesList } from "@/features/dashboard/pages-list";
import { listDashboardPages } from "@/features/pages/admin-queries";

export const metadata: Metadata = {
  title: "Pages",
};

export default async function DashboardPage() {
  await requireAdmin();
  const pages = await listDashboardPages();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Pages</h1>
      <PagesList pages={pages} />
    </div>
  );
}
