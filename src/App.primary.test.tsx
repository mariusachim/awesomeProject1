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

const accent = (name: RegExp) => screen.getByRole('button', { name }).classList.contains('primary')

test('Resume has the accent while paused and loses it on resume', () => {
  // given
  render(<App />)
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  expect(accent(/pause/i)).toBe(false)

  // when
  fireEvent.keyDown(window, { key: 'p' })

  // then
  expect(accent(/resume/i)).toBe(true)
  expect(accent(/walls|solid|wrap/i)).toBe(false)
  expect(accent(/mute/i)).toBe(false)

  // when
  fireEvent.keyDown(window, { key: 'p' })

  // then
  expect(accent(/pause/i)).toBe(false)
})

test('Restart has the accent on game over', () => {
  // given
  render(<App />)
  fireEvent.keyDown(window, { key: 'ArrowUp' })

  // when
  act(() => vi.advanceTimersByTime(5000))

  // then
  expect(accent(/restart/i)).toBe(true)
})
