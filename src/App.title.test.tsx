import { fireEvent, render } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from './App.tsx'

test('the tab title shows the state', () => {
  // given
  render(<App />)

  // when / then
  expect(document.title).toBe('Snake')

  // when
  fireEvent.keyDown(window, { key: 'ArrowUp' })

  // then
  expect(document.title).toBe('Snake · 0')

  // when
  fireEvent.keyDown(window, { key: 'p' })

  // then
  expect(document.title).toBe('Paused · Snake · 0')
})
