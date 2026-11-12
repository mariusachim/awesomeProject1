import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App.tsx'

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(Math, 'random').mockReturnValue(0)
  localStorage.clear()
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const tick = (n = 1) => act(() => vi.advanceTimersByTime(200 * n))
const eatFood = () => {
  fireEvent.keyDown(window, { key: 'ArrowUp' })
  tick(7)
  fireEvent.keyDown(window, { key: 'ArrowLeft' })
  tick(7)
}
const announced = () => screen.queryByText(/^Score \d+$/)

test('eating an apple announces the new score politely', () => {
  // given
  render(<App />)

  // when
  eatFood()

  // then
  const region = announced()!
  expect(region.getAttribute('role')).toBe('status')
  expect(region.className).toContain('sr-only')
})

test('moving without eating leaves the announcement unchanged', () => {
  // given
  render(<App />)
  eatFood()
  const before = announced()!.textContent

  // when
  fireEvent.keyDown(window, { key: 'ArrowDown' })
  tick(1)

  // then
  expect(announced()!.textContent).toBe(before)
})

test('game over adds no score announcement', () => {
  // given
  render(<App />)
  eatFood()

  // when
  tick(30)

  // then
  expect(screen.getByRole('alert').textContent).toContain('Game over')
  expect(announced()).toBeNull()
})

test('a restarted game announces its own first score', () => {
  // given
  render(<App />)
  eatFood()
  tick(30)
  fireEvent.keyDown(window, { key: 'r' })
  expect(announced()).toBeNull()

  // when
  eatFood()

  // then
  expect(announced()).not.toBeNull()
})
