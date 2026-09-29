import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPublishedPage } from "@/features/pages/queries";
import { PageRenderer } from "@/features/sections/page-renderer";

export async function generateMetadata({
  params,
}: PageProps<"/p/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedPage(slug);
  if (!page) return {};

  return {
    title: page.content.meta.title,
    description: page.content.meta.description,
  };
}

export default async function PublishedPage({
  params,
}: PageProps<"/p/[slug]">) {
  const { slug } = await params;
  const page = await getPublishedPage(slug);
  if (!page) notFound();

  return <PageRenderer content={page.content} />;
}
