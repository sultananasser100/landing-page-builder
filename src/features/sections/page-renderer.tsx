import { sectionAnchors } from "./anchors";
import type { PageContent } from "./page-content";
import { RenderSection } from "./renderers";

/** Renders validated page content. Pure and server-safe. */
export function PageRenderer({ content }: { content: PageContent }) {
  const anchors = sectionAnchors(content.sections);

  return (
    <main className="flex flex-1 flex-col">
      {content.sections.map((section, index) => (
        <RenderSection key={section.id} section={section} anchor={anchors[index]!} />
      ))}
    </main>
  );
}
