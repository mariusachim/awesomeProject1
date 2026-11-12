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
const warned = () => screen.getByTestId('board').className.includes('board-wall')

test('the board is outlined while the head moves toward the edge, and not after a turn', () => {
  // given
  render(<App />)
  fireEvent.keyDown(window, { key: 'ArrowUp' })

  // when
  tick(6)

  // then
  expect(warned()).toBe(false)

  // when
  tick(1)

  // then
  expect(warned()).toBe(true)

  // when
  fireEvent.keyDown(window, { key: 'ArrowLeft' })
  tick(1)

  // then
  expect(warned()).toBe(false)
})

test('wrap-around mode shows no outline', () => {
  // given
  localStorage.setItem(KEY, 'wrap')
  render(<App />)
  fireEvent.keyDown(window, { key: 'ArrowUp' })

  // when
  tick(7)

  // then
  expect(warned()).toBe(false)
})
