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

const head = () => screen.getByTestId('head').getAttribute('data-pos')

test.each(['r', 'R'])('key "%s" restarts a paused game', (key) => {
  // given
  render(<App />)
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  act(() => vi.advanceTimersByTime(400))
  fireEvent.keyDown(window, { key: 'p' })

  // when
  fireEvent.keyDown(window, { key })

  // then
  expect(head()).toBe('7,7')
  expect(screen.queryByText('Press Space or P to resume')).toBeNull()
})

test('R does nothing while the game waits for the first key', () => {
  // given
  render(<App />)

  // when
  fireEvent.keyDown(window, { key: 'r' })

  // then
  expect(screen.getByRole('status').textContent).toContain('to start')
})
