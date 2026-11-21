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
const eyeColor = () => screen.getAllByTestId('eye')[0].style.background

test('the head eyes are white on the crashed head and dark again after a restart', () => {
  // given
  render(<App />)
  key('ArrowUp')
  expect(eyeColor()).not.toBe('rgb(255, 255, 255)')

  // when
  act(() => vi.advanceTimersByTime(200 * 40))

  // then
  expect(screen.getAllByTestId('eye').length).toBeGreaterThan(0)
  expect(eyeColor()).toBe('rgb(255, 255, 255)')

  // when
  key('Enter')

  // then
  expect(eyeColor()).not.toBe('rgb(255, 255, 255)')
})
