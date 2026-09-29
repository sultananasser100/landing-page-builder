import "server-only";

import { compare, truncates } from "bcryptjs";

import type { AuthConfig } from "./config";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Checks the submitted credentials against the configured admin. The bcrypt
 * comparison runs even when the email does not match, so a wrong email and a
 * wrong password take similar time.
 */
export async function verifyAdminCredentials(
  config: Pick<AuthConfig, "adminEmail" | "passwordHash">,
  email: string,
  password: string,
): Promise<boolean> {
  const emailMatches = normalizeEmail(email) === normalizeEmail(config.adminEmail);
  // bcrypt ignores bytes after the 72nd, so a longer input could otherwise
  // match a hash of its prefix. The hash helper rejects such passwords.
  if (truncates(password)) return false;
  const passwordMatches = await compare(password, config.passwordHash);
  return emailMatches && passwordMatches;
}
