# FEAT-024: Eyes on the snake head

Issue: #164

## Story

As a player, I want the snake head to have two eyes that look where the snake is going, so that I see the direction at a glance and the snake feels alive.

## Acceptance criteria

- Given a new game, when the board is shown, then the head cell shows two eyes, looking right.
- Given a running game, when the snake turns up, down, left or right, then the eyes move to that side of the head cell.
- Given a paused game, when the board is shown, then the eyes stay on the side of the last move.
- Given a game over, when the board is shown, then the head is still red and still shows its eyes.
- Given a screen reader, when it reads the board, then the eyes add no extra announcement: the head keeps its current label.
- Given the snake eats, when the head flashes, then the eyes stay visible during the flash.

## Out of scope

- Animated eyes, blinking, or a tongue.
- Any change to the head colour, the outline, the flash or the game rules.

## Safety

Runs only in the browser. No network, no new dependency, no asset from another origin.
