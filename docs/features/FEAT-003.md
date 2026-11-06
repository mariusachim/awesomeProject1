# FEAT-003: High score

Issue: #39

## Story

As a player, I want the game to remember my best score, so that I can try to beat it in the next run.

## Acceptance criteria

- Given the player opens the game for the first time, when the player looks at the page, then they see "High score: 0" next to the current score.
- Given the current score is higher than the high score, when the player eats food, then the "High score" shows the current score at once.
- Given the player reached a high score and the game is over, when the player activates "Restart", then the score is 0 and the "High score" still shows the best score.
- Given the player reached a high score, when the player reloads the page, then the "High score" shows the same value.
- Given the current score is lower than or equal to the high score, when the game ends, then the "High score" does not change.
- Given the stored high score is missing, not a number or negative, or localStorage is not available, when the game loads, then the "High score" shows 0 and the game still works.

## Out of scope

- A list of scores, player names, a reset button for the high score and a "new record" animation.

## Safety

Runs only in the browser. No network, no new dependency, no asset from another origin. localStorage holds only the high score.
