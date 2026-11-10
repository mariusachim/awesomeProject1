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

// The start snake has length 1 on screen; it runs up into the wall.
const finish = () => {
  fireEvent.keyDown(window, { key: 'ArrowUp' })
  act(() => vi.advanceTimersByTime(200 * 30))
}
const lines = () =>
  Array.from(screen.getByTestId('board-overlay').querySelectorAll('[data-text]')).map((e) => e.getAttribute('data-text'))
const shown = (text: string) => lines().includes(text) && screen.getAllByText(text).length === 1

test('a record is shown and saved when none exists', () => {
  // given
  render(<App />)

  // when
  finish()

  // then
  expect(shown('Longest: 1')).toBe(true)
  expect(localStorage.getItem('snake.longest')).toBe('1')
})

test('a longer saved record is shown instead of the current length', () => {
  // given
  localStorage.setItem('snake.longest', '9')
  render(<App />)

  // when
  finish()

  // then
  expect(shown('Longest: 9')).toBe(true)
  expect(localStorage.getItem('snake.longest')).toBe('9')
})

test.each(['abc', '-3', '2.5', '', '0'])('a bad saved value %j counts as the current length', (bad) => {
  // given
  localStorage.setItem('snake.longest', bad)
  render(<App />)

  // when
  finish()

  // then
  expect(shown('Longest: 1')).toBe(true)
  expect(localStorage.getItem('snake.longest')).toBe('1')
})

test('the game works and shows the record when storage is blocked', () => {
  // given
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('denied')
  })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('denied')
  })
  render(<App />)

  // when
  finish()

  // then
  expect(shown('Longest: 1')).toBe(true)
})
