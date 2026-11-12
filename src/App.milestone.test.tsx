import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App.tsx'

// The first apple is the milestone, so the test does not need to play 10 apples.
vi.mock('./game.ts', async (orig) => ({
  ...(await orig<typeof import('./game.ts')>()),
  isMilestone: (n: number) => n === 1,
}))

const freqs: number[] = []

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(Math, 'random').mockReturnValue(0)
  localStorage.clear()
  freqs.length = 0
  class Ctx {
    currentTime = 0
    destination = {}
    createGain = () => ({ gain: { value: 0 }, connect: () => {} })
    createOscillator = () => {
      const o = {
        connect: () => {},
        stop: () => {},
        start: () => freqs.push(o.frequency.value),
        frequency: { value: 0 },
      }
      return o
    }
  }
  vi.stubGlobal('AudioContext', Ctx)
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const tick = (n = 1) => act(() => vi.advanceTimersByTime(200 * n))
const eatFood = () => {
  fireEvent.keyDown(window, { key: 'ArrowUp' })
  tick(7)
  fireEvent.keyDown(window, { key: 'ArrowLeft' })
  tick(7)
}
const flashing = () => screen.getByTestId('board').className.includes('board-milestone')

test('a milestone apple plays the higher chime and flashes the board for half a second', () => {
  // given
  render(<App />)

  // when
  eatFood()

  // then
  expect(freqs).toEqual([1320])
  expect(flashing()).toBe(true)
  act(() => vi.advanceTimersByTime(500))
  expect(flashing()).toBe(false)
})

test('a muted milestone flashes without sound', () => {
  // given
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Mute' }))

  // when
  eatFood()

  // then
  expect(freqs).toEqual([])
  expect(flashing()).toBe(true)
})
