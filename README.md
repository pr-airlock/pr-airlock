# pr-airlock

Config-only intake policy for GitHub pull requests and issue forms.

`pr-airlock` helps maintainers get reviewable contributions through a clear intake contract. It checks the metadata contributors already provide, leaves one friendly sticky comment when something is missing, and keeps labels in sync as the PR or issue is updated.

No model. No checkout. No API key.

## Why

Maintainers should not have to spend review time discovering that a PR has no linked context, no test plan, or no explanation for a large diff.

`pr-airlock` does not judge code quality and does not try to detect whether a contribution was AI-assisted. It only answers an earlier question:

> Is this contribution ready for maintainer attention?

## Quick Start

Add a workflow:

```yaml
name: PR Airlock

on:
  pull_request_target:
    types: [opened, edited, synchronize, reopened, labeled, unlabeled]
  issues:
    types: [opened, edited, labeled, unlabeled]

permissions:
  contents: read
  pull-requests: write
  issues: write

jobs:
  airlock:
    runs-on: ubuntu-latest
    steps:
      - uses: pr-airlock/pr-airlock@v0
        with:
          config: .github/pr-airlock.yml
```

Then add `.github/pr-airlock.yml`:

```yaml
preset: lenient
```

`lenient` is intentionally silent. `pr-airlock` does nothing until you choose a policy.

## Presets

```yaml
preset: lenient
```

Quiet by default. No checks are enabled. Use this when you want to install the action first and turn policies on deliberately.

```yaml
preset: recommended
```

Enables low-noise checks:

- large PRs need a short scope explanation;
- structured bug issue forms need required fields filled.

```yaml
preset: strict
```

Enables all built-in checks:

- linked issue or explicit exception;
- tests or explanation for source changes;
- scope explanation for large PRs;
- structured bug report fields;
- risk note;
- human review acknowledgement.

## Example Policy

```yaml
preset: recommended

override:
  label: "airlock:override"

pull_requests:
  require_issue_link: false
  require_tests_for_code_changes: true
  require_scope_for_large_prs: true
  source_paths:
    - "src/**"
    - "packages/**"
  test_paths:
    - "tests/**"
    - "**/*.test.*"
  docs_paths:
    - "docs/**"
    - "**/*.md"

issues:
  require_structured_bug_fields: true
  bug_form_ids:
    - "bug_report"
  required_bug_field_ids:
    - "reproduction"
    - "expected"
    - "actual"
    - "version"

large_pr:
  files: 30
  lines: 1000
  exclude:
    - "**/*lock*"
    - "**/dist/**"
    - "**/vendor/**"
    - "**/*.generated.*"

labels:
  missing_issue_link: "needs-issue-link"
  missing_tests: "needs-tests"
  missing_repro: "needs-repro"
  missing_scope: "needs-scope"
  missing_risk_note: "needs-risk-note"
  needs_human_ack: "needs-human-review"
  ready: "ready-for-review"
```

## Contributor Experience

When a check fails, `pr-airlock` posts one sticky comment and updates it on later runs:

```md
### PR Airlock

This PR is not ready for maintainer review yet.

- **Tests or explanation**: Add or update tests, or include a short explanation of why tests are not needed.

A maintainer can override this gate by applying the `airlock:override` label.
```

No auto-close. No accusations. No "AI slop" language.

## Security Model

`pr-airlock` is designed for privileged GitHub workflows that read untrusted PR and issue text.

- It does not check out contributor code.
- It does not execute contributor code.
- It does not send PR titles, descriptions, issue bodies, or comments to an LLM.
- It uses deterministic checks, so PR text cannot prompt-inject the checker.
- It requires only `contents: read`, `pull-requests: write`, and `issues: write`.
- Direct runtime dependencies are intentionally small and pinned.

Residual risk remains: every GitHub Action has supply-chain risk through its own code and dependencies, and the workflow token can write labels/comments. Keep the action pinned to a release tag or commit SHA in production.

## Why Not Danger?

[Danger](https://danger.systems/js/) is powerful when you want custom JavaScript or Ruby rules in CI.

`pr-airlock` is narrower:

- YAML config instead of custom rule code;
- no checkout needed;
- no execution of PR code;
- built for `pull_request_target` metadata checks;
- covers issue forms as well as PRs;
- ships a default sticky comment and label UX.

Use Danger when you need a programmable CI rule engine. Use `pr-airlock` when you want a safe, boring intake contract.

## Why Not AI Triage?

AI review and triage tools can be useful, but they add model cost, output noise, and prompt-injection surface area.

`pr-airlock` does not summarize, review, grade, or classify contributions. It only checks whether required intake fields are present.

## Maintainer Override

Apply the label configured at `override.label` to bypass all gates:

```yaml
override:
  label: "airlock:override"
```

The override survives new commits and edits until a maintainer removes the label.

## License

MIT
