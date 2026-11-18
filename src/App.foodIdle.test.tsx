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

test('the head eyes blink only on the start screen', () => {
  // given
  render(<App />)

  // when / then
  expect(screen.getAllByTestId('eye')[0].className).toContain('eye-blink')
  key('ArrowRight')
  expect(screen.getAllByTestId('eye')[0].className).not.toContain('eye-blink')
  key('p')
  expect(screen.getAllByTestId('eye')[0].className).not.toContain('eye-blink')
})
