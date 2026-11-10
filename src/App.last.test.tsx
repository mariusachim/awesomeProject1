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

const crash = () => {
  fireEvent.keyDown(window, { key: 'ArrowUp' })
  act(() => vi.advanceTimersByTime(200 * 30))
}

test('no last score before a game ends', () => {
  // given / when
  render(<App />)

  // then
  expect(screen.queryByText(/^Last/)).toBeNull()
})

test('the score of a finished game shows as Last after a restart', () => {
  // given
  render(<App />)
  crash()

  // when
  fireEvent.keyDown(window, { key: 'Enter' })

  // then
  expect(screen.getByText('Last: 0')).toBeTruthy()
})

test('a reload forgets the last score', () => {
  // given
  const first = render(<App />)
  crash()
  first.unmount()

  // when
  render(<App />)

  // then
  expect(screen.queryByText(/^Last/)).toBeNull()
})
