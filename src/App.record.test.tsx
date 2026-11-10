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

const tick = (n: number) => act(() => vi.advanceTimersByTime(200 * n))
const key = (k: string) => fireEvent.keyDown(window, { key: k })
// The food sits at 0,0 and the snake starts at 7,7: the first meal.
const eat = () => {
  key('ArrowUp')
  tick(7)
  key('ArrowLeft')
  tick(7)
}
// The next food sits on the top row: down, right to its column, up.
const eatAgain = () => {
  const x = Number(screen.getByTestId('food').getAttribute('data-pos')!.split(',')[0])
  key('ArrowDown')
  tick(1)
  key('ArrowRight')
  tick(x)
  key('ArrowUp')
  tick(1)
}
const record = () => screen.getByText(/^Score: \d+$/).closest('p')!.getAttribute('data-record')

test('the score is not marked while it is at or below the high score', () => {
  // given
  localStorage.setItem('snake.highScore', '1')
  render(<App />)

  // when
  eat()

  // then
  expect(screen.getByText('Score: 1')).toBeTruthy()
  expect(record()).toBeNull()
})

test('the first meal of a first game does not mark the score', () => {
  // given
  render(<App />)

  // when
  eat()

  // then
  expect(screen.getByText('Score: 1')).toBeTruthy()
  expect(record()).toBeNull()
})

test('a score above the high score is marked until the game ends, and not after a restart', () => {
  // given
  localStorage.setItem('snake.highScore', '1')
  render(<App />)
  eat()

  // when
  eatAgain()

  // then
  expect(screen.getByText('Score: 3')).toBeTruthy()
  expect(record()).toBe('true')

  // when
  tick(30)

  // then
  expect(screen.getByRole('alert')).toBeTruthy()
  expect(record()).toBe('true')

  // when
  fireEvent.click(screen.getByRole('button', { name: 'Restart' }))

  // then
  expect(screen.getByText('Score: 0')).toBeTruthy()
  expect(record()).toBeNull()
})
