export const KEY = 'snake.muted'

export type Sound = 'eat' | 'over' | 'chime'

const TONES: Record<Sound, { hz: number; seconds: number }> = {
  eat: { hz: 880, seconds: 0.08 },
  chime: { hz: 1320, seconds: 0.4 },
  over: { hz: 160, seconds: 0.3 },
}

// 880 Hz for +1, 1100 Hz for +2, 1320 Hz for +3 or more
export function eatHz(points: number): number {
  return [880, 880, 1100, 1320][Math.min(Math.max(points, 1), 3)]
}

export function parseMuted(raw: string | null): boolean {
  return raw === '1'
}

export function loadMuted(): boolean {
  try {
    return parseMuted(localStorage.getItem(KEY))
  } catch {
    return false
  }
}

export function saveMuted(muted: boolean): void {
  try {
    localStorage.setItem(KEY, muted ? '1' : '0')
  } catch {
    // storage is unavailable: the choice lasts only for this page
  }
}

export function vibrate(): void {
  // optional call: browsers without the Vibration API (e.g. iOS Safari) skip it
  navigator.vibrate?.(150)
}

let ctx: AudioContext | undefined

export function play(sound: Sound, hzOverride?: number): void {
  const { seconds } = TONES[sound]
  tone(hzOverride ?? TONES[sound].hz, seconds)
}

// A new high score: a rising pair, 660 Hz then 990 Hz.
export function playRecord(): void {
  tone(660, 0.12)
  tone(990, 0.12, 0.12)
}

function tone(hz: number, seconds: number, delay = 0): void {
  try {
    ctx ??= new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = hz
    gain.gain.value = 0.1
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime + delay)
    osc.stop(ctx.currentTime + delay + seconds)
  } catch {
    // no audio support, or the browser blocks audio: the game stays silent
  }
}
