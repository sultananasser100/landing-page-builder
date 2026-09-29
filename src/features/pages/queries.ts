import "server-only";

import { connection } from "next/server";
import { cache } from "react";
import { z } from "zod";

import {
  publishPageContentSchema,
  type PageContent,
} from "@/features/sections/page-content";
import { db } from "@/lib/db";

export type PublishedPage = {
  slug: string;
  content: PageContent;
};

/**
 * Loads a page's published snapshot and validates it with the publish schema.
 * Returns null when the page does not exist, is unpublished, or its stored
 * content is invalid.
 *
 * - `connection()` excludes the query from prerendering, so the public page is
 *   rendered per request and reflects publish/unpublish immediately.
 * - `cache()` deduplicates calls within a single request, so
 *   `generateMetadata` and the page share one database query.
 */
export const getPublishedPage = cache(
  async (slug: string): Promise<PublishedPage | null> => {
    await connection();

    const page = await db.page.findUnique({
      where: { slug },
      select: { slug: true, publishedContent: true },
    });
    if (!page || page.publishedContent === null) return null;

    const result = publishPageContentSchema.safeParse(page.publishedContent);
    if (!result.success) {
      console.error(
        `Published content for page "${page.slug}" is invalid:\n${z.prettifyError(result.error)}`,
      );
      return null;
    }

    return { slug: page.slug, content: result.data };
  },
);
