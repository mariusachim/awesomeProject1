# FEAT-002: Pause and resume

Issue: #26

## Story

As a player, I want to pause and resume the game, so that I can take a break without losing the run.

## Acceptance criteria

- Given the game is running, when the player presses Space or P, then the snake stops moving and the player sees a "Paused" message.
- Given the game is paused, when the player presses Space or P again, then the "Paused" message disappears and the snake moves again from where it stopped.
- Given the game is running, when the player activates the "Pause" button, then the game pauses and the button reads "Resume"; when the player activates "Resume", then the game runs again.
- Given the game is paused, when time passes, then the snake, the food and the score stay the same.
- Given the game is paused, when the player presses an arrow key or W, A, S, D, then the snake does not turn: after resume it still moves in its earlier direction.
- Given the game is over, when the player presses Space or P, then nothing changes and no "Paused" message appears.
- Given a new game starts after a game over, when the player looks at the page, then the game is running and not paused.

## Out of scope

- Pausing when the browser tab loses focus, a countdown on resume, sound and touch controls.

## Safety

Runs only in the browser. No network, no new dependency, no asset from another origin.
