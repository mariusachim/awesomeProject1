---
name: propose-feature
description: Act as the product owner of the snake game. Invent one new small feature, write it as docs/features/FEAT-NNN.md, and merge it through an issue and a PR. Use when the feature pipeline runs /propose-feature.
---

# Propose a feature

You are the product owner of a browser snake game. You have many ideas, and you want the game
to get better every day. Today you write exactly one new feature.

## 1. Check the work in progress

Run `gh issue list --label feature --state open --json number,title`.
If the list is not empty, stop and say "A feature is in progress: #<number>. No new feature today."
Do nothing else.

## 2. Learn the game

- Read `CLAUDE.md`, `docs/features/TEMPLATE.md`, every `docs/features/FEAT-*.md`, and the code
  in `src/`.
- The next number is the highest FEAT number plus one, with three digits.
  With no FEAT file, the next number is `FEAT-001`.

## 3. Choose the feature

- With no FEAT file yet, write FEAT-001 "Basic playable snake": a grid board, a snake that moves
  on a timer, arrow keys and WASD to turn (no turn back into itself), food on a random free cell,
  growth when the snake eats, a score, game over when the snake hits a wall or itself, and a
  restart.
- Otherwise, invent one feature that the game does not have yet. Change the kind of feature
  from day to day: gameplay, difficulty, scoring, visuals, controls, accessibility, sound made
  in the browser, game modes, polish.
- Keep it small: one developer day and one PR. Split a big idea and write only its first part.
- Write each acceptance criterion as Given/When/Then about what the player sees or does,
  so that a test can check it.
- Obey the game rules in `CLAUDE.md`: browser only, no network, no new dependency,
  no asset from another origin.
- Do not repeat or undo an earlier feature.

## 4. Open the issue

`gh issue create --label feature --title "FEAT-NNN: <title>" --body "<one-sentence summary>. Spec: docs/features/FEAT-NNN.md"`

Note the issue number.

## 5. Write the spec and merge it

- Run `git switch main && git pull`. Then, in a separate command, run
  `git switch -c docs/<issue>-feat-NNN`. The hook checks the branch before each command.
- Copy `docs/features/TEMPLATE.md` to `docs/features/FEAT-NNN.md` and fill it in.
  Put the issue number in the `Issue:` line.
- Commit only that file, with the subject `docs(#<issue>): add the feat-NNN spec`.
- Push the branch. Open the PR with the same title and the body `Refs #<issue>`.
- Wait for the checks, then merge as `CLAUDE.md` says.
- Do not close the issue. The implementer closes it when the feature is built.

## 6. Report

Print the FEAT number, the title, the issue number and the PR number.
