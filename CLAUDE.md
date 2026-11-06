# Git workflow

These rules add to the commit rules in the global CLAUDE.md.
Every change goes through a pull request. Nothing goes to `main` directly.

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

- Merge only when the user asks.
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
