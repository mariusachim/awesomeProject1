import { afterEach, expect, test, vi } from 'vitest'
import { tickMs } from './game.ts'
import { KEY, levelOf, loadStart, nextStart, paced, parseStart, saveStart } from './startSpeed.ts'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

test.each([[null, 'normal'], ['', 'normal'], ['FAST', 'normal'], ['slow', 'slow'], ['fast', 'fast'], ['normal', 'normal']])(
  'parses %j as %s',
  (raw, expected) => {
    // when / then
    expect(parseStart(raw)).toBe(expected)
  },
)

test('the button cycles normal, fast, slow', () => {
  // when / then
  expect([nextStart('normal'), nextStart('fast'), nextStart('slow')]).toEqual(['fast', 'slow', 'normal'])
})

test('fast is quicker and higher than normal, slow is slower', () => {
  // when / then
  expect(tickMs(paced(0, 'fast'))).toBeLessThan(tickMs(paced(0, 'normal')))
  expect(tickMs(paced(0, 'slow'))).toBeGreaterThan(tickMs(paced(0, 'normal')))
  expect(levelOf(0, 'fast')).toBeGreaterThan(levelOf(0, 'normal') as number)
  expect(levelOf(0, 'slow')).toBe(1)
})

test('saves and loads the start speed', () => {
  // given
  saveStart('fast')

  // when / then
  expect(loadStart()).toBe('fast')
  expect(localStorage.getItem(KEY)).toBe('fast')
})

test('a blocked storage reads normal and does not throw', () => {
  // given
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })

  // when / then
  expect(loadStart()).toBe('normal')
  expect(() => saveStart('slow')).not.toThrow()
})
