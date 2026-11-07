export const KEY = 'snake.walls'

export function parseWrap(raw: string | null): boolean {
  return raw === 'wrap'
}

export function loadWrap(): boolean {
  try {
    return parseWrap(localStorage.getItem(KEY))
  } catch {
    return false
  }
}

export function saveWrap(wrap: boolean): void {
  try {
    localStorage.setItem(KEY, wrap ? 'wrap' : 'solid')
  } catch {
    // storage is unavailable: the mode lasts only for this page
  }
}
