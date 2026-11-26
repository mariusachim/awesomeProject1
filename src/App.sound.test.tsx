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
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  tick(1)
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
  const beeps = freqs.filter((f) => f !== 440) // 440 is the turn tick
  expect(beeps.length).toBe(1)
  expect(beeps[0]).toBeGreaterThan(500)
})

test('a turn plays one soft tick; a reverse, the same key and a muted turn play none', () => {
  // given
  render(<App />)
  fireEvent.keyDown(window, { key: 'ArrowUp' })
  tick()
  freqs.length = 0

  // when the key is the current or the opposite direction
  fireEvent.keyDown(window, { key: 'ArrowUp' })
  fireEvent.keyDown(window, { key: 'ArrowDown' })
  tick()

  // then
  expect(freqs).toEqual([])

  // when
  fireEvent.keyDown(window, { key: 'ArrowLeft' })
  tick()

  // then
  expect(freqs).toEqual([440])

  // when muted
  fireEvent.click(screen.getByRole('button', { name: 'Mute' }))
  fireEvent.keyDown(window, { key: 'ArrowUp' })
  tick()

  // then
  expect(freqs).toEqual([440])
})

test('a paused game plays no tick on a turn key', () => {
  // given
  render(<App />)
  fireEvent.keyDown(window, { key: 'ArrowUp' })
  tick()
  fireEvent.keyDown(window, { key: ' ' })
  freqs.length = 0

  // when
  fireEvent.keyDown(window, { key: 'ArrowLeft' })
  tick()

  // then
  expect(freqs).toEqual([])
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
  expect(freqs).toEqual([660, 990]) // the muted meal made a record
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

test('the muted button shows a sound-off mark and is named Unmute; the sound-on button shows a speaker with waves', () => {
  // given
  render(<App />)
  const mute = screen.getByRole('button', { name: 'Mute' })

  // then
  expect(mute.getAttribute('aria-pressed')).toBeNull()
  expect(screen.queryByTestId('sound-off')).toBeNull()
  expect(mute.querySelector('[data-testid="sound-on"]')).toBeTruthy()

  // when
  fireEvent.keyDown(window, { key: 'm' })

  // then
  const unmute = screen.getByRole('button', { name: 'Unmute' })
  expect(unmute.getAttribute('aria-pressed')).toBeNull()
  expect(unmute.querySelector('[data-testid="sound-off"]')).toBeTruthy()
  expect(unmute.querySelector('[data-testid="sound-on"]')).toBeNull()
  expect(unmute.textContent).toContain('Unmute')

  // when
  fireEvent.keyDown(window, { key: 'm' })

  // then
  expect(screen.queryByTestId('sound-off')).toBeNull()
})

test('a reload with sound off shows the mark at once', () => {
  // given
  localStorage.setItem('snake.muted', '1')

  // when
  render(<App />)

  // then
  expect(screen.getByTestId('sound-off')).toBeTruthy()
})

// Eat once, then crash into the right wall: score 1 beats the high score 0.
const crashWithRecord = () => {
  eatFood()
  freqs.length = 0
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  tick(30)
}

test('a new high score ends with a rising two-note jingle, not the low tone', () => {
  // given
  render(<App />)

  // when
  crashWithRecord()

  // then
  expect(screen.getByText('Game over')).toBeTruthy()
  expect(freqs).toEqual([660, 990])
})

test('a game over at or below the high score keeps the low tone', () => {
  // given
  localStorage.setItem('snake.highScore', '5')
  render(<App />)
  eatFood()
  freqs.length = 0

  // when
  fireEvent.keyDown(window, { key: 'ArrowRight' })
  tick(30)

  // then
  expect(freqs.length).toBe(1)
  expect(freqs[0]).toBeLessThan(300)
})

test('a muted new high score makes no sound', () => {
  // given
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Mute' }))

  // when
  crashWithRecord()

  // then
  expect(freqs.length).toBe(0)
})
