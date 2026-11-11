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

const pos = () => screen.getByTestId('head').getAttribute('data-pos')!.split(',').map(Number)
const key = (k: string, repeat = false) => fireEvent.keyDown(window, { key: k, repeat })
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms))
const started = () => {
  render(<App />)
  key('ArrowRight')
  return pos()[0]
}

test('holding the current direction moves at half the interval', () => {
  // given
  const x = started()
  key('ArrowRight', true)
  // when
  advance(200)
  // then
  expect(pos()[0]).toBe(x + 2)
})

test('releasing the key restores the normal speed', () => {
  // given
  const x = started()
  key('ArrowRight', true)
  fireEvent.keyUp(window, { key: 'ArrowRight' })
  // when
  advance(200)
  // then
  expect(pos()[0]).toBe(x + 1)
})

test('a different direction key ends the boost', () => {
  // given
  started()
  key('ArrowRight', true)
  key('ArrowDown')
  advance(100)
  const [x, y] = pos()
  // when
  advance(200)
  // then
  expect(pos()).toEqual([x, y + 1])
})

test('a key that is not repeated does not boost', () => {
  // given
  const x = started()
  key('ArrowRight')
  // when
  advance(200)
  // then
  expect(pos()[0]).toBe(x + 1)
})

test('no boost applies while paused', () => {
  // given
  const x = started()
  key('ArrowRight', true)
  key('p')
  // when
  key('ArrowRight', true)
  advance(400)
  // then
  expect(pos()[0]).toBe(x)
})

test('resuming does not keep the boost', () => {
  // given
  started()
  key('ArrowRight', true)
  key('p')
  key('p')
  // Each count step is scheduled after a render, so the clock moves one second at a time.
  for (let i = 0; i < 3; i++) advance(1000)
  const x = pos()[0]
  // when
  advance(200)
  // then
  expect(pos()[0]).toBe(x + 1)
})
