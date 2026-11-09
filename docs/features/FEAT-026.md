# FEAT-026: Pop the score when eating

Issue: #170

## Story

As a player, I want the score to pop for a moment when I eat, so that I feel each point I earn.

## Acceptance criteria

- Given a running game, when the snake eats food and the score rises, then the score value shows a short pop animation (it grows briefly and returns to its normal size).
- Given the score pops, when the animation ends, then the score shows its normal size and the number is the new score.
- Given the snake does not eat, when the game ticks, then the score does not pop.
- Given a new game starts, when the score resets to 0, then the score does not pop.
- Given the player prefers reduced motion, when the snake eats, then the score changes with no animation.

## Out of scope

- Popping the speed, length or high score values.
- Any sound or vibration change.

## Safety

Runs only in the browser. No network, no new dependency, no asset from another origin.
