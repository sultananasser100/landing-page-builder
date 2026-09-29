// Immutable helpers for editing lists inside section data. Counts are bounded
// by the section schema limits; callers pass them in.

export type Bounds = { min: number; max: number };

export function canAddItem(count: number, bounds: Bounds): boolean {
  return count < bounds.max;
}

export function canRemoveItem(count: number, bounds: Bounds): boolean {
  return count > bounds.min;
}

/** Items with stable ids (features, testimonials, plans, FAQ, footer links). */
export function appendItem<T>(items: readonly T[], item: T, bounds: Bounds): T[] {
  return canAddItem(items.length, bounds) ? [...items, item] : [...items];
}

export function updateItem<T extends { id: string }>(
  items: readonly T[],
  id: string,
  patch: Partial<Omit<T, "id">>,
): T[] {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

export function removeItem<T extends { id: string }>(
  items: readonly T[],
  id: string,
  bounds: Bounds,
): T[] {
  if (!canRemoveItem(items.length, bounds)) return [...items];
  return items.filter((item) => item.id !== id);
}

/** Plain string lists without ids (pricing plan features). */
export function updateAt<T>(items: readonly T[], index: number, value: T): T[] {
  if (index < 0 || index >= items.length) return [...items];
  return items.map((item, i) => (i === index ? value : item));
}

export function removeAt<T>(items: readonly T[], index: number, bounds: Bounds): T[] {
  if (!canRemoveItem(items.length, bounds) || index < 0 || index >= items.length) {
    return [...items];
  }
  return items.filter((_, i) => i !== index);
}
