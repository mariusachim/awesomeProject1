# FEAT-021: Switch walls mode with the B key

Issue: #152

## Story

As a player, I want to press B to switch between solid and wrap walls, so that I can change the walls mode without leaving the keyboard.

## Acceptance criteria

- Given the walls mode is solid, when the player presses B, then the button reads "Walls: wrap" and a new game waits for the first key, as with the button.
- Given the walls mode is wrap, when the player presses B, then the button reads "Walls: solid" and a new game waits for the first key.
- Given the player presses the capital B, when the game handles the key, then it works the same as the small b.
- Given the player pressed B and reloads the page, then the walls mode is kept, as with the button.
- Given the game is running, when the player presses B, then the game restarts in the other mode, as the button does now.

## Out of scope

- A confirmation before the restart.
- Any change to how the walls mode is stored.

## Safety

Runs only in the browser. No network, no new dependency, no asset from another origin.
