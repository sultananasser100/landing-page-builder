import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import type { EditorIssue, IssuePath } from "../validation";
import { FieldMessage } from "./field-message";
import { describedBy, fieldId } from "./field-utils";

export type TextFieldProps = {
  path: IssuePath;
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  issue?: EditorIssue;
  /** Optional fields may stay empty when publishing. */
  optional?: boolean;
  multiline?: boolean;
  hint?: string;
  inputMode?: "text" | "url" | "email";
};

/** A labelled text input or textarea with a character counter and validation message. */
export function TextField({
  path,
  label,
  value,
  onChange,
  maxLength,
  issue,
  optional = false,
  multiline = false,
  hint,
  inputMode,
}: TextFieldProps) {
  const id = fieldId(path);
  const hintId = hint ? `${id}-hint` : undefined;
  const countId = `${id}-count`;
  const messageId = issue ? `${id}-message` : undefined;

  const controlProps = {
    id,
    value,
    maxLength,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(event.target.value),
    "aria-invalid": issue?.severity === "error" || undefined,
    "aria-describedby": describedBy(hintId, countId, messageId),
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
          {optional ? (
            <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
          ) : null}
        </label>
        <span id={countId} className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {value.length}/{maxLength}
          <span className="sr-only"> characters</span>
        </span>
      </div>
      {multiline ? (
        <Textarea {...controlProps} rows={3} />
      ) : (
        <Input {...controlProps} type="text" inputMode={inputMode} autoComplete="off" />
      )}
      {hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {messageId ? <FieldMessage id={messageId} issue={issue} /> : null}
    </div>
  );
}
