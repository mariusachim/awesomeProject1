import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App.tsx'

const vibrate = vi.fn()

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(Math, 'random').mockReturnValue(0)
  localStorage.clear()
  vibrate.mockClear()
  Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true })
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  Reflect.deleteProperty(navigator, 'vibrate')
})

const tick = (n = 1) => act(() => vi.advanceTimersByTime(200 * n))
const crash = () => {
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  tick(30)
}

test('game over vibrates once, briefly', () => {
  // given
  render(<App />)

  // when
  crash()

  // then
  expect(vibrate).toHaveBeenCalledTimes(1)
  expect(vibrate.mock.calls[0][0]).toBeLessThanOrEqual(200)
})

test('a second loss vibrates again', () => {
  // given
  render(<App />)
  crash()

  // when
  fireEvent.keyDown(window, { key: 'Enter' })
  crash()

  // then
  expect(vibrate).toHaveBeenCalledTimes(2)
})

test('a muted game does not vibrate', () => {
  // given
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Mute' }))

  // when
  crash()

  // then
  expect(vibrate).not.toHaveBeenCalled()
})

test('without vibration support game over still shows', () => {
  // given
  Reflect.deleteProperty(navigator, 'vibrate')
  render(<App />)

  // when
  crash()

  // then
  expect(screen.getByText('Game over')).toBeTruthy()
})

test('a waiting or paused game does not vibrate', () => {
  // given
  render(<App />)

  // when
  tick(30)
  fireEvent.keyDown(window, { key: 'ArrowUp' })
  fireEvent.keyDown(window, { key: ' ' })
  tick(30)

  // then
  expect(vibrate).not.toHaveBeenCalled()
})
