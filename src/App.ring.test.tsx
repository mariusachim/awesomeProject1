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

const run = (ms: number) => {
  for (let t = 0; t < ms; t += 200) act(() => vi.advanceTimersByTime(200))
}
test('no ring shows before a meal', () => {
  // given
  render(<App />)

  // when
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  run(200)

  // then
  expect(screen.queryByTestId('eat-ring')).toBeNull()
})

test('a ring appears on the eaten cell, under the snake, and is keyed by the score', () => {
  // given: head 7,7 and food 0,0 at random 0
  render(<App />)
  fireEvent.keyDown(window, { key: 'ArrowUp' })
  run(1400)
  fireEvent.keyDown(window, { key: 'ArrowLeft' })

  // when
  run(1400)

  // then
  const ring = screen.getByTestId('eat-ring')
  expect(ring.getAttribute('data-pos')).toBe('0,0')
  expect(ring.getAttribute('aria-hidden')).toBe('true')
  expect(screen.getAllByTestId('eat-ring')).toHaveLength(1)
  expect(ring.compareDocumentPosition(screen.getByTestId('head')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})
