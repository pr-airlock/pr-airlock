# Security Policy

## Supported Versions

Security fixes are released for the latest `v0` tag and the latest `v0.x.y` release.

## Reporting a Vulnerability

Please do not open a public issue for security-sensitive reports.

Report vulnerabilities through GitHub's private vulnerability reporting for this repository when available. If that is not available, contact the maintainers through the contact information listed on the `pr-airlock` GitHub organization profile.

Include:

- affected version or commit SHA;
- workflow configuration;
- a minimal reproduction;
- expected and actual behavior;
- whether the issue requires `pull_request_target`, issue events, or label/comment permissions.

## Threat Model

`pr-airlock` is designed for GitHub workflows that read untrusted pull request and issue text.

The action is intended to:

- avoid checking out contributor pull request code;
- avoid executing contributor code;
- avoid sending untrusted PR or issue text to an LLM;
- use deterministic checks that cannot be prompt-injected;
- require only `contents: read`, `pull-requests: write`, and `issues: write`;
- keep direct runtime dependencies small and pinned;
- publish a committed `dist/` bundle that can be reproduced from source.

Residual risk remains:

- the action itself and its dependencies are part of the supply chain;
- the workflow token can write labels and comments;
- maintainers can misconfigure workflows, for example by checking out PR head code in a privileged `pull_request_target` workflow.

Consumers should pin production workflows to a release tag or commit SHA and avoid adding checkout or code execution steps before or after `pr-airlock` in privileged workflows.
