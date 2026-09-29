import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";

import {
  appendItem,
  canAddItem,
  canRemoveItem,
  removeAt,
  removeItem,
  updateAt,
  updateItem,
  type Bounds,
} from "../item-list";
import type { EditorIssue, IssuePath } from "../validation";
import { FieldMessage } from "./field-message";
import { fieldId, type IssueLookup } from "./field-utils";
import { TextField } from "./text-field";

const FOCUSABLE = "input, textarea, select";
const ADD_BUTTON = "[data-add-item]";

/**
 * Moves focus after the list re-renders: to the first control of a new or
 * neighbouring item, or to the Add button when the list is empty. Uses a ref
 * rather than state so no extra render is needed.
 */
function usePendingFocus<E extends HTMLElement>() {
  const containerRef = useRef<E>(null);
  const pendingRef = useRef<string | null>(null);

  useEffect(() => {
    const selector = pendingRef.current;
    if (!selector || !containerRef.current) return;
    pendingRef.current = null;
    containerRef.current.querySelector<HTMLElement>(selector)?.focus();
  });

  return {
    containerRef,
    focusLater(selector: string) {
      pendingRef.current = selector;
    },
  };
}

function ListFooter({
  noun,
  plural,
  count,
  bounds,
  issueId,
  issue,
  onAdd,
}: {
  noun: string;
  plural: string;
  count: number;
  bounds: Bounds;
  issueId: string;
  issue?: EditorIssue;
  onAdd: () => void;
}) {
  const canAdd = canAddItem(count, bounds);
  return (
    <div className="space-y-1.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAdd}
        disabled={!canAdd}
        data-add-item=""
      >
        Add {noun.toLowerCase()}
      </Button>
      <p className="text-xs text-muted-foreground">
        {canAdd
          ? `${count} of ${bounds.max} ${plural}`
          : `Maximum of ${bounds.max} ${plural} reached`}
      </p>
      {issue ? <FieldMessage id={issueId} issue={issue} /> : null}
    </div>
  );
}

/** Items with stable ids: each item is a fieldset with its own fields. */
export function ItemListField<T extends { id: string }>({
  path,
  legend,
  noun,
  plural,
  items,
  bounds,
  issue,
  createItem,
  onChange,
  renderItem,
}: {
  path: IssuePath;
  legend: string;
  /** Singular, e.g. "Feature". */
  noun: string;
  /** Lower-case plural, e.g. "features". */
  plural: string;
  items: readonly T[];
  bounds: Bounds;
  issue?: EditorIssue;
  createItem: () => T;
  onChange: (items: T[]) => void;
  renderItem: (
    item: T,
    index: number,
    update: (patch: Partial<Omit<T, "id">>) => void,
  ) => React.ReactNode;
}) {
  const { containerRef, focusLater } = usePendingFocus<HTMLFieldSetElement>();
  const canRemove = canRemoveItem(items.length, bounds);

  const add = () => {
    const item = createItem();
    onChange(appendItem(items, item, bounds));
    focusLater(`[data-item-id="${item.id}"] :is(${FOCUSABLE})`);
  };

  const remove = (index: number) => {
    const item = items[index];
    if (!item) return;
    const neighbour = items[index + 1] ?? items[index - 1];
    onChange(removeItem(items, item.id, bounds));
    focusLater(
      neighbour ? `[data-item-id="${neighbour.id}"] :is(${FOCUSABLE})` : ADD_BUTTON,
    );
  };

  return (
    <fieldset ref={containerRef} className="space-y-3">
      <legend className="text-sm font-semibold">{legend}</legend>
      {items.map((item, index) => (
        <fieldset
          key={item.id}
          data-item-id={item.id}
          className="space-y-3 rounded-lg border p-3"
        >
          <legend className="px-1 text-sm font-medium">
            {noun} {index + 1}
          </legend>
          {renderItem(item, index, (patch) => onChange(updateItem(items, item.id, patch)))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => remove(index)}
            disabled={!canRemove}
          >
            Remove {noun.toLowerCase()} {index + 1}
          </Button>
        </fieldset>
      ))}
      <ListFooter
        noun={noun}
        plural={plural}
        count={items.length}
        bounds={bounds}
        issueId={`${fieldId(path)}-message`}
        issue={issue}
        onAdd={add}
      />
    </fieldset>
  );
}

/** A list of plain strings without ids (pricing plan features). */
export function StringListField({
  path,
  legend,
  noun,
  plural,
  values,
  bounds,
  maxLength,
  issue,
  issueFor,
  onChange,
}: {
  path: IssuePath;
  legend: string;
  noun: string;
  plural: string;
  values: readonly string[];
  bounds: Bounds;
  maxLength: number;
  issue?: EditorIssue;
  issueFor: IssueLookup;
  onChange: (values: string[]) => void;
}) {
  const { containerRef, focusLater } = usePendingFocus<HTMLFieldSetElement>();
  const canRemove = canRemoveItem(values.length, bounds);

  const add = () => {
    onChange(appendItem(values, "", bounds));
    focusLater(`[data-index="${values.length}"] :is(${FOCUSABLE})`);
  };

  const remove = (index: number) => {
    const remaining = values.length - 1;
    onChange(removeAt(values, index, bounds));
    // Indexes shift down, so the next value now sits at `index`.
    const target = remaining === 0 ? null : Math.min(index, remaining - 1);
    focusLater(target === null ? ADD_BUTTON : `[data-index="${target}"] :is(${FOCUSABLE})`);
  };

  return (
    <fieldset ref={containerRef} className="space-y-3">
      <legend className="text-sm font-medium">{legend}</legend>
      {values.map((value, index) => (
        // Plain strings have no ids; the index is the only stable key.
        <div key={index} data-index={index} className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <TextField
              path={[...path, index]}
              label={`${noun} ${index + 1}`}
              value={value}
              maxLength={maxLength}
              issue={issueFor([...path, index])}
              onChange={(next) => onChange(updateAt(values, index, next))}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => remove(index)}
            disabled={!canRemove}
          >
            Remove<span className="sr-only"> {noun.toLowerCase()} {index + 1}</span>
          </Button>
        </div>
      ))}
      <ListFooter
        noun={noun}
        plural={plural}
        count={values.length}
        bounds={bounds}
        issueId={`${fieldId(path)}-message`}
        issue={issue}
        onAdd={add}
      />
    </fieldset>
  );
}
