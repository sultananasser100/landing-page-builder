import { Icon, type IconName } from "@/features/sections/shared/icons";

import type { EditorIssue, IssuePath } from "../validation";
import { FieldMessage } from "./field-message";
import { describedBy, fieldId, humanize } from "./field-utils";

/** A native select of icon names with a live preview of the chosen icon. */
export function IconField<T extends IconName>({
  path,
  label,
  value,
  options,
  onChange,
  issue,
}: {
  path: IssuePath;
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  issue?: EditorIssue;
}) {
  const id = fieldId(path);
  const messageId = issue ? `${id}-message` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Icon name={value} />
        </span>
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value as T)}
          aria-invalid={issue?.severity === "error" || undefined}
          aria-describedby={describedBy(messageId)}
          className="h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {humanize(option)}
            </option>
          ))}
        </select>
      </div>
      {messageId ? <FieldMessage id={messageId} issue={issue} /> : null}
    </div>
  );
}

export function CheckboxField({
  path,
  label,
  checked,
  onChange,
  hint,
}: {
  path: IssuePath;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
}) {
  const id = fieldId(path);
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="flex items-start gap-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-describedby={hintId}
        className="mt-0.5 size-4 shrink-0 rounded border-input accent-primary focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      />
      <div>
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {hint ? (
          <p id={hintId} className="text-xs text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
