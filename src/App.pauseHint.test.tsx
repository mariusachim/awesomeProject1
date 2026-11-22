import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from './App.tsx'

const TEXT = 'Pause works after the game starts'
const pause = () => screen.getByRole('button', { name: /^Pause/ })
const described = (b: HTMLElement) => document.getElementById(b.getAttribute('aria-describedby') ?? '')?.textContent

test('the disabled Pause button says why, until the first key', () => {
  // given
  render(<App />)

  // when / then
  expect(described(pause())).toBe(TEXT)
  expect(pause().title).toBe(TEXT)

  // when
  fireEvent.keyDown(window, { key: 'ArrowUp' })

  // then
  expect(pause().getAttribute('aria-describedby')).toBeNull()
  expect(pause().title).toBe('')
})
