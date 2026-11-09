# FEAT-027: Bonus food slows the snake

Issue: #174

## Story

As a player, I want the snake to slow down for a few moves after I eat a bonus food, so that the bonus is a real reward and gives me a moment to plan.

## Acceptance criteria

- Given a running game, when the snake eats a bonus food, then the next 10 moves take the normal interval of the current score multiplied by 1.5.
- Given the slow-down is active, when 10 moves have passed, then the interval returns to the normal interval of the current score.
- Given the slow-down is active, when the snake eats a normal food, then the score rises and the slow-down keeps counting down; it does not restart.
- Given the slow-down is active, when the snake eats another bonus food, then the slow-down restarts at 10 moves.
- Given the slow-down is active, when the player sees the speed level, then the level still shows the level of the score and does not change.
- Given the game is over or a new game starts, when the game restarts, then no slow-down is active.
- Given the game is paused, when the player resumes, then the remaining slow-down moves are kept.

## Out of scope

- A new sound, animation or message for the slow-down.
- Changing the bonus points, the bonus rate or the bonus countdown.

## Safety

Runs only in the browser. No network, no new dependency, no asset from another origin.
