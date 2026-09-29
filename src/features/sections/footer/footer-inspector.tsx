import { HREF_HINT } from "@/features/editor/fields/link-field";
import { ItemListField } from "@/features/editor/fields/list-fields";
import { TextField } from "@/features/editor/fields/text-field";
import {
  dataUpdater,
  pathBuilder,
  type SectionInspectorProps,
} from "@/features/editor/inspector-types";

import { LABEL_MAX_LENGTH } from "../shared/fields";
import { createId } from "../shared/ids";
import { HREF_MAX_LENGTH } from "../shared/url";
import { FOOTER_LIMITS } from "./schema";

export function FooterInspector(props: SectionInspectorProps<"footer">) {
  const { section, basePath, issueFor } = props;
  const { data } = section;
  const set = dataUpdater(props);
  const p = pathBuilder(basePath);

  return (
    <div className="space-y-5">
      <TextField
        path={p("brandName")}
        label="Brand name"
        value={data.brandName}
        maxLength={FOOTER_LIMITS.brandName}
        issue={issueFor(p("brandName"))}
        onChange={(brandName) => set({ brandName })}
      />
      <TextField
        path={p("tagline")}
        label="Tagline"
        optional
        value={data.tagline ?? ""}
        maxLength={FOOTER_LIMITS.tagline}
        issue={issueFor(p("tagline"))}
        onChange={(tagline) => set({ tagline })}
      />
      <ItemListField
        path={p("links")}
        legend="Links"
        noun="Link"
        plural="links"
        items={data.links}
        bounds={FOOTER_LIMITS.links}
        issue={issueFor(p("links"))}
        createItem={() => ({ id: createId(), label: "", href: "" })}
        onChange={(links) => set({ links })}
        renderItem={(link, index, update) => (
          <>
            <TextField
              path={p("links", index, "label")}
              label="Label"
              value={link.label}
              maxLength={LABEL_MAX_LENGTH}
              issue={issueFor(p("links", index, "label"))}
              onChange={(label) => update({ label })}
            />
            <TextField
              path={p("links", index, "href")}
              label="Link"
              value={link.href}
              maxLength={HREF_MAX_LENGTH}
              hint={HREF_HINT}
              inputMode="url"
              issue={issueFor(p("links", index, "href"))}
              onChange={(href) => update({ href })}
            />
          </>
        )}
      />
      <TextField
        path={p("copyright")}
        label="Copyright"
        value={data.copyright}
        maxLength={FOOTER_LIMITS.copyright}
        issue={issueFor(p("copyright"))}
        onChange={(copyright) => set({ copyright })}
      />
    </div>
  );
}
