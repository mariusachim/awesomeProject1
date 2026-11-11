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
const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms))
const head = () => screen.getByTestId('head').getAttribute('data-pos')
const shown = () => screen.queryByTestId('countdown')?.textContent

const resumed = () => {
  render(<App />)
  key('ArrowRight')
  key('p')
  key('p')
}

test('resuming shows 3, 2, 1 and the snake waits', () => {
  // given
  resumed()
  const at = head()

  // when / then
  expect(shown()).toBe('3')
  wait(1000)
  expect(shown()).toBe('2')
  wait(1000)
  expect(shown()).toBe('1')
  expect(head()).toBe(at)
})

test('after 1 the number goes and the snake moves', () => {
  // given
  resumed()
  const at = head()

  // when
  wait(1000)
  wait(1000)
  wait(1000)
  wait(200)

  // then
  expect(shown()).toBeUndefined()
  expect(head()).not.toBe(at)
})

test('a turn during the countdown applies when the snake moves', () => {
  // given
  resumed()

  // when
  key('ArrowDown')
  wait(1000)
  wait(1000)
  wait(1000)

  // then
  expect(head()).toBe('7,8')
})

test('pausing during the countdown removes it', () => {
  // given
  resumed()

  // when
  key('p')

  // then
  expect(shown()).toBeUndefined()
  expect(screen.getByText('Paused')).toBeTruthy()
})

test('no countdown at start or restart', () => {
  // given
  render(<App />)

  // when
  key('ArrowRight')
  key('r')

  // then
  expect(shown()).toBeUndefined()
})

test('the number is announced in a polite live region', () => {
  // when
  resumed()

  // then
  expect(screen.getByRole('status').textContent).toBe('3')
})

test('the digit sits at the board edge, not in the centre over the snake', () => {
  // given
  resumed()

  // when
  const style = screen.getByTestId('countdown').style

  // then
  expect(style.alignItems).toBe('flex-end')
})
