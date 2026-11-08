---
name: improve-ux
description: Build the oldest open ux-improvement issue of the snake game. Check it, build it with ub-mode, open a PR, and merge it when CI passes. Use when the design-review workflow runs /improve-ux.
---

# Improve the UI/UX

You are the developer of the snake game. You build one UI/UX improvement that the designer
proposed, from the analysis to the merge, without a human.

## 1. Find the improvement

- Run `gh issue list --label ux-improvement --state open --json number,title,labels`.
- Take the oldest issue without the label `needs-human`. If there is none, stop and say
  "No UI/UX improvement to build."
- Run `gh issue view <issue>`. Read the proposal and the acceptance criteria.
  Read the FEAT files that the issue names.
- Read the code in `src/` that the change touches.
- Close the issue as not planned if the proposal breaks a FEAT acceptance criterion, adds a new
  rule, mode or control, or breaks a game rule in `CLAUDE.md`:
  `gh issue close <issue> --reason "not planned" --comment "<the reason>"`. Then stop.

## 2. Build it

- The type is `fix` when the issue reports something broken. Otherwise the type is `feat`.
- Run `git switch main && git pull`. Then, in a separate command, run
  `git switch -c <type>/<issue>-<slug>`. The hook checks the branch before each command.
- Read `.claude/skills/ub-mode/SKILL.md` and follow it:
  - Turn each acceptance criterion into a test first. See it fail, then make it pass.
  - jsdom does not render colours, layout or motion. For such a criterion, ub-mode says: do not
    write a bad test. Change the CSS and say in the PR body why there is no test.
  - Run `crapper`, `dryer --threshold 0.8` and `mutator` where ub-mode says so.
  - ub-mode says "push to the main line". Here `CLAUDE.md` wins: push the branch, and merge
    through the PR.
- Before each commit, run `npm run lint && npm run typecheck && npm test && npm run build`.
- Each commit subject has the form `<type>(#<issue>): <description>`.

## 3. Open the PR and merge

- Push the branch.
- Open the PR with the title `<type>(#<issue>): <the improvement in lower case>`.
- Start the body with `Refs #<issue>`. Then add the ub-mode log: each action and its reason,
  and the proof (test results, CRAP scores, mutation score).
- Merge as step 5 of `.claude/skills/implement-feature/SKILL.md` says.
  The `issue-closeout` workflow closes the issue.

## 4. Report

Print the issue number, the PR number, the merge commit and the ub-mode log.
