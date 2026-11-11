import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App.tsx'

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(Math, 'random').mockReturnValue(0)
})
afterEach(() => {
  localStorage.clear()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const key = (k: string) => fireEvent.keyDown(window, { key: k })
const food = () => screen.getByTestId('food')

test('the food idles only while the game runs, and keeps the spawn pulse', () => {
  // given
  render(<App />)

  // when / then
  expect(food().className).not.toContain('food-idle')
  key('ArrowRight')
  expect(food().className).toContain('food-idle')
  expect(food().className).toContain('pulse')

  // when
  key('p')

  // then
  expect(food().className).not.toContain('food-idle')
})
