// 행사 도트 (계획 17 작업 4·5): 지금 어떤 행사 소품이 어디에 놓이고, 누가 어떤 행사 동작을 하는지만 정한다.
// 그림은 렌더러가 src/render/wedding-art.ts·event-art.ts·event-life-motion.ts 원본 함수로 그 자리에서 만든다.
// 장식은 행사 중에만 — 시간이 지나면 이 함수들이 빈 목록을 돌려준다. 소품은 길을 막지 않는다(막는 칸에 넣지 않는다).
// 결혼 완료·보상·마음 점수는 여기서 건드리지 않는다.
import { festivalOf, FESTIVAL_FROM, FESTIVAL_TO, isWet, weatherOf, type Festival } from './calendar'
import { BABY_PARTY_SPOTS, gatheringWindow, HILL_SPOTS, type Gathering } from './bonds'
import { FIRE, FESTIVAL_SPOTS, isNear } from './neighbors'
import { isBirthday } from './notebook'
import { WEDDING_SPOT, type Romance } from './romance'
import { isHome, isWalkable, key, PLACES, START } from './world'
import { spotsForAppt, venueFor, type Appt } from './plans'
import { solidTiles, type Furniture } from './room'
import type { Fest } from './fest'
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
  /** 오늘 선물한 이웃 */
  gifted?: readonly string[]
  flags?: Record<string, number>
  today?: { gathering: Gathering | null } | null
  /** 내가 준비하는 작은 행사 (계획 16 작업 16) */
  plans?: { appts: readonly Appt[] }
  fests?: readonly Fest[]
  room?: readonly Furniture[]
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

// ── 생일·잔치·모임 (작업 5) ──

/** 생일 촛불을 끈 날 (이웃마다 한 칸 — 값은 그날) */
export const candleKey = (id: string) => `candleOut:${id}`

/**
 * 오늘 선물한 생일 이웃 곁의 생일 빵: 이웃이 바깥에 서 있을 때 그 옆 칸(오른쪽 → 왼쪽 → 아래 → 위 중 걸을 수 있는 곳).
 * 걷는 동안은 들고 가므로 놓지 않는다. 오늘 촛불을 껐으면 꺼진 초
 */
export function birthdayBreads(s: SceneState): { id: string; at: Tile; out: boolean }[] {
  const out: { id: string; at: Tile; out: boolean }[] = []
  const busy = new Set(Object.values(s.npcs).filter((n) => n.visible).map((n) => key(tileOf(n))))
  for (const id of s.gifted ?? []) {
    const n = s.npcs[id]
    if (!isBirthday(id, s.clock.day) || !n?.visible || n.path.length > 0) continue
    const t = tileOf(n)
    const at = [{ x: t.x + 1, y: t.y }, { x: t.x - 1, y: t.y }, { x: t.x, y: t.y + 1 }, { x: t.x, y: t.y - 1 }].find((c) => isWalkable(c) && !busy.has(key(c)))
    if (at) out.push({ id, at, out: s.flags?.[candleKey(id)] === s.clock.day })
  }
  return out
}

/** 지금 촛불을 불 생일 빵: 서 있는 기록자 곁(한 칸)에 아직 켜진 빵 — 그날 처음 한 번만 */
export function candleToBlow(s: SceneState): { id: string; at: Tile } | null {
  if (s.act || s.player.path.length > 0) return null
  const me = tileOf(s.player)
  const b = birthdayBreads(s).find((x) => !x.out && isNear(me, x.at))
  return b ? { id: b.id, at: b.at } : null
}

/** 마을 잔치 저녁 (맑은 날 18~21시, 결혼 잔치가 겹치면 결혼 잔치가 먼저) */
export function festivalEvening(s: SceneState): Festival | null {
  const f = festivalOf(s.clock.day)
  const m = s.clock.minute
  if (!f || isWet(weatherOf(s.clock.day)) || m < FESTIVAL_FROM || m >= FESTIVAL_TO || weddingEvening(s)) return null
  return f
}

/** 잔치마다 장식: 봄꽃 잔치 꽃 장식, 보리 잔치 그늘 천, 포도 수확 바구니, 겨울 모닥불 모임 등 */
export const FESTIVAL_DECOR: Record<Festival, string> = { blossom: 'springGarland', barley: 'summerShadeDecor', grapes: 'autumnHarvest', hearth: 'winterLantern' }
/** 행사 안내판 (모닥불 오른쪽 위 빈 곳) */
export const FEAST_BOARD: EventProp = { art: 'feastBoard', at: { x: 27, y: 17 }, w: 2, h: 1, foot: [{ x: 27, y: 17 }, { x: 28, y: 17 }] }

export function festivalLayout(f: Festival): EventProp[] {
  const art = FESTIVAL_DECOR[f]
  // 두 칸짜리 걸개(꽃 장식·그늘 천)는 안내판 위에 걸고, 한 칸짜리(바구니·등)는 모닥불 위쪽 양옆 땅에
  if (art === 'springGarland' || art === 'summerShadeDecor') return [FEAST_BOARD, { art, at: FEAST_BOARD.at, w: 2, h: 1, dy: -3, foot: [] }]
  return [FEAST_BOARD, { art, at: { x: 22, y: 18 }, w: 1, h: 1, foot: [{ x: 22, y: 18 }] }, { art, at: { x: 26, y: 18 }, w: 1, h: 1, foot: [{ x: 26, y: 18 }] }]
}

/** 언덕 소풍의 나들이 천 (벤치 아래 빈 풀밭 — 바닥에 깐다) */
export const PICNIC_CLOTH: EventProp = { art: 'picnicCloth', at: { x: 14, y: 12 }, w: 2, h: 1, ground: true, foot: [{ x: 14, y: 12 }, { x: 15, y: 12 }] }
/** 아기 잔치의 집들이 바구니 (빵집 앞 모임 자리 옆) */
export const WELCOME_BASKET: EventProp = { art: 'welcomeBasket', at: { x: 7, y: 17 }, w: 1, h: 1, foot: [{ x: 7, y: 17 }] }

/** 지금 열린 이웃 모임 (소풍·아기 잔치 — 별 보는 밤은 그대로라 없음) */
function gatheringNow(s: SceneState): 'picnic' | 'babyParty' | null {
  const g = s.today?.gathering
  if (g !== 'picnic' && g !== 'babyParty') return null
  const [from, to] = gatheringWindow(g)
  return s.clock.minute >= from && s.clock.minute < to ? g : null
}

// ── 내가 준비하는 작은 행사 (계획 16 작업 16): assets/events의 집들이·작품 발표·생일 도트, 결혼식 찻잔 ──

/** 지금 열리는 행사와 그 자리 */
function festsNow(s: SceneState): { f: Fest; seats: readonly Tile[] }[] {
  const out: { f: Fest; seats: readonly Tile[] }[] = []
  for (const f of s.fests ?? []) {
    const a = !f.closed && f.apptId ? s.plans?.appts.find((x) => x.id === f.apptId) : undefined
    if (!a || a.state !== 'running' || a.day !== s.clock.day || s.clock.minute < a.from || s.clock.minute >= a.to || venueFor(a).moved) continue
    out.push({ f, seats: spotsForAppt(a) })
  }
  return out
}

/** 앉은 자리 곁의 빈 칸 (자리·붙박이·서는 칸·가구를 피하고, 집 안 행사는 집 안에만) */
function besideSeats(s: SceneState, seats: readonly Tile[], n: number): Tile[] {
  const home = seats.some((t) => isHome(t))
  const solid = home ? solidTiles(s.room ?? []) : undefined
  // 기록자가 서 있는 칸·깨어 서는 칸에는 놓지 않는다 (사람 그림 밑에 숨지 않게)
  const taken = new Set([...seats.map(key), key(tileOf(s.player)), key(START)])
  const fixed = new Set(Object.values(PLACES).flatMap((p) => [...p.tiles, ...(p.stand ? [p.stand] : [])]).map(key))
  const out: Tile[] = []
  for (const seat of seats) for (const d of [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]) {
    const t = { x: seat.x + d.x, y: seat.y + d.y }
    if (out.length >= n) return out
    if (taken.has(key(t)) || fixed.has(key(t)) || !isWalkable(t, solid) || isHome(t) !== home) continue
    taken.add(key(t))
    out.push(t)
  }
  return out
}

/** 행사 소품: 차 모임 찻잔, 집들이 표지·바구니, 작품 소개 받침·작품, 생일이 겹치면 생일 장식 — 행사 시간에만 */
export function festPropsNow(s: SceneState): EventProp[] {
  const props: EventProp[] = []
  for (const { f, seats } of festsNow(s)) {
    const arts = f.kind === 'housewarming' ? ['housewarmingSign', 'welcomeBasket'] : f.kind === 'showcase' ? ['exhibitStand', 'artworkComplete'] : ['teaPair']
    const tiles = besideSeats(s, seats, arts.length)
    arts.forEach((art, i) => {
      const at = tiles[i]
      if (at) props.push({ art, at, w: 1, h: 1, foot: [at] })
    })
    // 생일 장식은 첫 자리 위에 거는 걸개 (땅에 닿지 않는다)
    if (f.birthday && seats[0]) props.push({ art: 'birthdayBanner', at: { x: seats[0].x, y: seats[0].y - 1 }, w: 2, h: 1, dy: -3, foot: [] })
  }
  return props
}

/** 지금 놓인 행사 소품 (행사가 아니면 빈 목록) */
export function eventPropsNow(s: SceneState): EventProp[] {
  const props: EventProp[] = []
  if (weddingEvening(s)) props.push(...WEDDING_LAYOUT)
  const f = festivalEvening(s)
  if (f) props.push(...festivalLayout(f))
  const g = gatheringNow(s)
  if (g === 'picnic') props.push(PICNIC_CLOTH)
  if (g === 'babyParty') props.push(WELCOME_BASKET)
  props.push(...festPropsNow(s))
  // 생일 빵: 촛불을 부는 동안은 기록자 손의 빵으로 그린다 (같은 빵이 둘로 보이지 않게)
  const me = tileOf(s.player)
  const blowing = s.act?.kind === 'blowCandle'
  for (const b of birthdayBreads(s))
    if (!(blowing && isNear(me, b.at))) props.push({ art: b.out ? 'candleOut' : 'birthdayBread', at: b.at, w: 1, h: 1, foot: [b.at] })
  return props
}

/** 한 번 하는 동작을 쉬었다 되풀이 (네 박자 + 두 박자 멈춤) */
function oneShot(action: string, id: string, t: number): { action: string; frame: number } {
  const f = Math.floor(((t + (offsetOf(id) % 13) * 0.29) * 1000) / 260) % 6
  return { action, frame: Math.min(3, f) }
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
  // 마을 잔치: 모닥불 둘레 이웃이 춤·맛보기·박수를 돌아가며
  if (festivalEvening(s) && standingAt(n, FESTIVAL_SPOTS[id])) return { set: 'event', ...rotate(['dance', 'taste', 'clap'], id, t), facing: faceToward(FESTIVAL_SPOTS[id], FIRE) }
  // 이웃 모임: 소풍은 음식 나누기(천 쪽을 보고), 아기 잔치는 접시 놓기
  const g = gatheringNow(s)
  if (g === 'picnic' && standingAt(n, HILL_SPOTS[id])) return { set: 'event', ...oneShot('shareFood', id, t), facing: faceToward(HILL_SPOTS[id], PICNIC_CLOTH.at) }
  if (g === 'babyParty' && standingAt(n, BABY_PARTY_SPOTS[id])) return { set: 'event', ...oneShot('placePlate', id, t), facing: 'down' }
  // 작은 행사: 앉은 자리에서 차 모임은 맛보기·웃음, 작품 소개는 박수·웃음 (이웃마다 박자가 다르다)
  for (const { f, seats } of festsNow(s)) {
    const seat = seats.find((t) => standingAt(n, t))
    if (seat && f.members.includes(id)) return { set: 'event', ...rotate(f.kind === 'showcase' ? ['clap', 'smile'] : ['taste', 'smile'], id, t), facing: faceToward(seat, seats.find((x) => !same(x, seat)) ?? seat) }
  }
  // 생일: 기록자가 촛불을 부는 동안 그 이웃은 박수
  if (s.act?.kind === 'blowCandle' && n && !n.path.length) {
    const b = birthdayBreads(s).find((x) => x.id === id)
    if (b && isNear(me, b.at)) return { set: 'event', action: 'clap', frame: Math.floor((t * 1000) / 260) % 4, facing: faceToward(tileOf(n), me) }
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
