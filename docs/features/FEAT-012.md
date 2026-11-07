# FEAT-012: Show the speed level

Issue: #92

## Story

As a player, I want to see the current speed level, so that I know how fast the snake is and when it
reaches top speed.

## Acceptance criteria

- Given a new game with score 0, when the board shows, then the player sees "Speed 1" next to the score.
- Given the snake moves at the interval for score 3 (170 ms), when the player looks at the screen,
  then it shows "Speed 4".
- Given the score rises by 1, when the snake eats, then the speed level rises by 1 at the same time as
  the move interval gets shorter (see FEAT-004).
- Given the snake has reached the shortest interval (80 ms), when the player looks at the screen,
  then it shows "Speed MAX" and the level does not rise any more.
- Given the game is over and the player restarts, when the new game starts, then it shows "Speed 1" again.
- Given the game is paused or waiting for the first key, when the player looks at the screen, then the
  level still shows and matches the score.
- The level comes from a pure function of the score, which unit tests check directly.

## Out of scope

- Changing the speed curve or the minimum interval.
- A speed setting chosen by the player.
- Sound or animation when the level rises.

## Safety

Runs only in the browser. No network, no new dependency, no asset from another origin.
