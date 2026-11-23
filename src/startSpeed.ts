import { speedLevel, TOP_LEVEL } from './game.ts'

export const KEY = 'snake.start'

export type StartSpeed = 'slow' | 'normal' | 'fast'

// The start speed shifts the score the speed curve reads, so every step stays the same.
const SHIFT: Record<StartSpeed, number> = { slow: -5, normal: 0, fast: 5 }
const NEXT: Record<StartSpeed, StartSpeed> = { normal: 'fast', fast: 'slow', slow: 'normal' }

export const nextStart = (s: StartSpeed): StartSpeed => NEXT[s]

export const paced = (score: number, start: StartSpeed): number => score + SHIFT[start]

// shortcut: slow shows level 1 until it passes the normal start, when a level 0 would read oddly.
export const levelOf = (score: number, start: StartSpeed): number | 'MAX' =>
  speedLevel(Math.max(0, paced(score, start)))

export function parseStart(raw: string | null): StartSpeed {
  return raw === 'slow' || raw === 'fast' ? raw : 'normal'
}

export function loadStart(): StartSpeed {
  try {
    return parseStart(localStorage.getItem(KEY))
  } catch {
    return 'normal'
  }
}

export function saveStart(start: StartSpeed): void {
  try {
    localStorage.setItem(KEY, start)
  } catch {
    // storage is unavailable: the speed lasts only for this page
  }
}

// How far the speed can still rise: 0..1, and 1 at MAX.
export const speedFill = (level: number | 'MAX'): number => (level === 'MAX' ? 1 : level / TOP_LEVEL)
