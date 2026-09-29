import { Button } from "@/components/ui/button";
import { LABEL_MAX_LENGTH } from "@/features/sections/shared/fields";
import { HREF_MAX_LENGTH } from "@/features/sections/shared/url";

import type { IssuePath } from "../validation";
import type { IssueLookup } from "./field-utils";
import { TextField } from "./text-field";

export type LinkValue = { label: string; href: string };

export const HREF_HINT = "https://, http://, mailto:, a #anchor or a /path";

/** A button/link `{ label, href }` pair grouped in a fieldset. */
export function LinkField({
  path,
  legend,
  value,
  onChange,
  issueFor,
  children,
}: {
  path: IssuePath;
  legend: string;
  value: LinkValue;
  onChange: (value: LinkValue) => void;
  issueFor: IssueLookup;
  children?: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-3 rounded-lg border p-3">
      <legend className="px-1 text-sm font-medium">{legend}</legend>
      <TextField
        path={[...path, "label"]}
        label="Label"
        value={value.label}
        maxLength={LABEL_MAX_LENGTH}
        issue={issueFor([...path, "label"])}
        onChange={(label) => onChange({ ...value, label })}
      />
      <TextField
        path={[...path, "href"]}
        label="Link"
        value={value.href}
        maxLength={HREF_MAX_LENGTH}
        hint={HREF_HINT}
        inputMode="url"
        issue={issueFor([...path, "href"])}
        onChange={(href) => onChange({ ...value, href })}
      />
      {children}
    </fieldset>
  );
}

/** An optional link (e.g. the hero's secondary button) that can be added or removed. */
export function OptionalLinkField({
  path,
  legend,
  value,
  onChange,
  issueFor,
}: {
  path: IssuePath;
  legend: string;
  value: LinkValue | undefined;
  onChange: (value: LinkValue | undefined) => void;
  issueFor: IssueLookup;
}) {
  const noun = legend.toLowerCase();
  if (!value) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange({ label: "", href: "" })}
      >
        Add {noun}
      </Button>
    );
  }
  return (
    <LinkField
      path={path}
      legend={`${legend} (optional)`}
      value={value}
      onChange={onChange}
      issueFor={issueFor}
    >
      <Button type="button" variant="ghost" size="sm" onClick={() => onChange(undefined)}>
        Remove {noun}
      </Button>
    </LinkField>
  );
}
