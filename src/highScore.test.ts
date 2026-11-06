import { afterEach, expect, test, vi } from 'vitest'
import { KEY, loadHighScore, parseHighScore, saveHighScore } from './highScore.ts'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

test.each([
  [null, 0],
  ['abc', 0],
  ['-3', 0],
  ['2.5', 0],
  ['', 0],
  ['0', 0],
  ['12', 12],
])('parses %j as %i', (raw, expected) => {
  // when / then
  expect(parseHighScore(raw)).toBe(expected)
})

test('saves and loads the high score', () => {
  // given
  saveHighScore(7)

  // when / then
  expect(loadHighScore()).toBe(7)
  expect(localStorage.getItem(KEY)).toBe('7')
})

test('loads 0 and does not throw when the storage is unavailable', () => {
  // given
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('denied')
  })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('denied')
  })

  // when / then
  expect(loadHighScore()).toBe(0)
  expect(() => saveHighScore(3)).not.toThrow()
})
