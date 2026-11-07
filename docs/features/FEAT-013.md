# FEAT-013: Remember the walls mode

Issue: #97

## Story

As a player, I want the game to remember my walls mode (solid or wrap), so that I do not have to switch
it again each time I open the game.

## Acceptance criteria

- Given the player switched the walls to "wrap", when the player opens the game again, then the button
  shows "Walls: wrap" and the game waits for the first key in wrap mode.
- Given the player switched the walls back to "solid", when the player opens the game again, then the
  button shows "Walls: solid".
- Given the game is opened for the first time, when the board shows, then the button shows "Walls: solid".
- Given the player restarts after game over, when the new game starts, then the walls mode stays the
  same as before (see FEAT-007) and is still the saved mode.
- Given the saved value is missing, damaged or not one of the two modes, when the game opens, then it
  starts in "Walls: solid" and does not crash.
- Given `localStorage` is blocked, when the player switches the walls, then the game still works for
  that visit and shows no error.
- Loading and saving the mode are small functions, which unit tests check directly.

## Out of scope

- Remembering any other setting besides the walls mode.
- A reset button for saved data.
- Changing how the wrap-around walls work.

## Safety

Runs only in the browser. No network, no new dependency, no asset from another origin.
`localStorage` holds only the walls mode, as game data.
