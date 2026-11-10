import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App.tsx'
import { LONGEST_KEY } from './highScore.ts'

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(Math, 'random').mockReturnValue(0)
})
afterEach(() => {
  localStorage.clear()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

// Going up crashes into the wall with the starting snake, length 1.
const crash = () => {
  fireEvent.keyDown(window, { key: 'ArrowUp' })
  act(() => vi.advanceTimersByTime(200 * 30))
}
const longest = () => document.querySelector('[data-text^="Longest"]')?.getAttribute('data-text')

test('with no record, the current length is the record and is saved', () => {
  // given
  render(<App />)

  // when
  crash()

  // then
  expect(longest()).toBe('Longest: 1')
  expect(localStorage.getItem(LONGEST_KEY)).toBe('1')
})

test('a shorter snake shows the saved record', () => {
  // given
  localStorage.setItem(LONGEST_KEY, '9')
  render(<App />)

  // when
  crash()

  // then
  expect(longest()).toBe('Longest: 9')
  expect(localStorage.getItem(LONGEST_KEY)).toBe('9')
})

test('a bad saved value counts as the current length', () => {
  // given
  localStorage.setItem(LONGEST_KEY, 'abc')
  render(<App />)

  // when
  crash()

  // then
  expect(longest()).toBe('Longest: 1')
})

test('blocked storage still shows the record', () => {
  // given
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('denied')
  })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('denied')
  })
  render(<App />)

  // when
  crash()

  // then
  expect(longest()).toBe('Longest: 1')
})
