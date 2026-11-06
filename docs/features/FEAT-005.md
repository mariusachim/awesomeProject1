# FEAT-005: Eating and game over sounds

Issue: #53

## Story

As a player, I want to hear a sound when the snake eats and when the game ends, so that the game feels alive and I get feedback without watching the score.

## Acceptance criteria

- Given the game is running and sound is on, when the snake eats food, then the player hears a short high beep.
- Given the game is running and sound is on, when the snake hits a wall or itself, then the player hears one short low tone and sees the game over message.
- Given the game has loaded, when the player looks at the page, then they see a button "Mute" and sound is on.
- Given sound is on, when the player presses the "Mute" button, then the button reads "Unmute" and later eating or game over makes no sound.
- Given sound is muted, when the player presses "Unmute", then the button reads "Mute" and the next eat makes a beep again.
- Given the player pressed "Mute", when the player reloads the page, then the button still reads "Unmute".
- Given the browser has no audio support or blocks audio, when the snake eats, then the game keeps running without an error.

## Out of scope

- Background music.
- A volume slider.
- Different sounds per score or per speed.
- Sound for turning, pausing or restarting.

## Safety

Runs only in the browser. No network, no new dependency, no asset from another origin. Sounds are generated with the Web Audio API (oscillator); no audio files are loaded. The mute choice is saved in `localStorage` as game data only.
