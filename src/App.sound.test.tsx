import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App.tsx'

const freqs: number[] = []

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(Math, 'random').mockReturnValue(0)
  localStorage.clear()
  freqs.length = 0
  class Ctx {
    currentTime = 0
    destination = {}
    createGain = () => ({ gain: { value: 0 }, connect: () => {} })
    createOscillator = () => {
      const o = {
        connect: () => {},
        stop: () => {},
        start: () => freqs.push(o.frequency.value),
        frequency: { value: 0 },
      }
      return o
    }
  }
  vi.stubGlobal('AudioContext', Ctx)
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const tick = (n = 1) => act(() => vi.advanceTimersByTime(200 * n))
const eatFood = () => {
  fireEvent.keyDown(window, { key: 'ArrowUp' })
  tick(7)
  fireEvent.keyDown(window, { key: 'ArrowLeft' })
  tick(7)
}

test('shows a Mute button at first', () => {
  // when
  render(<App />)

  // then
  expect(screen.getByRole('button', { name: 'Mute' })).toBeTruthy()
})

test('eating plays one high beep', () => {
  // given
  render(<App />)

  // when
  eatFood()

  // then
  expect(freqs.length).toBe(1)
  expect(freqs[0]).toBeGreaterThan(500)
})

test('game over plays one low tone', () => {
  // given
  render(<App />)
  fireEvent.keyDown(window, { key: 'ArrowRight' })

  // when
  tick(30)

  // then
  expect(screen.getByText('Game over')).toBeTruthy()
  expect(freqs.length).toBe(1)
  expect(freqs[0]).toBeLessThan(300)
})

test('a muted game makes no sound and Unmute brings the beep back', () => {
  // given
  render(<App />)

  // when
  fireEvent.click(screen.getByRole('button', { name: 'Mute' }))
  eatFood()

  // then
  expect(screen.getByRole('button', { name: 'Unmute' })).toBeTruthy()
  expect(freqs.length).toBe(0)

  // when
  fireEvent.click(screen.getByRole('button', { name: 'Unmute' }))
  tick(30)

  // then
  expect(screen.getByRole('button', { name: 'Mute' })).toBeTruthy()
  expect(freqs.length).toBe(1)
})

test('muted game over makes no sound', () => {
  // given
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Mute' }))

  // when
  tick(30)

  // then
  expect(freqs.length).toBe(0)
})

test('the mute choice survives a reload', () => {
  // given
  const first = render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Mute' }))
  first.unmount()

  // when
  render(<App />)

  // then
  expect(screen.getByRole('button', { name: 'Unmute' })).toBeTruthy()
})

test('without audio support eating keeps the game running', () => {
  // given
  vi.stubGlobal('AudioContext', undefined)
  render(<App />)

  // when
  eatFood()

  // then
  expect(screen.getByText('Score: 1')).toBeTruthy()
})

test('the M key mutes and unmutes', () => {
  // given
  render(<App />)

  // when
  fireEvent.keyDown(window, { key: 'M' })

  // then
  expect(screen.getByRole('button', { name: 'Unmute' })).toBeTruthy()

  // when
  fireEvent.keyDown(window, { key: 'm' })

  // then
  expect(screen.getByRole('button', { name: 'Mute' })).toBeTruthy()
})

test('Cmd+M does not mute', () => {
  // given
  render(<App />)

  // when
  fireEvent.keyDown(window, { key: 'm', metaKey: true })

  // then
  expect(screen.getByRole('button', { name: 'Mute' })).toBeTruthy()
})
