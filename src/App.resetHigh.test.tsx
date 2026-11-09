import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App.tsx'

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(Math, 'random').mockReturnValue(0)
  localStorage.setItem('snake.highScore', '7')
})
afterEach(() => {
  localStorage.clear()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const shown = () => screen.getByText(/^High score: \d+$/).textContent
const press = (key: string) => fireEvent.keyDown(window, { key })

test('H resets the high score while paused, and it stays reset after a reload', () => {
  // given
  const { unmount } = render(<App />)
  press('ArrowRight')
  press('p')
  expect(shown()).toBe('High score: 7')

  // when
  press('h')

  // then
  expect(shown()).toBe('High score: 0')
  unmount()
  render(<App />)
  expect(shown()).toBe('High score: 0')
})

test('H resets the high score while waiting for the first key, without starting', () => {
  // given
  render(<App />)

  // when
  press('H')

  // then
  expect(shown()).toBe('High score: 0')
  expect(screen.getByRole('status').textContent).toContain('to start')
})

test('H does nothing while the game runs', () => {
  // given
  render(<App />)
  press('ArrowRight')
  act(() => vi.advanceTimersByTime(200))

  // when
  press('h')

  // then
  expect(shown()).toBe('High score: 7')
})

test('H resets the high score when the game is over', () => {
  // given
  render(<App />)
  press('ArrowUp')
  act(() => vi.advanceTimersByTime(3000))
  expect(screen.getByRole('alert')).not.toBeNull()

  // when
  press('h')

  // then
  expect(shown()).toBe('High score: 0')
})

test('the paused panel hints at the reset key', () => {
  // given
  const { container } = render(<App />)
  press('ArrowRight')

  // when
  press('p')

  // then
  expect(container.querySelector('[data-text="H resets the high score"]')).not.toBeNull()
})
