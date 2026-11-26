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
  key('ArrowRight')
  tick(1)
}
// The next food sits on the top row: down, left to its column, up.
const eatAgain = () => {
  const x = Number(screen.getByTestId('food').getAttribute('data-pos')!.split(',')[0])
  key('ArrowDown')
  tick(1)
  key('ArrowLeft')
  tick(8 - x)
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

test('the game over panel marks the new high score line, and only then', () => {
  // given
  localStorage.setItem('snake.highScore', '0')
  render(<App />)

  // when
  eat()
  key('ArrowUp')
  tick(10)

  // then
  expect(document.querySelectorAll('.overlay-record[data-text="New high score!"]')).toHaveLength(1)
})

test('a run that does not beat the high score has no record line', () => {
  // given
  localStorage.setItem('snake.highScore', '5')
  render(<App />)

  // when
  eat()
  key('ArrowUp')
  tick(10)

  // then
  expect(screen.getByText('Final score: 1')).toBeTruthy()
  expect(document.querySelector('.overlay-record')).toBeNull()
})

const GAP = '.overlay-detail[data-text$="the high score"]'

test('game over says how far a run was from the high score, and the restart clears it', () => {
  // given
  localStorage.setItem('snake.highScore', '5')
  render(<App />)

  // when
  eat()
  key('ArrowUp')
  tick(10)

  // then
  expect(document.querySelector(GAP)!.getAttribute('data-text')).toBe('4 short of the high score')
  expect(screen.getByText('4 short of the high score')).toBeTruthy()

  // when
  key('Enter')

  // then
  expect(document.querySelector(GAP)).toBeNull()
})

test('game over shows no gap line on a first run', () => {
  // given
  render(<App />)

  // when
  key('ArrowUp')
  tick(10)

  // then
  expect(document.querySelector(GAP)).toBeNull()
})
