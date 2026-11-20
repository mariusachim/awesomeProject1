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

const eatShrinkAhead = () => {
  // given: the first food is one cell ahead; the shrink fruit lands on the cell after it
  vi.spyOn(Math, 'random').mockReset()
  vi.spyOn(Math, 'random').mockReturnValueOnce(110.5 / 222).mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(0.99).mockReturnValueOnce(109.5 / 220).mockReturnValue(0.5)
  render(<App />)
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  run(200)
  expect(screen.getByTestId('shrink').getAttribute('data-pos')).toBe('9,7')
  run(200)
}

test('eating the shrink triangle bursts a blue ring where it was', () => {
  // when
  eatShrinkAhead()

  // then
  const ring = screen.getByTestId('eat-ring')
  expect(ring.getAttribute('data-pos')).toBe('9,7')
  expect(ring.className).toContain('eat-ring-shrink')
})
