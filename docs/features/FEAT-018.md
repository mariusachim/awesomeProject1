# FEAT-018: Vibrate on game over

Issue: #140

## Story

As a player on a phone, I want the device to vibrate briefly when the game ends, so that I feel the crash even when I look away or play with the sound off.

## Acceptance criteria

- Given a running game on a device that supports vibration, when the snake hits a wall or itself, then the device vibrates once for a short time (200 ms or less).
- Given the game is over, when the player restarts and loses again, then the device vibrates again.
- Given the game is muted, when the game ends, then the device does not vibrate.
- Given a browser without vibration support, when the game ends, then the game over screen shows as usual and nothing fails.
- Given the game is paused or waiting for the first key, when the player does nothing, then the device does not vibrate.

## Out of scope

- Vibration when the snake eats food.
- A separate vibration setting; the Mute button controls it.
- Vibration patterns that differ by score.

## Safety

Runs only in the browser. No network, no new dependency, no asset from another origin.
