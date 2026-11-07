# FEAT-007: Wrap-around walls mode

Issue: #63

## Story

As a player, I want a mode where the snake passes through a wall and comes out on the opposite side, so that I can play a more relaxed game where only my own body can end the run.

## Acceptance criteria

- Given a new game in the default mode, when I look at the controls, then I see a button labelled "Walls: solid".
- Given the default mode, when the snake moves into a wall, then the game is over (as today).
- Given the default mode, when I press the mode button, then its label changes to "Walls: wrap" and a new game starts with score 0.
- Given the wrap mode and the snake head at the right edge moving right, when the next tick happens, then the head appears in the leftmost column of the same row and the game keeps running.
- Given the wrap mode, when the snake crosses the top, bottom or left edge, then the head appears on the opposite edge in the same column or row and the game keeps running.
- Given the wrap mode, when the snake moves into its own body, then the game is over.
- Given the wrap mode, when I press the mode button again, then the label returns to "Walls: solid" and a new game starts.
- Given the mode button has focus, when I press Space or Enter, then it toggles the mode once and the game is not paused by the same key press.
- Given the game is over, when I press restart, then the new game keeps the mode I chose.

## Out of scope

- Saving the chosen mode in `localStorage`.
- A separate high score for each mode: the high score stays shared.
- Drawing a special border for the wrap mode.

## Safety

Runs only in the browser. No network, no new dependency, no asset from another origin.
