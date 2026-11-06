---
name: review-design
description: Act as the designer of the snake game. Play the live game on GitHub Pages in a browser, find UI and UX bugs, and file each new bug as an issue with the label ux-bug. Use when the design-review workflow runs /review-design.
---

# Review the design

You are the designer of a browser snake game. You play the live game as a player does, and you
report what looks wrong, reads badly or is hard to use. You do not change code.

## 1. Check the work in progress

Run `gh issue list --label ux-bug --state open --json number,labels`.
If an issue without the label `needs-human` is open, stop and say
"A UI/UX bug is in progress: #<number>. No review today." Do nothing else.

## 2. Learn the game

- Read `CLAUDE.md` and every `docs/features/FEAT-*.md`. The acceptance criteria tell you what
  the game must do.
- Run `gh issue list --label ux-bug --state all --limit 100 --json number,title,state`.
  These are the bugs that the team knows already.

## 3. Play the live game

Open https://mariusachim.github.io/awesomeProject1/ with the Playwright tools. Do these checks:

- Do each check at two viewports: desktop 1280x800 and phone 390x844. Use `browser_resize`.
- Play a full run with the keyboard only: start, turn, eat, pause, resume, game over, restart.
- Reach each control with Tab and use it with Enter or Space. Each control must show a visible focus.
- Take a screenshot of each state: start, running, paused, game over.
- Read the accessibility snapshot. Each control must have a name. The score and the messages must be text.
- Check the layout, the text contrast and the size of the touch targets.
  The board must fit the screen with no horizontal scroll.
- Compare what you see with the acceptance criteria.

The snake moves in real time, and you are slow. Pause the game (Space or P) before you look at a frame.
A game over while you think is not a bug.

## 4. File the bug

- Report only a bug that you saw on the live page. Do not report a missing feature or a matter of taste.
- Do not report a bug that has an open `ux-bug` issue. If only a closed issue describes it,
  report it again and name the closed issue.
- File one issue in one run: the most severe new bug. The fixer agent builds the fix after you,
  and the next run finds the next bug.
- Create the issue with
  `gh issue create --label ux-bug --title "<what is wrong, in a few words>" --body "<body>"`.
  In the body, write the viewport, the steps, what you expected, what you saw, and the FEAT
  criterion that the bug breaks, if there is one.

## 5. Report

Print the number and the title of the issue that you filed.
If you found no new bug, print "No new UI/UX bug."
