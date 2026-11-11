import { render, screen } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import App from './App.tsx'

afterEach(() => localStorage.clear())

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
