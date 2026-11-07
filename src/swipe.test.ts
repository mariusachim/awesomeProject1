import { expect, test } from 'vitest'
import { swipeDir } from './game.ts'

test.each([
  [40, 0, 'right'],
  [-40, 0, 'left'],
  [0, 40, 'down'],
  [0, -40, 'up'],
  [60, 20, 'right'],
  [20, -60, 'up'],
  [30, 0, 'right'],
  [0, -30, 'up'],
])('a swipe of %i,%i points %s', (dx, dy, dir) => {
  // when / then
  expect(swipeDir(dx, dy)).toBe(dir)
})

test.each([
  [29, 0],
  [0, -29],
  [20, 20],
  [0, 0],
])('a move of %i,%i is too short for a swipe', (dx, dy) => {
  // when / then
  expect(swipeDir(dx, dy)).toBeUndefined()
})
