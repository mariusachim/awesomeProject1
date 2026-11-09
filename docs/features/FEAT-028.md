# FEAT-028: Pause with the Escape key

Issue: #178

## Story

As a player, I want to press Escape to pause, so that I can stop the game with the key that most games use for it.

## Acceptance criteria

- Given a running game, when the player presses Escape, then the game pauses and the paused panel shows.
- Given a paused game, when the player presses Escape, then the game stays paused.
- Given a game that is ready or over, when the player presses Escape, then nothing changes.
- Given a running game, when the player presses Space or P, then the game still pauses and resumes as before.

## Out of scope

- Resuming with Escape.
- Closing any dialog or leaving the page.

## Safety

Runs only in the browser. No network, no new dependency, no asset from another origin.
