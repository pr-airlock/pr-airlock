import YAML from "yaml";
import type { AirlockConfig, PresetName } from "./types.js";

const defaultConfig: AirlockConfig = {
  preset: "lenient",
  override: {
    label: "airlock:override"
  },
  pull_requests: {
    require_issue_link: false,
    require_tests_for_code_changes: false,
    require_scope_for_large_prs: false,
    require_risk_note: false,
    require_human_ack: false,
    source_paths: ["src/**", "lib/**", "app/**", "packages/**"],
    test_paths: ["test/**", "tests/**", "__tests__/**", "spec/**", "**/*.test.*", "**/*.spec.*"],
    docs_paths: ["docs/**", "**/*.md", "**/*.mdx"]
  },
  issues: {
    require_structured_bug_fields: false,
    bug_form_ids: ["bug_report"],
    required_bug_field_ids: ["reproduction", "expected", "actual", "version"]
  },
  large_pr: {
    files: 30,
    lines: 1000,
    exclude: [
      "**/*lock*",
      "**/dist/**",
      "**/vendor/**",
      "**/*.generated.*",
      "**/*.min.*",
      "**/fixtures/**"
    ]
  },
  labels: {
    missing_issue_link: "needs-issue-link",
    missing_tests: "needs-tests",
    missing_repro: "needs-repro",
    missing_scope: "needs-scope",
    missing_risk_note: "needs-risk-note",
    needs_human_ack: "needs-human-review",
    ready: "ready-for-review"
  },
  comments: {
    mode: "sticky",
    tone: "neutral"
  }
};

const recommendedOverrides: Partial<AirlockConfig> = {
  pull_requests: {
    ...defaultConfig.pull_requests,
    require_scope_for_large_prs: true
  },
  issues: {
    ...defaultConfig.issues,
    require_structured_bug_fields: true
  }
};

const strictOverrides: Partial<AirlockConfig> = {
  pull_requests: {
    ...defaultConfig.pull_requests,
    require_issue_link: true,
    require_tests_for_code_changes: true,
    require_scope_for_large_prs: true,
    require_risk_note: true,
    require_human_ack: true
  },
  issues: {
    ...defaultConfig.issues,
    require_structured_bug_fields: true
  }
};

export function loadConfig(source: string | undefined): AirlockConfig {
  const parsed = source?.trim() ? YAML.parse(source) ?? {} : {};
  validateRawConfig(parsed);
  const preset = normalizePreset(parsed.preset);
  const presetConfig = applyPreset(defaultConfig, preset);
  return mergeConfig(presetConfig, parsed);
}

function validateRawConfig(value: unknown): asserts value is Partial<AirlockConfig> {
  if (!isRecord(value)) {
    throw new Error("pr-airlock config must be a YAML object.");
  }

  const preset = value.preset;
  if (preset !== undefined && preset !== "lenient" && preset !== "recommended" && preset !== "strict") {
    throw new Error("pr-airlock config field `preset` must be one of: lenient, recommended, strict.");
  }

  validateObject(value.override, "override");
  validateObject(value.pull_requests, "pull_requests");
  validateObject(value.issues, "issues");
  validateObject(value.large_pr, "large_pr");
  validateObject(value.labels, "labels");
  validateObject(value.comments, "comments");

  validateBoolean(value.pull_requests, "pull_requests", "require_issue_link");
  validateBoolean(value.pull_requests, "pull_requests", "require_tests_for_code_changes");
  validateBoolean(value.pull_requests, "pull_requests", "require_scope_for_large_prs");
  validateBoolean(value.pull_requests, "pull_requests", "require_risk_note");
  validateBoolean(value.pull_requests, "pull_requests", "require_human_ack");
  validateStringArray(value.pull_requests, "pull_requests", "source_paths");
  validateStringArray(value.pull_requests, "pull_requests", "test_paths");
  validateStringArray(value.pull_requests, "pull_requests", "docs_paths");

  validateBoolean(value.issues, "issues", "require_structured_bug_fields");
  validateStringArray(value.issues, "issues", "bug_form_ids");
  validateStringArray(value.issues, "issues", "required_bug_field_ids");

  validateNumber(value.large_pr, "large_pr", "files");
  validateNumber(value.large_pr, "large_pr", "lines");
  validateStringArray(value.large_pr, "large_pr", "exclude");

  validateString(value.override, "override", "label");
  for (const key of [
    "missing_issue_link",
    "missing_tests",
    "missing_repro",
    "missing_scope",
    "missing_risk_note",
    "needs_human_ack",
    "ready"
  ]) {
    validateString(value.labels, "labels", key);
  }
}

function validateObject(value: unknown, path: string): void {
  if (value !== undefined && !isRecord(value)) {
    throw new Error(`pr-airlock config field \`${path}\` must be an object.`);
  }
}

function validateBoolean(parent: unknown, path: string, key: string): void {
  if (!isRecord(parent) || parent[key] === undefined) {
    return;
  }
  if (typeof parent[key] !== "boolean") {
    throw new Error(`pr-airlock config field \`${path}.${key}\` must be a boolean.`);
  }
}

function validateNumber(parent: unknown, path: string, key: string): void {
  if (!isRecord(parent) || parent[key] === undefined) {
    return;
  }
  if (typeof parent[key] !== "number" || !Number.isFinite(parent[key]) || parent[key] < 0) {
    throw new Error(`pr-airlock config field \`${path}.${key}\` must be a non-negative number.`);
  }
}

function validateString(parent: unknown, path: string, key: string): void {
  if (!isRecord(parent) || parent[key] === undefined) {
    return;
  }
  if (typeof parent[key] !== "string" || parent[key].trim() === "") {
    throw new Error(`pr-airlock config field \`${path}.${key}\` must be a non-empty string.`);
  }
}

function validateStringArray(parent: unknown, path: string, key: string): void {
  if (!isRecord(parent) || parent[key] === undefined) {
    return;
  }
  if (!Array.isArray(parent[key]) || !parent[key].every((item) => typeof item === "string" && item.trim() !== "")) {
    throw new Error(`pr-airlock config field \`${path}.${key}\` must be an array of non-empty strings.`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizePreset(value: unknown): PresetName {
  if (value === "recommended" || value === "strict" || value === "lenient") {
    return value;
  }
  return "lenient";
}

function applyPreset(base: AirlockConfig, preset: PresetName): AirlockConfig {
  if (preset === "recommended") {
    return mergeConfig(base, { preset, ...recommendedOverrides });
  }
  if (preset === "strict") {
    return mergeConfig(base, { preset, ...strictOverrides });
  }
  return mergeConfig(base, { preset });
}

function mergeConfig(base: AirlockConfig, override: Partial<AirlockConfig>): AirlockConfig {
  return {
    ...base,
    ...override,
    override: { ...base.override, ...override.override },
    pull_requests: { ...base.pull_requests, ...override.pull_requests },
    issues: { ...base.issues, ...override.issues },
    large_pr: { ...base.large_pr, ...override.large_pr },
    labels: { ...base.labels, ...override.labels },
    comments: { ...base.comments, ...override.comments }
  };
}

export { defaultConfig };
