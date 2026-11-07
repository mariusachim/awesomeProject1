export const KEY = 'snake.highScore'

export function parseHighScore(raw: string | null): number {
  return raw !== null && /^\d+$/.test(raw) ? Number(raw) : 0
}

export function isNewHighScore(previous: number, score: number): boolean {
  return score > previous
}

export function loadHighScore(): number {
  try {
    return parseHighScore(localStorage.getItem(KEY))
  } catch {
    return 0
  }
}

export function saveHighScore(score: number): void {
  try {
    localStorage.setItem(KEY, String(score))
  } catch {
    // storage is unavailable: the high score lasts only for this page
  }
}
