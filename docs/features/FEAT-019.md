# FEAT-019: Show the snake length

Issue: #144

## Story

As a player, I want to see how long my snake is, so that I know how big it has grown and how much room I have left.

## Acceptance criteria

- Given a new game, when the board is shown, then a "Length" stat next to the score and speed reads 1.
- Given a running game, when the snake eats a normal food, then the Length stat goes up by 1.
- Given a running game, when the snake eats a bonus food, then the Length stat goes up by 1, even though the score goes up by 3.
- Given a game over, when the player restarts, then the Length stat reads 1 again.
- Given the Length stat, when a screen reader reads the page, then it announces the label and the value, like the other stats.

## Out of scope

- A length record or a saved best length.
- Any change to the score, the speed or the growth rules.

## Safety

Runs only in the browser. No network, no new dependency, no asset from another origin.
