# FEAT-010: Pause when the tab is hidden

Issue: #78

## Story

As a player, I want the game to pause when I switch to another tab or window, so that the snake does not die while I am away.

## Acceptance criteria

- Given the game is running, when the page becomes hidden (the player switches to another tab), then the game is paused and the player sees "Paused" and a "Resume" button.
- Given the game is running, when the window loses focus (blur), then the game is paused and the player sees "Paused".
- Given the game was paused by a hidden page or lost focus, when the player returns, then the game stays paused until the player presses Space, P or "Resume".
- Given the game is waiting for the first key ("ready"), when the page becomes hidden, then the game stays in "ready" and still shows "Press an arrow key or WASD to start".
- Given the game is over, when the page becomes hidden, then the game over message stays and nothing else changes.
- Given the game is already paused, when the page becomes hidden, then the game stays paused and "Resume" does not change to "Pause".

## Out of scope

- Resuming automatically when the player returns.
- A countdown before the snake moves again.
- Pausing on the focus loss of a single button inside the page.

## Safety

Runs only in the browser. No network, no new dependency, no asset from another origin.
