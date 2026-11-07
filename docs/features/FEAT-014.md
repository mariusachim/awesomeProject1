# FEAT-014: Bonus food

Issue: #102

## Story

As a player, I want a bonus food that shows up now and then for a short time, so that I can take a risk
for extra points.

## Acceptance criteria

- Given the snake has eaten 5 normal foods since the last bonus (or since the start), when it eats the
  5th one, then a bonus food shows on a free cell, in a shape and colour that differ from the normal food.
- Given a bonus food is on the board, when the snake eats it, then the score rises by 3, the snake grows
  by one cell and the bonus food disappears.
- Given a bonus food is on the board, when the snake has moved 15 times without eating it, then it
  disappears and the score does not change.
- Given a bonus food is on the board, when the player looks at the board, then the bonus food has a text
  or label for screen readers, such as "Bonus food", and not only a colour.
- Given a bonus food is on the board, when the snake eats the normal food, then a new normal food shows
  as before and the bonus food stays until it is eaten or expires.
- Given a bonus food was never eaten or has expired, when the snake eats 5 more normal foods, then a new
  bonus food shows.
- Given a bonus food is on the board, when the game is paused, then the 15 moves do not count down.
- Given the player restarts after game over, when the new game starts, then no bonus food is on the board
  and the count of normal foods starts at 0.
- Given the bonus food shows, when it is placed, then it never sits on the snake or on the normal food.
- The placing, the countdown and the scoring are pure functions in `game.ts`, which unit tests check
  directly with a fixed random function.

## Out of scope

- A sound for the bonus food.
- A visible countdown bar or number.
- Saving anything to `localStorage`.
- A change to the speed: the speed still follows the score as in FEAT-004.

## Safety

Runs only in the browser. No network, no new dependency, no asset from another origin.
