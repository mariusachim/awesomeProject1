import { afterEach, expect, test, vi } from 'vitest'
import { KEY, loadMuted, parseMuted, play, saveMuted } from './sound.ts'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  localStorage.clear()
})

function stubAudio() {
  const osc = { frequency: { value: 0 }, connect: vi.fn(), start: vi.fn(), stop: vi.fn() }
  const gain = { gain: { value: 0 }, connect: vi.fn() }
  class Ctx {
    currentTime = 0
    destination = {}
    createOscillator = () => osc
    createGain = () => gain
  }
  vi.stubGlobal('AudioContext', Ctx)
  return osc
}

test.each([
  [null, false],
  ['', false],
  ['abc', false],
  ['0', false],
  ['1', true],
])('parses %j as muted=%s', (raw, expected) => {
  // when / then
  expect(parseMuted(raw)).toBe(expected)
})

test('saves and loads the mute choice', () => {
  // given
  saveMuted(true)

  // when / then
  expect(loadMuted()).toBe(true)
  expect(localStorage.getItem(KEY)).toBe('1')
  saveMuted(false)
  expect(loadMuted()).toBe(false)
})

test('falls back to sound on when storage throws', () => {
  // given
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked')
  })

  // when / then
  expect(loadMuted()).toBe(false)
  expect(() => saveMuted(true)).not.toThrow()
})

test('eat is a higher tone than game over', () => {
  // given
  const osc = stubAudio()

  // when
  play('eat')
  const eat = osc.frequency.value
  play('over')

  // then
  expect(eat).toBeGreaterThan(osc.frequency.value)
  expect(osc.start).toHaveBeenCalledTimes(2)
  expect(osc.stop).toHaveBeenCalledTimes(2)
})
