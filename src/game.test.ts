import { expect, test } from 'vitest'
import { type GameState, SIZE, keyToDir, newGame, placeFood, step, tickMs, togglePause, turn } from './game.ts'

const state = (over: Partial<GameState>): GameState => ({
  snake: [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }],
  dir: 'right',
  next: 'right',
  food: { x: 10, y: 10 },
  score: 0,
  status: 'running',
  ...over,
})

test('new game has a short snake, score 0 and food off the snake', () => {
  // given
  const rand = () => 0

  // when
  const game = newGame(rand)

  // then
  expect(game.snake.length).toBe(3)
  expect(game.score).toBe(0)
  expect(game.status).toBe('running')
  expect(game.snake).not.toContainEqual(game.food)
})

test('food skips the snake cells', () => {
  // given
  const snake = [{ x: 0, y: 0 }, { x: 1, y: 0 }]

  // when
  const food = placeFood(snake, () => 0)

  // then
  expect(food).toEqual({ x: 2, y: 0 })
})

test('food picks the cell the random number points at', () => {
  // given
  const snake = [{ x: 0, y: 0 }]

  // when
  const food = placeFood(snake, () => 0.999)

  // then
  expect(food).toEqual({ x: SIZE - 1, y: SIZE - 1 })
})

test('snake moves one cell in its direction', () => {
  // given
  const game = state({})

  // when
  const next = step(game, () => 0)

  // then
  expect(next.snake).toEqual([{ x: 6, y: 5 }, { x: 5, y: 5 }, { x: 4, y: 5 }])
})

test.each([
  ['up', { x: 5, y: 4 }],
  ['down', { x: 5, y: 6 }],
] as const)('turn %s changes the direction of the next move', (dir, head) => {
  // given
  const game = state({})

  // when
  const next = step(turn(game, dir), () => 0)

  // then
  expect(next.snake[0]).toEqual(head)
})

test.each([
  ['right', 'left'],
  ['left', 'right'],
  ['up', 'down'],
  ['down', 'up'],
] as const)('moving %s ignores a turn to %s', (dir, back) => {
  // given
  const game = state({ dir, next: dir })

  // when
  const next = turn(game, back)

  // then
  expect(next.next).toBe(dir)
})

test('two quick turns cannot reverse the snake', () => {
  // given
  const game = state({})

  // when
  const next = turn(turn(game, 'up'), 'left')

  // then
  expect(next.next).toBe('up')
  expect(step(next, () => 0).snake[0]).toEqual({ x: 5, y: 4 })
})

test('eating grows the snake, adds 1 point and moves the food', () => {
  // given
  const game = state({ food: { x: 6, y: 5 } })

  // when
  const next = step(game, () => 0)

  // then
  expect(next.snake.length).toBe(4)
  expect(next.score).toBe(1)
  expect(next.food).not.toEqual({ x: 6, y: 5 })
  expect(next.snake).not.toContainEqual(next.food)
})

test.each([
  ['right', { x: SIZE - 1, y: 5 }],
  ['left', { x: 0, y: 5 }],
  ['up', { x: 5, y: 0 }],
  ['down', { x: 5, y: SIZE - 1 }],
] as const)('hitting the wall moving %s ends the game', (dir, head) => {
  // given
  const game = state({ snake: [head, { x: 8, y: 8 }], dir, next: dir })

  // when
  const next = step(game, () => 0)

  // then
  expect(next.status).toBe('over')
})

test('hitting the own body ends the game', () => {
  // given
  const game = state({
    snake: [{ x: 5, y: 5 }, { x: 5, y: 6 }, { x: 4, y: 6 }, { x: 4, y: 5 }, { x: 4, y: 4 }],
    dir: 'up',
    next: 'left',
  })

  // when
  const next = step(game, () => 0)

  // then
  expect(next.status).toBe('over')
})

test('the tail cell is free for the head in the same move', () => {
  // given
  const game = state({
    snake: [{ x: 5, y: 5 }, { x: 5, y: 6 }, { x: 4, y: 6 }, { x: 4, y: 5 }],
    dir: 'up',
    next: 'left',
  })

  // when
  const next = step(game, () => 0)

  // then
  expect(next.status).toBe('running')
})

test('a game that is over does not move', () => {
  // given
  const game = state({ status: 'over' })

  // when
  const next = step(game, () => 0)

  // then
  expect(next).toBe(game)
})

test.each([
  ['ArrowUp', 'up'], ['w', 'up'], ['W', 'up'],
  ['ArrowDown', 'down'], ['s', 'down'],
  ['ArrowLeft', 'left'], ['a', 'left'],
  ['ArrowRight', 'right'], ['d', 'right'],
  ['x', undefined],
] as const)('key %s maps to %s', (key, dir) => {
  // when / then
  expect(keyToDir(key)).toBe(dir)
})

test('togglePause pauses a running game and resumes a paused one', () => {
  // given
  const running = state({})

  // when
  const paused = togglePause(running)
  const resumed = togglePause(paused)

  // then
  expect(paused.status).toBe('paused')
  expect(resumed).toEqual(running)
})

test('togglePause does nothing when the game is over', () => {
  // given
  const over = state({ status: 'over' })

  // when / then
  expect(togglePause(over)).toBe(over)
})

test('step leaves a paused game unchanged', () => {
  // given
  const paused = state({ status: 'paused' })

  // when / then
  expect(step(paused, () => 0)).toBe(paused)
})

test('turn is ignored while paused', () => {
  // given
  const paused = state({ status: 'paused' })

  // when / then
  expect(turn(paused, 'up')).toBe(paused)
})

test('tickMs starts at 200 ms and drops 10 ms per point', () => {
  // when / then
  expect([0, 1, 5].map(tickMs)).toEqual([200, 190, 150])
})

test('tickMs never falls below 80 ms', () => {
  // when / then
  expect([12, 13, 100].map(tickMs)).toEqual([80, 80, 80])
})
