export const KEY = 'snake.highScore'
export const LONGEST_KEY = 'snake.longest'

export function parseHighScore(raw: string | null): number {
  return raw !== null && /^\d+$/.test(raw) ? Number(raw) : 0
}

export function isNewHighScore(previous: number, score: number): boolean {
  return score > previous
}

// The line that relates a run that is no record to the high score; null when there is none to show.
export function shortOfHighScore(previous: number, score: number): string | null {
  if (previous === 0 || score > previous) return null
  return score === previous ? 'Tied the high score' : `${previous - score} short of the high score`
}

export function loadHighScore(key = KEY): number {
  try {
    return parseHighScore(localStorage.getItem(key))
  } catch {
    return 0
  }
}

export function saveHighScore(score: number, key = KEY): void {
  try {
    localStorage.setItem(key, String(score))
  } catch {
    // storage is unavailable: the high score lasts only for this page
  }
}
