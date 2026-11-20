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
// head 7,7 and food 0,0: up 7 cells, then left 7 cells; the meal is the last left tick.
const approach = () => {
  fireEvent.keyDown(window, { key: 'ArrowUp' })
  tick(7)
  fireEvent.keyDown(window, { key: 'ArrowLeft' })
  tick(6)
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
