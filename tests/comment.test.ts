import { describe, expect, it } from "vitest";
import { renderComment } from "../src/comment.js";

describe("renderComment", () => {
  it("renders missing checks without accusation language", () => {
    const comment = renderComment({
      kind: "pull_request",
      number: 1,
      results: [
        {
          id: "tests",
          label: "needs-tests",
          title: "Tests or explanation",
          details: "Add tests.",
          passed: false
        }
      ]
    });
    expect(comment).toContain("not ready for maintainer review");
    expect(comment).toContain("A maintainer can override");
    expect(comment).not.toMatch(/slop|AI-generated/i);
  });
});
