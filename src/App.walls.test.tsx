import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import App from './App.tsx'
import { KEY } from './wallsMode.ts'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

const walls = (label: string) => screen.getByRole('button', { name: `Walls: ${label}` })

test('a first visit starts with solid walls', () => {
  // when
  render(<App />)

  // then
  expect(walls('solid')).toBeTruthy()
})

test('switching to wrap is remembered on the next visit, waiting for the first key', () => {
  // given
  const first = render(<App />)
  fireEvent.click(walls('solid'))
  first.unmount()

  // when
  render(<App />)

  // then
  expect(walls('wrap')).toBeTruthy()
  expect(screen.getByText('Press an arrow key or WASD to start')).toBeTruthy()
})

test('switching back to solid is remembered', () => {
  // given
  localStorage.setItem(KEY, 'wrap')
  const first = render(<App />)
  fireEvent.click(walls('wrap'))
  first.unmount()

  // when
  render(<App />)

  // then
  expect(walls('solid')).toBeTruthy()
})

test('a damaged saved value starts with solid walls', () => {
  // given
  localStorage.setItem(KEY, 'oops')

  // when
  render(<App />)

  // then
  expect(walls('solid')).toBeTruthy()
})

test('blocked storage does not stop the switch', () => {
  // given
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('denied')
  })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('denied')
  })
  render(<App />)

  // when
  fireEvent.click(walls('solid'))

  // then
  expect(walls('wrap')).toBeTruthy()
})

const SOLID = 'Walls: the edge ends the run'
const WRAP = 'Walls off: the snake passes through the edge'
const overlayTexts = () =>
  Array.from(screen.getByTestId('board-overlay').querySelectorAll('[data-text]')).map((e) => e.getAttribute('data-text'))

test('the start screen says what solid walls do, on the board and for screen readers', () => {
  // when
  render(<App />)

  // then
  expect(overlayTexts()).toContain(SOLID)
  expect(screen.getByRole('status').textContent).toContain(SOLID)
})

test('toggling the walls changes the line on the start screen', () => {
  // given
  render(<App />)

  // when
  fireEvent.click(walls('solid'))

  // then
  expect(overlayTexts()).toContain(WRAP)
  expect(screen.getByRole('status').textContent).toContain(WRAP)
  expect(overlayTexts()).not.toContain(SOLID)
})

test('the board border class follows the walls mode, also when the game is over', () => {
  // given
  render(<App />)
  const board = screen.getByTestId('board')
  expect(board.classList.contains('board-wrap')).toBe(false)

  // when
  fireEvent.click(walls('solid'))

  // then
  expect(board.classList.contains('board-wrap')).toBe(true)
  fireEvent.click(walls('wrap'))
  expect(board.classList.contains('board-wrap')).toBe(false)
})

test('the walls line is gone once the game runs', () => {
  // given
  render(<App />)

  // when
  fireEvent.keyDown(window, { key: 'ArrowUp' })

  // then
  expect(screen.queryByTestId('board-overlay')).toBeNull()
  expect(screen.queryByText(SOLID)).toBeNull()
})
