import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from './App.tsx'

test('a new game shows no rocks', () => {
  // when
  render(<App />)

  // then
  expect(screen.queryAllByTestId('rock')).toHaveLength(0)
})
