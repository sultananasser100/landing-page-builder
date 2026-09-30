import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Pages</h1>
        <Link href="/dashboard/pages/new" className={buttonVariants()}>
          New page
        </Link>
      </div>
      <PagesList pages={pages} />
    </div>
  );
}
