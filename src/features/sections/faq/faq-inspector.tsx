import { ItemListField } from "@/features/editor/fields/list-fields";
import { TextField } from "@/features/editor/fields/text-field";
import {
  dataUpdater,
  pathBuilder,
  type SectionInspectorProps,
} from "@/features/editor/inspector-types";

import { createId } from "../shared/ids";
import { FAQ_LIMITS } from "./schema";

export function FaqInspector(props: SectionInspectorProps<"faq">) {
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
        maxLength={FAQ_LIMITS.heading}
        issue={issueFor(p("heading"))}
        onChange={(heading) => set({ heading })}
      />
      <ItemListField
        path={p("items")}
        legend="Questions"
        noun="Question"
        plural="questions"
        items={data.items}
        bounds={FAQ_LIMITS.items}
        issue={issueFor(p("items"))}
        createItem={() => ({ id: createId(), question: "", answer: "" })}
        onChange={(items) => set({ items })}
        renderItem={(item, index, update) => (
          <>
            <TextField
              path={p("items", index, "question")}
              label="Question"
              value={item.question}
              maxLength={FAQ_LIMITS.question}
              issue={issueFor(p("items", index, "question"))}
              onChange={(question) => update({ question })}
            />
            <TextField
              path={p("items", index, "answer")}
              label="Answer"
              multiline
              value={item.answer}
              maxLength={FAQ_LIMITS.answer}
              issue={issueFor(p("items", index, "answer"))}
              onChange={(answer) => update({ answer })}
            />
          </>
        )}
      />
    </div>
  );
}
