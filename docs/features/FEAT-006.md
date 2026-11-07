# FEAT-006: Buffer quick turns

Issue: #58

## Story

As a player, I want the game to remember a second turn key that I press before the next move, so that two quick turns, such as up then left, both happen and the snake does not ignore my first key.

## Acceptance criteria

- Given the snake moves right, when the player presses Up and then Left before the next move, then the snake moves up one cell and on the move after that moves left one cell.
- Given the snake moves right, when the player presses Up and then Down before the next move, then the snake moves up and the Down press is ignored because it would turn back into itself.
- Given the snake moves right, when the player presses Up, Left and Down before the next move, then the snake moves up, then left, and the third press waits for the move after that, or is dropped, but never makes the snake reverse.
- Given a key press waits in the buffer, when the game is paused or over, then the waiting press has no effect and the buffer is empty when a new game starts.
- Given the player presses one direction key per move, when time passes, then the snake turns exactly as it did before this feature.

## Out of scope

- A buffer longer than 2 key presses.
- Any change to the speed, score or sound.

## Safety

Runs only in the browser. No network, no new dependency, no asset from another origin.
