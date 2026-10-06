// 손으로 하는 짧은 활동 여섯 가지. 실패가 없다 — 끝까지 하면 언제나 해낸다 (아기자기한 게임이므로).
import type { Minigame, Rng } from './types'

export interface MashState {
  kind: 'mash'
  progress: number
  /** 한 번 찧을 때 차는 양 (없으면 MASH_GAIN — 손재주가 높으면 조금 더) */
  gain?: number
}
export interface TimingState {
  kind: 'timing'
  t: number
  hits: number
  misses: number
  /** 맞히는 구간 [시작, 끝] (0~1) */
  zone: [number, number]
  flash: 'hit' | 'miss' | null
}
export interface PickItem {
  id: number
  x: number
  y: number
  age: number
}
export interface PickState {
  kind: 'pick'
  /** 열매가 머무는 시간 (없으면 PICK_LIFE — 손재주가 높으면 조금 더) */
  life?: number
  items: PickItem[]
  got: number
  nextId: number
  spawn: number
}
/** 길게 누르기: 누르는 동안 눈금이 차오르고, 밝은 칸에서 떼면 한 번 (두레박 끌어올리기·기름틀 누르기) */
export interface HoldState {
  kind: 'hold'
  fill: number
  holding: boolean
  hits: number
  zone: [number, number]
  flash: 'hit' | 'miss' | null
}
/** 번갈아 누르기: 왼쪽·오른쪽을 차례로 (베 짜기·그물 기우기·풀무 밟기) */
export interface WeaveState {
  kind: 'weave'
  /** 다음에 눌러야 할 쪽 */
  next: 0 | 1
  count: number
  flash: 'hit' | 'miss' | null
}
/** 순서 기억하기: 밝게 켜지는 차례를 보고 같은 차례로 (짐 정리·편지 나누기·실 꿰매기) */
export interface OrderState {
  kind: 'order'
  seq: number[]
  /** 차례를 보여 준 뒤 흐른 시간 — 보여 주는 동안엔 누르지 못한다 */
  shown: number
  step: number
  rounds: number
  flash: 'hit' | 'miss' | null
}
export type MiniState = MashState | TimingState | PickState | HoldState | WeaveState | OrderState

export const MASH_GAIN = 0.12
export const MASH_DECAY = 0.05
export const TIMING_PERIOD = 1.6
export const TIMING_NEED = 3
export const PICK_NEED = 5
export const PICK_LIFE = 2.6
export const PICK_EVERY = 0.7
/** 줍기 칸: 가로 5 × 세로 3 */
export const PICK_COLS = 5
export const PICK_ROWS = 3
/** 길게 누르기: 한 번에 차는 빠르기(초당), 두 번 맞추면 끝 */
export const HOLD_RATE = 0.6
export const HOLD_NEED = 2
/** 번갈아 누르기: 열 번 */
export const WEAVE_NEED = 10
/** 순서 기억하기: 네 칸 중 셋을 차례로, 두 판. 한 칸씩 보여 주는 시간(초) */
export const ORDER_CELLS = 4
export const ORDER_LEN = 3
export const ORDER_ROUNDS = 2
export const ORDER_SHOW = 0.55
/** 길게 누르기에서 miniTap에 넘기는 값 (누름·뗌) */
export const HOLD_DOWN = 1
export const HOLD_UP = 0

function sequence(rng: Rng): number[] {
  const seq: number[] = []
  while (seq.length < ORDER_LEN) {
    const n = Math.min(ORDER_CELLS - 1, Math.floor(rng() * ORDER_CELLS))
    // 같은 칸이 잇달아 나오지 않게 (켜진 줄 모르고 지나치지 않게) — 같으면 옆 칸
    seq.push(seq[seq.length - 1] === n ? (n + 1) % ORDER_CELLS : n)
  }
  return seq
}

/** 순서 기억하기: 지금 켜져 보이는 칸 (보여 주는 중이 아니면 null) */
export function litCell(s: OrderState): number | null {
  if (s.shown < 0) return null
  const i = Math.floor(s.shown / ORDER_SHOW)
  if (i >= s.seq.length) return null
  // 칸과 칸 사이에 잠깐 꺼져 같은 칸이 두 번이어도 알아볼 수 있게
  return s.shown - i * ORDER_SHOW < ORDER_SHOW * 0.8 ? s.seq[i] : null
}
export function showing(s: OrderState): boolean {
  return s.shown < s.seq.length * ORDER_SHOW
}

/** ease: 손놀림이 너그러운 정도 0~0.2 (손재주 — 계획 11 작업 4). 0이면 예전 그대로 */
export function startMini(kind: Minigame, rng: Rng, ease = 0): MiniState {
  const e = Math.max(0, Math.min(0.2, ease))
  if (kind === 'mash') return e ? { kind, progress: 0, gain: MASH_GAIN * (1 + e) } : { kind, progress: 0 }
  if (kind === 'hold') {
    const a = 0.5 + rng() * 0.25
    return { kind, fill: 0, holding: false, hits: 0, zone: [a, Math.min(0.98, a + 0.18 + e / 2)], flash: null }
  }
  if (kind === 'weave') return { kind, next: 0, count: 0, flash: null }
  if (kind === 'order') return { kind, seq: sequence(rng), shown: 0, step: 0, rounds: 0, flash: null }
  if (kind === 'timing') {
    const a = 0.25 + rng() * 0.4
    return { kind, t: 0, hits: 0, misses: 0, zone: [a, Math.min(1, a + 0.22 + e / 2)], flash: null }
  }
  return e ? { kind, items: [], got: 0, nextId: 1, spawn: 0, life: PICK_LIFE * (1 + e) } : { kind, items: [], got: 0, nextId: 1, spawn: 0 }
}

/** 타이밍 막대의 위치 0~1 (오가며 움직인다) */
export function cursorOf(t: number): number {
  const p = (t % TIMING_PERIOD) / TIMING_PERIOD
  return p < 0.5 ? p * 2 : 2 - p * 2
}

export function stepMini(s: MiniState, dt: number, rng: Rng): MiniState {
  if (isDone(s)) return s
  if (s.kind === 'mash') return { ...s, progress: Math.max(0, s.progress - MASH_DECAY * dt) }
  if (s.kind === 'timing') return { ...s, t: s.t + dt }
  if (s.kind === 'weave') return s
  if (s.kind === 'order') return showing(s) ? { ...s, shown: s.shown + dt } : s
  if (s.kind === 'hold') {
    if (!s.holding) return s
    const fill = s.fill + HOLD_RATE * dt
    // 너무 오래 누르면 넘친다 — 처음부터 다시 (실패는 없다)
    return fill >= 1 ? { ...s, fill: 0, holding: false, flash: 'miss' } : { ...s, fill }
  }
  let items = s.items.map((i) => ({ ...i, age: i.age + dt })).filter((i) => i.age < (s.life ?? PICK_LIFE))
  let spawn = s.spawn - dt
  let nextId = s.nextId
  if (spawn <= 0 && items.length < 4) {
    const taken = new Set(items.map((i) => `${i.x},${i.y}`))
    const free: [number, number][] = []
    for (let y = 0; y < PICK_ROWS; y++) for (let x = 0; x < PICK_COLS; x++) if (!taken.has(`${x},${y}`)) free.push([x, y])
    const [x, y] = free[Math.min(free.length - 1, Math.floor(rng() * free.length))]
    items = [...items, { id: nextId++, x, y, age: 0 }]
    spawn = PICK_EVERY
  }
  return { ...s, items, spawn, nextId }
}

export function tapMini(s: MiniState, itemId?: number): MiniState {
  if (isDone(s)) return s
  if (s.kind === 'mash') return { ...s, progress: Math.min(1, s.progress + (s.gain ?? MASH_GAIN)) }
  if (s.kind === 'timing') {
    const c = cursorOf(s.t)
    const hit = c >= s.zone[0] && c <= s.zone[1]
    return { ...s, hits: s.hits + (hit ? 1 : 0), misses: s.misses + (hit ? 0 : 1), flash: hit ? 'hit' : 'miss' }
  }
  if (s.kind === 'hold') {
    if (itemId === HOLD_DOWN) return { ...s, holding: true, fill: 0, flash: null }
    if (!s.holding) return s
    const hit = s.fill >= s.zone[0] && s.fill <= s.zone[1]
    return { ...s, holding: false, hits: s.hits + (hit ? 1 : 0), flash: hit ? 'hit' : 'miss' }
  }
  if (s.kind === 'weave') {
    if (itemId !== s.next) return { ...s, flash: 'miss' }
    return { ...s, next: s.next === 0 ? 1 : 0, count: s.count + 1, flash: 'hit' }
  }
  if (s.kind === 'order') {
    if (showing(s) || itemId === undefined) return s
    // 틀리면 차례를 처음부터 한 번 더 보여 주고, 처음 칸부터 다시 누른다
    // (예전엔 맞힌 칸 다음부터 이어 받아서, 다시 본 대로 첫 칸부터 누르면 또 틀렸다 — 2026-10-07 사용자)
    if (itemId !== s.seq[s.step]) return { ...s, shown: 0, step: 0, flash: 'miss' }
    const step = s.step + 1
    if (step < s.seq.length) return { ...s, step, flash: 'hit' }
    return { ...s, rounds: s.rounds + 1, step: 0, flash: 'hit', ...(s.rounds + 1 < ORDER_ROUNDS ? { seq: nextSeq(s.seq), shown: -ORDER_SHOW } : {}) }
  }
  if (!s.items.some((i) => i.id === itemId)) return s
  return { ...s, items: s.items.filter((i) => i.id !== itemId), got: s.got + 1 }
}

/** 다음 판의 차례 — 앞 판을 뒤집고 한 칸 비틀어 (탭에는 난수가 없으므로) */
function nextSeq(seq: number[]): number[] {
  return [...seq].reverse().map((n, i) => (i === 1 ? (n + 1) % ORDER_CELLS : n)).map((n, i, a) => (i > 0 && a[i - 1] === n ? (n + 2) % ORDER_CELLS : n))
}

/** 손에 익은 연장이 있으면 손일 놀이를 바로 끝낸다 */
export function finishNow(s: MiniState): MiniState {
  switch (s.kind) {
    case 'mash':
      return { ...s, progress: 1 }
    case 'timing':
      return { ...s, hits: TIMING_NEED }
    case 'pick':
      return { ...s, got: PICK_NEED, items: [] }
    case 'hold':
      return { ...s, hits: HOLD_NEED, holding: false }
    case 'weave':
      return { ...s, count: WEAVE_NEED }
    case 'order':
      return { ...s, rounds: ORDER_ROUNDS }
  }
}

export function isDone(s: MiniState): boolean {
  if (s.kind === 'mash') return s.progress >= 1
  if (s.kind === 'timing') return s.hits >= TIMING_NEED
  if (s.kind === 'hold') return s.hits >= HOLD_NEED
  if (s.kind === 'weave') return s.count >= WEAVE_NEED
  if (s.kind === 'order') return s.rounds >= ORDER_ROUNDS
  return s.got >= PICK_NEED
}

/** 진행률 0~1 (화면 표시용) */
export function progressOf(s: MiniState): number {
  if (s.kind === 'mash') return s.progress
  if (s.kind === 'timing') return s.hits / TIMING_NEED
  if (s.kind === 'hold') return s.hits / HOLD_NEED
  if (s.kind === 'weave') return s.count / WEAVE_NEED
  if (s.kind === 'order') return (s.rounds * ORDER_LEN + s.step) / (ORDER_ROUNDS * ORDER_LEN)
  return s.got / PICK_NEED
}
