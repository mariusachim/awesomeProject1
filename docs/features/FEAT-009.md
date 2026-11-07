# FEAT-009: New high score message

Issue: #73

## Story

As a player, I want the game over panel to tell me when I set a new high score, so that I notice and enjoy my best run.

## Acceptance criteria

- Given a stored high score of 3, when a game ends with a final score of 5, then the game over panel shows "New high score!" below the final score.
- Given a stored high score of 5, when a game ends with a final score of 5, then the game over panel does not show "New high score!".
- Given a stored high score of 5, when a game ends with a final score of 2, then the game over panel does not show "New high score!".
- Given no stored high score, when a game ends with a final score of 0, then the game over panel does not show "New high score!".
- Given no stored high score, when a game ends with a final score of 1, then the game over panel shows "New high score!".
- Given the game over panel shows "New high score!", when the player restarts, then the message is gone and the game waits for the first key.

## Out of scope

- Sound, animation or confetti for the new high score.
- Changing how the high score is stored.

## Safety

Runs only in the browser. No network, no new dependency, no asset from another origin.
