import { getSession } from "@/features/auth/session";

// Lets the editor tell an expired session apart from other failures after a
// save or publish fails (see features/editor/session-check.ts). The proxy
// already redirects signed-out requests to /dashboard/*; the 401 here covers
// a session that is rejected after the proxy check.
export async function GET() {
  const session = await getSession();
  return new Response(null, {
    status: session ? 204 : 401,
    headers: { "Cache-Control": "no-store" },
  });
}
