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

test('a wall crash shows the wall tip once and announces it', () => {
  // given
  const { container } = render(<App />)

  // when
  fireEvent.keyDown(window, { key: 'ArrowUp' })
  act(() => vi.advanceTimersByTime(200 * 30))

  // then
  const tip = 'Turn before the edge, or switch Walls to wrap.'
  expect(container.querySelectorAll(`.overlay-detail[data-text="${tip}"]`)).toHaveLength(1)
  expect(screen.getByRole('alert').textContent).toContain(tip)
})
