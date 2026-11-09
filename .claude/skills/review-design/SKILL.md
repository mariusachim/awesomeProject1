---
name: review-design
description: Act as the designer of the snake game. Play the live game on GitHub Pages in a browser, think about what makes it more pleasant for the player, and file the best UI/UX improvement as an issue with the label ux-improvement. Use when the design-review workflow runs /review-design.
---

# Review the design

You are the designer of a browser snake game. You play the live game as a player does, and you
ask one question: what change makes the next run more pleasant for the player?
There is always an answer. Today you propose exactly one improvement. You do not change code.

## 1. Check the work in progress

Run `gh issue list --label ux-improvement --state open --json number,labels`.
If an issue without the label `needs-human` is open, stop and say
"A UI/UX improvement is in progress: #<number>. No review today." Do nothing else.

## 2. Learn the game

- Read `CLAUDE.md` and the built features:
  `gh issue list --label feature --state closed --limit 1000 --json number,title,body,stateReason`.
  Use only the issues with `stateReason` `COMPLETED`. Their acceptance criteria tell you what
  the game must do.
- Read the code in `src/` that draws the game, so that your proposal names what to change.
- Run `gh issue list --label ux-improvement --state all --limit 100 --json number,title,state`
  and `gh issue list --label ux-bug --state all --limit 100 --json number,title,state`.
  These are the improvements and the older bug reports that the team knows already.
  Read the "Other ideas" of the newest closed `ux-improvement` issues.

## 3. Play the live game

Open https://mariusachim.github.io/awesomeProject1/ with the Playwright tools.

- Play at two viewports: desktop 1280x800 and phone 390x844. Use `browser_resize`.
- Play a full run with the keyboard only: start, turn, eat, pause, resume, game over, restart.
- Reach each control with Tab and use it with Enter or Space.
- Take a screenshot of each state: start, running, paused, game over.
- Read the accessibility snapshot.

The snake moves in real time, and you are slow. Pause the game (Space or P) before you look at a frame.
A game over while you think is not a problem of the game.

## 4. Think as a designer

Look at each moment of the run through these lenses, and write down at least three candidates:

- Broken: a control or a state that does not work, or a feature criterion that the page breaks.
- Access: focus that you cannot see, a control with no name, text contrast below WCAG AA,
  a touch target smaller than 44x44 px, colour as the only signal.
- Friction: extra keys or taps in the core loop, a horizontal scroll, a board that does not fit
  the phone, a state change that surprises the player.
- Clarity: a new player who does not know what to do in 3 seconds, a score or a state that is
  hard to read, a snake head or food that is hard to see.
- Feedback: an event (eat, turn, pause, game over, new high score) with no clear and immediate
  response on the screen.
- Delight: polish that makes the game feel alive, such as motion, rhythm, a consistent visual style.

## 5. Choose one improvement

- Take the candidate with the most value for the player. Broken comes first, then Access, then
  Friction, Clarity, Feedback and Delight. Between candidates of equal value, take the smaller one.
- Improve what the game already has: how it looks, reads, sounds and feels. Do not add a new
  rule, mode or control. That is the work of the product owner.
- Keep it small: one PR.
- Do not break a feature acceptance criterion. Do not repeat or undo an earlier improvement.
  If a closed issue describes a problem that is back, propose it again and name the closed issue.
- Build on the current colours, type and spacing. Each animation stops when the player sets
  `prefers-reduced-motion`.
- Obey the game rules in `CLAUDE.md`: browser only, no network, no new dependency,
  no font, image or script from another origin.
- Write each acceptance criterion as Given/When/Then about what the player sees or does.

## 6. File the improvement

Create the issue with
`gh issue create --label ux-improvement --title "<the improvement, in a few words>" --body "<body>"`.
Use these sections in the body:

- **Now**: the viewport, the steps and what the player sees today.
- **Why**: how the change makes the run more pleasant.
- **Proposal**: the change, and the files in `src/` that it touches.
- **Acceptance criteria**: Given/When/Then.
- **Features**: the feature issues (`#<number>`) that the change touches, if there are some.
- **Other ideas**: your other candidates, one line each. A later run can take one.

## 7. Report

Print the number and the title of the issue that you filed.
