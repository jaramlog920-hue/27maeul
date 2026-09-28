// 조작하지 않을 때 기록자가 스스로 하는 일 (설계 2.6-1). 몸과 일상의 동작만 — 성경 이야기에 대한 반응은 없다 (exclusion-list §1-4).
import { phaseOf } from './clock'
import type { Rng } from './types'

export type IdleKind = 'look' | 'stretch' | 'yawn' | 'hum' | 'doze' | 'greet' | 'wrist'
export interface IdleAction {
  kind: IdleKind
  left: number
}
export interface IdleState {
  seconds: number
  action: IdleAction | null
  cooldown: number
}

/** 입력 없이 이만큼 지나면 스스로 움직이기 시작한다 */
export const IDLE_AFTER = 6
/** 이만큼 지나면 꾸벅 존다 (입력이 올 때까지) */
export const DOZE_AFTER = 45
/** 동작 사이 쉬는 시간 */
export const IDLE_GAP = 3

export const DURATION: Record<IdleKind, number> = {
  look: 2.5,
  stretch: 2,
  yawn: 1.8,
  hum: 3,
  doze: Number.POSITIVE_INFINITY,
  greet: 1.5,
  wrist: 2,
}

export const IDLE_RESET: IdleState = { seconds: 0, action: null, cooldown: 0 }

export function pickIdleAction(ctx: { idleSeconds: number; minute: number; wrote?: boolean }, rng: Rng): IdleAction | null {
  if (ctx.idleSeconds < IDLE_AFTER) return null
  if (ctx.idleSeconds >= DOZE_AFTER) return { kind: 'doze', left: DURATION.doze }
  const late = phaseOf(ctx.minute) === 'night'
  const weights: [IdleKind, number][] = [
    ['look', 3],
    ['stretch', 2],
    ['hum', 2],
    ['yawn', late ? 5 : 1],
    // 글을 많이 쓴 손은 가끔 손목을 돌린다
    ['wrist', ctx.wrote ? 1 : 0],
  ]
  const total = weights.reduce((s, [, w]) => s + w, 0)
  let r = rng() * total
  for (const [kind, w] of weights) {
    r -= w
    if (r < 0) return { kind, left: DURATION[kind] }
  }
  return { kind: 'look', left: DURATION.look }
}

/** 멈춰 있는 동안 한 프레임 */
export function stepIdle(idle: IdleState, dt: number, minute: number, rng: Rng, wrote = false): IdleState {
  const seconds = idle.seconds + dt
  if (idle.action) {
    const left = idle.action.left - dt
    if (left > 0) return { seconds, action: { ...idle.action, left }, cooldown: idle.cooldown }
    return { seconds, action: null, cooldown: IDLE_GAP }
  }
  const cooldown = idle.cooldown - dt
  if (cooldown > 0) return { seconds, action: null, cooldown }
  return { seconds, action: pickIdleAction({ idleSeconds: seconds, minute, wrote }, rng), cooldown: 0 }
}

/** 플레이어가 기록자를 누르면 화면 쪽을 돌아본다 */
export function greet(): IdleState {
  return { seconds: 0, action: { kind: 'greet', left: DURATION.greet }, cooldown: IDLE_GAP }
}
