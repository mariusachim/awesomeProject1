# FEAT-025: Say how the game ended

Issue: #168

## Story

As a player, I want the game over message to tell me whether the snake hit the wall or bit itself, so that I understand my mistake and play better next time.

## Acceptance criteria

- Given the snake runs into the wall in solid walls mode, when the game is over, then the player sees "Game over: you hit the wall".
- Given the snake runs into its own body, when the game is over, then the player sees "Game over: you bit yourself".
- Given the walls mode is wrap-around, when the game is over, then the message is always "Game over: you bit yourself", because the snake cannot hit a wall.
- Given the game is over, when the player restarts, then the message is gone.
- Given the game is over, when a screen reader reads the alert, then it reads the same reason text.
- Finding the reason is a pure function of the state before the last move, and a unit test checks it directly.

## Out of scope

- Any change to the rules for when the game ends.
- Showing the reason before the game is over.
- Counting or saving the reasons.

## Safety

Runs only in the browser. No network, no new dependency, no asset from another origin. No new storage.
