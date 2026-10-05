// 행사 도트 (계획 17 작업 4·5): 지금 어떤 행사 소품이 어디에 놓이고, 누가 어떤 행사 동작을 하는지만 정한다.
// 그림은 렌더러가 src/render/wedding-art.ts·event-art.ts·event-life-motion.ts 원본 함수로 그 자리에서 만든다.
// 장식은 행사 중에만 — 시간이 지나면 이 함수들이 빈 목록을 돌려준다. 소품은 길을 막지 않는다(막는 칸에 넣지 않는다).
// 결혼 완료·보상·마음 점수는 여기서 건드리지 않는다.
import { FESTIVAL_FROM, FESTIVAL_TO } from './calendar'
import { FIRE, FESTIVAL_SPOTS, isNear } from './neighbors'
import { WEDDING_SPOT, type Romance } from './romance'
import type { Npc } from './neighbors'
import type { Facing, Tile } from './types'

/** 행사 소품 한 개. art는 그림 이름(wedding-art·event-art의 이름, 꽃 아치는 'weddingArch') */
export interface EventProp {
  art: string
  /** 그림의 왼쪽 위 칸 */
  at: Tile
  /** 그림 크기(칸) — 렌더러 테스트가 원본 그림 크기와 맞춰 본다 */
  w: number
  h: number
  /** 바닥에 까는 것(통로 천·꽃잎·나들이 천) — 사람 아래에 그린다 */
  ground?: boolean
  /** 세로 픽셀 보정 (탁자 위에 올리는 쟁반 등) */
  dy?: number
  /** 땅에 닿는 칸 (서 있는 자리·불 자리와 겹치지 않게 — 지도 테스트) */
  foot: Tile[]
}

/** 행사 동작 한 장: 결혼식 동작(weddingActorFrame) 또는 행사 동작(eventMotionFrame) */
export interface EventMotion {
  set: 'wedding' | 'event'
  action: string
  frame: number
  facing: Facing
}

type SceneState = {
  clock: { day: number; minute: number }
  romance?: Romance
  npcs: Record<string, Npc>
  player: { x: number; y: number; path: readonly Tile[] }
  act?: { kind: string }
}

const tileOf = (a: { x: number; y: number }): Tile => ({ x: Math.round(a.x), y: Math.round(a.y) })
const same = (a: Tile, b: Tile) => a.x === b.x && a.y === b.y

/** 바라볼 방향: 가로 차이가 크면 왼쪽·오른쪽, 아니면 위·아래 */
export function faceToward(from: Tile, to: Tile, fallback: Facing = 'down'): Facing {
  const dx = to.x - from.x
  const dy = to.y - from.y
  if (dx === 0 && dy === 0) return fallback
  return Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up'
}

/** 이름마다 조금씩 다른 박자 (같은 동작을 다 같이 하지 않게) */
function offsetOf(id: string): number {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 997
  return h
}

// ── 결혼식 (작업 4) ──

/**
 * 결혼 잔치 저녁인가: 약혼한 결혼 날, 또는 오늘 결혼한 날의 18~21시.
 * (모닥불에 닿는 순간 부부가 되므로 — 결혼 완료 판정은 game.ts 그대로 — 그 뒤에도 그날 저녁 잔치는 이어진다)
 */
export function weddingEvening(s: { clock: { day: number; minute: number }; romance?: Romance }): boolean {
  const r = s.romance
  const m = s.clock.minute
  if (!r?.partner || m < FESTIVAL_FROM || m >= FESTIVAL_TO) return false
  return (r.stage === 'engaged' && r.weddingDay === s.clock.day) || (r.stage === 'married' && r.marriedDay === s.clock.day)
}

/** 결혼 잔치 자리: 광장 모닥불 둘레 (game.ts의 결혼 판정과 같은 거리) */
export function nearWeddingFire(p: Tile): boolean {
  return Math.abs(p.x - FIRE.x) + Math.abs(p.y - FIRE.y) <= 4
}

/** 모닥불 둘레 결혼 소품 — 꽃 아치는 신랑·신부 자리 뒤, 통로 천은 모닥불 앞, 잔치 탁자는 오른쪽 위 빈 곳 */
export const WEDDING_LAYOUT: readonly EventProp[] = [
  { art: 'weddingArch', at: { x: 23, y: 16 }, w: 4, h: 3, foot: [{ x: 23, y: 18 }, { x: 26, y: 18 }] },
  { art: 'aisle', at: { x: 24, y: 21 }, w: 1, h: 2, ground: true, foot: [{ x: 24, y: 21 }, { x: 24, y: 22 }] },
  { art: 'petalPatch', at: { x: 23, y: 21 }, w: 1, h: 1, ground: true, foot: [{ x: 23, y: 21 }] },
  { art: 'petalPatch', at: { x: 25, y: 21 }, w: 1, h: 1, ground: true, foot: [{ x: 25, y: 21 }] },
  { art: 'candlePair', at: { x: 22, y: 18 }, w: 1, h: 1, foot: [{ x: 22, y: 18 }] },
  { art: 'candlePair', at: { x: 27, y: 18 }, w: 1, h: 1, foot: [{ x: 27, y: 18 }] },
  { art: 'flowerPot', at: { x: 21, y: 17 }, w: 1, h: 1, foot: [{ x: 21, y: 17 }] },
  { art: 'flowerPot', at: { x: 28, y: 17 }, w: 1, h: 1, foot: [{ x: 28, y: 17 }] },
  { art: 'ribbonSign', at: { x: 23, y: 23 }, w: 1, h: 1, foot: [{ x: 23, y: 23 }] },
  { art: 'giftBundle', at: { x: 28, y: 19 }, w: 1, h: 1, foot: [{ x: 28, y: 19 }] },
  { art: 'feastTable', at: { x: 29, y: 16 }, w: 3, h: 2, foot: [{ x: 29, y: 17 }, { x: 30, y: 17 }, { x: 31, y: 17 }] },
  // 탁자 위 (땅에 닿지 않는다)
  { art: 'feastTray', at: { x: 29, y: 17 }, w: 1, h: 1, dy: -15, foot: [] },
  { art: 'teaPair', at: { x: 31, y: 17 }, w: 1, h: 1, dy: -15, foot: [] },
]

/** 결혼식 동작 차례: 입장 → 인사 → 꽃다발 → 기념 반지 → 손잡기 → 축하, 그리고 처음부터 (초, 한 박자 ms, 반복) */
export const WEDDING_BEATS: readonly { action: string; seconds: number; frameMs: number; loop: boolean }[] = [
  { action: 'arrive', seconds: 1.92, frameMs: 240, loop: true },
  { action: 'bow', seconds: 1.4, frameMs: 280, loop: false },
  { action: 'offerFlowers', seconds: 1.6, frameMs: 240, loop: false },
  { action: 'exchange', seconds: 1.6, frameMs: 240, loop: false },
  { action: 'holdHands', seconds: 2.4, frameMs: 240, loop: true },
  { action: 'celebrate', seconds: 2.4, frameMs: 240, loop: true },
]
const WEDDING_CYCLE = WEDDING_BEATS.reduce((a, b) => a + b.seconds, 0)

/** t초(그리는 시계)에 결혼식 동작 몇째 장인가. 단발 동작은 마지막 장에서 멈춰 있다 */
export function weddingBeat(t: number): { action: string; frame: number } {
  let m = ((t % WEDDING_CYCLE) + WEDDING_CYCLE) % WEDDING_CYCLE
  for (const b of WEDDING_BEATS) {
    if (m < b.seconds) {
      const f = Math.floor((m * 1000) / b.frameMs)
      return { action: b.action, frame: b.loop ? f % 4 : Math.min(3, f) }
    }
    m -= b.seconds
  }
  return { action: 'celebrate', frame: 0 }
}

/** 손님 동작: 몇 초마다 차례로 바꾼다 (이름마다 박자가 다르다). 한 박자 260ms */
function rotate(actions: readonly string[], id: string, t: number, period = 3.2): { action: string; frame: number } {
  const k = offsetOf(id)
  const shifted = t + (k % 17) * 0.37
  const action = actions[(Math.floor(shifted / period) + k) % actions.length]
  return { action, frame: Math.floor((shifted * 1000) / 260) % 4 }
}

function standingAt(n: Npc | undefined, spot: Tile | undefined): boolean {
  return !!n && !!spot && n.visible && n.path.length === 0 && same(tileOf(n), spot)
}

/** 지금 놓인 행사 소품 (행사가 아니면 빈 목록) */
export function eventPropsNow(s: SceneState): EventProp[] {
  if (weddingEvening(s)) return [...WEDDING_LAYOUT]
  return []
}

/** 이 이웃이 지금 하는 행사 동작 (없으면 null — 평소 그림) */
export function npcEventMotion(s: SceneState, id: string, t: number): EventMotion | null {
  const n = s.npcs[id]
  const me = tileOf(s.player)
  if (weddingEvening(s)) {
    const partner = s.romance?.partner
    if (id === partner && standingAt(n, WEDDING_SPOT)) {
      const facing = nearWeddingFire(me) && !same(me, WEDDING_SPOT) ? faceToward(WEDDING_SPOT, me) : 'down'
      return { set: 'wedding', ...weddingBeat(t), facing }
    }
    if (standingAt(n, FESTIVAL_SPOTS[id])) return { set: 'event', ...rotate(['clap', 'smile'], id, t), facing: faceToward(FESTIVAL_SPOTS[id], WEDDING_SPOT) }
  }
  return null
}

/** 기록자가 지금 하는 행사 동작 (서 있을 때만, 가구 동작 중이면 없음) */
export function playerEventMotion(s: SceneState, t: number): EventMotion | null {
  if (s.act || s.player.path.length > 0) return null
  const me = tileOf(s.player)
  if (weddingEvening(s) && nearWeddingFire(me)) {
    const partner = s.romance?.partner ? s.npcs[s.romance.partner] : undefined
    // 짝이 잔치 자리에 와 있을 때 함께 — 짝 쪽을 본다
    if (standingAt(partner, WEDDING_SPOT) && !same(me, WEDDING_SPOT) && isNear(me, WEDDING_SPOT, 4))
      return { set: 'wedding', ...weddingBeat(t), facing: faceToward(me, WEDDING_SPOT) }
  }
  return null
}
