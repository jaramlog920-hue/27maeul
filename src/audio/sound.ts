// 소리 (설계 2.10). 외부 음원 없이 Web Audio로 합성한다. 첫 탭 전에는 소리를 내지 않는다(브라우저 정책).
// AudioContext가 없는 곳(테스트·오래된 브라우저)에서는 모든 함수가 아무 일도 하지 않는다.
import type { Season } from '../engine/types'

type Sfx = 'step' | 'talk' | 'scroll' | 'tap' | 'hit' | 'miss' | 'done' | 'sleep' | 'eat' | 'gift' | 'meow' | 'bark' | 'place' | 'pen'

let ctx: AudioContext | null = null
let master: GainNode | null = null
let musicGain: GainNode | null = null
/** 효과음·빗소리가 모이는 곳 (배경음과 따로 크기를 맞춘다) */
let sfxGain: GainNode | null = null
/** 곡마다 소리 크기를 맞추는 곳 (musicGain 앞) */
let trackGain: GainNode | null = null
let muted = readMuted()
export type MusicChoice = 'default' | 'D' | 'E' | 'F'
let musicChoice: MusicChoice = readMusicChoice()
let rainNode: AudioBufferSourceNode | null = null
let rainGain: GainNode | null = null

function readMuted(): boolean {
  try {
    return globalThis.localStorage?.getItem('twenty-seven/muted') === '1'
  } catch {
    return false
  }
}
function readMusicChoice(): MusicChoice {
  try {
    const value = globalThis.localStorage?.getItem('twenty-seven/music')
    return value === 'D' || value === 'E' || value === 'F' ? value : 'default'
  } catch { return 'default' }
}
export function setMusicChoice(choice: MusicChoice) {
  musicChoice = choice
  if (trackGain && ctx) trackGain.gain.setTargetAtTime(trackLevel(choice), ctx.currentTime, 0.05)
  musicSeason = null
  step = 0
  nextAt = ctx ? ctx.currentTime + 0.1 : 0
  try { globalThis.localStorage?.setItem('twenty-seven/music', choice) } catch { /* 저장 불가 시에도 선택은 적용 */ }
}
export function currentMusicChoice(): MusicChoice { return musicChoice }

// ── 소리 크기: 배경음·효과음 따로 (0~1, 기본 0.7) ──
export type VolumeKind = 'music' | 'sfx'
const VOLUME_KEY: Record<VolumeKind, string> = { music: 'twenty-seven/volume-music', sfx: 'twenty-seven/volume-sfx' }
export const DEFAULT_VOLUME = 0.7
const BASE_GAIN: Record<VolumeKind, number> = { music: 0.35, sfx: 1 }
function readVolume(kind: VolumeKind): number {
  try {
    const raw = globalThis.localStorage?.getItem(VOLUME_KEY[kind])
    const v = raw === null || raw === undefined ? NaN : Number(raw)
    return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : DEFAULT_VOLUME
  } catch {
    return DEFAULT_VOLUME
  }
}
const volumes: Record<VolumeKind, number> = { music: readVolume('music'), sfx: readVolume('sfx') }
/** 슬라이더 값 → 실제 크기. 귀는 크기를 로그로 느끼므로 제곱으로 편다 (기본 0.7에서 원래 크기, 끝까지 올리면 약 두 배) */
export function volumeGain(kind: VolumeKind, v: number): number {
  return BASE_GAIN[kind] * (v / DEFAULT_VOLUME) ** 2
}
export function currentVolume(kind: VolumeKind): number {
  return volumes[kind]
}
/** 조용한 필사 화면 (계획 14 작업 2): 마을 배경음·빗소리를 잠시 끈다. 효과음(펜 소리)은 그대로 */
let quiet = false
const RAIN_LEVEL = 0.05
export function setQuiet(on: boolean) {
  quiet = on
  if (!ctx) return
  musicGain?.gain.setTargetAtTime(on ? 0 : volumeGain('music', volumes.music), ctx.currentTime, 0.3)
  rainGain?.gain.setTargetAtTime(on ? 0 : RAIN_LEVEL, ctx.currentTime, 0.3)
}
export function isQuiet(): boolean {
  return quiet
}

export function setVolume(kind: VolumeKind, v: number) {
  const value = Math.min(1, Math.max(0, v))
  volumes[kind] = value
  const node = kind === 'music' ? musicGain : sfxGain
  if (node && ctx && !(quiet && kind === 'music')) node.gain.setTargetAtTime(volumeGain(kind, value), ctx.currentTime, 0.05)
  try {
    globalThis.localStorage?.setItem(VOLUME_KEY[kind], String(value))
  } catch {
    /* 저장 불가 시에도 이번 판에는 적용 */
  }
}

/** 첫 사용자 입력 때 부른다 */
export function unlockAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume()
    return
  }
  const AC = (globalThis as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ??
    (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return
  try {
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : 0.6
    master.connect(ctx.destination)
    musicGain = ctx.createGain()
    musicGain.gain.value = quiet ? 0 : volumeGain('music', volumes.music)
    musicGain.connect(master)
    trackGain = ctx.createGain()
    trackGain.gain.value = trackLevel(musicChoice)
    trackGain.connect(musicGain)
    sfxGain = ctx.createGain()
    sfxGain.gain.value = volumeGain('sfx', volumes.sfx)
    sfxGain.connect(master)
  } catch {
    ctx = null
  }
}

export function setAudioMuted(m: boolean) {
  muted = m
  if (master && ctx) master.gain.setTargetAtTime(m ? 0 : 0.6, ctx.currentTime, 0.05)
}

function tone(freq: number, dur: number, opts: { type?: OscillatorType; vol?: number; at?: number; slide?: number; out?: AudioNode } = {}) {
  if (!ctx || !sfxGain) return
  const t0 = ctx.currentTime + (opts.at ?? 0)
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = opts.type ?? 'square'
  o.frequency.setValueAtTime(freq, t0)
  if (opts.slide) o.frequency.linearRampToValueAtTime(freq + opts.slide, t0 + dur)
  const v = opts.vol ?? 0.08
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(v, t0 + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  o.connect(g)
  g.connect(opts.out ?? sfxGain)
  o.start(t0)
  o.stop(t0 + dur + 0.02)
}

function noise(dur: number, vol: number, filterFreq: number, at = 0) {
  if (!ctx || !sfxGain) return
  const len = Math.floor(ctx.sampleRate * dur)
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const src = ctx.createBufferSource()
  src.buffer = buf
  const f = ctx.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.value = filterFreq
  const g = ctx.createGain()
  g.gain.value = vol
  src.connect(f)
  f.connect(g)
  g.connect(sfxGain)
  src.start(ctx.currentTime + at)
}

export function sfx(name: Sfx) {
  if (!ctx || muted) return
  switch (name) {
    case 'step':
      noise(0.05, 0.15, 900)
      break
    case 'talk':
      tone(660, 0.07, { vol: 0.05 })
      tone(880, 0.08, { vol: 0.05, at: 0.08 })
      break
    case 'scroll':
      noise(0.25, 0.2, 2500)
      break
    case 'pen':
      noise(0.12, 0.12, 4000)
      noise(0.1, 0.1, 3500, 0.15)
      break
    case 'tap':
      tone(520, 0.05, { type: 'triangle', vol: 0.08 })
      break
    case 'hit':
      tone(784, 0.1, { type: 'triangle', vol: 0.1 })
      tone(1046, 0.12, { type: 'triangle', vol: 0.08, at: 0.06 })
      break
    case 'miss':
      tone(220, 0.1, { type: 'triangle', vol: 0.06 })
      break
    case 'done':
      ;[523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, { type: 'triangle', vol: 0.08, at: i * 0.09 }))
      break
    case 'sleep':
      ;[523, 440, 392, 330].forEach((f, i) => tone(f, 0.3, { type: 'sine', vol: 0.07, at: i * 0.18 }))
      break
    case 'eat':
      noise(0.06, 0.2, 1200)
      noise(0.06, 0.2, 1000, 0.12)
      break
    case 'gift':
      tone(988, 0.12, { type: 'sine', vol: 0.08 })
      tone(1318, 0.2, { type: 'sine', vol: 0.07, at: 0.1 })
      break
    case 'meow':
      tone(700, 0.35, { type: 'sine', vol: 0.07, slide: 300 })
      break
    case 'bark':
      tone(300, 0.08, { vol: 0.08, slide: -80 })
      tone(320, 0.08, { vol: 0.08, slide: -80, at: 0.14 })
      break
    case 'place':
      tone(180, 0.08, { type: 'triangle', vol: 0.12 })
      break
  }
}

// ── 계절 음악: 잔잔한 오음계 가락 ──

const NOTE = (n: number) => 440 * Math.pow(2, (n - 69) / 12)
/** 계절마다 16박 가락 (MIDI 번호, 0은 쉼) */
const MELODY: Record<Season, number[]> = {
  spring: [72, 0, 74, 76, 79, 0, 76, 74, 72, 0, 69, 72, 74, 0, 0, 0],
  summer: [76, 79, 81, 0, 79, 76, 74, 0, 76, 0, 72, 74, 76, 0, 0, 0],
  autumn: [69, 0, 72, 74, 72, 0, 69, 67, 64, 0, 67, 69, 67, 0, 0, 0],
  winter: [64, 0, 67, 0, 69, 67, 64, 0, 62, 0, 64, 0, 60, 0, 0, 0],
}
const BASS: Record<Season, number[]> = {
  spring: [48, 55, 52, 55],
  summer: [52, 55, 57, 55],
  autumn: [45, 52, 48, 52],
  winter: [40, 47, 43, 47],
}
// B·C·D는 미리 들려드린 세 곡의 서로 다른 8비트 선율이다.
const RETRO: Record<'D' | 'E' | 'F', number[]> = {
  D: [72, 76, 79, 84, 79, 76, 74, 0, 74, 77, 81, 84, 81, 77, 76, 0, 76, 79, 84, 86, 84, 79, 77, 76, 74, 71, 67, 71, 72, 0, 79, 0],
  E: [76, 0, 79, 81, 79, 76, 72, 76, 74, 0, 77, 79, 77, 74, 71, 74, 72, 76, 79, 84, 83, 79, 76, 72, 74, 77, 76, 74, 72, 0, 72, 0],
  F: [69, 72, 76, 81, 76, 72, 69, 76, 67, 71, 74, 79, 74, 71, 67, 74, 65, 69, 72, 77, 72, 69, 65, 72, 64, 68, 71, 76, 74, 71, 68, 64],
}

// ── 곡마다 같은 크기로 ──
// 음 하나의 에너지는 (파형의 실효값 × 음량)² × 길이에 비례하고, 음 길이가 박자에 비례하므로
// 초당 평균 에너지는 박자 빠르기와 상관없이 "소리 나는 박의 비율 × 파형 실효값²"으로 정해진다.
// 네모파(B·C·D)는 세모파(A)보다 실효값이 √3배 크고 쉼표도 적어서, 그대로 두면 A보다 약 6dB 크게 들린다.
const RMS2: Record<'triangle' | 'square' | 'sine', number> = { triangle: 1 / 3, square: 1, sine: 1 / 2 }
/** 네모파는 높은 배음이 많아 같은 에너지여도 조금 더 크게 들린다 — 그만큼 더 낮춘다 (약 1dB) */
const BRIGHT = 1.25
const MELODY_VOL = 0.07
const BASS_POWER = 0.06 ** 2 * RMS2.sine * (3.5 / 4)
const soundingRatio = (notes: readonly number[]) => notes.filter((n) => n !== 0).length / notes.length
/** 곡의 평균 세기 (상대값). A는 네 계절 가락의 평균 */
export function trackPower(choice: MusicChoice): number {
  const melody =
    choice === 'default'
      ? (Object.values(MELODY).reduce((a, m) => a + soundingRatio(m), 0) / 4) * RMS2.triangle
      : soundingRatio(RETRO[choice]) * RMS2.square * BRIGHT
  return MELODY_VOL ** 2 * melody * 0.9 + BASS_POWER
}
/** A와 같은 세기가 되도록 곱할 값 */
export function trackLevel(choice: MusicChoice): number {
  return Math.sqrt(trackPower('default') / trackPower(choice))
}

let musicTimer: ReturnType<typeof setInterval> | null = null
let musicSeason: Season | null = null
let musicNight = false
let step = 0
let nextAt = 0

export function playMusic(season: Season, night: boolean) {
  if (!ctx) return
  musicNight = night
  if (musicSeason === season && musicTimer) return
  musicSeason = season
  if (musicTimer) return
  nextAt = ctx.currentTime + 0.1
  musicTimer = setInterval(() => {
    if (!ctx || !musicSeason || !musicGain) return
    const beat = musicChoice === 'D' ? (musicNight ? 0.5544 : 0.25344)
      : musicChoice === 'E' ? (musicNight ? 0.5808 : 0.23628)
      : musicChoice === 'F' ? (musicNight ? 0.5016 : 0.22044)
      : (musicNight ? 0.62 : 0.42)
    while (nextAt < ctx.currentTime + 0.4) {
      const retro = musicChoice !== 'default' ? RETRO[musicChoice] : null
      const base = retro ?? MELODY[musicSeason]
      const m = base[step % base.length]
      if (m) tone(NOTE(musicNight ? m - 12 : m), beat * 0.9, { type: retro ? 'square' : 'triangle', vol: musicNight ? 0.05 : 0.07, at: nextAt - ctx.currentTime, out: trackGain ?? musicGain })
      if (step % 4 === 0) tone(NOTE(BASS[musicSeason][(step / 4) % 4]), beat * 3.5, { type: 'sine', vol: 0.06, at: nextAt - ctx.currentTime, out: trackGain ?? musicGain })
      step++
      nextAt += beat
    }
  }, 120)
}

/** 빗소리 (바깥·비 오는 날) */
export function setRain(on: boolean) {
  if (!ctx || !sfxGain) return
  if (on && !rainNode) {
    const len = ctx.sampleRate * 2
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
    rainNode = ctx.createBufferSource()
    rainNode.buffer = buf
    rainNode.loop = true
    const f = ctx.createBiquadFilter()
    f.type = 'highpass'
    f.frequency.value = 1500
    rainGain = ctx.createGain()
    rainGain.gain.value = quiet ? 0 : RAIN_LEVEL
    rainNode.connect(f)
    f.connect(rainGain)
    rainGain.connect(sfxGain)
    rainNode.start()
  } else if (!on && rainNode) {
    try {
      rainNode.stop()
    } catch {
      /* 이미 멈춤 */
    }
    rainNode = null
    rainGain = null
  }
}
