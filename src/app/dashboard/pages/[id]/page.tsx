import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/features/auth/session";
import { InvalidContent } from "@/features/editor/invalid-content";
import { PageEditor } from "@/features/editor/page-editor";
import { getPageForEditor } from "@/features/pages/admin-queries";

// The editor has its own full-height layout, so it sits outside the dashboard
// (workspace) shell. `noindex` comes from app/dashboard/layout.tsx.

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/pages/[id]">): Promise<Metadata> {
  const { id } = await params;
  const result = await getPageForEditor(id);
  return { title: result ? `Edit ${result.page.name}` : "Page not found" };
}

export default async function EditPagePage({ params }: PageProps<"/dashboard/pages/[id]">) {
  await requireAdmin();
  const { id } = await params;

  const result = await getPageForEditor(id);
  if (!result) notFound();

  if (result.kind === "invalid") {
    return <InvalidContent page={result.page} issues={result.issues} />;
  }
  return <PageEditor page={result.page} initialContent={result.content} />;
}
