import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App.tsx'

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
  vi.spyOn(Math, 'random').mockReturnValue(0)
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  localStorage.clear()
})

const pulsing = () => screen.getByTestId('board').className.includes('board-walls-pulse')
const start = () => fireEvent.keyDown(window, { key: 'ArrowRight' })

test('R in a running game pulses the board for 300 ms, then the game keeps running', () => {
  // given
  render(<App />)
  start()
  act(() => vi.advanceTimersByTime(200))

  // when
  fireEvent.keyDown(window, { key: 'r' })

  // then
  expect(pulsing()).toBe(true)
  act(() => vi.advanceTimersByTime(300))
  expect(pulsing()).toBe(false)
})

test('R in a paused game pulses the board', () => {
  // given
  render(<App />)
  start()
  fireEvent.keyDown(window, { key: 'p' })

  // when
  fireEvent.keyDown(window, { key: 'r' })

  // then
  expect(pulsing()).toBe(true)
})

test('the first move and the page load do not pulse', () => {
  // given
  render(<App />)
  expect(pulsing()).toBe(false)

  // when
  start()

  // then
  expect(pulsing()).toBe(false)
})

test('reduced motion restarts without a pulse', () => {
  // given
  vi.stubGlobal('matchMedia', () => ({ matches: true }))
  render(<App />)
  start()

  // when
  fireEvent.keyDown(window, { key: 'r' })

  // then
  expect(pulsing()).toBe(false)
})
