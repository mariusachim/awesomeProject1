# Snake factory

A browser snake game in React and TypeScript. Claude agents build it one feature at a time:
a product-owner agent files a `feature` issue whose body is the spec, and an implementer agent
builds it.
The game is live at https://mariusachim.github.io/awesomeProject1/.

## Commands

- `npm ci` installs the exact dependencies.
- `npm run dev` starts the game at http://localhost:5173/awesomeProject1/.
- `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` are the checks.
  CI runs them on each PR, and `main` accepts a PR only when they pass.

## Commit rules

- Write the subject as `<type>(#<issue>): <description>`, for example `feat(#12): add a pause key`.
- Use one of these types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`,
  `ci`, `chore`, `revert`.
- Every commit references the GitHub issue it belongs to. Do not invent an issue number.
- Write the description in the imperative mood and in lower case, with no full stop.
  Keep the subject to 72 characters or fewer.
- Add a body only when the change needs an explanation, and then keep it to 1-3 lines.
- Do not add a `Co-Authored-By` line, a "Generated with Claude Code" line, or any other trailer.
- Do not add attribution lines to PR descriptions.

# Git workflow

Every change goes through a pull request. Nothing goes to `main` directly.
GitHub enforces this: `main` needs a PR and green `ci` and `issue-closeout-check` checks,
also for admins.

## Never commit to `main`

- Do not commit on `main`. Do not push to `main`.
- Before the first commit of a change, create a branch from an up-to-date `main`:
  `git switch main && git pull && git switch -c <type>/<issue>-<short-slug>`,
  for example `fix/12-println-format`.
- If you are on `main` and have changes, move them to a new branch before you commit.

## Open a pull request

- Push the branch: `git push -u origin <branch>`.
- Open the pull request with `gh pr create`.
- Write the PR title in the commit format: `<type>(#<issue>): <description>`.
- Put `Refs #<issue>` in the PR body. Do not write `Closes`, `Fixes` or `Resolves`:
  the `issue-closeout` workflow closes the issue, not GitHub.

## Merge with squash only

- Merge only when the user asks, or when you run as the feature pipeline (see below).
- Wait until the required checks pass: `gh pr checks <pr> --required --watch`.
  `main` refuses a merge before that. Other checks, such as the Claude review, do not block it.
- Use a squash merge. Use the PR title as the commit subject and no body:
  `gh pr merge <pr> --squash --delete-branch --subject "<PR title>" --body ""`
- Do not use a merge commit or a rebase merge.
- After the merge, update the local `main`: `git switch main && git pull`.

## The workflow closes the issue

- Do not close the issue after the merge. The `issue-closeout` workflow does it: it posts the
  Effort and System Changes section of the PR on the issue and closes the issue.
- If you find a merged PR whose issue is still open, the closeout run failed. Find the run with
  `gh run list --workflow issue-closeout.yml` and run it again with `gh run rerun <run> --failed`.
  If there is no run, tell the user.

# Feature pipeline

- The GitHub scheduler does not start runs in this repo. Two Claude cloud routines start the
  pipelines with `gh workflow run`. Manage them at https://claude.ai/code/routines.
  - `Trigger feature-factory (snake factory)` (`trig_01Xbwcht7KFZKmwuWWCf9HrP`): `15 */2 * * *`.
  - `Trigger design-review (snake factory)` (`trig_01GnYp3KWb5Vjg1RMk7aNN7L`): `15 1-23/2 * * *`.
- Do not add a `schedule` trigger to these workflows. The routines already start them, and a
  second trigger starts each run twice.
- Every 2 hours at the even hours UTC (00:15, 02:15, ...), a routine starts
  `.github/workflows/feature-factory.yml`. It runs the product owner (`/propose-feature`) and
  then the implementer (`/implement-feature`).
- A human can also file a feature: open an issue with the Feature template
  (`.github/ISSUE_TEMPLATE/feature.md`) and add the label `feature`. The next feature-factory
  run builds it. The template adds no label, because the repo is public and the label is the
  only gate.
- Every 2 hours at the odd hours UTC (01:15, 03:15, ...), a routine starts
  `.github/workflows/design-review.yml`. It runs the designer (`/review-design`) and then the
  UX developer (`/improve-ux`). The designer plays the live game, looks for what makes it more
  pleasant for the player, and files one UI/UX improvement as an issue with the label
  `ux-improvement`. A broken behaviour comes first. The UX developer builds the oldest open
  `ux-improvement` issue and merges the PR, or closes the issue as not planned.
- Work in progress is one `ux-improvement` issue. The designer files nothing while one is open.
- The label `ux-bug` is the old label of the design review. Its issues are history.
- Each feature is one issue with the label `feature`. The issue body is the spec, and the issue
  state is the feature state. The issues FEAT-001 to FEAT-028 carry their old number in the title.
- Work in progress is one feature. The product owner proposes nothing while a `feature` issue
  is open.
- The owner allows the pipeline to merge its own PRs when all checks pass.
- The label `needs-human` means that the pipeline stopped on that issue. The pipeline does not
  touch that issue again. A human removes the label or closes the issue.
- In the pipeline, do not change `.github/`, `CLAUDE.md`, `.claude/` or the body of a feature
  issue.
  If such a change is necessary, say so in a comment on the issue.

# Agent monitoring

- Each Claude step in `.github/workflows/` sends OpenTelemetry metrics and events to Grafana Cloud
  (free plan): prompts, replies, tool calls, tokens and cost. There is no proxy.
- The repo secrets `OTEL_EXPORTER_OTLP_ENDPOINT` and `OTEL_EXPORTER_OTLP_HEADERS` hold the
  destination. Copy both from the OpenTelemetry tile in Grafana Cloud. Without them, telemetry is off.
- Filter one run with the attributes `github.job` and `github.run_id`.

# Game rules: read-only safe

- The game runs only in the browser. No backend, no server calls, no secrets, no tracking.
- Do not use `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `navigator.sendBeacon`,
  `eval`, `new Function` or `dangerouslySetInnerHTML`. Lint rejects most of them, and the
  production CSP blocks all network access.
- Do not load anything from another origin: no CDN scripts, fonts or images.
- `localStorage` is the only storage. Use it only for game data, such as a high score.
- Do not add a dependency. CI accepts only the packages on the allowlist in
  `.github/workflows/ci.yml`, and only a human changes that list.

# Tests

- In each unit test, mark the three sections with a comment line: `// given`, `// when`,
  `// then`. If the action and the assertion are one statement, write `// when / then`.
- Put the game rules in pure functions and test them directly.
- Test components through what the player sees, with Testing Library.
