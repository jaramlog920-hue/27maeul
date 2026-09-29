// 몸의 필요 (설계 2.3). 벌을 주려는 게 아니라 돌봐 주고 싶게 만드는 장치다 — 굶거나 지쳐도 게임이 끝나지 않는다.
import type { Phase, Season } from './types'

export interface Needs {
  hunger: number
  fatigue: number
  cold: number
}

export const FRESH: Needs = { hunger: 10, fatigue: 0, cold: 0 }
export const HUNGRY = 70
export const TIRED = 75
export const CHILLY = 60
export const LIMIT = 100

const clamp = (n: number) => Math.min(LIMIT, Math.max(0, n))

export interface NeedsContext {
  indoor: boolean
  season: Season
  phase: Phase
  /** 화덕 옆 */
  warm: boolean
  hasBlanket: boolean
  /** 평안인 날 (자기 전 읽기) */
  peace?: boolean
}

/** minutes 동안 흐른 몸의 변화 */
export function tickNeeds(n: Needs, minutes: number, ctx: NeedsContext): Needs {
  const hunger = n.hunger + minutes / 14
  const fatigue = n.fatigue + minutes / (ctx.peace ? 15 : 12)
  let coldRate = 0
  if (ctx.warm) coldRate = -3
  else if (ctx.season === 'winter') coldRate = ctx.indoor ? (ctx.phase === 'night' ? 0.15 : -0.3) : ctx.phase === 'night' ? 0.8 : 0.4
  else if (ctx.phase === 'night' && !ctx.indoor) coldRate = 0.1
  else coldRate = -0.5
  if (coldRate > 0 && ctx.hasBlanket && ctx.indoor) coldRate /= 2
  return { hunger: clamp(hunger), fatigue: clamp(fatigue), cold: clamp(n.cold + coldRate * minutes) }
}

export function eat(n: Needs): Needs {
  return { ...n, hunger: clamp(n.hunger - 50) }
}

export function rest(n: Needs): Needs {
  return { ...n, fatigue: clamp(n.fatigue - 25) }
}

export function warmUp(n: Needs): Needs {
  return { ...n, cold: 0 }
}

/** 손으로 하는 일 한 번의 피로 */
export function work(n: Needs, amount = 5): Needs {
  return { ...n, fatigue: clamp(n.fatigue + amount) }
}

/** 잠. 새벽 1시를 넘겨 자면 덜 풀린다 */
export function sleepNeeds(n: Needs, sleptAtMinute: number): Needs {
  const late = sleptAtMinute >= 25 * 60
  return { hunger: clamp(n.hunger + 10), fatigue: late ? 30 : 0, cold: 0 }
}

/** 잠들 때 이 상태면 다음 날 앓아눕는다 */
export function fallsSick(n: Needs): boolean {
  return n.hunger >= LIMIT || n.fatigue >= LIMIT
}

/** 너무 지치면 손일과 글쓰기를 못 한다 */
export function exhausted(n: Needs): boolean {
  return n.fatigue >= LIMIT
}

export function starving(n: Needs): boolean {
  return n.hunger >= LIMIT
}
