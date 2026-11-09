export const KEY = 'snake.muted'

export type Sound = 'eat' | 'over'

const TONES: Record<Sound, { hz: number; seconds: number }> = {
  eat: { hz: 880, seconds: 0.08 },
  over: { hz: 160, seconds: 0.3 },
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

export function play(sound: Sound): void {
  try {
    ctx ??= new AudioContext()
    const { hz, seconds } = TONES[sound]
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = hz
    gain.gain.value = 0.1
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + seconds)
  } catch {
    // no audio support, or the browser blocks audio: the game stays silent
  }
}
