# FEAT-011: Swipe to turn on touch screens

Issue: #83

## Story

As a player on a phone or tablet, I want to swipe on the board to turn the snake, so that I can play without a keyboard.

## Acceptance criteria

- Given a running game, when the player swipes right on the board (a horizontal move of at least 30 px, mostly horizontal), then the snake turns right, as the right arrow key does.
- Given a running game, when the player swipes left, up or down on the board, then the snake turns left, up or down, as the matching arrow key does.
- Given a running game, when the player swipes against the snake's direction (a turn back into itself), then the snake keeps its direction, as with the keys.
- Given a running game, when the player touches the board and moves less than 30 px, then the snake does not turn.
- Given the "Press an arrow key or WASD to start" message, when the player swipes on the board, then the game starts and the snake moves in the swipe direction. The message then disappears.
- Given a swipe on the board, when the finger moves, then the page does not scroll (the board sets `touch-action: none`).
- Given a game over, when the player swipes on the board, then nothing changes. The Restart button still restarts the game.

## Out of scope

- Swipe on the rest of the page, a pause gesture, a tap to pause or restart.
- Haptic feedback and a visible on-screen D-pad.
- Changing the keyboard controls.

## Safety

Runs only in the browser. No network, no new dependency, no asset from another origin.
