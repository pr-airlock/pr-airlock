import * as core from "@actions/core";
import * as github from "@actions/github";
import { loadConfig } from "./config.js";
import { renderComment, COMMENT_MARKER } from "./comment.js";
import { evaluatePullRequest } from "./checks/pull-request.js";
import { evaluateIssue } from "./checks/issue.js";
import type { AirlockConfig, ChangedFile, Evaluation } from "./types.js";

async function run(): Promise<void> {
  const token = core.getInput("token", { required: true });
  const configPath = core.getInput("config") || ".github/pr-airlock.yml";
  const octokit = github.getOctokit(token);
  const context = github.context;
  const { owner, repo } = context.repo;
  const config = await loadRemoteConfig(octokit, owner, repo, configPath);

  if (context.payload.pull_request) {
    const pr = context.payload.pull_request;
    const labels = (pr.labels ?? []).map((label: { name: string }) => label.name);
    const files = await listPullRequestFiles(octokit, owner, repo, pr.number);
    const results = evaluatePullRequest({ title: pr.title ?? "", body: pr.body ?? "", files }, config);
    const evaluation: Evaluation = {
      kind: "pull_request",
      number: pr.number,
      results: labels.includes(config.override.label) ? [] : results
    };
    await publishEvaluation(octokit, owner, repo, evaluation, config);
    return;
  }

  if (context.payload.issue && !context.payload.issue.pull_request) {
    const issue = context.payload.issue;
    const labels = (issue.labels ?? []).map((label: { name: string }) => label.name);
    const results = evaluateIssue({ title: issue.title ?? "", body: issue.body ?? "" }, config);
    const evaluation: Evaluation = {
      kind: "issue",
      number: issue.number,
      results: labels.includes(config.override.label) ? [] : results
    };
    await publishEvaluation(octokit, owner, repo, evaluation, config);
    return;
  }

  core.info("pr-airlock only handles pull_request_target and issues events.");
}

async function loadRemoteConfig(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  path: string
): Promise<AirlockConfig> {
  try {
    const response = await octokit.rest.repos.getContent({ owner, repo, path });
    if (Array.isArray(response.data) || response.data.type !== "file") {
      return loadConfig(undefined);
    }
    const content = Buffer.from(response.data.content, "base64").toString("utf8");
    return loadConfig(content);
  } catch (error) {
    core.info(`No pr-airlock config found at ${path}; using lenient silent defaults.`);
    return loadConfig(undefined);
  }
}

async function listPullRequestFiles(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  pull_number: number
): Promise<ChangedFile[]> {
  const files = await octokit.paginate(octokit.rest.pulls.listFiles, {
    owner,
    repo,
    pull_number,
    per_page: 100
  });
  return files.map((file) => ({
    filename: file.filename,
    additions: file.additions,
    deletions: file.deletions,
    changes: file.changes,
    status: file.status
  }));
}

async function publishEvaluation(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  evaluation: Evaluation,
  config: AirlockConfig
): Promise<void> {
  const failingLabels = new Set(evaluation.results.filter((result) => !result.passed).map((result) => result.label));
  const managedLabels = new Set([
    config.labels.missing_issue_link,
    config.labels.missing_tests,
    config.labels.missing_repro,
    config.labels.missing_scope,
    config.labels.missing_risk_note,
    config.labels.needs_human_ack,
    config.labels.ready
  ]);

  if (evaluation.results.length === 0) {
    await syncLabels(octokit, owner, repo, evaluation.number, managedLabels, new Set());
    await deleteAirlockComment(octokit, owner, repo, evaluation.number);
    return;
  }

  if (failingLabels.size === 0 && evaluation.results.length > 0) {
    failingLabels.add(config.labels.ready);
  }

  await syncLabels(octokit, owner, repo, evaluation.number, managedLabels, failingLabels);
  await upsertComment(octokit, owner, repo, evaluation.number, renderComment(evaluation));
}

async function syncLabels(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  issue_number: number,
  managedLabels: Set<string>,
  desiredLabels: Set<string>
): Promise<void> {
  const current = await octokit.paginate(octokit.rest.issues.listLabelsOnIssue, {
    owner,
    repo,
    issue_number,
    per_page: 100
  });
  const currentNames = new Set(current.map((label) => label.name));

  const toAdd = [...desiredLabels].filter((label) => !currentNames.has(label));
  if (toAdd.length > 0) {
    await octokit.rest.issues.addLabels({ owner, repo, issue_number, labels: toAdd });
  }

  const toRemove = [...managedLabels].filter((label) => currentNames.has(label) && !desiredLabels.has(label));
  for (const label of toRemove) {
    try {
      await octokit.rest.issues.removeLabel({ owner, repo, issue_number, name: label });
    } catch {
      core.debug(`Label ${label} was already absent.`);
    }
  }
}

async function upsertComment(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  issue_number: number,
  body: string
): Promise<void> {
  const comments = await octokit.paginate(octokit.rest.issues.listComments, {
    owner,
    repo,
    issue_number,
    per_page: 100
  });
  const existing = comments.find((comment) => comment.body?.includes(COMMENT_MARKER));
  if (existing) {
    await octokit.rest.issues.updateComment({ owner, repo, comment_id: existing.id, body });
    return;
  }
  await octokit.rest.issues.createComment({ owner, repo, issue_number, body });
}

async function deleteAirlockComment(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  issue_number: number
): Promise<void> {
  const comments = await octokit.paginate(octokit.rest.issues.listComments, {
    owner,
    repo,
    issue_number,
    per_page: 100
  });
  const existing = comments.find((comment) => comment.body?.includes(COMMENT_MARKER));
  if (!existing) {
    return;
  }
  await octokit.rest.issues.deleteComment({ owner, repo, comment_id: existing.id });
}

run().catch((error: unknown) => {
  core.setFailed(error instanceof Error ? error.message : String(error));
});
