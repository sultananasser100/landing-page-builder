import type { PageContent } from "./page-content";
import { RenderSection } from "./renderers";

/** Renders validated page content. Pure and server-safe. */
export function PageRenderer({ content }: { content: PageContent }) {
  return (
    <main className="flex flex-1 flex-col">
      {content.sections.map((section) => (
        <RenderSection key={section.id} section={section} />
      ))}
    </main>
  );
}
