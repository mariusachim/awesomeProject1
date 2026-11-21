import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from './App.tsx'

test('the start screen shows a chevron in front of the head, hidden from screen readers', () => {
  // given
  render(<App />)

  // when
  const chevron = screen.queryByTestId('chevron')

  // then
  expect(chevron?.getAttribute('aria-hidden')).toBe('true')
  expect(chevron?.textContent).toBe('›')
  const [hx] = screen.getByTestId('head').getAttribute('data-pos')!.split(',').map(Number)
  expect(chevron?.getAttribute('data-pos')?.split(',')[0]).toBe(String(hx + 1))
})

test('the chevron is gone once the run starts', () => {
  // given
  render(<App />)

  // when
  fireEvent.keyDown(window, { key: 'ArrowUp' })

  // then
  expect(screen.queryByTestId('chevron')).toBeNull()
})

test('a paused run shows the chevron ahead of the head, turned to the heading, and drops it on resume', () => {
  // given
  render(<App />)
  fireEvent.keyDown(window, { key: 'ArrowUp' })

  // when
  fireEvent.keyDown(window, { key: 'p' })

  // then
  const chevron = screen.getByTestId('chevron')
  const [hx, hy] = screen.getByTestId('head').getAttribute('data-pos')!.split(',').map(Number)
  expect(chevron.getAttribute('data-pos')).toBe(`${hx},${hy - 1}`)
  expect(chevron.getAttribute('aria-hidden')).toBe('true')
  fireEvent.keyDown(window, { key: 'p' })
  expect(screen.queryByTestId('chevron')).toBeNull()
})
