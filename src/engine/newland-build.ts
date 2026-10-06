// 새 터 건축 (계획 20 작업 6): 놓기 검사·주문·공사 하루·취소·철거·환불·저장 정리.
// 필사·구약 진행·서고와 아무 상관이 없다 — 건물 0채여도 서고와 책상은 그대로 쓴다. 건물 안(가구)은 작업 7 몫이다.
// 이 파일은 GameState를 타입으로만 읽는다 (game.ts가 이 파일을 부른다).
import type { GameState } from './game'
import { addGift, has, take } from './items'
import type { Furniture } from './room'
import { ARCHIVE, BUILD_RECT, MAX_HOMES, NEWLAND_PORTAL_FRONT, NEWLAND_VISIBLE_H, NEWLAND_W, ROOM_SLOTS } from './newland-config'
import { NEWLAND_MAP } from './newland'
import {
  ART_TILES, BUILD_DAYS_TO_DONE, BUILD_DAYS_TO_START, isBuildKind, isTileKind, REFUND_BEFORE, REFUND_DEMOLISH_COINS, REFUND_DURING, SITES,
  type BuildKind, type Cost, type DoorSpec, type Items, type SiteKind, type TileKind,
} from './newland-sites'
import type { Facing, ItemId, Tile } from './types'
import { isBlockedChar } from './world'

export type BuildState = 'ordered' | 'building' | 'done'
export interface Build {
  /** 'b1', 'b2'… — 지워도 다시 쓰지 않는다 (nextId) */
  id: string
  kind: BuildKind
  /** 그림 왼쪽 위 칸 */
  x: number
  y: number
  facing: Facing
  state: BuildState
  /** 주문한 날 (clock.day) */
  orderedDay: number
  /** 낸 것 — 환불은 이 값에서 계산한다 */
  paid: Cost
  /** 입주 주택의 안 방 칸 번호 (ROOM_SLOTS) — 주문할 때 정해 저장한다. 같은 건물은 늘 같은 방 */
  slot?: number
  /** 환불을 이미 마쳤다는 표식 — 환불은 기록 삭제와 한 번에 일어나므로 남아 있는 기록에서는 늘 false */
  refunded: boolean
}
export interface NewlandState {
  builds: Build[]
  /** 깐 길·정원 칸 ('x,y' → 종류) */
  tiles: Record<string, TileKind>
  nextId: number
  /** 하루 정산을 마친 마지막 날 (같은 날 두 번 진행하지 않는다) */
  settledDay: number
}

export const MAX_BUILDS = 12
/** 입주 주택(안 방이 필요한 건물)의 최대 수 — 방 칸 수가 상한이다 (newland-config) */
export { MAX_HOMES }
export const emptyNewland = (): NewlandState => ({ builds: [], tiles: {}, nextId: 1, settledDay: 0 })

type Base = Pick<GameState, 'newland' | 'flags' | 'clock' | 'coins' | 'inv' | 'player'>

export const buildsOf = (s: Pick<GameState, 'newland'>): readonly Build[] => s.newland?.builds ?? []
export const tilesOf = (s: Pick<GameState, 'newland'>): Readonly<Record<string, TileKind>> => s.newland?.tiles ?? {}
export const revealedLand = (s: Pick<GameState, 'flags'>): boolean => !!s.flags.newlandRevealed

const key = (x: number, y: number) => `${x},${y}`
const keyOf = (t: Tile) => key(t.x, t.y)

// ── 모양 ──

/** 막히는(또는 마당처럼 자리를 차지하는) 영역의 칸들 */
export function areaOf(kind: SiteKind, x: number, y: number, size = 1): Tile[] {
  const def = SITES[kind]
  const w = kind === 'path' || kind === 'garden' ? size : def.area.w
  const h = kind === 'path' || kind === 'garden' ? size : def.area.h
  const dy = kind === 'path' || kind === 'garden' ? 0 : def.area.dy
  const out: Tile[] = []
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push({ x: x + i, y: y + dy + j })
  return out
}

/** 그림이 덮는 4×4 칸 */
export function boxOf(x: number, y: number): Tile[] {
  const out: Tile[] = []
  for (let j = 0; j < ART_TILES; j++) for (let i = 0; i < ART_TILES; i++) out.push({ x: x + i, y: y + j })
  return out
}

/** 건물의 문 칸과 문 앞 칸 (문이 없는 건물은 null) */
export function doorOf(kind: BuildKind, x: number, y: number, facing: Facing): { door: Tile; front: Tile } | null {
  const d: DoorSpec | undefined = SITES[kind].doors?.[facing]
  return d ? { door: { x: x + d.door.dx, y: y + d.door.dy }, front: { x: x + d.front.dx, y: y + d.front.dy } } : null
}

const inRect = (t: Tile) => t.x >= BUILD_RECT.x0 && t.x <= BUILD_RECT.x1 && t.y >= BUILD_RECT.y0 && t.y <= BUILD_RECT.y1

// ── 칸 덧씌우기 (world.tileAt이 읽는다) ──

/** 지금 막히는 칸 (공사 중에는 문 칸까지 전부, 완공 뒤에는 문 칸만 열린다) */
function blockedOf(builds: readonly Build[], finalState = false): Set<string> {
  const out = new Set<string>()
  for (const b of builds) {
    // 공사 중 마당은 덧씌움에서 S로 막힌다 — 길 검사도 같이 막힌 칸으로 본다 (완공된 마당은 걸을 수 있다)
    if (b.kind === 'courtyard' && b.state !== 'done') for (const t of areaOf('courtyard', b.x, b.y)) out.add(keyOf(t))
    if (b.kind !== 'home') continue
    const open = finalState || b.state === 'done' ? doorOf(b.kind, b.x, b.y, b.facing)?.door : undefined
    for (const t of areaOf(b.kind, b.x, b.y)) if (!(open && t.x === open.x && t.y === open.y)) out.add(keyOf(t))
  }
  return out
}

/** 칸 글자: 막히는 칸은 S, 길은 ',', 정원 칸·마당·열린 문은 풀('.') — 모두 기존 글자 */
function buildOverlay(nl: NewlandState): Map<string, string> {
  const m = new Map<string, string>()
  for (const [k, kind] of Object.entries(nl.tiles)) m.set(k, kind === 'path' ? ',' : '.')
  for (const b of nl.builds) {
    if (b.kind === 'courtyard') for (const t of areaOf('courtyard', b.x, b.y)) m.set(keyOf(t), b.state === 'done' ? '.' : 'S')
  }
  for (const k of blockedOf(nl.builds)) m.set(k, 'S')
  // 문은 완공 뒤에만 걸을 수 있다 (blockedOf가 이미 뺐다) — 바탕이 풀이라 따로 쓰지 않는다
  return m
}
let lastNl: NewlandState | undefined
let lastOverlay: ReadonlyMap<string, string> = new Map()
/** 상태의 덧씌우기 (같은 상태 객체면 다시 만들지 않는다 — syncHome이 자주 부르므로) */
export function overlayFor(nl: NewlandState | undefined): ReadonlyMap<string, string> {
  if (!nl || (nl.builds.length === 0 && Object.keys(nl.tiles).length === 0)) return EMPTY
  if (nl !== lastNl) {
    lastNl = nl
    lastOverlay = buildOverlay(nl)
  }
  return lastOverlay
}
const EMPTY: ReadonlyMap<string, string> = new Map()

// ── 놓기 검사 ──

/** 놓을 수 없는 까닭 하나 (화면은 이 하나만 보인다) */
export type PlaceBlock = 'unrevealed' | 'facing' | 'outside' | 'overlap' | 'standing' | 'door' | 'sealed' | 'many' | 'homes' | 'same'
/** 주문할 수 없는 까닭: 놓기 + 비용 */
export type OrderBlock = PlaceBlock | 'coins' | 'items' | 'unknown'

/** 이 놓기가 차지하는 칸(영역)과 그림 칸(상자) */
function footprintOf(kind: SiteKind, x: number, y: number, size: number) {
  const area = areaOf(kind, x, y, size)
  const box = kind === 'path' || kind === 'garden' ? area : boxOf(x, y)
  return { area, box }
}

function tileCharAt(x: number, y: number): string {
  return NEWLAND_MAP[y]?.[x] ?? 'T'
}

/** 입구에서 길찾기로 닿는 칸 (끝 모양 기준, 새 터의 바깥 줄만) */
function reachable(builds: readonly Build[]): Set<string> {
  const blocked = blockedOf(builds, true)
  const seen = new Set<string>()
  const start = NEWLAND_PORTAL_FRONT
  const queue: Tile[] = [{ x: start.x, y: start.y }]
  seen.add(keyOf(start))
  for (let i = 0; i < queue.length; i++) {
    const c = queue[i]
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const n = { x: c.x + dx, y: c.y + dy }
      if (n.x < 0 || n.y < 0 || n.x >= NEWLAND_W || n.y >= NEWLAND_VISIBLE_H) continue
      const k = keyOf(n)
      if (seen.has(k) || blocked.has(k) || isBlockedChar(tileCharAt(n.x, n.y))) continue
      seen.add(k)
      queue.push(n)
    }
  }
  return seen
}

/** 공사 중 마당(울타리가 쳐진 칸) — 덧씌움이 S로 막는 칸들 */
function fencedOf(builds: readonly Build[]): Set<string> {
  return new Set(builds.filter((b) => b.kind === 'courtyard' && b.state !== 'done').flatMap((b) => areaOf('courtyard', b.x, b.y).map(keyOf)))
}

/** 서고 문 앞과 문, 모든 건물의 문 앞·문, 길·정원·마당 칸 — 입구에서 닿아야 하는 칸들 (끝 모양 기준) */
function mustReach(builds: readonly Build[], tiles: Readonly<Record<string, TileKind>>): Tile[] {
  const others: Tile[] = [{ ...ARCHIVE.front }, { x: ARCHIVE.door.x, y: ARCHIVE.door.y }]
  const fenced = fencedOf(builds)
  for (const b of builds) {
    const d = doorOf(b.kind, b.x, b.y, b.facing)
    // 문 앞이 공사 중 마당 울타리 안이면 완공까지 닿지 못하는 것이 맞다 — 세지 않는다
    if (d && !fenced.has(keyOf(d.front))) others.push(d.front, d.door)
    // 공사 중 마당은 막혀 있으니 닿을 칸으로 세지 않는다 (완공되면 걸을 수 있다)
    if (b.kind === 'courtyard' && b.state === 'done') others.push(...areaOf('courtyard', b.x, b.y))
  }
  for (const k of Object.keys(tiles)) {
    const [x, y] = k.split(',').map(Number)
    others.push({ x, y })
  }
  return others
}

/**
 * 놓을 수 있는가 (없으면 null): 땅이 드러났고, 구역 안이고, 다른 것과 겹치지 않고, 서 있는 자리가 아니고,
 * 놓은 뒤에도 새 터 입구에서 서고 문·모든 건물의 문 앞·길 칸에 길찾기로 닿는다 (집 안에 갇히는 배치·서고를 막는 배치는 거절)
 */
export function canPlace(s: Base, kind: SiteKind, x: number, y: number, facing: Facing = 'down', size = 1): PlaceBlock | null {
  if (!revealedLand(s)) return 'unrevealed'
  const def = SITES[kind]
  if (!def.facings.includes(facing) || ((kind === 'path' || kind === 'garden') && !def.sizes.includes(size)) || !Number.isInteger(x) || !Number.isInteger(y)) return 'facing'
  const isTile = kind === 'path' || kind === 'garden'
  const { area, box } = footprintOf(kind, x, y, size)
  if (!box.every(inRect) || !area.every(inRect)) return 'outside'
  const builds = buildsOf(s)
  const tiles = tilesOf(s)
  if (!isTile && builds.length >= MAX_BUILDS) return 'many'
  if (kind === 'home' && builds.filter((b) => b.kind === 'home').length >= MAX_HOMES) return 'homes'
  // 겹침: 새 영역이 다른 영역에 닿으면 안 되고, 새 그림 상자가 다른 영역을 덮어도, 다른 그림 상자가 새 영역을 덮어도 안 된다
  const newArea = new Set(area.map(keyOf))
  const newBox = new Set(box.map(keyOf))
  for (const b of builds) {
    const eArea = areaOf(b.kind, b.x, b.y)
    if (eArea.some((t) => newArea.has(keyOf(t)) || (!isTile && newBox.has(keyOf(t))))) return 'overlap'
    if (!isTile && boxOf(b.x, b.y).some((t) => newArea.has(keyOf(t)))) return 'overlap'
  }
  for (const t of area) {
    if (isBlockedChar(tileCharAt(t.x, t.y))) return 'overlap'
    const here = tiles[keyOf(t)]
    if (here && (!isTile || here !== kind)) return 'overlap'
  }
  if (isTile && area.every((t) => tiles[keyOf(t)] === kind)) return 'same'
  const me = s.player
  const px = Math.round(me.x)
  const py = Math.round(me.y)
  if (!isTile && area.some((t) => t.x === px && t.y === py)) return 'standing'
  // 놓은 뒤의 모양으로 길 검사
  const nextBuilds: Build[] = isTile
    ? [...builds]
    : [...builds, { id: '', kind: kind as BuildKind, x, y, facing, state: 'ordered', orderedDay: 0, paid: { coins: 0, items: {} }, refunded: false }]
  const nextTiles = isTile ? { ...tiles, ...Object.fromEntries(area.map((t) => [keyOf(t), kind as TileKind])) } : tiles
  const seen = reachable(nextBuilds)
  // 어느 집이든 문 앞·문에 닿지 못하면 "문 앞이 막힌다" (새로 놓는 집이든, 이미 있는 집의 문 앞을 덮는 것이든)
  // (공사 중 마당 울타리 안의 문 앞은 완공될 때까지 닿지 못하는 것이 맞다 — 그 칸은 세지 않는다)
  const fenced = fencedOf(nextBuilds)
  for (const b of nextBuilds) {
    const d = doorOf(b.kind, b.x, b.y, b.facing)
    if (d && !fenced.has(keyOf(d.front)) && (!seen.has(keyOf(d.front)) || !seen.has(keyOf(d.door)))) return 'door'
  }
  if (mustReach(nextBuilds, nextTiles).some((t) => !seen.has(keyOf(t)))) return 'sealed'
  return null
}

// ── 비용 ──

export function costOf(kind: SiteKind, size = 1): Cost {
  const c = SITES[kind].cost
  const n = kind === 'path' || kind === 'garden' ? size * size : 1
  return { coins: c.coins * n, items: Object.fromEntries(Object.entries(c.items).map(([id, q]) => [id, (q as number) * n])) as Items }
}

/** 이미 깔린 같은 칸은 빼고 새로 깔 칸만 센다 */
function newTilesOf(s: Pick<GameState, 'newland'>, kind: TileKind, x: number, y: number, size: number): Tile[] {
  const tiles = tilesOf(s)
  return areaOf(kind, x, y, size).filter((t) => tiles[keyOf(t)] !== kind)
}

function costFor(s: Pick<GameState, 'newland'>, kind: SiteKind, x: number, y: number, size: number): Cost {
  if (kind === 'path' || kind === 'garden') {
    const n = newTilesOf(s, kind, x, y, size).length
    return { coins: SITES[kind].cost.coins * n, items: {} }
  }
  return costOf(kind)
}

export function canOrder(s: Base, kind: SiteKind, x: number, y: number, facing: Facing = 'down', size = 1): OrderBlock | null {
  const place = canPlace(s, kind, x, y, facing, size)
  if (place) return place
  const cost = costFor(s, kind, x, y, size)
  if (s.coins < cost.coins) return 'coins'
  if (!has(s.inv, cost.items)) return 'items'
  return null
}

type Ordered = Pick<GameState, 'newland' | 'coins' | 'inv'>

/**
 * 놓는다: 닢·재료를 내고 건물은 'ordered'로 기록한다 (다음 날 아침 공사, 그다음 날 아침 완공).
 * 길·정원 칸은 바로 깔린다. 놓을 수 없거나 모자라면 null (아무것도 바뀌지 않는다)
 */
export function orderBuild<T extends Base & Ordered>(s: T, kind: SiteKind, x: number, y: number, facing: Facing = 'down', size = 1): T | null {
  if (canOrder(s, kind, x, y, facing, size)) return null
  const cost = costFor(s, kind, x, y, size)
  const inv = take(s.inv, cost.items)
  if (!inv) return null
  const nl = s.newland ?? emptyNewland()
  const paid = { coins: s.coins - cost.coins, inv }
  if (kind === 'path' || kind === 'garden') {
    const tiles = { ...nl.tiles }
    for (const t of newTilesOf(s, kind, x, y, size)) tiles[keyOf(t)] = kind
    return { ...s, coins: paid.coins, inv: paid.inv, newland: { ...nl, tiles } }
  }
  const slot = kind === 'home' ? freeSlot(nl.builds) : undefined
  const b: Build = { id: `b${nl.nextId}`, kind: kind as BuildKind, x, y, facing, state: 'ordered', orderedDay: s.clock.day, paid: cost, refunded: false, ...(slot !== undefined ? { slot } : {}) }
  return { ...s, coins: paid.coins, inv: paid.inv, newland: { ...nl, builds: [...nl.builds, b], nextId: nl.nextId + 1 } }
}

/** 아직 어느 입주 주택도 쓰지 않는 가장 앞 방 칸 (없으면 undefined) */
function freeSlot(builds: readonly Build[]): number | undefined {
  const used = new Set(builds.filter((b) => b.kind === 'home').map((b) => b.slot))
  for (let i = 0; i < ROOM_SLOTS.length; i++) if (!used.has(i)) return i
  return undefined
}

// ── 문 ↔ 안 방 (World.warpAt이 읽는다) ──

function buildWarps(nl: NewlandState): Map<string, Tile> {
  const m = new Map<string, Tile>()
  for (const b of nl.builds) {
    if (b.kind !== 'home' || b.state !== 'done' || b.slot === undefined) continue
    const slot = ROOM_SLOTS[b.slot]
    const d = doorOf(b.kind, b.x, b.y, b.facing)
    if (!slot || !d) continue
    m.set(keyOf(d.door), { ...slot.entry })
    m.set(keyOf(slot.exit), { ...d.front })
  }
  return m
}
let lastWarpNl: NewlandState | undefined
let lastWarps: ReadonlyMap<string, Tile> = new Map()
/** 완공된 입주 주택의 문 → 방 안, 방 문깔개 → 문 앞 (같은 상태 객체면 다시 만들지 않는다) */
export function warpsFor(nl: NewlandState | undefined): ReadonlyMap<string, Tile> {
  if (!nl || nl.builds.length === 0) return EMPTY_WARPS
  if (nl !== lastWarpNl) {
    lastWarpNl = nl
    lastWarps = buildWarps(nl)
  }
  return lastWarps
}
const EMPTY_WARPS: ReadonlyMap<string, Tile> = new Map()

// ── 공사 하루 ──

function stateOnDay(b: Build, today: number): BuildState {
  if (b.state === 'done') return 'done'
  const passed = today - b.orderedDay
  if (passed >= BUILD_DAYS_TO_DONE) return 'done'
  if (passed >= BUILD_DAYS_TO_START) return 'building'
  return b.state
}

/**
 * 아침마다 한 번 (goToSleep의 아침 단계): 주문한 다음 날 아침 공사 시작, 그다음 날 아침 완공.
 * newland.settledDay가 오늘 이상이면 아무것도 하지 않는다 — 같은 날 다시 불러도·잠들어도 진행이 겹치지 않는다
 */
export function advanceBuilds<T extends Pick<GameState, 'newland' | 'clock'>>(s: T): T {
  const nl = s.newland
  if (!nl || nl.builds.length === 0) return s
  const today = s.clock.day
  if (nl.settledDay >= today) return s
  const builds = nl.builds.map((b) => {
    const st = stateOnDay(b, today)
    return st === b.state ? b : { ...b, state: st }
  })
  return { ...s, newland: { ...nl, builds, settledDay: today } }
}

// ── 취소·철거·환불 ──

/** 닢·재료를 몫만큼 돌려준다 (소수 버림). 재료는 가방이 가득해도 받는다 */
function share(c: Cost, rate: number, items: boolean): Cost {
  return {
    coins: Math.floor(c.coins * rate),
    items: items ? (Object.fromEntries(Object.entries(c.items).map(([id, q]) => [id, Math.floor((q as number) * rate)]).filter(([, q]) => (q as number) > 0)) as Items) : {},
  }
}
function refund<T extends Pick<GameState, 'coins' | 'inv'>>(s: T, c: Cost): T {
  return { ...s, coins: s.coins + c.coins, inv: Object.keys(c.items).length ? addGift(s.inv, c.items) : s.inv }
}
/** 환불과 기록 삭제를 한 번에: 이미 환불된 기록이면 아무것도 하지 않는다 */
function settleRefund<T extends Pick<GameState, 'coins' | 'inv' | 'newland'> & { rooms?: Record<string, Furniture[]> }>(s: T, id: string, rate: (b: Build) => Cost | null): T | null {
  const nl = s.newland
  const b = nl?.builds.find((x) => x.id === id)
  if (!nl || !b || b.refunded) return null
  const back = rate(b)
  if (!back) return null
  const gone = returnRoom(refund(s, back), id)
  return { ...gone, newland: { ...nl, builds: nl.builds.filter((x) => x.id !== id) } }
}

/** 소유 공간 키: 'newland:<건물 id>' (GameState.rooms) */
export const roomKeyFor = (buildId: string): string => `newland:${buildId}`

/** 건물이 사라질 때 안의 가구를 모두 가방으로 (가방이 가득해도 받는다 — 집을 넓힐 때 refitRoom과 같은 규칙) */
export function returnRoom<T extends Pick<GameState, 'inv'> & { rooms?: Record<string, Furniture[]> }>(s: T, buildId: string): T {
  const k = roomKeyFor(buildId)
  const room = s.rooms?.[k]
  if (!room) return s
  const back: Items = {}
  for (const f of room) back[f.item] = (back[f.item] ?? 0) + 1
  const { [k]: _gone, ...rest } = s.rooms!
  void _gone
  const { rooms: _old, ...others } = s
  void _old
  return { ...others, inv: addGift(s.inv, back), ...(Object.keys(rest).length ? { rooms: rest } : {}) } as T
}

/** 취소: 공사 시작 전이면 100%, 공사 중이면 50% (닢·재료 각각 소수 버림). 완공된 것은 취소가 아니라 철거 */
export function cancelBuild<T extends Pick<GameState, 'coins' | 'inv' | 'newland'> & { rooms?: Record<string, Furniture[]> }>(s: T, id: string): T | null {
  return settleRefund(s, id, (b) => (b.state === 'ordered' ? share(b.paid, REFUND_BEFORE, true) : b.state === 'building' ? share(b.paid, REFUND_DURING, true) : null))
}

/** 철거: 완공된 건물만 — 닢 50%, 재료 환급 없음. 서고(건물 기록이 아니다)는 철거할 수 없다 */
export function demolishBuild<T extends Pick<GameState, 'coins' | 'inv' | 'newland'> & { rooms?: Record<string, Furniture[]> }>(s: T, id: string): T | null {
  return settleRefund(s, id, (b) => (b.state === 'done' ? { coins: Math.floor(b.paid.coins * REFUND_DEMOLISH_COINS), items: {} } : null))
}

/** 깐 길·정원 칸 걷어내기: 바로 깔린 것이라 낸 닢을 그대로 돌려받는다 */
export function clearTile<T extends Pick<GameState, 'coins' | 'inv' | 'newland'>>(s: T, x: number, y: number): T | null {
  const nl = s.newland
  const k = key(x, y)
  const kind = nl?.tiles[k]
  if (!nl || !kind) return null
  const tiles = { ...nl.tiles }
  delete tiles[k]
  return { ...refund(s, { coins: SITES[kind].cost.coins, items: {} }), newland: { ...nl, tiles } }
}

/** 이 상태에서 이 건물이 할 수 있는 일 */
export function buildActionOf(b: Pick<Build, 'state'>): 'cancel' | 'demolish' {
  return b.state === 'done' ? 'demolish' : 'cancel'
}

/** 완공된 입주 주택의 수 (후속 작업이 읽는다) */
export const doneHomes = (s: Pick<GameState, 'newland'>): Build[] => buildsOf(s).filter((b) => b.kind === 'home' && b.state === 'done') as Build[]

// ── 저장 정리 (save.ts) ──

const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v)
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const FACINGS: readonly Facing[] = ['down', 'up', 'left', 'right']

function sanitizeItems(v: unknown): Items {
  const out: Items = {}
  if (!isObj(v)) return out
  const known = new Set<string>(Object.keys(SITES).flatMap((k) => Object.keys(SITES[k as SiteKind].cost.items)))
  for (const [id, n] of Object.entries(v)) if (known.has(id) && isInt(n) && n > 0 && n <= 99) out[id as ItemId] = n
  return out
}

/**
 * 모르는 값·깨진 값을 걸러 낸다: 옛 저장(newland 없음)은 undefined, 기록은 모양·구역·겹침이 맞는 것만,
 * 이미 환불된 표식이 있는 기록은 버린다 (다시 환불하지 않는다). 날짜는 미래로 가지 않게 오늘까지로 맞춘다
 */
export function sanitizeNewlandBuild(raw: unknown, today: number): NewlandState | undefined {
  if (!isObj(raw)) return undefined
  const builds: Build[] = []
  const taken = new Set<string>()
  const ids = new Set<string>()
  const slots = new Set<number>()
  let maxN = 0
  if (Array.isArray(raw.builds)) {
    for (const r of raw.builds) {
      if (builds.length >= MAX_BUILDS || !isObj(r)) continue
      const { id, kind, x, y, facing, state, orderedDay, paid, refunded } = r
      if (typeof id !== 'string' || !/^b[1-9]\d{0,6}$/.test(id) || ids.has(id)) continue
      if (!isBuildKind(kind) || !isInt(x) || !isInt(y) || refunded === true) continue
      if (!FACINGS.includes(facing as Facing) || !SITES[kind].facings.includes(facing as Facing)) continue
      if (state !== 'ordered' && state !== 'building' && state !== 'done') continue
      const box = boxOf(x, y)
      const area = areaOf(kind, x, y)
      if (!box.every(inRect)) continue
      if (area.some((t) => taken.has(keyOf(t)))) continue
      const p = isObj(paid) ? paid : {}
      const rawSlot = (r as { slot?: unknown }).slot
      const slot = kind === 'home' && isInt(rawSlot) && rawSlot >= 0 && rawSlot < ROOM_SLOTS.length && !slots.has(rawSlot) ? rawSlot : undefined
      if (slot !== undefined) slots.add(slot)
      const coins = isInt(p.coins) && p.coins >= 0 && p.coins <= 100000 ? p.coins : 0
      const day = isInt(orderedDay) ? Math.min(orderedDay, today) : today
      area.forEach((t) => taken.add(keyOf(t)))
      ids.add(id)
      maxN = Math.max(maxN, Number(id.slice(1)))
      builds.push({ id, kind, x, y, facing: facing as Facing, state, orderedDay: day, paid: { coins, items: sanitizeItems(p.items) }, refunded: false, ...(slot !== undefined ? { slot } : {}) })
    }
  }
  // 방 칸이 없는 입주 주택(작업 6 저장 — 칸 번호 이전)은 앞 빈 칸부터 잇는다. 칸이 모자라면 방 없이 둔다 (문은 있으나 들어갈 수 없다)
  for (let i = 0; i < builds.length; i++) {
    const b = builds[i]
    if (b.kind !== 'home' || b.slot !== undefined) continue
    const free = freeSlot(builds)
    if (free !== undefined) builds[i] = { ...b, slot: free }
  }
  const tiles: Record<string, TileKind> = {}
  if (isObj(raw.tiles)) {
    for (const [k, v] of Object.entries(raw.tiles)) {
      const m = /^(\d{1,2}),(\d{1,2})$/.exec(k)
      if (!m || !isTileKind(v)) continue
      const t = { x: Number(m[1]), y: Number(m[2]) }
      if (!inRect(t) || taken.has(k)) continue
      tiles[k] = v
    }
  }
  const nextId = Math.max(maxN + 1, isInt(raw.nextId) && raw.nextId > 0 && raw.nextId < 10_000_000 ? raw.nextId : 1)
  const settledDay = isInt(raw.settledDay) && raw.settledDay >= 0 ? Math.min(raw.settledDay, today) : 0
  return { builds, tiles, nextId, settledDay }
}

