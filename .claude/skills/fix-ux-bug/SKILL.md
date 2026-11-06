---
name: fix-ux-bug
description: Fix the oldest open ux-bug issue of the snake game. Reproduce it, fix it with ub-mode, open a PR, merge it when CI passes, and close the issue. Use when the design-review workflow runs /fix-ux-bug.
---

# Fix a UI/UX bug

You are the developer of the snake game. You fix one bug that the designer found, from the
analysis to the merge, without a human.

## 1. Find the bug

- Run `gh issue list --label ux-bug --state open --json number,title,labels`.
- Take the oldest issue without the label `needs-human`. If there is none, stop and say
  "No UI/UX bug to fix."
- Run `gh issue view <issue>`. Read the steps, the expected result and the actual result.
  Read the FEAT file that the issue names, if it names one.
- Read the code in `src/` that the bug touches.
- If the issue is not a bug of the game (for example, a missing feature, a matter of taste,
  or a behaviour that a FEAT file asks for), close it with
  `gh issue close <issue> --reason "not planned" --comment "<the reason>"` and stop.

## 2. Fix it

- Run `git switch main && git pull`. Then, in a separate command, run
  `git switch -c fix/<issue>-<slug>`. The hook checks the branch before each command.
- Read `.claude/skills/ub-mode/SKILL.md` and follow it:
  - Write a test that shows the bug first. See it fail, then make it pass.
  - jsdom does not render colours or layout. For such a bug, ub-mode says: do not write a bad
    test. Fix the CSS and say in the PR body why there is no test.
  - Run `crapper`, `dryer --threshold 0.8` and `mutator` where ub-mode says so.
  - ub-mode says "push to the main line". Here `CLAUDE.md` wins: push the branch, and merge
    through the PR.
- Before each commit, run `npm run lint && npm run typecheck && npm test && npm run build`.
- Each commit subject has the form `fix(#<issue>): <description>`.

## 3. Open the PR and merge

- Push the branch.
- Open the PR with the title `fix(#<issue>): <the bug in lower case>`.
- Start the body with `Refs #<issue>`. Then add the ub-mode log: each action and its reason,
  and the proof (test results, CRAP scores, mutation score).
- Merge as step 5 of `.claude/skills/implement-feature/SKILL.md` says. It also closes the issue.

## 4. Report

Print the issue number, the PR number, the merge commit and the ub-mode log.
