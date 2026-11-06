# Snake factory

A browser snake game in React and TypeScript. Claude agents build it one feature a day:
a product-owner agent writes `docs/features/FEAT-NNN.md`, and an implementer agent builds it.
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
GitHub enforces this: `main` needs a PR and a green `ci` check, also for admins.

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
  Claude closes the issue, not GitHub.

## Merge with squash only

- Merge only when the user asks, or when you run as the feature pipeline (see below).
- Wait until the required checks pass: `gh pr checks <pr> --required --watch`.
  `main` refuses a merge before that. Other checks, such as the Claude review, do not block it.
- Use a squash merge. Use the PR title as the commit subject and no body:
  `gh pr merge <pr> --squash --delete-branch --subject "<PR title>" --body ""`
- Do not use a merge commit or a rebase merge.
- After the merge, update the local `main`: `git switch main && git pull`.

## Close the issue after the merge

- Confirm that the merge is done: `gh pr view <pr> --json state` must show `MERGED`.
- Close the issue that the PR refers to, with a comment that names the PR:
  `gh issue close <issue> --comment "Done in #<pr>."`
- If the merge fails, do not close the issue.
- If you find a merged PR whose issue is still open (for example, the user merged it
  on GitHub), close the issue in the same way.

# Feature pipeline

- Every day at 06:00 UTC, `.github/workflows/feature-factory.yml` runs the product owner
  (`/propose-feature`) and then the implementer (`/implement-feature`).
- `.github/workflows/feature-listener.yml` runs the implementer when a human adds a FEAT file
  to `main`. A human who writes a FEAT file first opens its issue, as the product owner does:
  the label `feature` and the title `FEAT-NNN: <title>`.
- Every day at 10:00 UTC, `.github/workflows/design-review.yml` runs the designer
  (`/review-design`) and then the fixer (`/fix-ux-bug`). The designer plays the live game and
  files the most severe UI/UX bug as an issue with the label `ux-bug`. The fixer fixes the oldest
  open `ux-bug` issue, merges the fix and closes the issue, or closes it as not planned.
- Work in progress is one `ux-bug` issue. The designer files nothing while one is open.
- Each FEAT file has one issue with the label `feature`. The issue state is the feature state.
- Work in progress is one feature. The product owner proposes nothing while a `feature` issue
  is open.
- The owner allows the pipeline to merge its own PRs when all checks pass.
- The label `needs-human` means that the pipeline stopped on that issue. The pipeline does not
  touch that issue again. A human removes the label or closes the issue.
- In the pipeline, do not change `.github/`, `CLAUDE.md`, `.claude/` or an existing FEAT file.
  If such a change is necessary, say so in a comment on the issue.

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
