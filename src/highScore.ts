export const KEY = 'snake.highScore'
export const LONGEST_KEY = 'snake.longest'

export function parseHighScore(raw: string | null): number {
  return raw !== null && /^\d+$/.test(raw) ? Number(raw) : 0
}

export function isNewHighScore(previous: number, score: number): boolean {
  return score > previous
}

// One record per key: the high score and the longest snake share the load and save.
export function loadRecord(key: string): number {
  try {
    return parseHighScore(localStorage.getItem(key))
  } catch {
    return 0
  }
}

export function saveRecord(key: string, value: number): void {
  try {
    localStorage.setItem(key, String(value))
  } catch {
    // storage is unavailable: the record lasts only for this page
  }
}

export const loadHighScore = () => loadRecord(KEY)
export const saveHighScore = (score: number) => saveRecord(KEY, score)
export const loadLongest = () => loadRecord(LONGEST_KEY)
export const saveLongest = (length: number) => saveRecord(LONGEST_KEY, length)
