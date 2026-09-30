import type { Metadata } from "next";

import { requireAdmin } from "@/features/auth/session";
import { NewPageForm } from "@/features/dashboard/new-page-form";
import { templateOptions } from "@/features/templates/templates";

export const metadata: Metadata = {
  title: "New page",
};

export default async function NewPagePage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">New page</h1>
      <NewPageForm templates={templateOptions} />
    </div>
  );
}
