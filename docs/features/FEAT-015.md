# FEAT-015: Checkerboard board

Issue: #110

## Story

As a player, I want the board to show a checkerboard of two dark shades, so that I can judge distances
and plan my turns more easily.

## Acceptance criteria

- Given the board is shown, when the player looks at it, then the 15 x 15 cells alternate between two
  dark shades, and two cells that touch by a side have different shades.
- Given the board is shown, when the player looks at the cells, then the shade of the cell at (x, y)
  depends only on whether x + y is even or odd, so it never changes while the game runs.
- Given the snake, the food or the bonus food is on a cell, when the player looks at it, then it is
  as easy to see as before: both shades stay dark, and each shade keeps a contrast ratio of at least
  3:1 against the snake head, the snake body, the food and the bonus food.
- Given the game is paused or over, when the overlay shows, then the overlay text stays readable
  over both shades.
- Given the board size, when the board is drawn, then it has the same width and height as before and
  no cell moves.
- Given a screen reader, when it reads the page, then it reads nothing new: the background cells have
  no text and no role.
- The shade of a cell is a pure function in `game.ts` (for example `cellShade(x, y)`), which a unit
  test checks directly for neighbouring cells.

## Out of scope

- A theme switch or a choice of colours.
- A change to the colours of the snake, the food or the bonus food.
- A grid line or a border between cells.

## Safety

Runs only in the browser. No network, no new dependency, no asset from another origin.
