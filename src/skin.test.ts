import { afterEach, expect, test, vi } from 'vitest'
import { KEY, SKINS, type Skin, loadSkin, nextSkin, parseSkin, saveSkin } from './skin.ts'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

test.each([
  [null, 'green'],
  ['', 'green'],
  ['red', 'green'],
  ['BLUE', 'green'],
  ['blue', 'blue'],
  ['purple', 'purple'],
  ['orange', 'orange'],
])('parses %j as %s', (raw, expected) => {
  // when / then
  expect(parseSkin(raw)).toBe(expected)
})

test('cycles through the list and wraps to the first', () => {
  // given
  const seen: Skin[] = ['green']

  // when
  for (let i = 0; i < 4; i++) seen.push(nextSkin(seen[i]))

  // then
  expect(seen).toEqual(['green', 'blue', 'purple', 'orange', 'green'])
})

test('every skin has its own body and a head outline apart from the head', () => {
  // when / then
  expect(new Set(Object.values(SKINS).map((s) => s.body)).size).toBe(4)
  for (const s of Object.values(SKINS)) {
    expect(s.head).not.toBe(s.body)
    expect(s.outline).not.toBe(s.head)
  }
})

test('saves and loads a skin', () => {
  // given
  saveSkin('purple')

  // when / then
  expect(loadSkin()).toBe('purple')
  expect(localStorage.getItem(KEY)).toBe('purple')
})

test('loads green and does not throw when the storage is blocked', () => {
  // given
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('denied')
  })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('denied')
  })

  // when / then
  expect(loadSkin()).toBe('green')
  expect(() => saveSkin('blue')).not.toThrow()
})
