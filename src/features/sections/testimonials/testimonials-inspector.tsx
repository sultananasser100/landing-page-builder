import { ItemListField } from "@/features/editor/fields/list-fields";
import { TextField } from "@/features/editor/fields/text-field";
import {
  dataUpdater,
  pathBuilder,
  type SectionInspectorProps,
} from "@/features/editor/inspector-types";

import { createId } from "../shared/ids";
import { TESTIMONIALS_LIMITS } from "./schema";

export function TestimonialsInspector(props: SectionInspectorProps<"testimonials">) {
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
        maxLength={TESTIMONIALS_LIMITS.heading}
        issue={issueFor(p("heading"))}
        onChange={(heading) => set({ heading })}
      />
      <ItemListField
        path={p("items")}
        legend="Testimonials"
        noun="Testimonial"
        plural="testimonials"
        items={data.items}
        bounds={TESTIMONIALS_LIMITS.items}
        issue={issueFor(p("items"))}
        createItem={() => ({ id: createId(), quote: "", name: "", role: "" })}
        onChange={(items) => set({ items })}
        renderItem={(item, index, update) => (
          <>
            <TextField
              path={p("items", index, "quote")}
              label="Quote"
              multiline
              value={item.quote}
              maxLength={TESTIMONIALS_LIMITS.quote}
              issue={issueFor(p("items", index, "quote"))}
              onChange={(quote) => update({ quote })}
            />
            <TextField
              path={p("items", index, "name")}
              label="Name"
              value={item.name}
              maxLength={TESTIMONIALS_LIMITS.name}
              issue={issueFor(p("items", index, "name"))}
              onChange={(name) => update({ name })}
            />
            <TextField
              path={p("items", index, "role")}
              label="Role"
              value={item.role}
              maxLength={TESTIMONIALS_LIMITS.role}
              issue={issueFor(p("items", index, "role"))}
              onChange={(role) => update({ role })}
            />
          </>
        )}
      />
    </div>
  );
}
