import { IconField } from "@/features/editor/fields/choice-fields";
import { ItemListField } from "@/features/editor/fields/list-fields";
import { TextField } from "@/features/editor/fields/text-field";
import {
  dataUpdater,
  pathBuilder,
  type SectionInspectorProps,
} from "@/features/editor/inspector-types";

import { createId } from "../shared/ids";
import { FEATURE_ICONS, FEATURES_LIMITS } from "./schema";

export function FeaturesInspector(props: SectionInspectorProps<"features">) {
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
        maxLength={FEATURES_LIMITS.heading}
        issue={issueFor(p("heading"))}
        onChange={(heading) => set({ heading })}
      />
      <TextField
        path={p("description")}
        label="Description"
        multiline
        value={data.description}
        maxLength={FEATURES_LIMITS.description}
        issue={issueFor(p("description"))}
        onChange={(description) => set({ description })}
      />
      <ItemListField
        path={p("items")}
        legend="Features"
        noun="Feature"
        plural="features"
        items={data.items}
        bounds={FEATURES_LIMITS.items}
        issue={issueFor(p("items"))}
        createItem={() => ({ id: createId(), icon: FEATURE_ICONS[0], title: "", description: "" })}
        onChange={(items) => set({ items })}
        renderItem={(item, index, update) => (
          <>
            <IconField
              path={p("items", index, "icon")}
              label="Icon"
              value={item.icon}
              options={FEATURE_ICONS}
              issue={issueFor(p("items", index, "icon"))}
              onChange={(icon) => update({ icon })}
            />
            <TextField
              path={p("items", index, "title")}
              label="Title"
              value={item.title}
              maxLength={FEATURES_LIMITS.itemTitle}
              issue={issueFor(p("items", index, "title"))}
              onChange={(title) => update({ title })}
            />
            <TextField
              path={p("items", index, "description")}
              label="Description"
              multiline
              value={item.description}
              maxLength={FEATURES_LIMITS.itemDescription}
              issue={issueFor(p("items", index, "description"))}
              onChange={(description) => update({ description })}
            />
          </>
        )}
      />
    </div>
  );
}
