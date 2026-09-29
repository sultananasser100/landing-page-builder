import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { publishPageContentSchema } from "../src/features/sections/page-content";
import {
  SAMPLE_PAGE_NAME,
  SAMPLE_PAGE_SLUG,
  samplePageContent,
} from "../src/features/sections/sample-page";

// src/lib/db.ts is server-only (Next.js), so the seed creates its own client.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  // Fail before writing anything if the sample is not publishable.
  const content = publishPageContentSchema.parse(samplePageContent);
  const now = new Date();

  const page = await db.page.upsert({
    where: { slug: SAMPLE_PAGE_SLUG },
    create: {
      name: SAMPLE_PAGE_NAME,
      slug: SAMPLE_PAGE_SLUG,
      draftContent: content,
      publishedContent: content,
      publishedAt: now,
    },
    update: {
      name: SAMPLE_PAGE_NAME,
      draftContent: content,
      publishedContent: content,
      publishedAt: now,
    },
  });

  console.log(`Seeded published page "${page.name}" at /p/${page.slug}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
