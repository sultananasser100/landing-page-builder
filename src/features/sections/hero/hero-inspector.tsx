import { LinkField, OptionalLinkField } from "@/features/editor/fields/link-field";
import { TextField } from "@/features/editor/fields/text-field";
import {
  dataUpdater,
  pathBuilder,
  type SectionInspectorProps,
} from "@/features/editor/inspector-types";

import { HERO_LIMITS } from "./schema";

export function HeroInspector(props: SectionInspectorProps<"hero">) {
  const { section, basePath, issueFor } = props;
  const { data } = section;
  const set = dataUpdater(props);
  const p = pathBuilder(basePath);

  return (
    <div className="space-y-5">
      <TextField
        path={p("eyebrow")}
        label="Eyebrow"
        optional
        value={data.eyebrow ?? ""}
        maxLength={HERO_LIMITS.eyebrow}
        issue={issueFor(p("eyebrow"))}
        onChange={(eyebrow) => set({ eyebrow })}
      />
      <TextField
        path={p("heading")}
        label="Heading"
        value={data.heading}
        maxLength={HERO_LIMITS.heading}
        issue={issueFor(p("heading"))}
        onChange={(heading) => set({ heading })}
      />
      <TextField
        path={p("subheading")}
        label="Subheading"
        multiline
        value={data.subheading}
        maxLength={HERO_LIMITS.subheading}
        issue={issueFor(p("subheading"))}
        onChange={(subheading) => set({ subheading })}
      />
      <LinkField
        path={p("primaryButton")}
        legend="Primary button"
        value={data.primaryButton}
        issueFor={issueFor}
        onChange={(primaryButton) => set({ primaryButton })}
      />
      <OptionalLinkField
        path={p("secondaryButton")}
        legend="Secondary button"
        value={data.secondaryButton}
        issueFor={issueFor}
        onChange={(secondaryButton) => set({ secondaryButton })}
      />
    </div>
  );
}
