import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App.tsx'

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(Math, 'random').mockReturnValue(0)
})
afterEach(() => {
  localStorage.clear()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const tick = (n = 1) => {
  for (let i = 0; i < n; i++) act(() => vi.advanceTimersByTime(200))
}
const cls = () => screen.getByTestId('head').classList
// head 7,7 and food 8,0: up 7 cells, then right; the meal is the right tick.
const approach = () => {
  fireEvent.keyDown(window, { key: 'ArrowUp' })
  tick(7)
  fireEvent.keyDown(window, { key: 'ArrowRight' })
}

test('the head gulps on the tick it eats, and the turn nudge does not play with it', () => {
  // given
  render(<App />)
  approach()
  expect(cls().contains('head-eat')).toBe(false)

  // when
  tick()

  // then
  expect(screen.getByTestId('eat-ring')).toBeTruthy()
  expect(cls().contains('head-eat')).toBe(true)
  expect(cls().contains('head-turn')).toBe(false)
})

test('the head does not gulp on the turn after a meal', () => {
  // given
  render(<App />)
  approach()
  tick()

  // when
  fireEvent.keyDown(window, { key: 'ArrowDown' })
  tick()

  // then
  expect(cls().contains('head-eat')).toBe(false)
  expect(cls().contains('head-turn')).toBe(true)
})

test('a +1 label shows on the head cell on a meal and is gone after 600 ms', () => {
  // given
  render(<App />)
  approach()
  expect(screen.queryByTestId('gain-label')).toBeNull()

  // when
  tick()

  // then
  const label = screen.getByTestId('gain-label')
  expect(label.textContent).toBe('+1')
  expect(label.getAttribute('aria-hidden')).toBe('true')
  expect(label.classList.contains('gain-down')).toBe(true) // food at the top row: floats down
  act(() => vi.advanceTimersByTime(600))
  expect(screen.queryByTestId('gain-label')).toBeNull()
})

test('no label is left on the board when the game is paused', () => {
  // given
  render(<App />)
  approach()
  tick()

  // when
  fireEvent.keyDown(window, { key: ' ' })

  // then
  expect(screen.queryByTestId('gain-label')).toBeNull()
})
