import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";

describe("loadConfig", () => {
  it("defaults to a silent lenient preset", () => {
    const config = loadConfig(undefined);
    expect(config.preset).toBe("lenient");
    expect(config.pull_requests.require_issue_link).toBe(false);
    expect(config.pull_requests.require_tests_for_code_changes).toBe(false);
    expect(config.pull_requests.require_scope_for_large_prs).toBe(false);
    expect(config.issues.require_structured_bug_fields).toBe(false);
  });

  it("applies recommended defaults without enabling strict PR checks", () => {
    const config = loadConfig("preset: recommended");
    expect(config.pull_requests.require_scope_for_large_prs).toBe(true);
    expect(config.pull_requests.require_issue_link).toBe(false);
    expect(config.pull_requests.require_tests_for_code_changes).toBe(false);
    expect(config.issues.require_structured_bug_fields).toBe(true);
  });

  it("lets explicit config override presets", () => {
    const config = loadConfig(`
preset: strict
pull_requests:
  require_issue_link: false
`);
    expect(config.pull_requests.require_issue_link).toBe(false);
    expect(config.pull_requests.require_tests_for_code_changes).toBe(true);
  });

  it("rejects invalid field types with a useful error", () => {
    expect(() =>
      loadConfig(`
pull_requests:
  require_issue_link: "yes"
`)
    ).toThrow("pull_requests.require_issue_link");
  });
});
