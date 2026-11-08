export const SIZE = 15

// Two dark shades; the shade of a cell depends only on the parity of x + y.
export const cellShade = (x: number, y: number): string => ((x + y) % 2 === 0 ? '#1c1c1c' : '#2c2c2c')

export type Dir = 'up' | 'down' | 'left' | 'right'
export type Cell = { x: number; y: number }
export type GameState = {
  snake: Cell[] // head first
  dir: Dir // direction of the last move
  queue: Dir[] // waiting turns, at most 2, oldest first
  food: Cell
  score: number
  status: 'ready' | 'running' | 'paused' | 'over'
  wrap: boolean // true: walls lead to the opposite side
  bonus: Bonus | null // the bonus food on the board, if any
  eaten: number // normal foods eaten since the last bonus food was placed
}
export type Bonus = { cell: Cell; movesLeft: number }
export type Rand = () => number

const DELTA: Record<Dir, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}
const OPPOSITE: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' }
const KEYS: Record<string, Dir> = {
  arrowup: 'up', w: 'up',
  arrowdown: 'down', s: 'down',
  arrowleft: 'left', a: 'left',
  arrowright: 'right', d: 'right',
}

const MAX_QUEUE = 2

export const BONUS_EVERY = 5
export const BONUS_POINTS = 3
export const BONUS_MOVES = 15

const same = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y

const outside = (c: Cell) => c.x < 0 || c.y < 0 || c.x >= SIZE || c.y >= SIZE

const MIN_TICK_MS = 80
const TICK_START_MS = 200
const TICK_STEP_MS = 10

export const tickMs = (score: number) => Math.max(MIN_TICK_MS, TICK_START_MS - TICK_STEP_MS * score)

// The level rises with each shorter interval, and reads MAX at the shortest one.
export const speedLevel = (score: number): number | 'MAX' => {
  const ms = tickMs(score)
  return ms === MIN_TICK_MS ? 'MAX' : (TICK_START_MS - ms) / TICK_STEP_MS + 1
}

export const keyToDir = (key: string): Dir | undefined => KEYS[key.toLowerCase()]

export const SWIPE_MIN_PX = 30

// A finger move is a swipe when it is long enough; the longer axis gives the direction.
export function swipeDir(dx: number, dy: number): Dir | undefined {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_MIN_PX) return undefined
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'right' : 'left'
  return dy > 0 ? 'down' : 'up'
}

function freeCells(taken: Cell[]): Cell[] {
  const free: Cell[] = []
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (!taken.some((c) => same(c, { x, y }))) free.push({ x, y })
    }
  }
  return free
}

export function placeFood(snake: Cell[], rand: Rand): Cell {
  const free = freeCells(snake)
  return free[Math.floor(rand() * free.length)]
}

// The bonus food needs a cell that is free of the snake and of the normal food; null when none is left.
export function placeBonus(snake: Cell[], food: Cell, rand: Rand): Cell | null {
  const free = freeCells([...snake, food])
  return free[Math.floor(rand() * free.length)] ?? null
}

const wrapCell = (c: Cell): Cell => ({ x: (c.x + SIZE) % SIZE, y: (c.y + SIZE) % SIZE })

export function newGame(rand: Rand, wrap = false, status: GameState['status'] = 'running'): GameState {
  const mid = Math.floor(SIZE / 2)
  const snake = [{ x: mid, y: mid }, { x: mid - 1, y: mid }, { x: mid - 2, y: mid }]
  return { snake, dir: 'right', queue: [], food: placeFood(snake, rand), score: 0, status, wrap, bonus: null, eaten: 0 }
}

// R starts a new game in the same wall mode; it does nothing before the first key.
export const restart = (state: GameState, rand: Rand): GameState =>
  state.status === 'ready' ? state : newGame(rand, state.wrap)

export function turn(state: GameState, dir: Dir): GameState {
  if (state.status === 'ready') {
    // The first key starts the game; a key against the heading only starts it.
    const queue = dir === state.dir || dir === OPPOSITE[state.dir] ? [] : [dir]
    return { ...state, queue, status: 'running' }
  }
  const last = state.queue[state.queue.length - 1] ?? state.dir
  if (state.status !== 'running' || state.queue.length >= MAX_QUEUE) return state
  if (dir === last || dir === OPPOSITE[last]) return state
  return { ...state, queue: [...state.queue, dir] }
}

export function togglePause(state: GameState): GameState {
  if (state.status === 'over' || state.status === 'ready') return state
  return { ...state, status: state.status === 'running' ? 'paused' : 'running' }
}

export function pauseIfRunning(state: GameState): GameState {
  return state.status === 'running' ? { ...state, status: 'paused' } : state
}

export function step(state: GameState, rand: Rand): GameState {
  if (state.status !== 'running') return state
  const [first, ...queue] = state.queue
  const dir = first ?? state.dir
  const d = DELTA[dir]
  const moved = { x: state.snake[0].x + d.x, y: state.snake[0].y + d.y }
  const head = state.wrap ? wrapCell(moved) : moved
  const eatsFood = same(head, state.food)
  const eatsBonus = state.bonus !== null && same(head, state.bonus.cell)
  const body = eatsFood || eatsBonus ? state.snake : state.snake.slice(0, -1)
  if (outside(head) || body.some((c) => same(c, head))) return { ...state, dir, queue, status: 'over' }
  const snake = [head, ...body]
  return { ...state, snake, dir, queue, ...settleFood(state, snake, eatsFood, eatsBonus, rand) }
}

// What the move changes besides the snake: the foods, the score and the count of eaten foods.
function settleFood(state: GameState, snake: Cell[], eatsFood: boolean, eatsBonus: boolean, rand: Rand) {
  const food = eatsFood ? placeFood(snake, rand) : state.food
  const eaten = state.eaten + (eatsFood ? 1 : 0)
  const spawn = eaten >= BONUS_EVERY
  return {
    food,
    score: state.score + (eatsFood ? 1 : 0) + (eatsBonus ? BONUS_POINTS : 0),
    eaten: spawn ? 0 : eaten,
    bonus: nextBonus(state.bonus, eatsBonus, spawn ? placeBonus(snake, food, rand) : null),
  }
}

// An eaten bonus is gone, an old one counts down and expires, and a fresh one starts at the full count.
function nextBonus(old: Bonus | null, eaten: boolean, fresh: Cell | null): Bonus | null {
  if (old && !eaten) return old.movesLeft > 1 ? { ...old, movesLeft: old.movesLeft - 1 } : null
  return fresh ? { cell: fresh, movesLeft: BONUS_MOVES } : null
}
