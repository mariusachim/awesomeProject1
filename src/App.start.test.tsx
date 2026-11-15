import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import App from './App.tsx'
import { KEY } from './startSpeed.ts'

afterEach(() => {
  vi.useRealTimers()
  localStorage.clear()
})

const btn = (label: string) => screen.getByRole('button', { name: `Start: ${label}` })

test('a first visit reads Start: normal and the button cycles', () => {
  // given
  render(<App />)

  // when / then
  fireEvent.click(btn('normal'))
  expect(btn('fast')).toBeTruthy()
  fireEvent.click(btn('fast'))
  expect(btn('slow')).toBeTruthy()
  fireEvent.click(btn('slow'))
  expect(btn('normal')).toBeTruthy()
})

test('the choice is remembered on the next visit', () => {
  // given
  const first = render(<App />)
  fireEvent.click(btn('normal'))
  first.unmount()

  // when
  render(<App />)

  // then
  expect(btn('fast')).toBeTruthy()
})

test('a damaged saved value reads normal', () => {
  // given
  localStorage.setItem(KEY, 'warp')

  // when
  render(<App />)

  // then
  expect(btn('normal')).toBeTruthy()
})

test('fast shows a higher speed level once the game runs, and the button is disabled', () => {
  // given
  render(<App />)
  fireEvent.click(btn('normal'))

  // when
  fireEvent.keyDown(window, { key: 'ArrowUp' })

  // then
  expect(screen.getByText('Speed 6')).toBeTruthy()
  expect((btn('fast') as HTMLButtonElement).disabled).toBe(true)
})
