import { describe, expect, it } from "@jest/globals";

import type { PageActionResult } from "@/features/pages/actions";

import {
  CONFLICT_MESSAGE,
  failureMessage,
  feedbackFor,
  successMessage,
} from "./action-results";

const at = new Date("2026-09-29T10:05:00Z");
const issue = { path: "meta.title", message: "Invalid value" };

describe("successMessage", () => {
  it("names the action and the UTC time", () => {
    expect(successMessage("save", at)).toBe("Saved at 10:05 AM UTC.");
    expect(successMessage("publish", at)).toBe("Published at 10:05 AM UTC.");
  });
});

describe("failureMessage", () => {
  it("counts problems for invalid saves without listing content", () => {
    expect(failureMessage("save", { ok: false, reason: "invalid", issues: [issue] })).toBe(
      "Couldn't save: 1 problem with the content. Fix the errors and try again.",
    );
    expect(
      failureMessage("save", { ok: false, reason: "invalid", issues: [issue, issue, issue] }),
    ).toContain("3 problems");
  });

  it("tells the admin what to do when publishing is refused", () => {
    const message = failureMessage("publish", { ok: false, reason: "invalid", issues: [issue, issue] });
    expect(message).toBe(
      "Couldn't publish: 2 fields still need attention. Fill in the required content, save, and try again.",
    );
    expect(failureMessage("publish", { ok: false, reason: "invalid", issues: [issue] })).toContain(
      "1 field still needs",
    );
  });

  it("explains a conflict the same way for save and publish", () => {
    for (const kind of ["save", "publish"] as const) {
      expect(failureMessage(kind, { ok: false, reason: "conflict" })).toBe(CONFLICT_MESSAGE);
    }
    expect(CONFLICT_MESSAGE).toContain("Reload");
  });

  it("reports pages that no longer exist", () => {
    expect(failureMessage("save", { ok: false, reason: "not_found" })).toBe(
      "Couldn't save: this page no longer exists.",
    );
    expect(failureMessage("publish", { ok: false, reason: "not_found" })).toContain("publish");
  });

  it.each(["bad_request", "error"] as const)("hides the details of %s failures", (reason) => {
    expect(failureMessage("publish", { ok: false, reason })).toBe(
      "Couldn't publish because something went wrong. Please try again.",
    );
  });
});

describe("feedbackFor", () => {
  it("maps results to a tone and message", () => {
    const success: PageActionResult = {
      ok: true,
      version: "2026-09-29T10:05:00.000Z",
      status: "draft",
      publishedAt: null,
    };
    expect(feedbackFor("save", success, at)).toEqual({
      tone: "success",
      message: "Saved at 10:05 AM UTC.",
    });
    expect(feedbackFor("save", { ok: false, reason: "conflict" }, at)).toEqual({
      tone: "error",
      message: CONFLICT_MESSAGE,
    });
  });
});
