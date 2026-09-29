import { CheckboxField } from "@/features/editor/fields/choice-fields";
import { HREF_HINT } from "@/features/editor/fields/link-field";
import { ItemListField, StringListField } from "@/features/editor/fields/list-fields";
import { TextField } from "@/features/editor/fields/text-field";
import {
  dataUpdater,
  pathBuilder,
  type SectionInspectorProps,
} from "@/features/editor/inspector-types";

import { LABEL_MAX_LENGTH } from "../shared/fields";
import { createId } from "../shared/ids";
import { HREF_MAX_LENGTH } from "../shared/url";
import { PRICING_LIMITS } from "./schema";

export function PricingInspector(props: SectionInspectorProps<"pricing">) {
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
        maxLength={PRICING_LIMITS.heading}
        issue={issueFor(p("heading"))}
        onChange={(heading) => set({ heading })}
      />
      <TextField
        path={p("description")}
        label="Description"
        multiline
        value={data.description}
        maxLength={PRICING_LIMITS.description}
        issue={issueFor(p("description"))}
        onChange={(description) => set({ description })}
      />
      <ItemListField
        path={p("plans")}
        legend="Plans"
        noun="Plan"
        plural="plans"
        items={data.plans}
        bounds={PRICING_LIMITS.plans}
        issue={issueFor(p("plans"))}
        createItem={() => ({
          id: createId(),
          name: "",
          price: "",
          period: "",
          description: "",
          features: [],
          buttonLabel: "",
          buttonHref: "",
          highlighted: false,
        })}
        onChange={(plans) => set({ plans })}
        renderItem={(plan, index, update) => (
          <>
            <TextField
              path={p("plans", index, "name")}
              label="Name"
              value={plan.name}
              maxLength={PRICING_LIMITS.planName}
              issue={issueFor(p("plans", index, "name"))}
              onChange={(name) => update({ name })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField
                path={p("plans", index, "price")}
                label="Price"
                value={plan.price}
                maxLength={PRICING_LIMITS.price}
                issue={issueFor(p("plans", index, "price"))}
                onChange={(price) => update({ price })}
              />
              <TextField
                path={p("plans", index, "period")}
                label="Period"
                value={plan.period}
                maxLength={PRICING_LIMITS.period}
                issue={issueFor(p("plans", index, "period"))}
                onChange={(period) => update({ period })}
              />
            </div>
            <TextField
              path={p("plans", index, "description")}
              label="Description"
              multiline
              value={plan.description}
              maxLength={PRICING_LIMITS.planDescription}
              issue={issueFor(p("plans", index, "description"))}
              onChange={(description) => update({ description })}
            />
            <StringListField
              path={p("plans", index, "features")}
              legend="Plan features"
              noun="Feature"
              plural="features"
              values={plan.features}
              bounds={PRICING_LIMITS.features}
              maxLength={PRICING_LIMITS.feature}
              issue={issueFor(p("plans", index, "features"))}
              issueFor={issueFor}
              onChange={(features) => update({ features })}
            />
            <TextField
              path={p("plans", index, "buttonLabel")}
              label="Button label"
              value={plan.buttonLabel}
              maxLength={LABEL_MAX_LENGTH}
              issue={issueFor(p("plans", index, "buttonLabel"))}
              onChange={(buttonLabel) => update({ buttonLabel })}
            />
            <TextField
              path={p("plans", index, "buttonHref")}
              label="Button link"
              value={plan.buttonHref}
              maxLength={HREF_MAX_LENGTH}
              hint={HREF_HINT}
              inputMode="url"
              issue={issueFor(p("plans", index, "buttonHref"))}
              onChange={(buttonHref) => update({ buttonHref })}
            />
            <CheckboxField
              path={p("plans", index, "highlighted")}
              label="Highlight this plan"
              checked={plan.highlighted}
              onChange={(highlighted) => update({ highlighted })}
            />
          </>
        )}
      />
    </div>
  );
}
