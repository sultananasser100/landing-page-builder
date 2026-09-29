/** Generates a stable id for sections and list items (matches `idSchema`). */
export function createId(): string {
  return crypto.randomUUID();
}
