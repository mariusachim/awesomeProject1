# FEAT-001: Basic playable snake

Issue: #19

## Story

As a player, I want to steer a snake around a board and eat food, so that I can play a simple game of snake and chase a score.

## Acceptance criteria

- Given the game has loaded, when the player looks at the page, then they see a square grid board, a snake of a few cells, one food cell and a score of 0.
- Given the game is running, when time passes and the player presses nothing, then the snake moves one cell at a time in its current direction on a timer.
- Given the snake moves in a direction, when the player presses an arrow key or W, A, S, D, then the snake turns to that direction.
- Given the snake moves right, when the player presses left (or A), then the snake keeps moving right. The same holds for every direction: no turn back into itself.
- Given the food is on the board, when it appears, then it is on a random cell that the snake does not occupy.
- Given the snake head reaches the food, when it eats, then the snake grows by one cell, the score goes up by 1 and new food appears on a free cell.
- Given the snake head moves out of the board, when it hits the wall, then the game ends and the player sees a "Game over" message with the final score.
- Given the snake head moves onto its own body, when it hits itself, then the game ends and the player sees a "Game over" message with the final score.
- Given the game is over, when the player activates the "Restart" button or presses Enter, then a new game starts with a short snake, score 0 and new food.

## Out of scope

- High score, pause, speed changes, sound, touch controls and visual themes.

## Safety

Runs only in the browser. No network, no new dependency, no asset from another origin.
