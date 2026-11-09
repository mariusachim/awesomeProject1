# FEAT-023: Remember the start speed

Issue: #160

## Story

As a player, I want the game to remember my start speed (slow, normal or fast), so that I do not have to choose it again each time I open the game.

## Acceptance criteria

- Given the player chose "Start: fast", when the player opens the game again, then the button reads "Start: fast" and the game starts at the fast speed.
- Given the player chose "Start: slow", when the player opens the game again, then the button reads "Start: slow".
- Given the game is opened for the first time, when the controls show, then the button reads "Start: normal".
- Given the saved value is missing, damaged or not one of the three speeds, when the game opens, then the button reads "Start: normal" and the game does not crash.
- Given `localStorage` is blocked, when the player changes the start speed, then the game still works for that visit and shows no error.
- Loading and saving the start speed are small functions, which unit tests check directly.

## Out of scope

- A key to change the start speed.
- Saving the high score per start speed.
- Any change to the speed steps or to the start-speed button itself (see FEAT-022).

## Safety

Runs only in the browser. No network, no new dependency, no asset from another origin. `localStorage` holds only the start speed.
