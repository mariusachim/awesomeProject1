# FEAT-008: Wait for the first key to start

Issue: #68

## Story

As a player, I want the game to wait until I am ready, so that the snake does not move or crash before I have my hands on the keys.

## Acceptance criteria

- Given a new page load, when I look at the board, then I see the snake and the food, a message "Press an arrow key or WASD to start", and the snake does not move.
- Given the ready state, when several ticks pass, then the snake stays on the same cells and the score stays 0.
- Given the ready state, when I press an arrow key or a WASD key, then the game starts and the snake moves in the direction of that key on the next tick, and the ready message disappears.
- Given the ready state, when I press the key for the direction opposite to the snake's current heading, then the game starts and the snake keeps its current heading.
- Given the ready state, when I press Space or P, then nothing changes and the game stays in the ready state.
- Given the ready state, when I look at the controls, then the "Pause" button is disabled.
- Given the game is over, when I press restart, then the new game starts running at once without the ready state.
- Given I change the walls mode, when the new game begins, then it is in the ready state.

## Out of scope

- A countdown (3, 2, 1) before the start.
- A "Start" button.
- Saving anything in `localStorage`.

## Safety

Runs only in the browser. No network, no new dependency, no asset from another origin.
