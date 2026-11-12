import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App.tsx'

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(Math, 'random').mockReturnValue(0.99)
})
afterEach(() => {
  localStorage.clear()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

// One tick per act: React batches the steps of a single act into one render, and the trail sees one move per render.
const run = (ms: number) => {
  for (let t = 0; t < ms; t += 200) act(() => vi.advanceTimersByTime(200))
}
const opacity = (el: HTMLElement) => Number(el.style.getPropertyValue('--ghost'))

test('no ghost shows before the snake moves', () => {
  // when
  render(<App />)

  // then
  expect(screen.queryAllByTestId('ghost')).toHaveLength(0)
})

test('the cells behind the tail glow, at most 3, each fainter than the one before', () => {
  // given
  render(<App />)
  fireEvent.keyDown(window, { key: 'ArrowRight' })

  // when
  run(800)

  // then
  const ghosts = screen.getAllByTestId('ghost')
  expect(ghosts).toHaveLength(3)
  expect(opacity(ghosts[0])).toBeGreaterThan(opacity(ghosts[1]))
  expect(opacity(ghosts[1])).toBeGreaterThan(opacity(ghosts[2]))
  expect(opacity(ghosts[2])).toBeGreaterThan(0)
})

test('a ghost is drawn under the snake', () => {
  // given
  render(<App />)
  fireEvent.keyDown(window, { key: 'ArrowRight' })

  // when
  run(800)

  // then
  const board = screen.getByTestId('board')
  const ghost = screen.getAllByTestId('ghost')[0]
  const head = screen.getByTestId('head')
  expect(ghost.compareDocumentPosition(head) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(board.contains(ghost)).toBe(true)
})

test('no ghost shows while the game is paused', () => {
  // given
  render(<App />)
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  run(800)
  expect(screen.getAllByTestId('ghost')).toHaveLength(3)

  // when
  fireEvent.keyDown(window, { key: 'p' })

  // then
  expect(screen.queryAllByTestId('ghost')).toHaveLength(0)
})

test('no ghost shows when the game is over', () => {
  // given
  render(<App />)
  fireEvent.keyDown(window, { key: 'ArrowRight' })

  // when
  run(20000)

  // then
  expect(screen.getByTestId('board-overlay')).toBeTruthy()
  expect(screen.queryAllByTestId('ghost')).toHaveLength(0)
})
