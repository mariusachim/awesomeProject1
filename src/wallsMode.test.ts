import { afterEach, expect, test, vi } from 'vitest'
import { KEY, loadWrap, parseWrap, saveWrap } from './wallsMode.ts'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

test.each([
  [null, false],
  ['', false],
  ['abc', false],
  ['WRAP', false],
  ['solid', false],
  ['wrap', true],
])('parses %j as wrap: %s', (raw, expected) => {
  // when / then
  expect(parseWrap(raw)).toBe(expected)
})

test('saves and loads wrap mode', () => {
  // given
  saveWrap(true)

  // when / then
  expect(loadWrap()).toBe(true)
  expect(localStorage.getItem(KEY)).toBe('wrap')
})

test('saves and loads solid mode', () => {
  // given
  saveWrap(true)
  saveWrap(false)

  // when / then
  expect(loadWrap()).toBe(false)
  expect(localStorage.getItem(KEY)).toBe('solid')
})

test('loads solid and does not throw when the storage is blocked', () => {
  // given
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('denied')
  })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('denied')
  })

  // when / then
  expect(loadWrap()).toBe(false)
  expect(() => saveWrap(true)).not.toThrow()
})
