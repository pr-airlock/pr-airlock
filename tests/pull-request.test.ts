import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";
import { evaluatePullRequest } from "../src/checks/pull-request.js";
import type { ChangedFile } from "../src/types.js";

const smallSourceChange: ChangedFile[] = [
  { filename: "src/index.ts", additions: 10, deletions: 2, changes: 12 }
];

describe("evaluatePullRequest", () => {
  it("does not run checks in lenient mode", () => {
    const config = loadConfig("preset: lenient");
    const results = evaluatePullRequest({ title: "Fix typo", body: "", files: smallSourceChange }, config);
    expect(results).toEqual([]);
  });

  it("passes a small PR in recommended mode", () => {
    const config = loadConfig("preset: recommended");
    const results = evaluatePullRequest({ title: "Small change", body: "", files: smallSourceChange }, config);
    expect(results.every((result) => result.passed)).toBe(true);
  });

  it("requires scope for large counted PRs", () => {
    const config = loadConfig(`
preset: recommended
large_pr:
  files: 1
  lines: 20
`);
    const files: ChangedFile[] = [
      { filename: "src/index.ts", additions: 40, deletions: 0, changes: 40 },
      { filename: "src/other.ts", additions: 1, deletions: 0, changes: 1 }
    ];
    const results = evaluatePullRequest({ title: "Large change", body: "", files }, config);
    expect(results.find((result) => result.id === "scope")?.passed).toBe(false);
  });

  it("excludes lockfiles and generated files from large PR counts", () => {
    const config = loadConfig(`
preset: recommended
large_pr:
  files: 1
  lines: 20
`);
    const files: ChangedFile[] = [
      { filename: "package-lock.json", additions: 5000, deletions: 0, changes: 5000 },
      { filename: "src/client.generated.ts", additions: 5000, deletions: 0, changes: 5000 }
    ];
    const results = evaluatePullRequest({ title: "Dependency update", body: "", files }, config);
    expect(results.find((result) => result.id === "scope")?.passed).toBe(true);
  });

  it("strict mode requires linked issue and tests", () => {
    const config = loadConfig("preset: strict");
    const results = evaluatePullRequest({ title: "Change behavior", body: "", files: smallSourceChange }, config);
    expect(results.find((result) => result.id === "issue-link")?.passed).toBe(false);
    expect(results.find((result) => result.id === "tests")?.passed).toBe(false);
  });
});
