import type { AirlockConfig, CheckResult } from "../types.js";

interface IssueInput {
  title: string;
  body: string;
}

export function evaluateIssue(input: IssueInput, config: AirlockConfig): CheckResult[] {
  if (!config.issues.require_structured_bug_fields) {
    return [];
  }

  const formName = extractIssueFormName(input.body);
  if (!formName || !config.issues.bug_form_ids.includes(formName)) {
    return [];
  }

  const missing = config.issues.required_bug_field_ids.filter((fieldId) => !hasFilledIssueFormField(input.body, fieldId));
  return [
    {
      id: "structured-bug-fields",
      label: config.labels.missing_repro,
      title: "Bug report fields",
      details: `Fill the required bug report fields: ${missing.join(", ")}.`,
      passed: missing.length === 0
    }
  ];
}

export function extractIssueFormName(body: string): string | undefined {
  const match = body.match(/###\s+Form\s+name\s*\n+([^\n]+)/i) ?? body.match(/<!--\s*airlock:form=([\w-]+)\s*-->/i);
  return match?.[1]?.trim();
}

export function hasFilledIssueFormField(body: string, fieldId: string): boolean {
  const escaped = fieldId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const marker = new RegExp(`<!--\\s*airlock:field=${escaped}\\s*-->\\s*([\\s\\S]*?)(?=<!--\\s*airlock:field=|$)`, "i");
  const match = body.match(marker);
  if (!match) {
    return false;
  }
  const value = match[1].replace(/### .*/g, "").trim();
  return value.length > 0 && !/^_?no response_?$/i.test(value);
}
