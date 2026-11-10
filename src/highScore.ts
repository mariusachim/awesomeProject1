export const KEY = 'snake.highScore'
export const LONGEST_KEY = 'snake.longest'

export function parseHighScore(raw: string | null): number {
  return raw !== null && /^\d+$/.test(raw) ? Number(raw) : 0
}

export function isNewHighScore(previous: number, score: number): boolean {
  return score > previous
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
