import { expect, test } from 'vitest'
import { newGame, pauseIfRunning, step, tickCount, togglePause, turn } from './game.ts'

const paused = () => togglePause(newGame(() => 0))

test('resuming starts a countdown at 3 and the snake does not move', () => {
  // given
  const g = paused()

  // when
  const resumed = togglePause(g)

  // then
  expect(resumed.count).toBe(3)
  expect(step(resumed, () => 0).snake).toEqual(resumed.snake)
})

test('tickCount counts 3, 2, 1, then ends', () => {
  // given
  const g = togglePause(paused())

  // when
  const counts = [g, tickCount(g), tickCount(tickCount(g)), tickCount(tickCount(tickCount(g)))].map((s) => s.count)

  // then
  expect(counts).toEqual([3, 2, 1, 0])
})

test('after the countdown the snake moves', () => {
  // given
  let g = togglePause(paused())

  // when
  for (let i = 0; i < 3; i++) g = tickCount(g)

  // then
  expect(step(g, () => 0).snake[0]).not.toEqual(g.snake[0])
})

test('a turn during the countdown is kept', () => {
  // given
  const g = togglePause(paused())

  // when
  const turned = turn(g, 'up')

  // then
  expect(turned.queue).toEqual(['up'])
})

test('pausing during the countdown clears it', () => {
  // given
  const g = togglePause(paused())

  // when
  const again = togglePause(g)

  // then
  expect(again.status).toBe('paused')
  expect(again.count).toBe(0)
  expect(pauseIfRunning(g).count).toBe(0)
})

test('a new game has no countdown', () => {
  // when / then
  expect(newGame(() => 0).count).toBe(0)
})
