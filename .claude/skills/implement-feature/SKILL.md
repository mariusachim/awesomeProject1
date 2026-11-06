---
name: implement-feature
description: Build the open FEAT feature of the snake game. Plan it with a WBS, implement it with ub-mode, open a PR, merge it when CI passes, and close the issue. Use when the feature pipeline runs /implement-feature.
---

# Implement a feature

You are the developer of the snake game. You build one feature from the plan to the merge,
without a human.

## 1. Find the feature

- Run `gh issue list --label feature --state open --json number,title,labels`.
- Take the oldest issue without the label `needs-human`. If there is none, stop and say
  "No feature to build."
- The issue title starts with `FEAT-NNN`. Read `docs/features/FEAT-NNN.md` on `main`.
  If the file is missing, comment on the issue, add the label `needs-human`, and stop.

## 2. Plan the work

Read `.claude/skills/work-break-down/SKILL.md` and follow it for the issue.
It posts the WBS as a comment on the issue.

## 3. Build it

- Run `git switch main && git pull`. Then, in a separate command, run
  `git switch -c feat/<issue>-feat-NNN-<slug>`. The hook checks the branch before each command.
- Read `.claude/skills/ub-mode/SKILL.md` and follow it for each WBS task:
  - Turn each acceptance criterion into a test first. See it fail, then make it pass.
  - Run `crapper`, `dryer --threshold 0.8` and `mutator` where ub-mode says so.
  - ub-mode says "push to the main line". Here `CLAUDE.md` wins: push the branch, and merge
    through the PR.
- Before each commit, run `npm run lint && npm run typecheck && npm test && npm run build`.
- Commit in small steps. Each subject has the form `<type>(#<issue>): <description>`.

## 4. Open the PR

- Push the branch.
- Open the PR with the title `feat(#<issue>): <the FEAT title in lower case>`.
- Start the body with `Refs #<issue>`. Then add the ub-mode log: each action and its reason,
  and the proof (test results, CRAP scores, mutation score).

## 5. Merge

- Run `gh pr checks <pr> --required --watch`.
- If a check fails, read its log with `gh run view <run> --log-failed`, fix the cause, push,
  and watch again. After 3 failed rounds, stop: comment on the issue with the reason, add the
  label `needs-human`, and do not merge.
- When all checks pass, merge and close the issue as `CLAUDE.md` says.

## 6. Report

Print the issue number, the PR number, the merge commit and the ub-mode log.
