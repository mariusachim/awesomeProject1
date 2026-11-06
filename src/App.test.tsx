import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from './App.tsx'

test('shows the game title', () => {
  // given
  const app = <App />

  // when
  render(app)

  // then
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Snake')
})
