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
  const preset = normalizePreset(parsed.preset);
  const presetConfig = applyPreset(defaultConfig, preset);
  return mergeConfig(presetConfig, parsed);
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
