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

const crash = () => {
  fireEvent.keyDown(window, { key: 'ArrowUp' })
  act(() => vi.advanceTimersByTime(200 * 30))
}

test('before a game ends Last game shows none', () => {
  // given / when
  render(<App />)

  // then
  expect(screen.getByText('Last game')).toBeTruthy()
  expect(screen.getByText('none', { selector: '.stat-value' })).toBeTruthy()
})

test('the score of a finished game shows as Last after a restart', () => {
  // given
  render(<App />)
  crash()

  // when
  fireEvent.keyDown(window, { key: 'Enter' })

  // then
  expect(screen.getByText('Last game: 0')).toBeTruthy()
})

test('at game over Last game still shows the earlier run, not the one that just ended', () => {
  // given
  render(<App />)
  crash()

  // when / then
  expect(screen.getByText('Last game: none')).toBeTruthy()
})

test('a reload forgets the last score', () => {
  // given
  const first = render(<App />)
  crash()
  first.unmount()

  // when
  render(<App />)

  // then
  expect(screen.getByText('none', { selector: '.stat-value' })).toBeTruthy()
  expect(screen.getByText('Last game: none')).toBeTruthy()
})

test('the Last game value bumps when the next run starts, not before', () => {
  // given
  const { container } = render(<App />)
  const value = () => container.querySelectorAll('.stat-value')[4]
  expect(value().classList.contains('bump')).toBe(false)
  crash()
  expect(value().classList.contains('bump')).toBe(false)

  // when
  fireEvent.keyDown(window, { key: 'Enter' })

  // then
  expect(value().textContent).toBe('0')
  expect(value().classList.contains('bump')).toBe(true)
})
