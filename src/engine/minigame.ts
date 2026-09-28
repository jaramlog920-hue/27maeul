// 손으로 하는 짧은 활동 세 가지. 실패가 없다 — 끝까지 하면 언제나 해낸다 (아기자기한 게임이므로).
import type { Minigame, Rng } from './types'

export interface MashState {
  kind: 'mash'
  progress: number
}
export interface TimingState {
  kind: 'timing'
  t: number
  hits: number
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
  items: PickItem[]
  got: number
  nextId: number
  spawn: number
}
export type MiniState = MashState | TimingState | PickState

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

export function startMini(kind: Minigame, rng: Rng): MiniState {
  if (kind === 'mash') return { kind, progress: 0 }
  if (kind === 'timing') {
    const a = 0.25 + rng() * 0.4
    return { kind, t: 0, hits: 0, zone: [a, a + 0.22], flash: null }
  }
  return { kind, items: [], got: 0, nextId: 1, spawn: 0 }
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
  let items = s.items.map((i) => ({ ...i, age: i.age + dt })).filter((i) => i.age < PICK_LIFE)
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
  if (s.kind === 'mash') return { ...s, progress: Math.min(1, s.progress + MASH_GAIN) }
  if (s.kind === 'timing') {
    const c = cursorOf(s.t)
    const hit = c >= s.zone[0] && c <= s.zone[1]
    return { ...s, hits: s.hits + (hit ? 1 : 0), flash: hit ? 'hit' : 'miss' }
  }
  if (!s.items.some((i) => i.id === itemId)) return s
  return { ...s, items: s.items.filter((i) => i.id !== itemId), got: s.got + 1 }
}

export function isDone(s: MiniState): boolean {
  if (s.kind === 'mash') return s.progress >= 1
  if (s.kind === 'timing') return s.hits >= TIMING_NEED
  return s.got >= PICK_NEED
}

/** 진행률 0~1 (화면 표시용) */
export function progressOf(s: MiniState): number {
  if (s.kind === 'mash') return s.progress
  if (s.kind === 'timing') return s.hits / TIMING_NEED
  return s.got / PICK_NEED
}
