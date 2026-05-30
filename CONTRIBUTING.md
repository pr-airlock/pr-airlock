# Contributing

Thanks for helping improve `pr-airlock`.

This repository dogfoods the action. If your PR receives an Airlock comment, treat it as a checklist rather than a rejection. A maintainer can override the gate with the `airlock:override` label.

Before opening a PR:

- Keep changes focused.
- Add or update tests when behavior changes.
- Explain why tests are not needed when they are not practical.
- Add a scope note for large changes.
- Do not submit unreviewed generated code.

## Development

```bash
npm install
npm test
npm run build
```

The action must not check out or execute untrusted pull request code.
