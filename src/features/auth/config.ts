import "server-only";

import { z } from "zod";

// $2a$/$2b$/$2y$, two-digit cost, 22-char salt + 31-char hash.
const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

const authEnvSchema = z.object({
  ADMIN_EMAIL: z.email("must be a valid email address"),
  ADMIN_PASSWORD_HASH: z
    .string()
    .regex(
      BCRYPT_HASH_PATTERN,
      "must be a bcrypt hash (generate one with `npm run auth:hash-password`; in .env files escape each $ as \\$)",
    ),
  SESSION_SECRET: z.string().min(32, "must be at least 32 characters"),
});

export type AuthConfig = {
  adminEmail: string;
  passwordHash: string;
  sessionSecret: Uint8Array;
};

export class AuthConfigError extends Error {
  override name = "AuthConfigError";
}

/**
 * Validates the auth environment variables. Error messages name the variables
 * but never include their values.
 */
export function parseAuthConfig(env: Record<string, string | undefined>): AuthConfig {
  const values = {
    ADMIN_EMAIL: env.ADMIN_EMAIL,
    ADMIN_PASSWORD_HASH: env.ADMIN_PASSWORD_HASH,
    SESSION_SECRET: env.SESSION_SECRET,
  };
  const result = authEnvSchema.safeParse(values);

  if (!result.success) {
    const problems = result.error.issues.map((issue) => {
      const name = String(issue.path[0]);
      return values[name as keyof typeof values] === undefined
        ? `${name} is not set`
        : `${name} ${issue.message}`;
    });
    throw new AuthConfigError(`Invalid auth configuration: ${problems.join("; ")}`);
  }

  return {
    adminEmail: result.data.ADMIN_EMAIL,
    passwordHash: result.data.ADMIN_PASSWORD_HASH,
    sessionSecret: new TextEncoder().encode(result.data.SESSION_SECRET),
  };
}

let cachedConfig: AuthConfig | undefined;

/**
 * Reads the auth configuration from `process.env` on first use (not at import
 * time) and caches it. Throws `AuthConfigError` when misconfigured.
 */
export function getAuthConfig(): AuthConfig {
  cachedConfig ??= parseAuthConfig(process.env);
  return cachedConfig;
}

/** Logs a configuration problem server-side without exposing secret values. */
export function logAuthConfigError(error: unknown): void {
  if (error instanceof AuthConfigError) {
    console.error(`[auth] ${error.message}`);
  } else {
    console.error("[auth] Failed to load auth configuration", error);
  }
}
