# FEAT-020: Mute with the M key

Issue: #148

## Story

As a player, I want to press M to mute or unmute the sound, so that I can silence the game without taking my hands off the keys.

## Acceptance criteria

- Given sound is on, when the player presses M, then the button reads "Unmute" and the eat and game over sounds stop playing.
- Given sound is off, when the player presses M, then the button reads "Mute" and the sounds play again.
- Given the player presses the capital M, when the game handles the key, then it works the same as the small m.
- Given the player pressed M and reloads the page, then the mute choice is kept, as with the button.
- Given the game is paused or over, when the player presses M, then the sound toggles and the game state does not change.

## Out of scope

- A volume control or new sounds.
- Any change to how the mute choice is stored.

## Safety

Runs only in the browser. No network, no new dependency, no asset from another origin.
