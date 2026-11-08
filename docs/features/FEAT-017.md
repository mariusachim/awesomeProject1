# FEAT-017: Bonus countdown

Issue: #136

## Story

As a player, I want to see how many moves the bonus food has left, so that I can decide if I can reach it in time.

## Acceptance criteria

- Given a bonus food has just appeared, when I look at the board, then the bonus shows the number 15.
- Given a bonus food is on the board, when the snake moves one cell and does not eat it, then the number on the bonus is one lower.
- Given a bonus food shows the number 1, when the snake moves again and does not eat it, then the bonus disappears.
- Given a bonus food is on the board, when a screen reader reads it, then it says "Bonus food, N moves left" with the current number.
- Given the number is shown on the bonus, then the normal food shows no number and the bonus still keeps its diamond shape.

## Out of scope

- Changing the number of moves, the points or how often the bonus appears.
- A sound or a colour change when the bonus is about to vanish.

## Safety

Runs only in the browser. No network, no new dependency, no asset from another origin.
