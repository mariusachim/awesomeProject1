import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App.tsx'

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  localStorage.clear()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

test('a shrink fruit shows after a meal and differs from the food by shape', () => {
  // given: the first food lands one cell ahead of the head; the roll after the meal is high
  vi.spyOn(Math, 'random').mockReturnValueOnce(110.5 / 222).mockReturnValue(0.99)
  render(<App />)
  expect(screen.queryByTestId('shrink')).toBeNull()

  // when
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  act(() => vi.advanceTimersByTime(200))

  // then
  const fruit = screen.getByRole('img', { name: 'Shrink fruit, 10 moves left' })
  expect(fruit.style.clipPath).toContain('polygon')
  expect(fruit.style.borderRadius).toBe('')
  expect(screen.getByTestId('food').style.borderRadius).toBe('50%')
})

test('the shrink fruit shows its moves left, counts down and is hidden from screen readers', () => {
  // given
  vi.spyOn(Math, 'random').mockReturnValueOnce(110.5 / 222).mockReturnValue(0.99)
  render(<App />)
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  act(() => vi.advanceTimersByTime(200))

  // when / then
  const count = screen.getByTestId('shrink-count')
  expect(count.textContent).toBe('10')
  expect(count.getAttribute('aria-hidden')).toBe('true')

  // when
  act(() => vi.advanceTimersByTime(200))

  // then
  expect(screen.getByTestId('shrink-count').textContent).toBe('9')
})
