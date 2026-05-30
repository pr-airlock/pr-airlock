import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";
import { evaluateIssue, extractIssueFormName, hasFilledIssueFormField } from "../src/checks/issue.js";

describe("evaluateIssue", () => {
  it("does nothing for free-text issues", () => {
    const config = loadConfig("preset: recommended");
    const results = evaluateIssue({ title: "Bug", body: "It broke." }, config);
    expect(results).toEqual([]);
  });

  it("extracts the airlock form marker", () => {
    expect(extractIssueFormName("<!-- airlock:form=bug_report -->")).toBe("bug_report");
  });

  it("detects filled issue form fields", () => {
    const body = `
<!-- airlock:field=reproduction -->
Run npm test.
<!-- airlock:field=expected -->
Passes.
`;
    expect(hasFilledIssueFormField(body, "reproduction")).toBe(true);
    expect(hasFilledIssueFormField(body, "actual")).toBe(false);
  });

  it("requires configured fields for structured bug reports", () => {
    const config = loadConfig("preset: recommended");
    const body = `
### Steps to reproduce
<!-- airlock:form=bug_report -->
<!-- airlock:field=reproduction -->
Run npm test.
### Expected behavior
<!-- airlock:field=expected -->
Passes.
`;
    const results = evaluateIssue({ title: "Bug", body }, config);
    expect(results).toHaveLength(1);
    expect(results[0].passed).toBe(false);
    expect(results[0].details).toContain("actual");
    expect(results[0].details).toContain("version");
  });
});
