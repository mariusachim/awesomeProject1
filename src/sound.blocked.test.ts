import { afterEach, expect, test, vi } from 'vitest'
import { play } from './sound.ts'

afterEach(() => {
  vi.unstubAllGlobals()
})

test('does nothing without audio support', () => {
  // given
  vi.stubGlobal('AudioContext', undefined)

  // when / then
  expect(() => play('eat')).not.toThrow()
})

test('does not throw when audio is blocked', () => {
  // given
  vi.stubGlobal('AudioContext', function () {
    throw new Error('blocked')
  })

  // when / then
  expect(() => play('over')).not.toThrow()
})
