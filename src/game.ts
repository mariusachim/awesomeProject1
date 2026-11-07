export const SIZE = 15

export type Dir = 'up' | 'down' | 'left' | 'right'
export type Cell = { x: number; y: number }
export type GameState = {
  snake: Cell[] // head first
  dir: Dir // direction of the last move
  queue: Dir[] // waiting turns, at most 2, oldest first
  food: Cell
  score: number
  status: 'running' | 'paused' | 'over'
  wrap: boolean // true: walls lead to the opposite side
}
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

const same = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y

const outside = (c: Cell) => c.x < 0 || c.y < 0 || c.x >= SIZE || c.y >= SIZE

export const tickMs = (score: number) => Math.max(80, 200 - 10 * score)

export const keyToDir = (key: string): Dir | undefined => KEYS[key.toLowerCase()]

export function placeFood(snake: Cell[], rand: Rand): Cell {
  const free: Cell[] = []
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (!snake.some((c) => same(c, { x, y }))) free.push({ x, y })
    }
  }
  return free[Math.floor(rand() * free.length)]
}

const wrapCell = (c: Cell): Cell => ({ x: (c.x + SIZE) % SIZE, y: (c.y + SIZE) % SIZE })

export function newGame(rand: Rand, wrap = false): GameState {
  const mid = Math.floor(SIZE / 2)
  const snake = [{ x: mid, y: mid }, { x: mid - 1, y: mid }, { x: mid - 2, y: mid }]
  return { snake, dir: 'right', queue: [], food: placeFood(snake, rand), score: 0, status: 'running', wrap }
}

export function turn(state: GameState, dir: Dir): GameState {
  const last = state.queue[state.queue.length - 1] ?? state.dir
  if (state.status !== 'running' || state.queue.length >= MAX_QUEUE) return state
  if (dir === last || dir === OPPOSITE[last]) return state
  return { ...state, queue: [...state.queue, dir] }
}

export function togglePause(state: GameState): GameState {
  if (state.status === 'over') return state
  return { ...state, status: state.status === 'running' ? 'paused' : 'running' }
}

export function step(state: GameState, rand: Rand): GameState {
  if (state.status !== 'running') return state
  const [first, ...queue] = state.queue
  const dir = first ?? state.dir
  const d = DELTA[dir]
  const moved = { x: state.snake[0].x + d.x, y: state.snake[0].y + d.y }
  const head = state.wrap ? wrapCell(moved) : moved
  const eats = same(head, state.food)
  const body = eats ? state.snake : state.snake.slice(0, -1)
  if (outside(head) || body.some((c) => same(c, head))) return { ...state, dir, queue, status: 'over' }
  const snake = [head, ...body]
  return {
    ...state,
    snake,
    dir,
    queue,
    food: eats ? placeFood(snake, rand) : state.food,
    score: state.score + (eats ? 1 : 0),
  }
}
