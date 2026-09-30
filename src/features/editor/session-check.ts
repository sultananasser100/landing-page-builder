export const SESSION_CHECK_URL = "/dashboard/session";

/**
 * After a save or publish request failed unexpectedly: is the admin signed out?
 *
 * The proxy answers a signed-out request to /dashboard/* with a redirect to
 * /login. That redirect is also what makes Server Action calls fail with an
 * unhelpful error, so it is the signal checked here: the request is not
 * followed (`redirect: "manual"`), and an opaque redirect, or a 401 from the
 * route itself, means the session is gone. Any other outcome, including a
 * network error, is not treated as an expired session.
 */
export async function isSessionExpired(
  fetchImpl: typeof fetch = (input, init) => fetch(input, init),
): Promise<boolean> {
  try {
    const response = await fetchImpl(SESSION_CHECK_URL, {
      cache: "no-store",
      redirect: "manual",
      credentials: "same-origin",
    });
    return response.type === "opaqueredirect" || response.status === 401;
  } catch {
    return false;
  }
}
