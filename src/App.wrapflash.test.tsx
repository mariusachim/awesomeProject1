import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App.tsx'
import { KEY } from './wallsMode.ts'

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(Math, 'random').mockReturnValue(0.5)
  localStorage.clear()
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const tick = (n = 1) => act(() => vi.advanceTimersByTime(200 * n))
const side = () => screen.getByTestId('board').getAttribute('data-wrap-side')

test('wrap going right enters at the left edge', () => {
  // given
  localStorage.setItem(KEY, 'wrap')
  render(<App />)
  fireEvent.keyDown(window, { key: 'ArrowRight' })

  // when
  let flashed: string | null = null
  for (let i = 0; i < 30 && !flashed; i++) {
    tick(1)
    flashed = side()
  }

  // then
  expect(flashed).toBe('left')
})

test('wrap going up enters at the bottom edge and the flash clears after 250 ms', () => {
  // given
  localStorage.setItem(KEY, 'wrap')
  render(<App />)
  fireEvent.keyDown(window, { key: 'ArrowUp' })

  // when
  tick(1)
  const before = side()
  let flashed: string | null = null
  for (let i = 0; i < 30 && !flashed; i++) {
    tick(1)
    flashed = side()
  }

  // then
  expect(before).toBe(null)
  expect(flashed).toBe('down')
  act(() => vi.advanceTimersByTime(250))
  expect(side()).toBe(null)
})

test('solid walls never flash', () => {
  // given
  render(<App />)
  fireEvent.keyDown(window, { key: 'ArrowUp' })

  // when / then
  for (let i = 0; i < 12; i++) {
    tick(1)
    expect(side()).toBe(null)
  }
})

test('a flash does not stay when the game is paused', () => {
  // given
  localStorage.setItem(KEY, 'wrap')
  render(<App />)
  fireEvent.keyDown(window, { key: 'ArrowUp' })
  for (let i = 0; i < 30 && !side(); i++) tick(1)
  expect(side()).not.toBe(null)

  // when
  fireEvent.keyDown(window, { key: 'p' })

  // then
  expect(side()).toBe(null)
})
