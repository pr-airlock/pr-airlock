import type { AirlockConfig, ChangedFile, CheckResult } from "../types.js";
import { matchesAny } from "../glob.js";

interface PullRequestInput {
  title: string;
  body: string;
  files: ChangedFile[];
}

export function evaluatePullRequest(input: PullRequestInput, config: AirlockConfig): CheckResult[] {
  const results: CheckResult[] = [];

  if (config.pull_requests.require_issue_link) {
    results.push(checkIssueLink(input, config));
  }

  if (config.pull_requests.require_tests_for_code_changes) {
    results.push(checkTests(input, config));
  }

  if (config.pull_requests.require_scope_for_large_prs) {
    results.push(checkScope(input, config));
  }

  if (config.pull_requests.require_risk_note) {
    results.push(checkSection(input.body, config.labels.missing_risk_note, "Risk note", "Add a short `Risk` or `Rollback` section."));
  }

  if (config.pull_requests.require_human_ack) {
    results.push(checkHumanAck(input.body, config));
  }

  return results;
}

function checkIssueLink(input: PullRequestInput, config: AirlockConfig): CheckResult {
  const text = `${input.title}\n${input.body}`;
  const hasLink = /\b(fixes|closes|resolves)\s+#\d+\b/i.test(text) || /https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/issues\/\d+/i.test(text);
  const hasException = /maintainer-approved|drive-by|trivial/i.test(text);
  return {
    id: "issue-link",
    label: config.labels.missing_issue_link,
    title: "Linked issue",
    details: "Add `Fixes #123`, `Closes #123`, an issue URL, or a maintainer-approved exception.",
    passed: hasLink || hasException
  };
}

function checkTests(input: PullRequestInput, config: AirlockConfig): CheckResult {
  const relevantFiles = input.files.filter((file) => !matchesAny(file.filename, config.pull_requests.docs_paths));
  const changedSource = relevantFiles.some((file) => matchesAny(file.filename, config.pull_requests.source_paths));
  const changedTests = input.files.some((file) => matchesAny(file.filename, config.pull_requests.test_paths));
  const explainsNoTests = /no tests? (needed|required)|tests? not (needed|required)|manual test/i.test(input.body);

  return {
    id: "tests",
    label: config.labels.missing_tests,
    title: "Tests or explanation",
    details: "Add or update tests, or include a short explanation of why tests are not needed.",
    passed: !changedSource || changedTests || explainsNoTests
  };
}

function checkScope(input: PullRequestInput, config: AirlockConfig): CheckResult {
  const countedFiles = input.files.filter((file) => !matchesAny(file.filename, config.large_pr.exclude));
  const fileCount = countedFiles.length;
  const lineCount = countedFiles.reduce((total, file) => total + file.additions + file.deletions, 0);
  const isLarge = fileCount > config.large_pr.files || lineCount > config.large_pr.lines;
  const hasScope = /scope|out of scope|split|why this is one pr|large pr/i.test(input.body);

  return {
    id: "scope",
    label: config.labels.missing_scope,
    title: "Scope explanation",
    details: `This PR changes ${fileCount} counted files and ${lineCount} counted lines. Add a short scope explanation or split it into smaller PRs.`,
    passed: !isLarge || hasScope
  };
}

function checkSection(body: string, label: string, title: string, details: string): CheckResult {
  return {
    id: title.toLowerCase().replace(/\s+/g, "-"),
    label,
    title,
    details,
    passed: /\b(risk|rollback|compatibility|breaking change)\b/i.test(body)
  };
}

function checkHumanAck(body: string, config: AirlockConfig): CheckResult {
  return {
    id: "human-ack",
    label: config.labels.needs_human_ack,
    title: "Human acknowledgement",
    details: "Confirm that you reviewed and understand every change in this PR.",
    passed:
      /^\s*-\s*\[[xX]\]\s+.*(reviewed and understand every change|not submitting unreviewed|understand this change)/im.test(body) ||
      /^\s*\[[xX]\]\s+.*(reviewed and understand every change|not submitting unreviewed|understand this change)/im.test(body)
  };
}
