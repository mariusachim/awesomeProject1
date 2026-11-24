import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App.tsx'
import { cellShade } from './game.ts'

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('matchMedia', () => ({ matches: true })) // the start fade-out has its own tests
  vi.spyOn(Math, 'random').mockReturnValue(0)
})
afterEach(() => {
  localStorage.clear()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const countdown = () => {
  for (let i = 0; i < 3; i++) act(() => vi.advanceTimersByTime(1000))
}
const key = (k: string) => fireEvent.keyDown(window, { key: k })
const overlay = () => screen.queryByTestId('board-overlay')
const label = () => overlay()?.querySelector('.overlay-panel')?.getAttribute('data-label')

test('a new game in the ready state shows the start hint on the dimmed board, hidden from screen readers', () => {
  // given / when
  render(<App />)

  // then
  expect(label()).toBeNull()
  expect(overlay()?.getAttribute('aria-hidden')).toBe('true')
  expect(screen.getByTestId('board').contains(overlay())).toBe(true)
  expect(lines()).toEqual(['Press an arrow key or WASD to start', 'Swipe on the board to start', 'Walls: the edge ends the run', 'Start speed: normal'])
})

test('the start hint is spoken once, by the sr-only status below the board', () => {
  // given / when
  render(<App />)

  // then
  expect(screen.getAllByText('Press an arrow key or WASD to start')).toHaveLength(1)
  expect(screen.getByRole('status').className).toContain('sr-only')
})

test('the start overlay goes away on the first key', () => {
  // given
  render(<App />)

  // when
  key('ArrowRight')

  // then
  expect(overlay()).toBeNull()
})

test('pausing dims the board with a Paused label, and resuming removes it', () => {
  // given
  render(<App />)
  key('ArrowRight')

  // when
  key('p')

  // then
  expect(label()).toBe('Paused')
  expect(screen.getByTestId('board').contains(overlay())).toBe(true)
  key('p')
  expect(overlay()).toBeNull()
})

test('game over dims the board with a Game over label and Restart still works', () => {
  // given
  render(<App />)
  key('ArrowUp')

  // when
  act(() => vi.advanceTimersByTime(200 * 30))

  // then
  expect(label()).toBe('Game over: you hit the wall')
  expect(screen.getByRole('alert').textContent).toContain('Game over: you hit the wall')
  fireEvent.click(screen.getByRole('button', { name: 'Restart' }))
  expect(overlay()).toBeNull()
})

test('the board border turns red on game over, not when paused, and resets on restart', () => {
  // given
  render(<App />)
  const board = screen.getByTestId('board')
  key('ArrowRight')
  key('p')

  // when / then
  expect(board.classList.contains('board-over')).toBe(false)
  key('p')
  countdown()
  key('ArrowUp')
  act(() => vi.advanceTimersByTime(200 * 30))
  expect(board.classList.contains('board-over')).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: 'Restart' }))
  expect(board.classList.contains('board-over')).toBe(false)
})

test('the overlay is hidden from screen readers and does not repeat the text', () => {
  // given
  render(<App />)
  key('ArrowRight')

  // when
  key('p')

  // then
  expect(overlay()?.getAttribute('aria-hidden')).toBe('true')
  expect(screen.getAllByText('Paused')).toHaveLength(1)
})

test('while paused the status text is only spoken, so Paused is visible once, on the board', () => {
  // given
  render(<App />)
  key('ArrowRight')

  // when
  key('p')

  // then
  const status = screen.getByRole('status')
  expect(status.textContent).toBe('Paused')
  expect(status.className).toContain('sr-only')
})

const crash = () => {
  key('ArrowUp')
  act(() => vi.advanceTimersByTime(200 * 30))
}
const lines = () => Array.from(screen.getByTestId('board-overlay').querySelectorAll('[data-text]')).map((e) => e.getAttribute('data-text'))

test('pausing shows the resume hint for keyboard and touch on the board', () => {
  // given
  render(<App />)
  key('ArrowRight')

  // when
  key('p')

  // then
  expect(lines()).toEqual(['Press Space or P to resume', 'Tap Resume'])
  key('p')
  expect(overlay()).toBeNull()
})

test('game over shows the final score and a restart hint on the board', () => {
  // given
  render(<App />)

  // when
  crash()

  // then
  expect(lines()).toEqual(['Final score: 0', 'Time\u00a00:01', 'Apples\u00a00', 'Longest\u00a01', 'Press Enter or R to restart', 'Tap Restart'])
})

test('Paused explains the special foods, and the legend is gone while running', () => {
  // given
  render(<App />)
  key('ArrowRight')

  // when
  key('p')

  // then
  const legend = screen.getByTestId('food-legend')
  expect(legend.textContent).toBe('grows the snakeslows the snakeshortens the snakeworth x3')
  expect(legend.querySelectorAll('li')).toHaveLength(4)
  expect(legend.querySelectorAll('.legend-swatch[aria-hidden="true"]')).toHaveLength(4)
  expect(legend.querySelectorAll('.legend-more')).toHaveLength(3)
  expect(screen.getByText(/Diamond slows the snake/).className).toContain('sr-only')
  key('p')
  expect(screen.queryByTestId('food-legend')).toBeNull()
})

const hHint = () => screen.getByTestId('board-overlay').querySelector('[data-text="H resets the high score"]')

test('the H hint on Paused is key-only, so touch screens hide it', () => {
  // given
  localStorage.setItem('snake.highScore', '7')
  render(<App />)
  key('ArrowRight')

  // when
  key('p')

  // then
  expect(hHint()?.classList.contains('hint-keys')).toBe(true)
})

test('the H hint on Game over is key-only, so touch screens hide it', () => {
  // given
  localStorage.setItem('snake.highScore', '7')
  render(<App />)

  // when
  crash()

  // then
  expect(hHint()?.classList.contains('hint-keys')).toBe(true)
})

test('the time survived leaves out the pause and the countdown, and a new game starts at zero', () => {
  // given
  render(<App />)
  key('ArrowUp')
  act(() => vi.advanceTimersByTime(200))
  key('p')
  act(() => vi.advanceTimersByTime(60000))
  key('p')
  countdown()

  // when
  act(() => vi.advanceTimersByTime(200 * 30))

  // then
  expect(lines()[1]).toMatch(/^Time\u00a00:0\d$/)
  expect(lines().slice(2, 4)).toEqual(['Apples\u00a00', 'Longest\u00a01'])
  key('Enter')
  crash()
  expect(lines().slice(1, 4)).toEqual(['Time\u00a00:01', 'Apples\u00a00', 'Longest\u00a01'])
})

test('game over speaks the result once and adds nothing visible below the board', () => {
  // given
  render(<App />)

  // when
  crash()

  // then
  const alert = screen.getByRole('alert')
  expect(screen.getAllByText('Game over')).toHaveLength(1)
  expect(screen.getAllByText('Final score: 0')).toHaveLength(1)
  const visible = Array.from(alert.children).filter((e) => !e.classList.contains('sr-only'))
  expect(visible).toEqual([])
})

test('the game over overlay shows the streak meals, and screen readers hear them', () => {
  // given: eat the food at 0,0, then the next one at 4,0 six moves later
  render(<App />)
  key('ArrowUp')
  act(() => vi.advanceTimersByTime(200 * 7))
  key('ArrowLeft')
  act(() => vi.advanceTimersByTime(200 * 7))
  key('ArrowDown')
  act(() => vi.advanceTimersByTime(200))
  key('ArrowRight')
  act(() => vi.advanceTimersByTime(200 * 4))
  key('ArrowUp')

  // when
  act(() => vi.advanceTimersByTime(200 * 30))

  // then
  expect(lines()).toContain('Streak meals: 1')
  expect(screen.getAllByText('Streak meals: 1')).toHaveLength(1)
})

test('game over reads the apple count with the other lines', () => {
  // given
  render(<App />)

  // when
  crash()

  // then
  expect(screen.getByRole('alert').textContent).toContain('Apples: 0')
})

test('no streak meals line when the game ended without one', () => {
  // given / when
  render(<App />)
  crash()

  // then
  expect(lines().some((l) => l?.startsWith('Streak'))).toBe(false)
  expect(screen.queryByText(/Streak meals/)).toBeNull()
})

test('a new high score shows on the board too', () => {
  // given
  render(<App />)
  // the food sits at 0,0 and the snake starts at 7,7 heading right
  key('ArrowUp')
  act(() => vi.advanceTimersByTime(200 * 7))
  key('ArrowLeft')
  act(() => vi.advanceTimersByTime(200 * 7))
  act(() => vi.advanceTimersByTime(200 * 30))

  // when
  const text = lines()

  // then
  expect(text).toContain('New high score!')
})

test('the head is red on game over, green while running, and the game over panel sits away from it', () => {
  // given
  render(<App />)
  expect(screen.getByTestId('head').style.background).toBe('rgb(119, 238, 119)')

  // when
  crash()

  // then
  expect(screen.getByTestId('head').style.background).toBe('rgb(255, 51, 51)')
  expect(overlay()?.classList.contains('board-overlay-bottom')).toBe(true)
})

test('every overlay, game over included, uses a light dim so the snake and food stay visible', () => {
  // given
  render(<App />)

  // when / then
  expect(overlay()?.classList.contains('board-overlay-light')).toBe(true)
  key('ArrowRight')
  key('p')
  expect(overlay()?.classList.contains('board-overlay-light')).toBe(true)
  key('p')
  countdown()
  act(() => vi.advanceTimersByTime(200 * 30))
  expect(overlay()?.classList.contains('board-overlay-light')).toBe(true)
})

test('the panel keeps off the food in the top row, even when the snake head is low', () => {
  // given
  render(<App />)

  // when / then
  expect(overlay()?.classList.contains('board-overlay-bottom')).toBe(true)
  key('ArrowRight')
  key('p')
  expect(overlay()?.classList.contains('board-overlay-bottom')).toBe(true)
  key('p')
  key('ArrowDown')
  act(() => vi.advanceTimersByTime(200 * 3))
  key('p')
  expect(overlay()?.classList.contains('board-overlay-bottom')).toBe(true)
  expect(overlay()?.classList.contains('board-overlay-top')).toBe(false)
})

test('ready and paused dim the tiles below the food and snake, so the pieces keep their colour', () => {
  // given
  render(<App />)
  const below = (a: Node, b: Node) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)

  // when / then
  expect(below(screen.getByTestId('board-dim'), screen.getByTestId('food'))).toBe(true)
  expect(below(screen.getByTestId('board-dim'), screen.getByTestId('head'))).toBe(true)
  expect(overlay()?.classList.contains('board-overlay-under')).toBe(true)
  key('ArrowRight')
  key('p')
  expect(screen.getByTestId('board-dim')).toBeTruthy()
  key('p')
  expect(screen.queryByTestId('board-dim')).toBeNull()
})

test('game over keeps the dim over everything', () => {
  // given
  render(<App />)

  // when
  crash()

  // then
  expect(screen.queryByTestId('board-dim')).toBeNull()
  expect(overlay()?.classList.contains('board-overlay-under')).toBe(false)
})

test('Enter restarts after game over', () => {
  // given
  render(<App />)
  crash()

  // when
  key('Enter')

  // then
  expect(overlay()).toBeNull()
})

test('only the start hints carry the pulse class, and none remains after the start', () => {
  // given
  render(<App />)

  // when / then
  expect(overlay()?.querySelectorAll('.start-hint')).toHaveLength(2)

  // when
  key('ArrowRight')

  // then
  expect(document.querySelector('.start-hint')).toBeNull()
})

test('paused with no snake cell under the panel leaves every cell unmarked', () => {
  // given
  render(<App />)
  key('ArrowDown')
  act(() => vi.advanceTimersByTime(1000 * 4))

  // when
  key('p')

  // then
  expect(document.querySelector('.snake-over-panel')).toBeNull()
})

test('running or ready never marks a snake cell as over the panel', () => {
  // given / when
  render(<App />)

  // then
  expect(document.querySelector('.snake-over-panel')).toBeNull()
})

test('paused with the head in a row the panel covers draws the head above the panel', () => {
  // given
  render(<App />)
  key('ArrowRight')

  // when
  key('p')

  // then
  expect(screen.getByTestId('head').classList.contains('snake-over-panel')).toBe(true)
})

const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const hex = (rgb: string) => '#' + (rgb.match(/\d+/g) ?? []).map((n) => Number(n).toString(16).padStart(2, '0')).join('')

test('the crashed head fill is a clear red with at least 3:1 contrast with both board cell colours', () => {
  // given
  render(<App />)

  // when
  crash()

  // then
  const head = lum(hex(screen.getByTestId('head').style.background))
  for (const shade of [cellShade(0, 0), cellShade(1, 0)]) {
    const cell = lum(shade)
    expect((head + 0.05) / (cell + 0.05)).toBeGreaterThanOrEqual(3)
  }
})

test('the start panel lists the special foods like the paused panel, and the legend goes with the first key', () => {
  // given
  render(<App />)

  // when
  const legend = screen.getByTestId('food-legend')

  // then
  expect(legend.textContent).toBe('grows the snakeslows the snakeshortens the snakeworth x3')
  expect(legend.querySelectorAll('li')).toHaveLength(4)
  key('ArrowRight')
  expect(screen.queryByTestId('food-legend')).toBeNull()
})
