import { z } from "zod";

export const LOGIN_ERROR_INVALID = "Invalid email or password.";
export const LOGIN_ERROR_UNAVAILABLE = "Sign-in is temporarily unavailable.";

export const loginSchema = z.object({
  email: z.string().trim().max(254).pipe(z.email()),
  // The upper bound limits bcrypt work for oversized submissions.
  password: z.string().min(1).max(1024),
});

export type LoginState = {
  error: string | null;
  /** Echoed back so the email field keeps its value after an error. */
  email: string;
};

export const initialLoginState: LoginState = { error: null, email: "" };
