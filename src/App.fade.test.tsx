import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import App from './App.tsx'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

test('the start panel fades out for 150 ms after the first key and ignores the pointer', () => {
  // given
  vi.useFakeTimers()
  render(<App />)

  // when
  fireEvent.keyDown(window, { key: 'ArrowUp' })

  // then
  expect(screen.getByTestId('board-overlay').className).toContain('board-overlay-leaving')
  act(() => {
    vi.advanceTimersByTime(150)
  })
  expect(screen.queryByTestId('board-overlay')).toBeNull()
})

test('the panel is removed at once with reduced motion', () => {
  // given
  vi.stubGlobal('matchMedia', () => ({ matches: true }))
  render(<App />)

  // when
  fireEvent.keyDown(window, { key: 'ArrowUp' })

  // then
  expect(screen.queryByTestId('board-overlay')).toBeNull()
})

test('pausing while the panel fades does not leave a leaving panel', () => {
  // given
  vi.useFakeTimers()
  render(<App />)
  fireEvent.keyDown(window, { key: 'ArrowUp' })

  // when
  fireEvent.keyDown(window, { key: ' ' })

  // then
  expect(screen.getByTestId('board-overlay').className).not.toContain('board-overlay-leaving')
})

test('the paused panel fades out for 150 ms on resume, keeps its text, then leaves', () => {
  // given
  vi.useFakeTimers()
  render(<App />)
  fireEvent.keyDown(window, { key: 'ArrowUp' })
  act(() => {
    vi.advanceTimersByTime(150)
  })
  fireEvent.keyDown(window, { key: 'p' })

  // when
  fireEvent.keyDown(window, { key: 'p' })

  // then
  const panel = screen.getByTestId('board-overlay')
  expect(panel.className).toContain('board-overlay-leaving')
  expect(screen.getByTestId('food-legend')).toBeTruthy()
  act(() => {
    vi.advanceTimersByTime(150)
  })
  expect(screen.queryByTestId('board-overlay')).toBeNull()
})

test('the paused panel leaves at once on resume with reduced motion', () => {
  // given
  vi.stubGlobal('matchMedia', () => ({ matches: true }))
  render(<App />)
  fireEvent.keyDown(window, { key: 'ArrowUp' })
  fireEvent.keyDown(window, { key: 'p' })

  // when
  fireEvent.keyDown(window, { key: 'p' })

  // then
  expect(screen.queryByTestId('board-overlay')).toBeNull()
})
