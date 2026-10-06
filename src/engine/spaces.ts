// 집 안 공간별 쓰임 (계획 16 작업 23, 기획 09): 놓은 가구로 차 자리·손일 자리·가족 쉼터·동물 쉼터·읽는 자리를 정한다.
// 지정은 위치·접근 가능성·용도만 본다(가격·가구 수 등급 없음). 필수 가구·문·길을 막는 자리는 지정할 수 없고,
// 가구가 옮겨지거나 치워지면 그때그때 다시 따져 쓸 수 없으면 쉬게 둔다(다시 갖추면 되살아난다).
// 필사 책상·침대·작업대·책장의 기존 쓰임은 그대로이고, 필사에는 어떤 조건도 걸지 않는다.
// 이용자 자리는 저장하지 않고 그때 다시 계산한다 — 같은 자리에 둘이 겹치지 않게 비어 있는 곳을 고른다.
import { BABY_ROOM, LIVING_ROOM, PARTNER_ROOM } from './home-layout'
import { footprint, facingOf, keepClear, solidTiles, type Furniture } from './room'
import { petSpotSafe } from './companion'
import { findPath } from './movement'
import { personOf } from './people'
import { currentHomeLevel, HOME_ENTRY, isHome, isWalkable, key, placeActive, PLACES, sameTile } from './world'
import type { Tile } from './types'

export type SpaceUse = 'tea' | 'craft' | 'family' | 'pet' | 'read'
export interface HomeSpace { id: string; use: SpaceUse; furniture: string[]; at: Tile; name?: string }
/** 기획 기본값: 같은 방에 지정 자리 최대 셋 */
export const SPACES_PER_ROOM = 3
export const SPACE_USES: readonly SpaceUse[] = ['tea', 'craft', 'family', 'pet', 'read']
/** 배우자·아이가 자리를 쓰는 저녁 시간 (저녁 일곱 시부터 아홉 시 반 — 그 뒤엔 제 방·요람) */
export const SPACE_FROM = 19 * 60
export const SPACE_TO = 21 * 60 + 30
/** 아이가 낮에도 놀이 자리를 쓰는 때 (걷는 아이) */
export const KID_SPACE_FROM = 7 * 60

export const furnitureId = (f: Pick<Furniture, 'item' | 'x' | 'y'>) => `${f.item}:${f.x}:${f.y}`

type RoomKey = 'workshop' | 'partner' | 'baby' | 'living'
const inRect = (r: { x0: number; y0: number; x1: number; y1: number }, t: Tile) => t.x > r.x0 && t.x < r.x1 && t.y > r.y0 && t.y < r.y1
export function roomKeyOf(t: Tile): RoomKey {
  if (inRect(LIVING_ROOM, t)) return 'living'
  if (inRect(PARTNER_ROOM, t)) return 'partner'
  if (inRect(BABY_ROOM, t)) return 'baby'
  return 'workshop'
}

// ── 가구 종류 ──
const SOLID_SEATS: readonly string[] = ['chair', 'stool', 'longBench', 'daybed']
const FLOOR_SEATS: readonly string[] = ['cushion', 'pillows', 'mat']
const SOFT: readonly string[] = ['cushion', 'pillows', 'mat', 'rug', 'roundRug', 'purpleRug']
const BOOKS: readonly string[] = ['bookcase', 'homeShelf']
const plain = (f: Furniture) => !f.on && !f.item.startsWith('spouse:')
const isSeat = (f: Furniture) => plain(f) && (SOLID_SEATS.includes(f.item) || FLOOR_SEATS.includes(f.item))
const isTable = (f: Furniture) => plain(f) && f.item === 'table'
const isWork = (f: Furniture) => plain(f) && (f.item === 'table' || f.item === 'homeWorkbench')
const isSoft = (f: Furniture) => plain(f) && SOFT.includes(f.item)
const isBook = (f: Furniture) => plain(f) && BOOKS.includes(f.item)

const dist = (a: Furniture, b: Furniture) => {
  let best = Infinity
  for (const t of footprint(a)) for (const p of footprint(b)) best = Math.min(best, Math.abs(t.x - p.x) + Math.abs(t.y - p.y))
  return best
}
/** 한 자리로 묶는 거리: 탁자·의자는 한 칸 건너까지, 책장은 조금 더 */
const NEAR = 2
const NEAR_BOOKS = 3

// ── 앉을 칸(슬롯) ──
export interface SeatSlot { item: string; at: Tile; stand: Tile }
const FRONT_OF = { down: { x: 0, y: 1 }, up: { x: 0, y: -1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } } as const

function reachable(t: Tile, blocked: ReadonlySet<string>): boolean {
  return isHome(t) && isWalkable(t, blocked) && !!findPath(HOME_ENTRY, t, blocked)
}

/** 이 가구의 앉을 칸들: 긴 의자는 칸마다 하나. 서는 칸은 가구 앞쪽을 먼저, 걸어갈 수 있고 문·서는 자리가 아닌 바닥 */
export function seatSlots(f: Furniture, blocked: ReadonlySet<string>, avoid: readonly Tile[] = keepClear()): SeatSlot[] {
  const bad = (t: Tile) => avoid.some(a => sameTile(a, t))
  if (FLOOR_SEATS.includes(f.item)) return footprint(f).filter(t => !bad(t) && reachable(t, blocked)).map(t => ({ item: f.item, at: t, stand: t }))
  const own = footprint(f)
  const [front] = [FRONT_OF[facingOf(f)]]
  const out: SeatSlot[] = []
  for (const at of own) {
    const around = [{ x: at.x + front.x, y: at.y + front.y }, { x: at.x - 1, y: at.y }, { x: at.x + 1, y: at.y }, { x: at.x, y: at.y - 1 }, { x: at.x, y: at.y + 1 }]
    const stand = around.find(c => !own.some(o => sameTile(o, c)) && !bad(c) && reachable(c, blocked))
    if (stand) out.push({ item: f.item, at, stand })
  }
  return out
}

/** 이 방 가구로 이 쓰임이 정말 되는가 (필요한 가구가 있고, 앉을 칸까지 걸어갈 수 있다) */
function satisfied(use: SpaceUse, fs: readonly Furniture[], room: readonly Furniture[]): boolean {
  const blocked = solidTiles(room)
  const seats = fs.filter(isSeat).filter(f => seatSlots(f, blocked).length > 0)
  switch (use) {
    case 'tea': return seats.some(s => fs.some(t => isTable(t) && dist(s, t) <= NEAR))
    case 'craft': return seats.some(s => fs.some(t => isWork(t) && dist(s, t) <= NEAR))
    case 'family': return seats.length > 0
    case 'read': return seats.some(s => fs.some(b => isBook(b) && dist(s, b) <= NEAR_BOOKS))
    case 'pet': return fs.some(f => isSoft(f) && petTileOf(f, blocked) !== null)
  }
}
function petTileOf(f: Furniture, blocked: ReadonlySet<string>): Tile | null {
  return footprint(f).find(t => !keepClear().some(a => sameTile(a, t)) && petSpotSafe(t, blocked) && !!findPath(HOME_ENTRY, t, blocked)) ?? null
}

/** 그 쓰임에 쓰는 가구만 (장식 소품은 쓰임을 좌우하지 않는다) */
function relevant(use: SpaceUse, fs: readonly Furniture[]): Furniture[] {
  switch (use) {
    case 'tea': return fs.filter(f => isSeat(f) || isTable(f))
    case 'craft': return fs.filter(f => isSeat(f) || isWork(f))
    case 'family': return fs.filter(f => isSeat(f))
    case 'read': return fs.filter(f => isSeat(f) || isBook(f))
    case 'pet': return fs.filter(isSoft)
  }
}
/** 앵커 둘레에서 이 쓰임에 쓰이는 가구들 */
function groupFor(use: SpaceUse, room: readonly Furniture[], anchor: Furniture): Furniture[] {
  return relevant(use, room.filter(f => plain(f) && dist(anchor, f) <= (use === 'read' ? NEAR_BOOKS : NEAR)))
}
/** 이 가구를 눌러 고를 수 있는 쓰임 — 지금 가구로 정말 되는 것만 제안한다 */
export function usesFor(room: readonly Furniture[], anchor: Furniture): SpaceUse[] {
  if (!plain(anchor) || !room.some(f => furnitureId(f) === furnitureId(anchor) && !f.on) || !isHome({ x: anchor.x, y: anchor.y })) return []
  return SPACE_USES.filter(use => {
    const fs = groupFor(use, room, anchor)
    return fs.some(f => furnitureId(f) === furnitureId(anchor)) && satisfied(use, fs, room)
  })
}

export function spaceFurniture(room: readonly Furniture[], s: HomeSpace): Furniture[] {
  return s.furniture.flatMap(id => { const f = room.find(o => !o.on && furnitureId(o) === id); return f ? [f] : [] })
}
/** 지금 쓸 수 있는가 (가구가 옮겨지거나 치워졌으면 아니다) */
export function spaceReady(room: readonly Furniture[], s: HomeSpace): boolean {
  const fs = spaceFurniture(room, s)
  return fs.length > 0 && satisfied(s.use, fs, room) && fs.every(f => isHome({ x: f.x, y: f.y }))
}

/** 쓸 수 있는 자리만 (가구 배치가 바뀌어도 늘 지금 방으로 다시 따진다) */
let liveMemo: { room: readonly Furniture[]; spaces: readonly HomeSpace[]; level: number; out: HomeSpace[] } | null = null
export function liveSpaces(s: { room: readonly Furniture[]; spaces?: readonly HomeSpace[] }): HomeSpace[] {
  const spaces = s.spaces ?? []
  if (!spaces.length) return []
  const level = currentHomeLevel()
  if (liveMemo && liveMemo.room === s.room && liveMemo.spaces === spaces && liveMemo.level === level) return liveMemo.out
  const out = spaces.filter(sp => spaceReady(s.room, sp))
  liveMemo = { room: s.room, spaces, level, out }
  return out
}

/** 자리를 대표하는 칸: 탁자·작업면, 없으면 첫 앉을 칸·깔개 */
function primaryOf(use: SpaceUse, fs: readonly Furniture[]): Tile | null {
  const pick = (use === 'tea' ? fs.find(isTable) : use === 'craft' ? fs.find(isWork) : use === 'read' ? fs.find(isBook) : undefined) ?? fs.find(isSeat) ?? fs.find(isSoft) ?? fs[0]
  return pick ? { x: pick.x, y: pick.y } : null
}

/** 자리 하나를 정한다. 못 정하면 null (쓰임이 안 되거나, 방마다 셋이 찼거나, 길을 막는다) */
export function designateSpace(room: readonly Furniture[], spaces: readonly HomeSpace[], anchor: Furniture, use: SpaceUse): HomeSpace[] | null {
  if (!usesFor(room, anchor).includes(use)) return null
  const fs = groupFor(use, room, anchor)
  const id = `space:${furnitureId(anchor)}`
  const at = primaryOf(use, fs)
  if (!at) return null
  if (spaces.filter(s => s.id !== id && roomKeyOf(s.at) === roomKeyOf(at)).length >= SPACES_PER_ROOM) return null
  const next: HomeSpace = { id, use, at, furniture: fs.map(furnitureId), ...(spaces.find(s => s.id === id)?.name ? { name: spaces.find(s => s.id === id)!.name } : {}) }
  if (!spaceReady(room, next)) return null
  return [...spaces.filter(s => s.id !== id), next]
}
export const clearSpace = (spaces: readonly HomeSpace[], id: string): HomeSpace[] => spaces.filter(s => s.id !== id)
/** 이 가구가 속한 자리들 */
export function spacesOf(spaces: readonly HomeSpace[], f: Pick<Furniture, 'item' | 'x' | 'y'>): HomeSpace[] {
  return spaces.filter(s => s.furniture.includes(furnitureId(f)))
}

/** 가구를 옮겼을 때 자리가 그 가구를 따라가게 한다 (id만 바꾼다 — 쓸 수 있는지는 다시 따진다) */
export function moveInSpaces(spaces: readonly HomeSpace[], from: Pick<Furniture, 'item' | 'x' | 'y'>, to: Pick<Furniture, 'item' | 'x' | 'y'>): HomeSpace[] {
  const a = furnitureId(from), b = furnitureId(to)
  if (a === b) return [...spaces]
  return spaces.map(s => s.furniture.includes(a) ? { ...s, furniture: s.furniture.map(id => id === a ? b : id) } : s)
}
/** 방에 없는 가구는 자리에서 빼고, 가구가 하나도 없으면 자리를 없앤다. 대표 칸은 남은 가구로 */
export function pruneSpaces(spaces: readonly HomeSpace[], room: readonly Furniture[]): HomeSpace[] {
  const out: HomeSpace[] = []
  for (const s of spaces) {
    const fs = spaceFurniture(room, s)
    if (!fs.length) continue
    const at = primaryOf(s.use, fs) ?? s.at
    out.push({ ...s, furniture: fs.map(furnitureId), at })
  }
  return out
}

/** 저장에서 읽기: 모양이 틀린 것은 버리고, 없는 가구는 빼고, 방마다 셋까지 (지금 쓸 수 있는지는 저장하지 않는다) */
export function sanitizeSpaces(raw: unknown, room: readonly Furniture[]): HomeSpace[] {
  if (!Array.isArray(raw)) return []
  const out: HomeSpace[] = []
  for (const s of raw) {
    if (!s || typeof s !== 'object' || typeof s.id !== 'string' || !SPACE_USES.includes(s.use) || !Array.isArray(s.furniture) || s.furniture.some((v: unknown) => typeof v !== 'string')) continue
    const ids = [...new Set<string>(s.furniture)]
    const base: HomeSpace = { id: s.id, use: s.use, furniture: ids, at: s.at && Number.isInteger(s.at.x) && Number.isInteger(s.at.y) ? { x: s.at.x, y: s.at.y } : { x: 0, y: 0 }, ...(typeof s.name === 'string' && s.name.trim() ? { name: s.name.trim().slice(0, 20) } : {}) }
    const [space] = pruneSpaces([base], room)
    if (!space || out.some(p => p.id === space.id) || out.filter(p => roomKeyOf(p.at) === roomKeyOf(space.at)).length >= SPACES_PER_ROOM) continue
    out.push(space)
  }
  return out
}

// ── 이용자 자리 (저장하지 않고 그때 계산) ──
export interface Seat { at: Tile; stand: Tile }
/** 비어 있는 앉을 칸을 이용자마다 하나씩. occupied: 이미 누가 서 있는 칸(키) — 같은 의자에 둘이 겹치지 않는다 */
export function reserveSeats(room: readonly Furniture[], s: HomeSpace, users: readonly string[], occupied: ReadonlySet<string> = new Set(), near?: Tile): Record<string, Seat> {
  return assignSeats(room, [{ space: s, who: users }], occupied, near)
}

function assignSeats(room: readonly Furniture[], wants: readonly { space: HomeSpace; who: readonly string[] }[], occupied: ReadonlySet<string>, near?: Tile): Record<string, Seat> {
  const blocked = solidTiles(room), taken = new Set(occupied), out: Record<string, Seat> = {}
  for (const { space, who } of wants) {
    if (!spaceReady(room, space)) continue
    const slots = spaceFurniture(room, space).filter(isSeat).flatMap(f => seatSlots(f, blocked))
    // 곁에서 가장 가까운 자리부터 (같은 거리면 가구 차례대로)
    if (near) slots.sort((a, b) => Math.abs(a.stand.x - near.x) + Math.abs(a.stand.y - near.y) - (Math.abs(b.stand.x - near.x) + Math.abs(b.stand.y - near.y)))
    for (const user of who) {
      if (out[user]) continue
      const slot = slots.find(sl => !taken.has(key(sl.at)) && !taken.has(key(sl.stand)))
      if (!slot) continue
      out[user] = { at: slot.at, stand: slot.stand }
      taken.add(key(slot.at)); taken.add(key(slot.stand))
    }
  }
  return out
}

/** 이 칸을 눌렀을 때 열리는 자리 (앉을 곳·탁자·작업면 — 동물 쉼터는 그냥 바닥이라 누르는 자리가 아니다) */
export function spaceAtTile(s: { room: readonly Furniture[]; spaces?: readonly HomeSpace[] }, t: Tile): HomeSpace | undefined {
  return liveSpaces(s).find(sp => sp.use !== 'pet' && spaceFurniture(s.room, sp).some(f => (isSeat(f) || isWork(f) || isBook(f)) && footprint(f).some(p => sameTile(p, t))))
}
/** 동물 쉼터에서 동물이 쉴 안전한 칸 (여러 쉼터가 있으면 첫 번째로 안전한 칸) */
export function petSpaceTile(s: { room: readonly Furniture[]; spaces?: readonly HomeSpace[] }, occupied: ReadonlySet<string> = new Set()): Tile | null {
  const blocked = solidTiles(s.room)
  for (const sp of liveSpaces(s).filter(x => x.use === 'pet'))
    for (const f of spaceFurniture(s.room, sp).filter(isSoft))
      for (const t of footprint(f)) if (!occupied.has(key(t)) && !keepClear().some(a => sameTile(a, t)) && petSpotSafe(t, blocked) && findPath(HOME_ENTRY, t, blocked)) return t
  return null
}

/** 쉬는 자리 지정 후에도 문·침대·작업대·책상·화덕·선반 앞이 막히지 않는가 (들러 선 이웃이 서 있어도) */
export function routesOpen(room: readonly Furniture[], stands: readonly Tile[]): boolean {
  const blocked = new Set([...solidTiles(room), ...stands.map(key)])
  const ids = (Object.keys(PLACES) as (keyof typeof PLACES)[]).filter(id => PLACES[id].stand && isHome(PLACES[id].stand!) && placeActive(id))
  for (const id of ids) if (!sameTile(PLACES[id].stand!, HOME_ENTRY) && !findPath(HOME_ENTRY, PLACES[id].stand!, blocked)) return false
  return true
}

// ── 배우자·아이가 쓰는 자리 ──
/** 배우자가 좋아하는 쓰임 순서 (활동 취향에서 — 없으면 차 자리·가족 쉼터) */
export function spouseUses(npc: string): SpaceUse[] {
  const a = personOf(npc)?.tastes?.activity ?? {}
  const out: SpaceUse[] = []
  if (a.tea === 1) out.push('tea')
  if (a.make === 1 || a.sew === 1 || a.observe === 1 || a.garden === 1) out.push('craft')
  if (a.walk === 1 || a.taste === 1) out.push('family')
  for (const u of ['tea', 'family', 'read', 'craft'] as const) if (!out.includes(u)) out.push(u)
  return out
}
/** 아이 단계에 맞는 쓰임: 걷는 아이는 놀이(가족 쉼터)부터, 돕는 아이는 탁자·책 곁 */
export function childUses(stage: 'baby' | 'toddler' | 'helper' | 'adult'): SpaceUse[] {
  if (stage === 'toddler') return ['family', 'tea', 'craft']
  if (stage === 'helper') return ['craft', 'tea', 'read', 'family']
  return []
}

export interface FamilyWants { spouse?: string; child?: { stage: 'baby' | 'toddler' | 'helper' | 'adult' } }
/**
 * 배우자와 아이가 지금 앉을 자리 (지정 자리가 없거나 가득 찼으면 해당 항목이 없다 → 기존 자리).
 * 기록자가 앉은 칸·동물·이웃이 서 있는 칸은 피한다.
 */
export function familySeats(s: { room: readonly Furniture[]; spaces?: readonly HomeSpace[] }, want: FamilyWants, occupied: ReadonlySet<string> = new Set()): { spouse?: Tile; child?: Tile } {
  const live = liveSpaces(s).filter(sp => sp.use !== 'pet')
  if (!live.length) return {}
  const blocked = solidTiles(s.room), taken = new Set(occupied), out: { spouse?: Tile; child?: Tile } = {}
  const order: { who: 'spouse' | 'child'; uses: SpaceUse[] }[] = []
  if (want.spouse) order.push({ who: 'spouse', uses: spouseUses(want.spouse) })
  if (want.child) order.push({ who: 'child', uses: childUses(want.child.stage) })
  for (const { who, uses } of order) {
    for (const use of uses) {
      let found = false
      for (const sp of live.filter(x => x.use === use)) {
        const slot = spaceFurniture(s.room, sp).filter(isSeat).flatMap(f => seatSlots(f, blocked)).find(sl => !taken.has(key(sl.at)) && !taken.has(key(sl.stand)))
        if (!slot) continue
        out[who] = slot.stand
        taken.add(key(slot.at)); taken.add(key(slot.stand)); found = true
        break
      }
      if (found) break
    }
  }
  return out
}

/** 놓을 수 있는 집들이 손님 자리 (쓸 수 있는 자리의 서는 칸) — 문·길을 막지 않는 칸만 */
export function guestStands(s: { room: readonly Furniture[]; spaces?: readonly HomeSpace[] }, n: number, avoid: readonly Tile[] = []): Tile[] {
  const blocked = solidTiles(s.room), out: Tile[] = []
  const order: Record<SpaceUse, number> = { tea: 0, family: 1, craft: 2, read: 3, pet: 9 }
  for (const sp of [...liveSpaces(s)].filter(x => x.use !== 'pet').sort((a, b) => order[a.use] - order[b.use])) {
    for (const f of spaceFurniture(s.room, sp).filter(isSeat)) for (const sl of seatSlots(f, blocked)) {
      if (out.length >= n) return out
      if (out.some(t => sameTile(t, sl.stand)) || avoid.some(t => sameTile(t, sl.stand))) continue
      if (!routesOpen(s.room, [...out, sl.stand])) continue
      out.push(sl.stand)
    }
  }
  return out
}
