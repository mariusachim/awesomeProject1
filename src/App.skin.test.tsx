import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import App from './App.tsx'
import { KEY, SKINS, type Skin } from './skin.ts'

afterEach(() => localStorage.clear())

const bg = (id: string) => (screen.getAllByTestId(id)[0] as HTMLElement).style.background
const press = () => fireEvent.keyDown(window, { key: 'c' })
// The browser normalises colours, so compare through an element.
function css(colour: string) {
  const el = document.createElement('div')
  el.style.background = colour
  return el.style.background
}
const head = (n: Skin) => css(SKINS[n].head)
const body = (n: Skin) => css(SKINS[n].body)

test('C cycles the colours and wraps to green', () => {
  // given
  render(<App />)
  const seen = [bg('head')]

  // when
  for (let i = 0; i < 4; i++) {
    press()
    seen.push(bg('head'))
  }

  // then
  expect(seen).toEqual((['green', 'blue', 'purple', 'orange', 'green'] as Skin[]).map(head))
})

test('the body and the head outline follow the colour', () => {
  // given
  render(<App />)

  // when
  press()

  // then
  expect(bg('snake')).toBe(body('blue'))
  expect(screen.getByTestId('head').style.outline).toContain('2px solid')
})

test('the colour is remembered after a reload', () => {
  // given
  const first = render(<App />)
  press()
  first.unmount()

  // when
  render(<App />)

  // then
  expect(localStorage.getItem(KEY)).toBe('blue')
  expect(bg('head')).toBe(head('blue'))
})

test('an unknown stored value gives green', () => {
  // given
  localStorage.setItem(KEY, 'pink')

  // when
  render(<App />)

  // then
  expect(bg('head')).toBe(head('green'))
})

test('C does not start or change the game', () => {
  // given
  render(<App />)
  const before = screen.getByTestId('board-overlay').textContent

  // when
  press()

  // then
  expect(screen.getByText('Press an arrow key or WASD to start')).toBeTruthy()
  expect(screen.getByTestId('board-overlay').textContent).toBe(before)
})

test('the help text mentions the C key', () => {
  // when
  render(<App />)

  // then
  expect(screen.getByText('C changes the snake colour')).toBeTruthy()
})

test('the C hint shows the key as a badge', () => {
  // when
  const { container } = render(<App />)

  // then
  const badge = container.querySelector('.help kbd')
  expect(badge?.textContent).toBe('C')
  expect(badge?.closest('[aria-hidden="true"]')).toBeTruthy()
})
