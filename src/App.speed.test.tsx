import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App.tsx'
import { TOP_LEVEL } from './game.ts'

const level = vi.hoisted(() => ({ fixed: false }))
vi.mock('./game.ts', async (orig) => {
  const g = await orig<typeof import('./game.ts')>()
  return { ...g, speedLevel: (s: number) => (level.fixed ? 1 : g.speedLevel(s)) }
})

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(Math, 'random').mockReturnValue(0)
  localStorage.clear()
  level.fixed = false
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
const flashing = () => screen.getByTestId('board').className.includes('board-speed')

test('the apple that raises the speed level flashes the board for 300 ms', () => {
  // given
  render(<App />)

  // when
  eatFood()

  // then
  expect(flashing()).toBe(true)
  act(() => vi.advanceTimersByTime(300))
  expect(flashing()).toBe(false)
})

test('an apple that keeps the speed level does not flash', () => {
  // given
  level.fixed = true
  render(<App />)

  // when
  eatFood()

  // then
  expect(flashing()).toBe(false)
})

test('a new game at the start speed does not flash', () => {
  // given
  render(<App />)
  eatFood()
  act(() => vi.advanceTimersByTime(300))

  // when
  fireEvent.keyDown(window, { key: 'r' })

  // then
  expect(flashing()).toBe(false)
})

test('reduced motion does not flash', () => {
  // given
  vi.stubGlobal('matchMedia', () => ({ matches: true }))
  render(<App />)

  // when
  eatFood()

  // then
  expect(flashing()).toBe(false)
})

const meter = () => screen.getByText('Speed', { selector: '.stat-label' }).parentElement!.querySelector('.stat-meter')!

test('the speed meter starts mostly empty, is hidden from screen readers and grows with the level', () => {
  // given
  render(<App />)
  const width = () => parseFloat((meter().firstElementChild as HTMLElement).style.width)
  const before = width()

  // when
  eatFood()

  // then
  expect(before).toBeLessThan(20)
  expect(width()).toBeGreaterThan(before)
  expect(meter().getAttribute('aria-hidden')).toBe('true')
  expect(screen.getByText('Speed 2')).toBeTruthy()
})

test('the speed meter carries one tick per level step', () => {
  // given
  render(<App />)

  // when / then
  expect((meter() as HTMLElement).style.getPropertyValue('--levels')).toBe(String(TOP_LEVEL))
})
