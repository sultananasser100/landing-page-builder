import { hash, truncates } from "bcryptjs";

// Used by scripts/hash-password.ts to produce ADMIN_PASSWORD_HASH.

export const BCRYPT_COST = 12;
export const PASSWORD_MAX_BYTES = 72;

/** Returns an error message for passwords bcrypt cannot hash faithfully. */
export function validatePasswordForHashing(password: string): string | null {
  if (password.length === 0) return "Password must not be empty.";
  if (truncates(password)) {
    return `Password must be at most ${PASSWORD_MAX_BYTES} bytes (UTF-8); bcrypt ignores anything longer.`;
  }
  return null;
}

export async function hashPassword(
  password: string,
  cost: number = BCRYPT_COST,
): Promise<string> {
  const problem = validatePasswordForHashing(password);
  if (problem) throw new Error(problem);
  return hash(password, cost);
}

/**
 * Formats the `.env` line. Next.js expands `$VAR` references in .env files,
 * so every `$` in the bcrypt hash must be escaped as `\$`.
 */
export function formatPasswordHashEnvLine(passwordHash: string): string {
  return `ADMIN_PASSWORD_HASH="${passwordHash.replaceAll("$", "\\$")}"`;
}
