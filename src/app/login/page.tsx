import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/login-form";
import { safeRedirectPath } from "@/features/auth/redirect";
import { getSession } from "@/features/auth/session";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const nextPath = safeRedirectPath(next);

  if (await getSession()) redirect(nextPath);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-xs">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to manage your landing pages.
        </p>
        <div className="mt-8">
          <LoginForm next={nextPath} />
        </div>
      </div>
    </main>
  );
}
