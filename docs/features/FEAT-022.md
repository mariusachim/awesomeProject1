# FEAT-022: Choose the start speed

Issue: #156

## Story

As a player, I want to choose a slow, normal or fast start speed, so that I can make the game easier or harder to fit my skill.

## Acceptance criteria

- Given a new game waits for the first key, when the player looks at the controls, then a button reads "Start: normal".
- Given the button reads "Start: normal", when the player presses it, then it reads "Start: fast"; pressed again it reads "Start: slow"; pressed again it reads "Start: normal".
- Given the player chose "Start: fast", when the game starts, then the snake moves faster than with "Start: normal" and the speed level shown is higher than with "Start: normal".
- Given the player chose "Start: slow", when the game starts, then the snake moves slower than with "Start: normal".
- Given the game is running or paused, when the player looks at the start-speed button, then it is disabled and the speed is unchanged.
- Given the player chose a start speed, when the game ends and the player restarts, then the same start speed is used.
- Given the snake eats food, when the speed rises, then it rises by the same steps as now, from the chosen start speed.

## Out of scope

- Storing the start speed in `localStorage`.
- A key to change the start speed.
- Any change to the high score: one high score stays for all start speeds.

## Safety

Runs only in the browser. No network, no new dependency, no asset from another origin.
