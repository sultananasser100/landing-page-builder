import { LinkField } from "@/features/editor/fields/link-field";
import { TextField } from "@/features/editor/fields/text-field";
import {
  dataUpdater,
  pathBuilder,
  type SectionInspectorProps,
} from "@/features/editor/inspector-types";

import { CTA_LIMITS } from "./schema";

export function CtaInspector(props: SectionInspectorProps<"cta">) {
  const { section, basePath, issueFor } = props;
  const { data } = section;
  const set = dataUpdater(props);
  const p = pathBuilder(basePath);

  return (
    <div className="space-y-5">
      <TextField
        path={p("heading")}
        label="Heading"
        value={data.heading}
        maxLength={CTA_LIMITS.heading}
        issue={issueFor(p("heading"))}
        onChange={(heading) => set({ heading })}
      />
      <TextField
        path={p("description")}
        label="Description"
        multiline
        value={data.description}
        maxLength={CTA_LIMITS.description}
        issue={issueFor(p("description"))}
        onChange={(description) => set({ description })}
      />
      <LinkField
        path={p("button")}
        legend="Button"
        value={data.button}
        issueFor={issueFor}
        onChange={(button) => set({ button })}
      />
    </div>
  );
}
