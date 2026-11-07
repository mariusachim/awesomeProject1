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
