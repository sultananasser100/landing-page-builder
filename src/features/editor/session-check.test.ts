import { describe, expect, it, jest } from "@jest/globals";

import { isSessionExpired, SESSION_CHECK_URL } from "./session-check";

/** A fetch stand-in that resolves to the given response-like values. */
function fakeFetch(response: { type?: string; status: number }) {
  return jest.fn<typeof fetch>().mockResolvedValue(response as Response);
}

describe("isSessionExpired", () => {
  it("is true when the proxy redirected the check (browser reports an opaque redirect)", async () => {
    expect(await isSessionExpired(fakeFetch({ type: "opaqueredirect", status: 0 }))).toBe(true);
  });

  it("is true when the route itself answers 401", async () => {
    expect(await isSessionExpired(fakeFetch({ type: "basic", status: 401 }))).toBe(true);
  });

  it.each([200, 204, 404, 500])("is false for a %i response", async (status) => {
    expect(await isSessionExpired(fakeFetch({ type: "basic", status }))).toBe(false);
  });

  it("is false when the check cannot be made (network failure)", async () => {
    const failing = jest.fn<typeof fetch>().mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await isSessionExpired(failing)).toBe(false);
  });

  it("asks without following redirects or using the cache", async () => {
    const fetchMock = fakeFetch({ type: "basic", status: 204 });
    await isSessionExpired(fetchMock);
    expect(fetchMock).toHaveBeenCalledWith(SESSION_CHECK_URL, {
      cache: "no-store",
      redirect: "manual",
      credentials: "same-origin",
    });
  });
});
