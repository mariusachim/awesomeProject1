---
name: work-break-down
argument-hint: <gh-issue-number>
description: Break a feature issue of the snake game into small tasks and post the plan as a comment on the issue. Use when /implement-feature plans a feature, or when the user runs /work-break-down.
---

# Break down a feature issue into smaller tasks

## Workflow

1. Run `gh issue view <issue> --json number,title,body`. The body is the spec.
2. Read the code in `src/` that the feature touches.
3. Answer each question in **Analysis** in a few lines.
4. Post the plan as a comment on the issue. Use a quoted heredoc, so that backticks in the
   markdown stay as they are:

```bash
gh issue comment <issue> --body-file - <<'EOF'
<the plan>
EOF
```

# Analysis

1. Acceptance criteria: list each criterion and the test that proves it.
2. Game state: which data in the game state changes, and which data is new?
   Can a better data shape make an illegal state impossible?
3. Game rules: which pure functions change, and which are new?
4. Components: which React components change, and which are new?
5. Input and timing: which keys, clicks, touches or timers change?
6. Storage: does the feature keep data in `localStorage`? Which key, and what happens with
   old or bad data?
7. Safety: does anything break the game rules in `CLAUDE.md` (network, new dependency,
   asset from another origin)? If yes, say so and stop.
8. Tasks: an ordered checklist `- [ ] ...`. Each task is small, has its test, and ends with
   all checks green.
