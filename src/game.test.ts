import { expect, test } from 'vitest'
import { type GameState, formatTime,SHRINK_MOVES, SIZE, placeShrink, placeRock, mealPoints, cellShade, keyToDir, newGame, overlayEdge, pauseIfRunning, placeBonus, placeFood, speedLevel, step, tickMs, boostMs, togglePause, turn } from './game.ts'

const state = (over: Partial<GameState>): GameState => ({
  snake: [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }],
  dir: 'right',
  queue: [],
  food: { x: 10, y: 10 },
  score: 0,
  status: 'running',
  wrap: false,
  bonus: null,
  eaten: 0,
  meals: 0,
  streaks: 0,
  rocks: [],
  shrink: null,
  sinceFood: null,
  gain: 0,
  ms: 0,
  count: 0,
  ...over,
})

test.each([[0, '0:00'], [7999, '0:07'], [65000, '1:05'], [600000, '10:00']])('formatTime(%i) is %s', (ms, text) => {
  // when / then
  expect(formatTime(ms)).toBe(text)
})

test('a running step adds one tick to the time, also the step that ends the game', () => {
  // given
  const g = state({ ms: 100 })

  // when
  const next = step(g, () => 0)
  const dead = step(state({ ms: 100, snake: [{ x: 0, y: 5 }], dir: 'left' }), () => 0)

  // then
  expect(next.ms).toBe(100 + tickMs(0))
  expect(dead.status).toBe('over')
  expect(dead.ms).toBe(100 + tickMs(0))
})

test.each([state({ status: 'paused' }), state({ status: 'ready' }), state({ count: 2 })])('a step of a waiting game does not add time', (g) => {
  // when / then
  expect(step(g, () => 0).ms).toBe(0)
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
  const game = state({ dir })

  // when
  const next = turn(game, back)

  // then
  expect(next.queue).toEqual([])
})

test('two quick turns both happen, one per move', () => {
  // given
  const game = state({})

  // when
  const first = step(turn(turn(game, 'up'), 'left'), () => 0)
  const second = step(first, () => 0)

  // then
  expect(first.snake[0]).toEqual({ x: 5, y: 4 })
  expect(second.snake[0]).toEqual({ x: 4, y: 4 })
})

test('a turn back into the buffered turn is ignored', () => {
  // given
  const game = state({})

  // when
  const next = turn(turn(game, 'up'), 'down')

  // then
  expect(next.queue).toEqual(['up'])
})

test('a third quick turn is dropped', () => {
  // given
  const game = state({})

  // when
  const next = turn(turn(turn(game, 'up'), 'left'), 'down')

  // then
  expect(next.queue).toEqual(['up', 'left'])
})

test('repeating the buffered direction does not fill the buffer', () => {
  // given
  const game = state({})

  // when
  const next = turn(turn(game, 'up'), 'up')

  // then
  expect(next.queue).toEqual(['up'])
})

test('turns while paused are not buffered', () => {
  // given
  const game = state({ status: 'paused' })

  // when
  const next = turn(game, 'up')

  // then
  expect(next.queue).toEqual([])
})

test('a new game starts with an empty buffer', () => {
  // when / then
  expect(newGame(() => 0).queue).toEqual([])
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
  const game = state({ snake: [head, { x: 8, y: 8 }], dir })

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
    queue: ['left'],
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
    queue: ['left'],
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
  expect(resumed).toEqual({ ...running, count: 3 })
})

test('togglePause does nothing when the game is over', () => {
  // given
  const over = state({ status: 'over' })

  // when / then
  expect(togglePause(over)).toBe(over)
})

test('pauseIfRunning pauses a running game', () => {
  // when / then
  expect(pauseIfRunning(state({})).status).toBe('paused')
})

test.each(['ready', 'paused', 'over'] as const)('pauseIfRunning leaves a %s game unchanged', (status) => {
  // given
  const g = state({ status })

  // when / then
  expect(pauseIfRunning(g)).toBe(g)
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

test('newGame can start in the ready state', () => {
  // when / then
  expect(newGame(() => 0, false, 'ready').status).toBe('ready')
  expect(newGame(() => 0).status).toBe('running')
})

test('a ready game does not move, pause or score', () => {
  // given
  const ready = state({ status: 'ready' })

  // when / then
  expect(step(ready, () => 0)).toBe(ready)
  expect(togglePause(ready)).toBe(ready)
})

test('a turn starts a ready game and queues the new direction', () => {
  // given
  const ready = state({ status: 'ready' })

  // when
  const next = step(turn(ready, 'up'), () => 0)

  // then
  expect(next.status).toBe('running')
  expect(next.snake[0]).toEqual({ x: 5, y: 4 })
})

test.each(['left', 'right'] as const)('key %s starts a ready game and keeps the heading', (dir) => {
  // given
  const ready = state({ status: 'ready' })

  // when
  const next = step(turn(ready, dir), () => 0)

  // then
  expect(next.status).toBe('running')
  expect(next.snake[0]).toEqual({ x: 6, y: 5 })
})

test('tickMs starts at 200 ms and drops 10 ms per point', () => {
  // when / then
  expect([0, 1, 5].map(tickMs)).toEqual([200, 190, 150])
})

test('tickMs never falls below 80 ms', () => {
  // when / then
  expect([12, 13, 100].map(tickMs)).toEqual([80, 80, 80])
})

test('boostMs halves the interval while the boost is on', () => {
  // when / then
  expect([0, 5].map((s) => boostMs(s, true))).toEqual([100, 75])
})

test('boostMs keeps the normal interval while the boost is off', () => {
  // when / then
  expect([0, 5].map((s) => boostMs(s, false))).toEqual([200, 150])
})

test('boostMs halves the minimum interval too', () => {
  // when / then
  expect([boostMs(100, true), boostMs(100, false)]).toEqual([40, 80])
})

test('speedLevel counts one per point, starting at 1', () => {
  // when / then
  expect([0, 1, 3, 11].map(speedLevel)).toEqual([1, 2, 4, 12])
})

test('speedLevel is MAX once the move interval is at its shortest', () => {
  // when / then
  expect([12, 13, 100].map(speedLevel)).toEqual(['MAX', 'MAX', 'MAX'])
})

test('new game is solid by default and keeps the wrap mode it is given', () => {
  // when / then
  expect(newGame(() => 0).wrap).toBe(false)
  expect(newGame(() => 0, true).wrap).toBe(true)
})

test('solid walls end the game', () => {
  // given
  const game = state({ snake: [{ x: SIZE - 1, y: 5 }, { x: SIZE - 2, y: 5 }], dir: 'right' })

  // when
  const next = step(game, () => 0)

  // then
  expect(next.status).toBe('over')
})

test.each([
  ['right', { x: SIZE - 1, y: 4 }, { x: 0, y: 4 }],
  ['left', { x: 0, y: 4 }, { x: SIZE - 1, y: 4 }],
  ['up', { x: 4, y: 0 }, { x: 4, y: SIZE - 1 }],
  ['down', { x: 4, y: SIZE - 1 }, { x: 4, y: 0 }],
] as const)('wrap mode: moving %s across the edge comes out on the other side', (dir, from, to) => {
  // given
  const game = state({ wrap: true, dir, snake: [from], food: { x: 9, y: 9 } })

  // when
  const next = step(game, () => 0)

  // then
  expect(next.status).toBe('running')
  expect(next.snake[0]).toEqual(to)
})

test('wrap mode: moving into the own body ends the game', () => {
  // given
  const snake = [{ x: 5, y: 5 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 6, y: 5 }, { x: 6, y: 4 }]
  const game = state({ wrap: true, snake, dir: 'up', queue: ['right'] })

  // when
  const next = step(game, () => 0)

  // then
  expect(next.status).toBe('over')
})

// Bonus food. The snake heads right from 5,5; the food at 6,5 sits right in front of it.
const BONUS_FAR = { x: 12, y: 12 }

test('a new game has no bonus food and a count of 0', () => {
  // when
  const game = newGame(() => 0)

  // then
  expect(game.bonus).toBeNull()
  expect(game.eaten).toBe(0)
})

test('the 5th normal food places a bonus food on a free cell and resets the count', () => {
  // given
  const game = state({ food: { x: 6, y: 5 }, eaten: 4 })

  // when
  const next = step(game, () => 0)

  // then
  expect(next.eaten).toBe(0)
  expect(next.bonus).not.toBeNull()
  expect(next.bonus?.movesLeft).toBe(15)
  expect(next.snake).not.toContainEqual(next.bonus?.cell)
  expect(next.food).not.toEqual(next.bonus?.cell)
})

test('a normal food before the 5th only counts', () => {
  // given
  const game = state({ food: { x: 6, y: 5 }, eaten: 3 })

  // when
  const next = step(game, () => 0)

  // then
  expect(next.eaten).toBe(4)
  expect(next.bonus).toBeNull()
})

test('the bonus food never sits on the snake or on the normal food', () => {
  // given
  const snake = [{ x: 0, y: 0 }, { x: 1, y: 0 }]
  const food = { x: 2, y: 0 }

  // when
  const cell = placeBonus(snake, food, () => 0)

  // then
  expect(cell).toEqual({ x: 3, y: 0 })
})

test('no bonus food is placed when the board has no free cell', () => {
  // given
  const snake = Array.from({ length: SIZE * SIZE - 1 }, (_, i) => ({ x: i % SIZE, y: Math.floor(i / SIZE) }))
  const food = { x: SIZE - 1, y: SIZE - 1 }

  // when / then
  expect(placeBonus(snake, food, () => 0)).toBeNull()
})

test('eating the bonus food adds 3 points, grows the snake by one and removes it', () => {
  // given
  const game = state({ bonus: { cell: { x: 6, y: 5 }, movesLeft: 9 } })

  // when
  const next = step(game, () => 0)

  // then
  expect(next.score).toBe(3)
  expect(next.snake.length).toBe(4)
  expect(next.bonus).toBeNull()
  expect(next.eaten).toBe(0)
})

test('eating the normal food keeps the bonus food and counts it down', () => {
  // given
  const game = state({ food: { x: 6, y: 5 }, bonus: { cell: BONUS_FAR, movesLeft: 9 } })

  // when
  const next = step(game, () => 0)

  // then
  expect(next.score).toBe(1)
  expect(next.bonus).toEqual({ cell: BONUS_FAR, movesLeft: 8 })
  expect(next.eaten).toBe(1)
})

test('the bonus food disappears after 15 moves and the score stays', () => {
  // given
  let game = state({ wrap: true, snake: [{ x: 0, y: 5 }, { x: 0, y: 6 }], dir: 'up', bonus: { cell: BONUS_FAR, movesLeft: 15 } })

  // when
  for (let i = 0; i < 14; i++) game = step(game, () => 0)
  const before = game.bonus
  game = step(game, () => 0)

  // then
  expect(before?.movesLeft).toBe(1)
  expect(game.bonus).toBeNull()
  expect(game.score).toBe(0)
})

test('a paused game does not count the bonus food down', () => {
  // given
  const game = state({ status: 'paused', bonus: { cell: BONUS_FAR, movesLeft: 9 } })

  // when
  const next = step(game, () => 0)

  // then
  expect(next.bonus?.movesLeft).toBe(9)
})

test('the 5th normal food keeps a bonus food that is still on the board', () => {
  // given
  const game = state({ food: { x: 6, y: 5 }, eaten: 4, bonus: { cell: BONUS_FAR, movesLeft: 9 } })

  // when
  const next = step(game, () => 0)

  // then
  expect(next.bonus).toEqual({ cell: BONUS_FAR, movesLeft: 8 })
  expect(next.eaten).toBe(0)
})

const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (hi + 0.05) / (lo + 0.05)
}

test('cell shades alternate between neighbours and depend only on x + y parity', () => {
  // given
  const cells = Array.from({ length: SIZE * SIZE }, (_, i) => ({ x: i % SIZE, y: Math.floor(i / SIZE) }))

  // when / then
  for (const { x, y } of cells) {
    expect(cellShade(x, y)).not.toBe(cellShade(x + 1, y))
    expect(cellShade(x, y)).not.toBe(cellShade(x, y + 1))
    expect(cellShade(x, y)).toBe(cellShade(x + 1, y + 1))
  }
})

test('both shades are dark and keep 3:1 contrast against the game pieces', () => {
  // given
  const pieces = ['#77ee77', '#22aa22', '#ee4444', '#ffcc33']

  // when
  const shades = [cellShade(0, 0), cellShade(1, 0)]

  // then
  for (const s of shades) {
    expect(lum(s)).toBeLessThan(0.05)
    for (const p of pieces) expect(contrast(s, p)).toBeGreaterThanOrEqual(3)
  }
})

const edge = (over: Partial<GameState>) => overlayEdge(state(over))

test('start screen with the food in the bottom rows puts the panel at the top', () => {
  // given / when / then
  expect(edge({ status: 'ready', snake: [{ x: 7, y: 7 }], food: { x: 3, y: SIZE - 1 } })).toBe('top')
})

test('paused with the head on top and the food in the bottom rows puts the panel at the top', () => {
  // given / when / then
  expect(edge({ status: 'paused', snake: [{ x: 7, y: 1 }], food: { x: 3, y: SIZE - 2 } })).toBe('top')
})

test('head and food in the same half put the panel at the other edge', () => {
  // given / when / then
  expect(edge({ status: 'paused', snake: [{ x: 7, y: 1 }], food: { x: 3, y: 2 } })).toBe('bottom')
  expect(edge({ status: 'paused', snake: [{ x: 7, y: 13 }], food: { x: 3, y: 12 } })).toBe('top')
})

test('game over puts the panel at the edge that covers neither head nor food', () => {
  // given / when / then
  expect(edge({ status: 'over', snake: [{ x: 7, y: 1 }], food: { x: 3, y: 2 } })).toBe('bottom')
  expect(edge({ status: 'over', snake: [{ x: 7, y: 13 }], food: { x: 3, y: 12 } })).toBe('top')
  expect(edge({ status: 'over', snake: [{ x: 7, y: 1 }], food: { x: 3, y: SIZE - 2 } })).toBe('top')
  expect(edge({ status: 'over', snake: [{ x: 7, y: 13 }], food: { x: 3, y: 1 } })).toBe('bottom')
})

test('paused panel covers 5 rows: food in the 5th row from the bottom sends it to the top', () => {
  // given / when / then
  expect(edge({ status: 'paused', snake: [{ x: 7, y: 6 }], food: { x: 3, y: SIZE - 5 } })).toBe('top')
  expect(edge({ status: 'paused', snake: [{ x: 7, y: 9 }], food: { x: 3, y: 3 } })).toBe('bottom')
})

test('with both edges free the panel stays away from the head', () => {
  // given / when / then
  expect(edge({ status: 'paused', snake: [{ x: 7, y: 5 }], food: { x: 3, y: 7 } })).toBe('bottom')
  expect(edge({ status: 'paused', snake: [{ x: 7, y: 9 }], food: { x: 3, y: 7 } })).toBe('top')
  expect(edge({ status: 'ready', snake: [{ x: 7, y: 7 }], food: { x: 3, y: 7 } })).toBe('bottom')
})

test('the panel counts its full height: food 5 rows from the bottom edge is covered', () => {
  // given / when / then
  expect(edge({ status: 'ready', snake: [{ x: 7, y: 7 }], food: { x: 3, y: SIZE - 5 } })).toBe('top')
  expect(edge({ status: 'paused', snake: [{ x: 7, y: 1 }], food: { x: 3, y: SIZE - 4 } })).toBe('top')
})

test('game over keeps the old rule', () => {
  // given / when / then
  expect(edge({ status: 'over', snake: [{ x: 7, y: 1 }], food: { x: 3, y: 1 } })).toBe('bottom')
  expect(edge({ status: 'over', snake: [{ x: 7, y: 13 }], food: { x: 3, y: SIZE - 1 } })).toBe('top')
})

test.each([[null, 1], [1, 2], [10, 2], [11, 1]])('a meal after %s moves scores %s', (moves, points) => {
  // when / then
  expect(mealPoints(moves)).toBe(points)
})

const eat = (over: Partial<GameState>) => step(state({ food: { x: 6, y: 5 }, ...over }), () => 0)

test('a meal 10 moves after the last one scores 2 and sets the gain', () => {
  // when
  const next = eat({ sinceFood: 9 })

  // then
  expect([next.score, next.gain, next.sinceFood]).toEqual([2, 2, 0])
})

test('a streak meal counts one streak, a slow meal does not', () => {
  // when
  const fast = eat({ sinceFood: 9, streaks: 2 })
  const slow = eat({ sinceFood: 10, streaks: 2 })

  // then
  expect([fast.streaks, slow.streaks]).toEqual([3, 2])
})

test('a new game has no streak meals', () => {
  // when / then
  expect(newGame(() => 0).streaks).toBe(0)
})

test('a meal 11 moves after the last one scores 1', () => {
  // when
  const next = eat({ sinceFood: 10 })

  // then
  expect([next.score, next.gain]).toEqual([1, 1])
})

test('the first meal of a game scores 1', () => {
  // when
  const next = eat({})

  // then
  expect(next.score).toBe(1)
})

test('a move without a meal counts up and clears the gain', () => {
  // when
  const next = step(state({ sinceFood: 3, gain: 2 }), () => 0)

  // then
  expect([next.sinceFood, next.gain]).toEqual([4, 0])
})

test('a new game carries no streak', () => {
  // when
  const game = newGame(() => 0)

  // then
  expect([game.sinceFood, game.gain]).toEqual([null, 0])
})

test('a new game has no rocks', () => {
  // when
  const game = newGame(() => 0)

  // then
  expect(game.rocks).toEqual([])
})

test('the 5th food adds a rock off the snake, the foods and the cell ahead of the head', () => {
  // given
  const game = state({ food: { x: 6, y: 5 }, meals: 4 })

  // when
  const next = step(game, () => 0)

  // then
  expect(next.rocks).toHaveLength(1)
  for (const c of [...next.snake, next.food, { x: 7, y: 5 }]) expect(next.rocks[0]).not.toEqual(c)
})

test('no rock before the 5th food', () => {
  // given
  const game = state({ food: { x: 6, y: 5 }, meals: 2 })

  // when
  const next = step(game, () => 0)

  // then
  expect(next.rocks).toEqual([])
})

test('hitting a rock ends the game', () => {
  // given
  const game = state({ rocks: [{ x: 6, y: 5 }] })

  // when
  const next = step(game, () => 0)

  // then
  expect(next.status).toBe('over')
})

test('food and bonus food never land on a rock', () => {
  // given
  const snake = [{ x: 0, y: 0 }]
  const rocks = [{ x: 1, y: 0 }]

  // when / then
  expect(placeFood(snake, () => 0, rocks)).toEqual({ x: 2, y: 0 })
  expect(placeBonus(snake, { x: 2, y: 0 }, () => 0, rocks)).toEqual({ x: 3, y: 0 })
})

test('a rock avoids the cell ahead of a wrapping head', () => {
  // given
  const game = state({ snake: [{ x: SIZE - 1, y: 0 }], wrap: true, food: { x: 5, y: 5 } })

  // when
  const rock = placeRock(game, 'right', () => 0)

  // then
  expect(rock).toEqual({ x: 1, y: 0 })
})

const long = (n: number) => Array.from({ length: n }, (_, i) => ({ x: 9 - i, y: 5 }))
// The calls are: the new food, the 1-in-8 roll, the fruit cell.
const seq = (...v: number[]) => () => v.shift() ?? 0

test('eating a food may spawn a shrink fruit on a free cell', () => {
  // given
  const g = state({ food: { x: 6, y: 5 } })

  // when
  const next = step(g, seq(0.99, 0.99, 0.99))

  // then
  expect(next.shrink?.movesLeft).toBe(SHRINK_MOVES)
  expect(next.shrink?.cell).toEqual({ x: 11, y: 14 }) // index 217 of the 220 free cells
  expect(next.shrink?.cell).not.toEqual(next.food)
})

test('a low roll spawns no shrink fruit', () => {
  // given
  const g = state({ food: { x: 6, y: 5 } })

  // when
  const next = step(g, seq(0.5, 0.5, 0.5))

  // then
  expect(next.shrink).toBeNull()
})

test('shrink placement avoids snake, food, bonus and rocks', () => {
  // given
  const snake = [{ x: 0, y: 0 }]

  // when
  const cell = placeShrink(snake, { x: 1, y: 0 }, { cell: { x: 2, y: 0 }, movesLeft: 3 }, [{ x: 3, y: 0 }], () => 0)

  // then
  expect(cell).toEqual({ x: 4, y: 0 })
})

test('eating a shrink fruit cuts 3 tail cells, keeps the score and clears the fruit', () => {
  // given
  const g = state({ snake: long(6), score: 4, shrink: { cell: { x: 10, y: 5 }, movesLeft: 5 } })

  // when
  const next = step(g, () => 0.5)

  // then
  expect(next.snake).toHaveLength(3)
  expect(next.score).toBe(4)
  expect(next.shrink).toBeNull()
  expect(next.status).toBe('running')
})

test('a shrink fruit never takes the snake below length 2', () => {
  // given
  const g = state({ shrink: { cell: { x: 6, y: 5 }, movesLeft: 5 } })

  // when
  const next = step(g, () => 0.5)

  // then
  expect(next.snake).toHaveLength(2)
})

test('a shrink fruit expires after SHRINK_MOVES moves', () => {
  // given
  let g = state({ snake: [{ x: 3, y: 5 }, { x: 2, y: 5 }, { x: 1, y: 5 }], shrink: { cell: { x: 5, y: 0 }, movesLeft: SHRINK_MOVES } })

  // when
  for (let i = 0; i < SHRINK_MOVES - 1; i++) g = step(g, () => 0.5)
  const before = g.shrink
  g = step(g, () => 0.5)

  // then
  expect(before?.movesLeft).toBe(1)
  expect(g.shrink).toBeNull()
})
