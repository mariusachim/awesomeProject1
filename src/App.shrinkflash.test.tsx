import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App.tsx'

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  localStorage.clear()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const run = (ms: number) => {
  for (let t = 0; t < ms; t += 200) act(() => vi.advanceTimersByTime(200))
}
const flashed = () => document.querySelector('[data-shrunk]')

test('a red apple does not flash the Length stat', () => {
  // given
  vi.spyOn(Math, 'random').mockReturnValueOnce(49.5 / 105).mockReturnValue(0.99)
  render(<App />)

  // when
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  run(200)

  // then
  expect(flashed()).toBeNull()
})

test('eating the shrink triangle flashes the Length stat, and a restart clears it', () => {
  // given: the first food is one cell ahead; the shrink fruit lands on the cell after it
  vi.spyOn(Math, 'random').mockReturnValueOnce(49.5 / 105).mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(0.99).mockReturnValueOnce(109.5 / 220).mockReturnValue(0.5)
  render(<App />)
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  run(200)
  expect(flashed()).toBeNull()

  // when
  run(200)

  // then
  expect(flashed()?.textContent).toContain('Length')

  // when
  fireEvent.keyDown(window, { key: 'r' })

  // then
  expect(flashed()).toBeNull()
})
