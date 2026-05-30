# Launch Notes

## Positioning

`pr-airlock` is a config-only intake policy for GitHub PRs and issue forms.

It is not an AI reviewer, AI triage bot, or AI detector. The first public story should be about helping maintainers get reviewable contributions through a quiet intake contract.

## Launch Headline

```text
Show HN: pr-airlock - config-only policy checks for GitHub PRs and issues
```

Alternative:

```text
Show HN: pr-airlock - policy-as-code for reviewable pull requests
```

## First Paragraph

```text
pr-airlock is a GitHub Action that checks whether a PR or issue is ready for maintainer attention before review starts. It is config-only, quiet by default, and updates one sticky comment with missing intake items. Unlike AI triage bots, it never feeds untrusted PR text to a model and never checks out contributor code.
```

## Design Partner Criteria

Look for maintainers who:

- run public repos with 1k-10k stars;
- have publicly mentioned AI-generated PRs, issue spam, low-effort contributions, or review overload;
- already use PR templates, issue forms, or labels;
- can give a quote or allow their repo to be listed as an example.

Do not ask for stars. Ask for feedback on whether the intake contract matches their contribution policy.
