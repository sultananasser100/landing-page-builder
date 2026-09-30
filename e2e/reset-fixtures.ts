// Resets the E2E fixture pages. Run by e2e/global-setup.ts under tsx (Playwright
// loads TypeScript as CommonJS, which cannot import the generated Prisma
// client). Checks the test-database guard again before writing anything.
import { PrismaPg } from "@prisma/adapter-pg";

import { Prisma, PrismaClient } from "../src/generated/prisma/client";
import { publishPageContentSchema } from "../src/features/sections/page-content";
import { samplePageContent } from "../src/features/sections/sample-page";
import { assertTestDatabase, E2E_PAGES } from "./test-database";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  assertTestDatabase(connectionString);

  const content = publishPageContentSchema.parse(samplePageContent);
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: connectionString! }) });
  try {
    // The sample page: published, draft equal to published.
    await db.page.upsert({
      where: { slug: E2E_PAGES.sample.slug },
      create: {
        name: E2E_PAGES.sample.name,
        slug: E2E_PAGES.sample.slug,
        draftContent: content,
        publishedContent: content,
        publishedAt: new Date(),
      },
      update: {
        name: E2E_PAGES.sample.name,
        draftContent: content,
        publishedContent: content,
        publishedAt: new Date(),
      },
    });

    // The persistence page: reset to a never-published draft before every run.
    await db.page.upsert({
      where: { slug: E2E_PAGES.persistence.slug },
      create: {
        name: E2E_PAGES.persistence.name,
        slug: E2E_PAGES.persistence.slug,
        draftContent: content,
      },
      update: {
        name: E2E_PAGES.persistence.name,
        draftContent: content,
        publishedContent: Prisma.DbNull,
        publishedAt: null,
      },
    });
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
