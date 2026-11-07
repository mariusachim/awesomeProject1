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

const key = (k: string) => fireEvent.keyDown(window, { key: k })
const overlay = () => screen.queryByTestId('board-overlay')

test('a new game in the ready state shows no overlay', () => {
  // given / when
  render(<App />)

  // then
  expect(overlay()).toBeNull()
})

test('pausing dims the board with a Paused label, and resuming removes it', () => {
  // given
  render(<App />)
  key('ArrowRight')

  // when
  key('p')

  // then
  expect(overlay()?.getAttribute('data-label')).toBe('Paused')
  expect(screen.getByTestId('board').contains(overlay())).toBe(true)
  key('p')
  expect(overlay()).toBeNull()
})

test('game over dims the board with a Game over label and Restart still works', () => {
  // given
  render(<App />)
  key('ArrowUp')

  // when
  act(() => vi.advanceTimersByTime(200 * 30))

  // then
  expect(overlay()?.getAttribute('data-label')).toBe('Game over')
  fireEvent.click(screen.getByRole('button', { name: 'Restart' }))
  expect(overlay()).toBeNull()
})

test('the overlay is hidden from screen readers and does not repeat the text', () => {
  // given
  render(<App />)
  key('ArrowRight')

  // when
  key('p')

  // then
  expect(overlay()?.getAttribute('aria-hidden')).toBe('true')
  expect(screen.getAllByText('Paused')).toHaveLength(1)
})

test('while paused the status text is only spoken, so Paused is visible once, on the board', () => {
  // given
  render(<App />)
  key('ArrowRight')

  // when
  key('p')

  // then
  const status = screen.getByRole('status')
  expect(status.textContent).toBe('Paused')
  expect(status.className).toContain('sr-only')
})
