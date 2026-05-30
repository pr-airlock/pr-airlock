export type PresetName = "lenient" | "recommended" | "strict";

export interface AirlockConfig {
  preset: PresetName;
  override: {
    label: string;
  };
  pull_requests: {
    require_issue_link: boolean;
    require_tests_for_code_changes: boolean;
    require_scope_for_large_prs: boolean;
    require_risk_note: boolean;
    require_human_ack: boolean;
    source_paths: string[];
    test_paths: string[];
    docs_paths: string[];
  };
  issues: {
    require_structured_bug_fields: boolean;
    bug_form_ids: string[];
    required_bug_field_ids: string[];
  };
  large_pr: {
    files: number;
    lines: number;
    exclude: string[];
  };
  labels: {
    missing_issue_link: string;
    missing_tests: string;
    missing_repro: string;
    missing_scope: string;
    missing_risk_note: string;
    needs_human_ack: string;
    ready: string;
  };
  comments: {
    mode: "sticky";
    tone: "neutral";
  };
}

export interface ChangedFile {
  filename: string;
  additions: number;
  deletions: number;
  changes: number;
  status?: string;
}

export interface CheckResult {
  id: string;
  label: string;
  title: string;
  details: string;
  passed: boolean;
}

export interface Evaluation {
  kind: "pull_request" | "issue";
  number: number;
  results: CheckResult[];
}
