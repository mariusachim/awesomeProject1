# FEAT-004: Speed up as you eat

Issue: #48

## Story

As a player, I want the snake to move faster as my score grows, so that the game stays challenging the longer I play.

## Acceptance criteria

- Given a new game with score 0, when time passes, then the snake moves one cell every 200 ms.
- Given the snake eats food, when the score rises by 1, then the time between moves becomes 10 ms shorter than before.
- Given the score is high enough that the interval would fall below 80 ms, when the snake keeps eating, then the snake moves one cell every 80 ms and gets no faster.
- Given the game is paused, when the player resumes, then the snake keeps the speed that belongs to the current score.
- Given the game is over, when the player restarts, then the score is 0 and the snake moves one cell every 200 ms again.

## Out of scope

- A speed display, difficulty settings, sound and a different speed curve per level.

## Safety

Runs only in the browser. No network, no new dependency, no asset from another origin.
