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

const head = () => screen.getByTestId('head').getAttribute('data-pos')

const crash = () => {
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  act(() => vi.advanceTimersByTime(20000))
}

test.each(['r', 'Enter'])('restart with %s holds the snake with the arrow ahead, then it moves', (key) => {
  // given
  render(<App />)
  crash()

  // when
  fireEvent.keyDown(window, { key })

  // then
  expect(screen.getByTestId('chevron').getAttribute('aria-hidden')).toBe('true')
  act(() => vi.advanceTimersByTime(500))
  expect(head()).toBe('7,7')
  act(() => vi.advanceTimersByTime(100 + 600))
  expect(screen.queryByTestId('chevron')).toBeNull()
  expect(head()).not.toBe('7,7')
})

test('a turn key during the beat ends it and is the first turn', () => {
  // given
  render(<App />)
  crash()
  fireEvent.keyDown(window, { key: 'r' })

  // when
  fireEvent.keyDown(window, { key: 'ArrowUp' })
  act(() => vi.advanceTimersByTime(200))

  // then
  expect(screen.queryByTestId('chevron')).toBeNull()
  expect(head()).toBe('7,6')
})

test('pause during the beat ends it and the time does not pass', () => {
  // given
  render(<App />)
  crash()
  fireEvent.keyDown(window, { key: 'r' })

  // when
  fireEvent.keyDown(window, { key: 'p' })
  act(() => vi.advanceTimersByTime(5000))

  // then
  expect(head()).toBe('7,7')
})
