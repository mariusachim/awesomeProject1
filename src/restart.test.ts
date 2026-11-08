import { expect, test } from 'vitest'
import { type GameState, newGame, restart } from './game.ts'

test.each(['running', 'paused', 'over'] as const)('restart from %s starts a fresh game and keeps the wall mode', (status) => {
  // given
  const old: GameState = { ...newGame(() => 0, true), status, score: 7 }

  // when
  const next = restart(old, () => 0)

  // then
  expect(next).toEqual(newGame(() => 0, true))
})

test('restart does nothing while the game waits for the first key', () => {
  // given
  const ready = newGame(() => 0, false, 'ready')

  // when / then
  expect(restart(ready, () => 0.5)).toBe(ready)
})
