import type { Evaluation } from "./types.js";

export const COMMENT_MARKER = "<!-- pr-airlock:status -->";

export function renderComment(evaluation: Evaluation, overrideLabel: string): string {
  const failing = evaluation.results.filter((result) => !result.passed);
  if (failing.length === 0) {
    return `${COMMENT_MARKER}
### PR Airlock

Ready for maintainer review. All configured intake checks are passing.
`;
  }

  const rows = failing.map((result) => `- **${result.title}**: ${result.details}`).join("\n");
  return `${COMMENT_MARKER}
### PR Airlock

This ${evaluation.kind === "pull_request" ? "PR" : "issue"} is not ready for maintainer review yet.

${rows}

A maintainer can override this gate by applying the \`${overrideLabel}\` label.
`;
}
