export const KEY = 'snake.skin'

// Head, body and head outline per colour; the outline is a light tint so the head stays outlined.
export const SKINS = {
  green: { head: '#7e7', body: '#2a2', outline: '#efe' },
  blue: { head: '#6af', body: '#26c', outline: '#def' },
  purple: { head: '#c8f', body: '#82c', outline: '#f0e6ff' },
  orange: { head: '#fa5', body: '#d70', outline: '#ffe8d0' },
}
export type Skin = keyof typeof SKINS
const NAMES = Object.keys(SKINS) as Skin[]

const TAIL_SHADE = 0.65

// Body segment `index` (1 = next to the head) fades linearly to 65% of the base colour at the tail.
export function bodyShade(color: string, index: number, length: number): string {
  if (index <= 1 || length <= 2) return color
  const f = 1 - (1 - TAIL_SHADE) * Math.min(1, (index - 1) / (length - 2))
  const [r, g, b] = color.slice(1).split('').map((h) => Math.round(parseInt(h + h, 16) * f))
  return `rgb(${r}, ${g}, ${b})`
}

export const parseSkin = (raw: string | null): Skin =>
  NAMES.find((n) => n === raw) ?? 'green'

export const nextSkin = (s: Skin): Skin => NAMES[(NAMES.indexOf(s) + 1) % NAMES.length]

export function loadSkin(): Skin {
  try {
    return parseSkin(localStorage.getItem(KEY))
  } catch {
    return 'green'
  }
}

export function saveSkin(skin: Skin): void {
  try {
    localStorage.setItem(KEY, skin)
  } catch {
    // storage is unavailable: the colour lasts only for this page
  }
}
