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

test('shows the title, the board, a snake, one food and a score of 0', () => {
  // when
  render(<App />)

  // then
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Snake')
  expect(screen.getByText('Score: 0')).toBeTruthy()
  expect(screen.getAllByTestId('head').length + screen.getAllByTestId('snake').length).toBe(3)
  expect(screen.getAllByTestId('food').length).toBe(1)
})

test('the snake moves right on a timer without input', () => {
  // given
  render(<App />)
  const before = head()

  // when
  tick()

  // then
  expect(head()).not.toBe(before)
  expect(head()).toBe('8,7')
})

test.each([
  ['ArrowUp', '7,6'],
  ['w', '7,6'],
  ['ArrowDown', '7,8'],
  ['s', '7,8'],
])('key %s turns the snake', (key, pos) => {
  // given
  render(<App />)

  // when
  fireEvent.keyDown(window, { key })
  tick()

  // then
  expect(head()).toBe(pos)
})

test('a turn back into the snake is ignored', () => {
  // given
  render(<App />)

  // when
  fireEvent.keyDown(window, { key: 'a' })
  tick()

  // then
  expect(head()).toBe('8,7')
})

test('hitting the wall shows Game over with the score', () => {
  // given
  render(<App />)

  // when
  tick(10)

  // then
  expect(screen.getByText('Game over')).toBeTruthy()
  expect(screen.getByText('Final score: 0')).toBeTruthy()
})

test('the Restart button starts a new game', () => {
  // given
  render(<App />)
  tick(10)

  // when
  fireEvent.click(screen.getByRole('button', { name: 'Restart' }))

  // then
  expect(screen.queryByText('Game over')).toBeNull()
  expect(head()).toBe('7,7')
})

test('Enter restarts a finished game', () => {
  // given
  render(<App />)
  tick(10)

  // when
  fireEvent.keyDown(window, { key: 'Enter' })

  // then
  expect(screen.queryByText('Game over')).toBeNull()
  expect(head()).toBe('7,7')
})

test.each([' ', 'p'])('key "%s" pauses and resumes the game', (key) => {
  // given
  render(<App />)

  // when
  fireEvent.keyDown(window, { key })
  tick(3)

  // then
  expect(screen.getByText('Paused')).toBeTruthy()
  expect(head()).toBe('7,7')

  // when
  fireEvent.keyDown(window, { key })
  tick()

  // then
  expect(screen.queryByText('Paused')).toBeNull()
  expect(head()).toBe('8,7')
})

test('the Pause button pauses and the Resume button resumes', () => {
  // given
  render(<App />)

  // when
  fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
  tick(2)

  // then
  expect(screen.getByText('Paused')).toBeTruthy()
  expect(head()).toBe('7,7')

  // when
  fireEvent.click(screen.getByRole('button', { name: 'Resume' }))
  tick()

  // then
  expect(screen.queryByRole('button', { name: 'Resume' })).toBeNull()
  expect(head()).toBe('8,7')
})

test('a turn key while paused does not turn the snake', () => {
  // given
  render(<App />)
  fireEvent.keyDown(window, { key: 'p' })

  // when
  fireEvent.keyDown(window, { key: 'ArrowUp' })
  fireEvent.keyDown(window, { key: 'p' })
  tick()

  // then
  expect(head()).toBe('8,7')
})

test('Space and P do nothing after game over', () => {
  // given
  render(<App />)
  tick(10)

  // when
  fireEvent.keyDown(window, { key: ' ' })
  fireEvent.keyDown(window, { key: 'p' })

  // then
  expect(screen.queryByText('Paused')).toBeNull()
  expect(screen.getByText('Game over')).toBeTruthy()
})

test('a new game after pausing and game over is running', () => {
  // given
  render(<App />)
  tick(10)
  fireEvent.click(screen.getByRole('button', { name: 'Restart' }))

  // when
  tick()

  // then
  expect(screen.queryByText('Paused')).toBeNull()
  expect(head()).toBe('8,7')
})

test('Enter does nothing while the game runs', () => {
  // given
  render(<App />)
  tick()

  // when
  fireEvent.keyDown(window, { key: 'Enter' })

  // then
  expect(head()).toBe('8,7')
})
