import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import App from './App.tsx'

afterEach(() => {
  localStorage.clear()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

test('Pause, Walls and Mute show their keys, announced once through aria-keyshortcuts', () => {
  // when
  render(<App />)

  // then
  const keys = [
    ['Pause', 'P'],
    ['Walls: solid', 'B'],
    ['Mute', 'M'],
  ]
  for (const [name, key] of keys) {
    const button = screen.getByRole('button', { name })
    expect(button.getAttribute('aria-keyshortcuts')).toBe(key)
    expect(button.querySelector('kbd')?.textContent).toBe(key)
  }
})

test('after game over the Restart button shows the R key, named Restart', () => {
  // given
  vi.useFakeTimers()
  vi.spyOn(Math, 'random').mockReturnValue(0)
  render(<App />)
  fireEvent.keyDown(window, { key: 'ArrowRight' })

  // when
  act(() => {
    vi.advanceTimersByTime(2000)
  })

  // then
  const restart = screen.getByRole('button', { name: 'Restart' })
  expect(restart.querySelector('kbd')?.textContent).toBe('R')
  expect(restart.getAttribute('aria-keyshortcuts')).toBe('R')
})
