# FEAT-016: Restart with the R key

Issue: #119

## Story

As a player, I want to press R to start a new game at any time, so that I can try again quickly without
dying first or reaching for the mouse.

## Acceptance criteria

- Given a game is running, when the player presses R (upper or lower case), then a new game starts: the
  score is 0, the snake has its start length and the speed is level 1.
- Given a game is paused, when the player presses R, then a new game starts and the pause overlay is gone.
- Given the game is over, when the player presses R, then a new game starts, as with Enter.
- Given the game is waiting for the first key, when the player presses R, then nothing changes.
- Given the player chose the wrap-around walls mode, when the player restarts with R, then the new game
  keeps that mode.
- Given the player restarts with R, when the new game starts, then the high score stays as it was.
- Given a restart with R, when the new game starts, then it begins in the same state as a restart after
  game over (FEAT-008).
- The restart rule is a pure function in `game.ts`, which unit tests check directly.

## Out of scope

- A confirmation question before the restart.
- A visible hint for the R key.
- A sound for the restart.

## Safety

Runs only in the browser. No network, no new dependency, no asset from another origin.
