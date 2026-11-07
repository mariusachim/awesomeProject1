import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App.tsx'

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(Math, 'random').mockReturnValue(0)
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const head = () => screen.getByTestId('head').getAttribute('data-pos')
const tick = (n = 1) => act(() => vi.advanceTimersByTime(200 * n))
const board = () => document.querySelector('.board') as HTMLElement
const startKey = () => fireEvent.keyDown(window, { key: 'ArrowRight' })

// A touch on the board that moves at least 30 px turns the snake.
const swipe = (dx: number, dy: number) => {
  fireEvent.touchStart(board(), { changedTouches: [{ clientX: 100, clientY: 100 }] })
  fireEvent.touchEnd(board(), { changedTouches: [{ clientX: 100 + dx, clientY: 100 + dy }] })
}

test.each([
  [0, 40, '7,8'],
  [0, -40, '7,6'],
])('a swipe of %i,%i turns the snake', (dx, dy, pos) => {
  // given
  render(<App />)
  startKey()

  // when
  swipe(dx, dy)
  tick()

  // then
  expect(head()).toBe(pos)
})

test('a swipe against the snake is ignored', () => {
  // given
  render(<App />)
  startKey()

  // when
  swipe(-40, 0)
  tick()

  // then
  expect(head()).toBe('8,7')
})

test('a short touch does not turn the snake', () => {
  // given
  render(<App />)
  startKey()

  // when
  swipe(0, 20)
  tick()

  // then
  expect(head()).toBe('8,7')
})

test('a swipe starts the game in the swipe direction', () => {
  // given
  render(<App />)

  // when
  swipe(0, 40)
  tick()

  // then
  expect(head()).toBe('7,8')
  expect(screen.queryByText('Press an arrow key or WASD to start')).toBeNull()
})

test('the board does not scroll the page', () => {
  // given
  render(<App />)

  // when / then
  expect(board().style.touchAction).toBe('none')
})

test('a swipe on a finished game changes nothing', () => {
  // given
  render(<App />)
  startKey()
  tick(10)
  const before = document.body.innerHTML

  // when
  swipe(0, 40)

  // then
  expect(screen.getByText('Game over')).toBeTruthy()
  expect(document.body.innerHTML).toBe(before)
})
