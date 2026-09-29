// Pure helpers for reordering top-level sections (drag and drop, keyboard,
// and the Move up / Move down buttons all end in the reducer's moveSection).

export type DropPlacement = "before" | "after";

/** Returns a new array with the item at `from` moved to final position `to`. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  if (from < 0 || from >= items.length || to < 0 || to >= items.length || from === to) {
    return next;
  }
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved as T);
  return next;
}

/**
 * Final position for an item dragged from `from` and dropped before/after the
 * row at `over`. Dropping on itself or next to itself returns `from` (no move).
 */
export function dropIndex(from: number, over: number, placement: DropPlacement): number {
  const insertAt = placement === "before" ? over : over + 1;
  // Removing the dragged item first shifts later positions up by one.
  return insertAt > from ? insertAt - 1 : insertAt;
}

/**
 * Target position for a keyboard reorder key on a section's handle, or null
 * when the key does not reorder (or the item cannot move that way).
 */
export function keyboardMoveIndex(key: string, index: number, length: number): number | null {
  const last = length - 1;
  let target: number;
  switch (key) {
    case "ArrowUp":
      target = index - 1;
      break;
    case "ArrowDown":
      target = index + 1;
      break;
    case "Home":
      target = 0;
      break;
    case "End":
      target = last;
      break;
    default:
      return null;
  }
  return target < 0 || target > last || target === index ? null : target;
}
