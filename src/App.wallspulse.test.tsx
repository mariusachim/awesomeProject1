import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App.tsx'
import { KEY } from './wallsMode.ts'

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
  localStorage.clear()
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  localStorage.clear()
})

const pulsing = () => screen.getByTestId('board').className.includes('board-walls-pulse')

test('pressing B pulses the board for 300 ms and then clears the flag', () => {
  // given
  render(<App />)

  // when
  fireEvent.keyDown(window, { key: 'b' })

  // then
  expect(pulsing()).toBe(true)
  act(() => vi.advanceTimersByTime(300))
  expect(pulsing()).toBe(false)
})

test('tapping the Walls button pulses the board', () => {
  // given
  render(<App />)

  // when
  fireEvent.click(screen.getByRole('button', { name: 'Walls: solid' }))

  // then
  expect(pulsing()).toBe(true)
})

test('a mode restored from localStorage does not pulse', () => {
  // given
  localStorage.setItem(KEY, 'wrap')

  // when
  render(<App />)

  // then
  expect(pulsing()).toBe(false)
})

test('reduced motion switches the mode without a pulse', () => {
  // given
  vi.stubGlobal('matchMedia', () => ({ matches: true }))
  render(<App />)

  // when
  fireEvent.keyDown(window, { key: 'b' })

  // then
  expect(screen.getByRole('button', { name: 'Walls: wrap' })).toBeTruthy()
  expect(pulsing()).toBe(false)
})
