import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from './App.tsx'

test('the stats row is dimmed while paused and back to normal on resume', () => {
  // given
  render(<App />)
  fireEvent.keyDown(window, { key: 'ArrowUp' })
  const stats = screen.getByRole('group', { name: 'Game stats' })
  expect(stats.className).not.toContain('stats-paused')

  // when
  fireEvent.keyDown(window, { key: 'p' })

  // then
  expect(stats.className).toContain('stats-paused')
  fireEvent.keyDown(window, { key: 'p' })
  expect(stats.className).not.toContain('stats-paused')
})
