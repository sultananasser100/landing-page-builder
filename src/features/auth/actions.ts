"use server";

import { redirect } from "next/navigation";

import { getAuthConfig, logAuthConfigError, type AuthConfig } from "./config";
import { verifyAdminCredentials } from "./credentials";
import { safeRedirectPath } from "./redirect";
import {
  LOGIN_ERROR_INVALID,
  LOGIN_ERROR_UNAVAILABLE,
  loginSchema,
  type LoginState,
} from "./schemas";
import { createSession, deleteSession } from "./session";

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const rawEmail = formData.get("email");
  const email = typeof rawEmail === "string" ? rawEmail.slice(0, 254) : "";

  const parsed = loginSchema.safeParse({
    email: rawEmail,
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: LOGIN_ERROR_INVALID, email };

  let config: AuthConfig;
  try {
    config = getAuthConfig();
  } catch (error) {
    logAuthConfigError(error);
    return { error: LOGIN_ERROR_UNAVAILABLE, email };
  }

  const valid = await verifyAdminCredentials(
    config,
    parsed.data.email,
    parsed.data.password,
  );
  if (!valid) return { error: LOGIN_ERROR_INVALID, email };

  await createSession();
  redirect(safeRedirectPath(formData.get("next")));
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
