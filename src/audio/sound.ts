// 소리 (설계 2.10). 외부 음원 없이 Web Audio로 합성한다. 첫 탭 전에는 소리를 내지 않는다(브라우저 정책).
// AudioContext가 없는 곳(테스트·오래된 브라우저)에서는 모든 함수가 아무 일도 하지 않는다.
// 옛 마을(돌집·포도밭·양·고깃배·호수)과 조용한 필사에 어울리게: 뜯는 수금, 잔잔한 물결 같은 분산화음, 등잔 아래 피리, 장날의 손북.
// 높은 배음이 센 네모파는 쓰지 않고, 배경음 전체를 한 번 더 낮은 쪽으로 걸러 귀에 거슬리지 않게 한다.
import type { Season } from '../engine/types'

export const SFX_NAMES = [
  'step', 'talk', 'scroll', 'tap', 'hit', 'miss', 'done', 'sleep', 'eat', 'gift', 'meow', 'bark', 'place', 'pen',
  'page', 'bind', 'shelve', 'door', 'coin', 'bell', 'splash', 'letter', 'harvest', 'quill', 'stamp',
] as const
export type Sfx = (typeof SFX_NAMES)[number]

let ctx: AudioContext | null = null
let master: GainNode | null = null
let musicGain: GainNode | null = null
/** 효과음·빗소리가 모이는 곳 (배경음과 따로 크기를 맞춘다) */
let sfxGain: GainNode | null = null
/** 곡마다 소리 크기를 맞추는 곳 (musicGain 앞) */
let trackGain: GainNode | null = null
/** 배경음이 함께 쓰는 메아리 (한 번만 만든다) */
let echoIn: GainNode | null = null
/** 소리 결을 내는 데 함께 쓰는 잡음 (한 번만 만든다 — 무작위는 여기에만) */
let noiseBuf: AudioBuffer | null = null
let muted = readMuted()
export type MusicChoice = 'default' | 'D' | 'E' | 'F'
/** 설정 화면에 보이는 순서: 들판·호숫가·등불·장날 (저장 값은 예전 그대로) */
export const MUSIC_CHOICES: readonly MusicChoice[] = ['default', 'D', 'E', 'F']
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
  loopKey = ''
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

// ── 메아리: 0.42초 뒤로 조금씩 흐려지며 되돌아온다 ──
const ECHO_DELAY = 0.42
const ECHO_FEEDBACK = 0.32
const ECHO_WET = 0.35
/** 배경음 전체에 거는 마지막 거름 — 높은 쪽 날카로움을 덜어낸다 */
const MUSIC_LOWPASS = 3800

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
    const soften = ctx.createBiquadFilter()
    soften.type = 'lowpass'
    soften.frequency.value = MUSIC_LOWPASS
    soften.Q.value = 0.5
    soften.connect(musicGain)
    trackGain = ctx.createGain()
    trackGain.gain.value = trackLevel(musicChoice)
    trackGain.connect(soften)
    // 메아리: 들어온 소리 → 지연 → (거름 → 되먹임) → 곡 크기로
    echoIn = ctx.createGain()
    const delay = ctx.createDelay(1)
    delay.delayTime.value = ECHO_DELAY
    const dull = ctx.createBiquadFilter()
    dull.type = 'lowpass'
    dull.frequency.value = 1800
    const fb = ctx.createGain()
    fb.gain.value = ECHO_FEEDBACK
    const wet = ctx.createGain()
    wet.gain.value = ECHO_WET
    echoIn.connect(delay)
    delay.connect(dull)
    dull.connect(fb)
    fb.connect(delay)
    dull.connect(wet)
    wet.connect(trackGain)
    sfxGain = ctx.createGain()
    sfxGain.gain.value = volumeGain('sfx', volumes.sfx)
    sfxGain.connect(master)
    const len = ctx.sampleRate
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  } catch {
    ctx = null
  }
}

export function setAudioMuted(m: boolean) {
  muted = m
  if (master && ctx) master.gain.setTargetAtTime(m ? 0 : 0.6, ctx.currentTime, 0.05)
}

// ── 악기 (배경음·효과음이 함께 쓴다). t는 AudioContext 시각, out은 보낼 곳 ──

export type Voice = 'pluck' | 'soft' | 'flute' | 'pad' | 'drone' | 'drum'

/** 음 하나가 실제로 울리는 길이(초). 배경음 크기 계산과 합성이 같은 값을 쓴다 */
export function voiceSeconds(voice: Voice, lenBeats: number, beat: number, variant = 0): number {
  const s = lenBeats * beat
  switch (voice) {
    case 'pluck': return Math.min(2.2, Math.max(0.5, s * 1.6))
    case 'soft': return Math.min(1.8, Math.max(0.8, s * 4))
    case 'drum': return variant === 0 ? 0.4 : 0.15
    default: return s
  }
}
/** 길게 끄는 소리(피리·바탕·밑음)의 들어오고 사라지는 시간 */
function swell(voice: Voice, dur: number): { attack: number; release: number } {
  if (voice === 'flute') return { attack: Math.min(0.3, dur * 0.3), release: Math.min(0.6, dur * 0.4) }
  if (voice === 'pad') return { attack: Math.min(1.2, dur * 0.35), release: Math.min(1.5, dur * 0.4) }
  return { attack: Math.min(0.8, dur * 0.3), release: Math.min(1.2, dur * 0.4) }
}

function envGain(t: number, vol: number, dur: number, attack: number, out: AudioNode, send = 0): GainNode {
  const g = ctx!.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(vol, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  g.connect(out)
  sendTo(g, send)
  return g
}
function sustainGain(t: number, vol: number, dur: number, attack: number, release: number, out: AudioNode, send = 0): GainNode {
  const g = ctx!.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(vol, t + attack)
  g.gain.setValueAtTime(vol, t + Math.max(attack, dur - release))
  g.gain.linearRampToValueAtTime(0, t + dur)
  g.connect(out)
  sendTo(g, send)
  return g
}
function sendTo(g: GainNode, send: number) {
  if (send <= 0 || !echoIn || !ctx) return
  const s = ctx.createGain()
  s.gain.value = send
  g.connect(s)
  s.connect(echoIn)
}
function osc(type: OscillatorType, freq: number, t: number, end: number): OscillatorNode {
  const o = ctx!.createOscillator()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  o.start(t)
  o.stop(end + 0.05)
  return o
}

/** 뜯는 수금: 톱니파를 밝게 시작해 금방 어둡게 닫는 거름으로 — 줄을 튕긴 듯 */
function pluck(freq: number, t: number, dur: number, vol: number, out: AudioNode, send = 0) {
  const o = osc('sawtooth', freq, t, t + dur)
  const f = ctx!.createBiquadFilter()
  f.type = 'lowpass'
  f.Q.value = 0.6
  f.frequency.setValueAtTime(Math.min(freq * 5, 2600), t)
  f.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.2, 180), t + dur * 0.6)
  o.connect(f)
  f.connect(envGain(t, vol, dur, 0.004, out, send))
}
/** 물결 같은 고운 소리: 세모파를 부드럽게 열고 천천히 사라지게 */
function soft(freq: number, t: number, dur: number, vol: number, out: AudioNode, send = 0) {
  const o = osc('triangle', freq, t, t + dur)
  const f = ctx!.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = 2000
  o.connect(f)
  f.connect(envGain(t, vol, dur, 0.03, out, send))
}
/** 피리: 사인파에 늦게 들어오는 떨림 (숨결) */
function flute(freq: number, t: number, dur: number, vol: number, out: AudioNode, send = 0) {
  const { attack, release } = swell('flute', dur)
  const g = sustainGain(t, vol, dur, attack, release, out, send)
  const o = osc('sine', freq, t, t + dur)
  const lfo = osc('sine', 4.8, t, t + dur)
  const depth = ctx!.createGain()
  depth.gain.setValueAtTime(0, t)
  depth.gain.linearRampToValueAtTime(freq * 0.005, t + Math.min(0.8, dur * 0.5))
  lfo.connect(depth)
  depth.connect(o.frequency)
  o.connect(g)
  const o2 = osc('sine', freq * 2, t, t + dur)
  const g2 = ctx!.createGain()
  g2.gain.value = 0.12
  o2.connect(g2)
  g2.connect(g)
}
/** 따뜻한 바탕: 살짝 어긋난 세모파 둘을 낮게 걸러 */
function pad(freq: number, t: number, dur: number, vol: number, out: AudioNode, send = 0) {
  const { attack, release } = swell('pad', dur)
  const g = sustainGain(t, vol, dur, attack, release, out, send)
  const f = ctx!.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = 800
  f.connect(g)
  for (const cents of [-4, 4]) {
    const o = osc('triangle', freq * Math.pow(2, cents / 1200), t, t + dur)
    o.connect(f)
  }
}
/** 밑음: 길게 끄는 사인파 */
function drone(freq: number, t: number, dur: number, vol: number, out: AudioNode, send = 0) {
  const { attack, release } = swell('drone', dur)
  osc('sine', freq, t, t + dur).connect(sustainGain(t, vol, dur, attack, release, out, send))
}
/** 잡음 한 줌: 거름 종류·높이·쓸어 올림(to)을 고른다 */
function noiseAt(t: number, dur: number, vol: number, freq: number, out: AudioNode, opts: { type?: BiquadFilterType; q?: number; to?: number; attack?: number } = {}) {
  if (!ctx || !noiseBuf) return
  const src = ctx.createBufferSource()
  src.buffer = noiseBuf
  src.loop = true
  const f = ctx.createBiquadFilter()
  f.type = opts.type ?? 'bandpass'
  f.Q.value = opts.q ?? 1
  f.frequency.setValueAtTime(freq, t)
  if (opts.to) f.frequency.exponentialRampToValueAtTime(opts.to, t + dur)
  src.connect(f)
  f.connect(envGain(t, vol, dur, opts.attack ?? 0.005, out))
  src.start(t)
  src.stop(t + dur + 0.05)
}
/** 손북: 둥(0)은 가라앉는 낮은 울림, 탁(1)은 가벼운 가죽 소리 */
function drum(variant: number, t: number, vol: number, out: AudioNode) {
  const dur = voiceSeconds('drum', 1, 1, variant)
  const [from, to] = variant === 0 ? [110, 52] : [220, 160]
  const o = osc('sine', from, t, t + dur)
  o.frequency.exponentialRampToValueAtTime(to, t + dur * 0.5)
  o.connect(envGain(t, vol, dur, 0.003, out))
  noiseAt(t, variant === 0 ? 0.08 : 0.05, vol * 0.35, variant === 0 ? 400 : 1200, out, { type: variant === 0 ? 'lowpass' : 'bandpass' })
}

// ── 곡 악보 ──
// 모든 곡은 박(step) 단위의 고리(loop)다. 음표는 정해진 값으로만 만든다(무작위 없음) — 같은 곡은 언제나 같게 들린다.

export interface NoteEv {
  step: number
  voice: Voice
  /** MIDI 번호 (손북은 0=둥, 1=탁) */
  midi: number
  /** 박 수 */
  len: number
  vol: number
  /** 메아리로 보내는 몫 (0~1) */
  send: number
}
export interface Loop {
  /** 한 박의 길이(초) */
  beat: number
  steps: number
  events: NoteEv[]
}

const NOTE = (n: number) => 440 * Math.pow(2, (n - 69) / 12)
const R = 0 // 쉼
/** 밤에는 모든 곡이 이만큼 더 여리게 */
export const NIGHT_SOFT = 0.7
const MINOR: Record<Season, boolean> = { spring: false, summer: false, autumn: true, winter: true }

// 들판 — 뜯는 수금의 오음계 가락 + 낮은 수금 반주 + 밑음. 계절마다 다른 조 (봄 C, 여름 D, 가을 A단조, 겨울 E단조)
const FIELD_MELODY: Record<Season, number[]> = {
  spring: [72, R, 74, 76, 79, R, 76, 74, 72, R, 69, R, 67, R, R, R, 69, R, 72, 74, 76, R, 74, 72, 74, R, 72, 69, 72, R, R, R],
  summer: [74, 76, 78, R, 81, R, 78, 76, 74, R, 71, 74, 76, R, R, R, 78, R, 81, 83, 81, R, 78, 76, 78, 76, 74, R, 74, R, R, R],
  autumn: [69, R, 72, 74, 76, R, 74, 72, 69, R, 67, R, 64, R, R, R, 67, R, 69, 72, 74, R, 72, 69, 67, R, 64, 67, 69, R, R, R],
  winter: [64, R, 67, R, 69, 71, 69, 67, 64, R, 62, R, 59, R, R, R, 62, R, 64, 67, 69, R, 67, 64, 62, R, 59, 62, 64, R, R, R],
}
const FIELD_ROOT: Record<Season, number> = { spring: 48, summer: 50, autumn: 45, winter: 52 }
function fieldLoop(season: Season, night: boolean): Loop {
  const beat = night ? 0.5 : 0.34
  const lvl = night ? NIGHT_SOFT : 1
  const root = FIELD_ROOT[season]
  const events: NoteEv[] = []
  FIELD_MELODY[season].forEach((m, step) => {
    if (m) events.push({ step, voice: 'pluck', midi: night ? m - 12 : m, len: 1, vol: 0.075 * lvl, send: 0.3 })
  })
  // 마디(8박)마다 낮은 수금 두 번: 마디 밑음과 그 다섯째 음
  const bars = MINOR[season] ? [0, 3, 7, 10] : [0, 7, 9, 7]
  bars.forEach((off, bar) => {
    events.push({ step: bar * 8, voice: 'pluck', midi: root + off + 12, len: 3, vol: 0.05 * lvl, send: 0.2 })
    events.push({ step: bar * 8 + 4, voice: 'pluck', midi: root + off + 19, len: 3, vol: 0.04 * lvl, send: 0.2 })
  })
  // 밑음과 다섯째 음을 반 고리씩 길게
  for (const at of [0, 16]) {
    events.push({ step: at, voice: 'drone', midi: root, len: 16, vol: 0.035 * lvl, send: 0 })
    events.push({ step: at, voice: 'drone', midi: root + 7, len: 16, vol: 0.02 * lvl, send: 0 })
  }
  return { beat, steps: 32, events }
}

// 호숫가 — 물결처럼 오르내리는 분산화음 (열린 화음: 밑음·다섯째·아홉째·열째·열두째) + 마디 밑음. 메아리를 넉넉히
const LAKE_ROOT: Record<Season, number> = { spring: 53, summer: 55, autumn: 50, winter: 52 }
/** 마디마다 [밑음에서 떨어진 반음 수, 단화음인가] */
const LAKE_MAJOR: [number, boolean][] = [[0, false], [9, true], [5, false], [7, false]]
const LAKE_MINOR: [number, boolean][] = [[0, true], [8, false], [3, false], [10, false]]
const LAKE_ARP = [0, 1, 2, 3, 4, 3, 2, 1]
function lakeLoop(season: Season, night: boolean): Loop {
  const beat = night ? 0.32 : 0.22
  const lvl = night ? NIGHT_SOFT : 1
  const root = LAKE_ROOT[season]
  const events: NoteEv[] = []
  ;(MINOR[season] ? LAKE_MINOR : LAKE_MAJOR).forEach(([off, minor], bar) => {
    const voicing = [0, 7, 14, minor ? 15 : 16, 19].map((x) => root + off + x)
    LAKE_ARP.forEach((idx, i) => {
      events.push({ step: bar * 8 + i, voice: 'soft', midi: voicing[idx], len: 1, vol: (i === 0 ? 0.06 : 0.045) * lvl, send: 0.5 })
    })
    events.push({ step: bar * 8, voice: 'drone', midi: root + off - 12 + (off > 6 ? 0 : 12), len: 8, vol: 0.03 * lvl, send: 0.2 })
  })
  return { beat, steps: 32, events }
}

// 등불 — 아주 느리고 드문 피리 가락 (D 단조 오음계) 위에 따뜻한 바탕 화음. 빈 곳을 넉넉히 둔다
const LAMP_TRANSPOSE: Record<Season, number> = { spring: 0, summer: 2, autumn: -2, winter: -4 }
/** [박, MIDI, 박 수] */
const LAMP_MELODY: [number, number, number][] = [
  [0, 69, 6], [8, 72, 3], [11, 74, 1], [12, 72, 4], [20, 69, 2], [22, 67, 2], [24, 65, 6],
  [32, 67, 4], [36, 69, 2], [38, 72, 2], [40, 74, 6], [48, 72, 2], [50, 69, 2], [52, 67, 4], [56, 62, 6],
]
/** 16박마다 바탕 화음: Dm · B♭ · C · Am */
const LAMP_PAD: number[][] = [[50, 57, 65], [46, 53, 62], [48, 55, 64], [45, 52, 60]]
function lampLoop(season: Season, night: boolean): Loop {
  const beat = night ? 0.85 : 0.6
  const lvl = night ? NIGHT_SOFT : 1
  const tr = LAMP_TRANSPOSE[season]
  const events: NoteEv[] = []
  for (const [step, m, len] of LAMP_MELODY) events.push({ step, voice: 'flute', midi: m + tr, len, vol: 0.028 * lvl, send: 0.45 })
  LAMP_PAD.forEach((chord, i) => {
    for (const m of chord) events.push({ step: i * 16, voice: 'pad', midi: m + tr, len: 16, vol: 0.012 * lvl, send: 0.15 })
  })
  return { beat, steps: 64, events }
}

// 장날 — 손북 장단(둥 탁 · 탁 둥 · 탁 ·)에 수금 가락. 봄·여름은 믹솔리디아(밝음), 가을·겨울은 도리아(차분함). 음은 음계 자리로 적는다
const MODE: Record<'mixolydian' | 'dorian', number[]> = { mixolydian: [0, 2, 4, 5, 7, 9, 10], dorian: [0, 2, 3, 5, 7, 9, 10] }
const MARKET_TONIC: Record<Season, number> = { spring: 67, summer: 69, autumn: 62, winter: 64 }
const N = null // 쉼
const MARKET_MELODY: (number | null)[] = [
  4, N, 4, 5, 6, 5, 4, 2, 3, N, 2, 1, 0, N, N, N, 4, N, 4, 5, 6, 7, 8, 7, 6, 5, 4, 3, 4, N, N, N,
  7, N, 6, 5, 4, N, 5, 6, 7, 8, 7, 6, 5, N, N, N, 4, 5, 6, 5, 4, 3, 2, 1, 2, 1, 0, N, 0, N, N, N,
]
/** 마디(8박)마다 반주 밑음의 음계 자리 */
const MARKET_BASS = [0, 0, -1, 0, 3, 0, -1, 0]
/** 한 마디의 손북: [박, 둥(0)/탁(1), 세기] */
const MAQSUM: [number, number, number][] = [[0, 0, 1], [1, 1, 0.6], [3, 1, 0.6], [4, 0, 0.8], [6, 1, 0.6]]
function degree(tonic: number, scale: number[], d: number): number {
  const oct = Math.floor(d / 7)
  return tonic + oct * 12 + scale[((d % 7) + 7) % 7]
}
function marketLoop(season: Season, night: boolean): Loop {
  const beat = night ? 0.28 : 0.2
  const lvl = night ? NIGHT_SOFT : 1
  const scale = MINOR[season] ? MODE.dorian : MODE.mixolydian
  const tonic = MARKET_TONIC[season]
  const events: NoteEv[] = []
  MARKET_MELODY.forEach((d, step) => {
    if (d !== null) events.push({ step, voice: 'pluck', midi: degree(tonic, scale, d), len: 1, vol: 0.06 * lvl, send: 0.2 })
  })
  MARKET_BASS.forEach((d, bar) => {
    events.push({ step: bar * 8, voice: 'pluck', midi: degree(tonic - 24, scale, d), len: 3, vol: 0.05 * lvl, send: 0.1 })
    events.push({ step: bar * 8 + 4, voice: 'pluck', midi: degree(tonic - 24, scale, d + 4), len: 3, vol: 0.04 * lvl, send: 0.1 })
    for (const [s, v, w] of MAQSUM) events.push({ step: bar * 8 + s, voice: 'drum', midi: v, len: 1, vol: 0.12 * w * lvl, send: 0 })
  })
  return { beat, steps: 64, events }
}

const LOOPS: Record<MusicChoice, (season: Season, night: boolean) => Loop> = { default: fieldLoop, D: lakeLoop, E: lampLoop, F: marketLoop }
const loopCache = new Map<string, Loop>()
export function musicLoop(choice: MusicChoice, season: Season, night: boolean): Loop {
  const key = `${choice}/${season}/${night ? 1 : 0}`
  let loop = loopCache.get(key)
  if (!loop) {
    // 조를 옮기면 귀에 들리는 크기도 조금 달라진다 — 계절마다 낮 고리를 그 곡의 네 계절 평균 세기에 맞춘다 (밤은 같은 배율로, 그래서 여전히 여리다)
    const raw = LOOPS[choice](season, night)
    const avg = SEASONS.reduce((a, s) => a + loopPower(LOOPS[choice](s, false)), 0) / SEASONS.length
    const k = Math.sqrt(avg / loopPower(night ? LOOPS[choice](season, false) : raw))
    loop = { ...raw, events: raw.events.map((ev) => ({ ...ev, vol: ev.vol * k })) }
    loopCache.set(key, loop)
  }
  return loop
}

// ── 곡마다 같은 크기로 ──
// 음 하나의 에너지 = 음량² × (파형·거름을 거친 실효값²) × 울리는 길이의 몫.
// 지수로 사라지는 소리(수금·물결·손북)는 0.0001까지 내려가는 동안 dur/(2·ln 10⁴) ≈ dur/18.4,
// 길게 끄는 소리(피리·바탕·밑음)는 들어오고 사라지는 직선 구간만큼 2/3씩 빼고 나머지는 그대로 센다.
// 메아리로 보낸 몫은 send² × 젖은 소리² / (1 − 되먹임²) 만큼 더한다. 곡의 세기 = 고리 한 번의 에너지 ÷ 고리 길이.
// 귀는 낮은 소리를 덜 크게 듣는다 — 소리 높이마다 A 가중(소리 크기 측정에서 쓰는 곡선)을 곱한다.
/** 거름까지 거친 대략의 실효값² */
const VOICE_RMS2: Record<Voice, number> = { pluck: 0.15, soft: 0.3, flute: 0.5 * (1 + 0.12 ** 2), pad: 0.6, drone: 0.5, drum: 0.5 }
/** A 가중 (에너지 배율, 1kHz에서 1) */
export function aWeight(f: number): number {
  const f2 = f * f
  const ra = (12194 ** 2 * f2 * f2) / ((f2 + 20.6 ** 2) * Math.sqrt((f2 + 107.7 ** 2) * (f2 + 737.9 ** 2)) * (f2 + 12194 ** 2))
  return (ra * 10 ** (2 / 20)) ** 2
}
/** 귀에 들리는 대표 높이: 수금(톱니파)은 둘째 배음 쪽이 크게 들리고, 손북은 가죽 소리 쪽(약 300Hz)으로 본다 */
function hearingFreq(ev: NoteEv): number {
  if (ev.voice === 'drum') return 300
  return NOTE(ev.midi) * (ev.voice === 'pluck' ? 2 : 1)
}
const DECAY_SHARE = 1 / (2 * Math.log(1e4))
const ECHO_GAIN2 = ECHO_WET ** 2 / (1 - ECHO_FEEDBACK ** 2)
export function noteEnergy(ev: NoteEv, beat: number): number {
  const dur = voiceSeconds(ev.voice, ev.len, beat, ev.midi)
  const decaying = ev.voice === 'pluck' || ev.voice === 'soft' || ev.voice === 'drum'
  let body: number
  if (decaying) body = dur * DECAY_SHARE
  else {
    const { attack, release } = swell(ev.voice, dur)
    body = dur - ((attack + release) * 2) / 3
  }
  return ev.vol ** 2 * VOICE_RMS2[ev.voice] * aWeight(hearingFreq(ev)) * body * (1 + ev.send ** 2 * ECHO_GAIN2)
}
export function loopPower(loop: Loop): number {
  return loop.events.reduce((a, ev) => a + noteEnergy(ev, loop.beat), 0) / (loop.steps * loop.beat)
}
const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter']
/** 곡의 평균 세기 (상대값): 네 계절 낮 고리의 평균 */
export function trackPower(choice: MusicChoice): number {
  return SEASONS.reduce((a, s) => a + loopPower(musicLoop(choice, s, false)), 0) / SEASONS.length
}
/** 네 곡이 모두 이 세기로 들리게 한다 (예전 기본 곡과 비슷한 크기) */
export const TARGET_POWER = 5e-5
/** 이 곡에 곱할 값 */
export function trackLevel(choice: MusicChoice): number {
  return Math.sqrt(TARGET_POWER / trackPower(choice))
}

function playNote(ev: NoteEv, t: number, beat: number) {
  const out = trackGain ?? musicGain
  if (!out) return
  const dur = voiceSeconds(ev.voice, ev.len, beat, ev.midi)
  const f = NOTE(ev.midi)
  switch (ev.voice) {
    case 'pluck': return pluck(f, t, dur, ev.vol, out, ev.send)
    case 'soft': return soft(f, t, dur, ev.vol, out, ev.send)
    case 'flute': return flute(f, t, dur, ev.vol, out, ev.send)
    case 'pad': return pad(f, t, dur, ev.vol, out, ev.send)
    case 'drone': return drone(f, t, dur, ev.vol, out, ev.send)
    case 'drum': return drum(ev.midi, t, ev.vol, out)
  }
}

let musicTimer: ReturnType<typeof setInterval> | null = null
let musicSeason: Season | null = null
let musicNight = false
let loopKey = ''
let step = 0
let nextAt = 0
/** 박마다 울릴 음 (고리마다 한 번 묶어 둔다) */
const byStepCache = new WeakMap<Loop, NoteEv[][]>()
function eventsAt(loop: Loop, s: number): NoteEv[] {
  let table = byStepCache.get(loop)
  if (!table) {
    table = Array.from({ length: loop.steps }, () => [] as NoteEv[])
    for (const ev of loop.events) table[ev.step].push(ev)
    byStepCache.set(loop, table)
  }
  return table[s % loop.steps]
}

export function playMusic(season: Season, night: boolean) {
  if (!ctx) return
  musicNight = night
  musicSeason = season
  if (musicTimer) return
  nextAt = ctx.currentTime + 0.1
  musicTimer = setInterval(() => {
    if (!ctx || !musicSeason || !musicGain) return
    const key = `${musicChoice}/${musicSeason}/${musicNight}`
    if (key !== loopKey) {
      // 계절·낮밤·곡이 바뀌면 처음부터, 잠깐 숨을 쉬고
      const first = loopKey === ''
      loopKey = key
      step = 0
      if (!first) nextAt = Math.max(nextAt, ctx.currentTime) + 0.6
    }
    const loop = musicLoop(musicChoice, musicSeason, musicNight)
    if (nextAt < ctx.currentTime - 1) nextAt = ctx.currentTime + 0.05 // 탭이 멈췄다 돌아오면 밀린 음을 몰아 치지 않는다
    while (nextAt < ctx.currentTime + 0.4) {
      // 조용한 필사 화면·음소거 중에는 박만 세고 소리는 만들지 않는다
      if (!quiet && !muted) for (const ev of eventsAt(loop, step)) playNote(ev, nextAt, loop.beat)
      step = (step + 1) % loop.steps
      nextAt += loop.beat
    }
  }, 120)
}

// ── 효과음 ──

function tone(freq: number, dur: number, opts: { type?: OscillatorType; vol?: number; at?: number; slide?: number; attack?: number } = {}) {
  if (!ctx || !sfxGain) return
  const t = ctx.currentTime + (opts.at ?? 0)
  const o = osc(opts.type ?? 'triangle', freq, t, t + dur)
  if (opts.slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + opts.slide), t + dur)
  o.connect(envGain(t, opts.vol ?? 0.06, dur, opts.attack ?? 0.008, sfxGain))
}
function rustle(dur: number, vol: number, freq: number, at = 0, opts: { type?: BiquadFilterType; q?: number; to?: number; attack?: number } = {}) {
  if (!ctx || !sfxGain) return
  noiseAt(ctx.currentTime + at, dur, vol, freq, sfxGain, opts)
}
function lyre(freqs: number[], gap: number, dur: number, vol: number, at = 0) {
  if (!ctx || !sfxGain) return
  freqs.forEach((f, i) => pluck(f, ctx!.currentTime + at + i * gap, dur, vol, sfxGain!))
}
function knock(freq: number, vol: number, at = 0) {
  tone(freq, 0.12, { type: 'sine', vol, at, slide: -freq * 0.4, attack: 0.002 })
  rustle(0.04, vol * 0.5, 700, at, { type: 'lowpass' })
}
/** 작은 종: 맑은 배음 몇 개만 (높은 배음은 뺀다) */
function bellAt(freq: number, vol: number, at = 0) {
  tone(freq, 1.8, { type: 'sine', vol, at, attack: 0.003 })
  tone(freq * 2, 1.0, { type: 'sine', vol: vol * 0.35, at, attack: 0.003 })
  tone(freq * 2.76, 0.6, { type: 'sine', vol: vol * 0.2, at, attack: 0.003 })
}

/** pitch: 높이 배율 (글자마다 펜 소리를 조금씩 달리할 때만 쓴다) */
export function sfx(name: Sfx, pitch = 1) {
  if (!ctx || !sfxGain || muted) return
  switch (name) {
    case 'quill': // 필사 글자 하나: 깃펜 끝이 종이를 아주 짧게 긁는 소리 (아주 작게)
      rustle(0.035, 0.03, 3700 * pitch, 0, { q: 4, attack: 0.006 })
      rustle(0.025, 0.015, 5200 * pitch, 0.018, { q: 4, attack: 0.005 })
      break
    case 'stamp': // 한 절을 마침: 펜을 나무 책상에 톡 내려놓고 종이가 살짝 바스락
      knock(190, 0.075)
      rustle(0.16, 0.03, 2400, 0.07, { q: 0.8, attack: 0.04 })
      break
    case 'step': // 흙길 발소리
      rustle(0.06, 0.12, 500, 0, { type: 'lowpass' })
      break
    case 'talk': // 나무 딸깍 두 번
      tone(587, 0.07, { vol: 0.05, slide: -40 })
      tone(784, 0.08, { vol: 0.045, at: 0.075, slide: -50 })
      break
    case 'scroll': // 두루마리 펴는 종이 소리
      rustle(0.08, 0.08, 2400, 0, { q: 0.8, attack: 0.02 })
      rustle(0.1, 0.06, 2000, 0.06, { q: 0.8, attack: 0.02 })
      rustle(0.12, 0.05, 2800, 0.13, { q: 0.8, attack: 0.03 })
      break
    case 'pen': // 깃펜이 종이를 긁는 소리
      rustle(0.07, 0.06, 3800, 0, { q: 3, attack: 0.01 })
      rustle(0.05, 0.05, 4400, 0.09, { q: 3, attack: 0.01 })
      rustle(0.09, 0.05, 3600, 0.16, { q: 3, attack: 0.015 })
      break
    case 'page': // 책장 넘기기: 쓸어 올리는 바람 + 종이가 내려앉는 소리
      rustle(0.26, 0.07, 800, 0, { q: 0.7, to: 3000, attack: 0.08 })
      rustle(0.06, 0.06, 1200, 0.22, { type: 'lowpass' })
      break
    case 'tap':
      tone(660, 0.04, { vol: 0.05 })
      break
    case 'hit': // 수금 두 줄이 위로
      lyre([784, 1046], 0.07, 0.6, 0.07)
      break
    case 'miss': // 낮게 눌린 수금
      lyre([233, 220], 0.08, 0.4, 0.07)
      break
    case 'done': // 수금 화음이 차례로
      lyre([523, 659, 784, 1046], 0.06, 1.2, 0.055)
      break
    case 'sleep': // 내려가는 피리
      ;[784, 659, 587, 523].forEach((f, i) => tone(f, 0.5, { type: 'sine', vol: 0.045, at: i * 0.22, attack: 0.05 }))
      break
    case 'eat': // 사각 베어 무는 소리
      rustle(0.06, 0.12, 1400, 0, { type: 'lowpass' })
      rustle(0.06, 0.1, 1100, 0.12, { type: 'lowpass' })
      break
    case 'gift': // 따뜻한 작은 울림
      tone(440, 0.4, { type: 'triangle', vol: 0.03 })
      tone(880, 0.5, { type: 'sine', vol: 0.05 })
      tone(1318, 0.7, { type: 'sine', vol: 0.035, at: 0.1 })
      break
    case 'meow': {
      const t = ctx.currentTime
      const o = osc('sine', 650, t, t + 0.4)
      o.frequency.exponentialRampToValueAtTime(900, t + 0.15)
      o.frequency.exponentialRampToValueAtTime(600, t + 0.4)
      o.connect(envGain(t, 0.05, 0.4, 0.04, sfxGain))
      break
    }
    case 'bark': // 부드러운 멍멍
      for (const at of [0, 0.14]) {
        tone(260, 0.09, { vol: 0.07, at, slide: -90 })
        rustle(0.05, 0.04, 600, at, { type: 'lowpass' })
      }
      break
    case 'place': // 나무를 내려놓는 소리
      knock(180, 0.09)
      break
    case 'bind': // 실 당기기 + 두 번 두드림 + 수금
      rustle(0.2, 0.05, 1500, 0, { q: 2, to: 2400, attack: 0.06 })
      knock(150, 0.08, 0.2)
      knock(150, 0.07, 0.34)
      lyre([392, 494, 587, 784], 0.06, 1.1, 0.045, 0.5)
      break
    case 'shelve': // 책을 밀어 넣고 툭, 작은 울림
      rustle(0.18, 0.06, 900, 0, { type: 'lowpass', attack: 0.04 })
      knock(140, 0.09, 0.17)
      lyre([659, 880], 0.08, 0.8, 0.04, 0.32)
      break
    case 'door': { // 나무문 삐걱 + 닫히는 소리
      const t = ctx.currentTime
      const o = osc('triangle', 180, t, t + 0.3)
      o.frequency.linearRampToValueAtTime(230, t + 0.15)
      o.frequency.linearRampToValueAtTime(200, t + 0.3)
      const f = ctx.createBiquadFilter()
      f.type = 'lowpass'
      f.frequency.value = 900
      o.connect(f)
      f.connect(envGain(t, 0.035, 0.3, 0.05, sfxGain))
      knock(110, 0.1, 0.3)
      break
    }
    case 'coin': // 동전 두 닢
      tone(1568, 0.15, { type: 'sine', vol: 0.035, attack: 0.002 })
      tone(2093, 0.2, { type: 'sine', vol: 0.03, at: 0.06, attack: 0.002 })
      break
    case 'bell': // 손종 두 번
      bellAt(660, 0.04)
      bellAt(495, 0.035, 0.5)
      break
    case 'splash': // 물 튀는 소리 + 물방울
      rustle(0.35, 0.09, 2500, 0, { q: 0.8, to: 500, attack: 0.01 })
      tone(1200, 0.05, { type: 'sine', vol: 0.02, at: 0.15, slide: 600 })
      tone(1400, 0.05, { type: 'sine', vol: 0.018, at: 0.25, slide: 600 })
      break
    case 'letter': // 봉투 여는 소리 + 작은 울림
      rustle(0.1, 0.06, 2200, 0, { q: 0.8, attack: 0.02 })
      tone(1046, 0.4, { type: 'sine', vol: 0.035, at: 0.1 })
      tone(1318, 0.5, { type: 'sine', vol: 0.03, at: 0.18 })
      break
    case 'harvest': // 잎 바스락 + 오르는 수금
      rustle(0.1, 0.06, 1600, 0, { q: 0.8 })
      lyre([523, 784], 0.07, 0.5, 0.055, 0.03)
      break
  }
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
