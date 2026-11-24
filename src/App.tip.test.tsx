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

const key = (k: string) => fireEvent.keyDown(window, { key: k })
const WALL = 'Turn before the edge, or switch Walls to wrap.'

test('a wall crash shows a tip once, on the panel and in the announcement', () => {
  // given
  const { container } = render(<App />)

  // when
  key('ArrowUp')
  act(() => vi.advanceTimersByTime(200 * 40))

  // then
  expect(container.querySelector(`.overlay-detail[data-text="${WALL}"]`)).not.toBeNull()
  expect(screen.getByRole('alert').textContent).toContain(WALL)
})

test('no tip shows while playing', () => {
  // given
  const { container } = render(<App />)

  // when
  key('ArrowUp')

  // then
  expect(container.querySelector(`[data-text="${WALL}"]`)).toBeNull()
})
