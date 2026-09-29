// 게임 상태와 규칙의 조합. 순수 함수만 — 화면과 저장은 바깥(store)이 맡는다.
import { festivalOf, FESTIVAL_FROM, FESTIVAL_TO, isMarketDay, isWet, weatherOf, barleyRipe, grapesRipe } from './calendar'
import { advance, newClock, phaseOf, seasonOf, sleepClock, type Clock } from './clock'
import { DURATION, greet, IDLE_GAP, IDLE_RESET, stepIdle, type IdleState } from './autonomy'
import { adopt, companionGoal, STRAY_DAY, STRAY_SPOTS, stepCompanion, type Animal, type Companion } from './companion'
import { add, addGift, CHAPTER_COST, FOODS, count, craft, has, MAX_STACK, RECIPES, recipeGives, take, TOOLS, type Inventory, type RecipeId } from './items'
import { facingFor, findPath, pathToward, stepActor, type Actor } from './movement'
import { coolDown, exhausted, fallsSick, FRESH, rest, sleepNeeds, starving, tickNeeds, warmUp, work, type Needs } from './needs'
import { inGoodMood } from './mood'
import { placement, refitRoom, removal, solidTiles, type Furniture } from './room'
import {
  BABY_PARTY_SPOTS,
  FRIENDS_FROM,
  FRIENDS_HEARTS,
  FRIENDS_SPOT,
  FRIENDS_TO,
  gatheringWindow,
  HILL_SPOTS,
  INVITE_DOORS,
  INVITE_FROM,
  INVITE_TO,
  pickInviter,
  pickVisitor,
  planGathering,
  reqState,
  requestFor,
  unlocked,
  villageLevel,
  VISIT_FROM,
  VISIT_GIFTS,
  VISIT_SPOT,
  VISIT_TO,
  type Gathering,
} from './bonds'
import { COVER_FROM, jobOf, SELL_FROM } from './job'
import { FESTIVAL_SPOTS, goalFor, isNear, npcTile, placeNpc, stepNpc, type Npc } from './neighbors'
import { GAIN, heartsOf, MAX_POINTS } from './hearts'
import { actsRoomOpen, bookDone, bookRoomOpen, emptyProgress, roomOpen, totalChapters, type Progress } from './books'
import { modeOf, SHELF_ROOMS } from './shelf-rooms'
import { currentChapter, offersForDay } from './offers'
import { POSTMAN, postForDay } from './post'
import { blanksFor } from './copy'
import { checkArrangement, moveItem, type ArrangeResult } from './scroll'
import { cardsForChapters, journeyComplete, placeNewCards } from './journey'
import { growGarden, type Plot } from './garden'
import { feastToday, gospelRoomFull, readOff, type Grade } from './library'
import {
  BABY_DAY,
  LESSON_FROM,
  LESSON_SPOT,
  LESSON_TO,
  LETTERS_TOTAL,
  CHILD_ASKS_AT,
  MILESTONE_GIFTS,
  MILESTONES,
  momentNow,
  onceKey,
} from './stories'
import { ATTIC, BED_STAND, HEARTH_STAND, HOME_DOOR, inAttic, isIndoor, isWalkable, key, LADDER, lockedTiles, PLACES, placeAt, roomAt, sameTile, setActsOpen, setHomeLevel, START, tileAt, WARPS } from './world'
import { GOSPELS, type Book, type Facing, type GameContent, type ItemId, type NeighborDef, type PlaceId, type Rng, type Target, type Tile } from './types'
import type { Avatar } from './avatar'

export interface JournalEntry {
  day: number
  heard: string[]
  notes?: string[]
}

export interface AlbumEntry {
  id: string
  day: number
}


export type { Furniture }

export interface GameState {
  version: 1
  clock: Clock
  player: Actor
  idle: IdleState
  target: Target | null
  /** 이웃 id → 오늘 전해 줄 조각 id */
  offers: Record<string, string>
  /** 오늘 편지 나르는 이웃이 가져온 편지(편지 책의 장 조각 id) — 지금 책이 편지 책일 때만, 한꺼번에 건넨다 */
  post: string[]
  collected: string[]
  todayHeard: string[]
  /** 지금 엮는 책 (처음엔 고르지 않았다) */
  activeBook: Book | null
  /** 책별 진행 */
  progress: Progress
  /** 오늘 조각을 건넨 이웃 — 책을 바꿔도 같은 날 또 건네지 않는다 */
  listened: string[]
  /** 서고에 꽂힌 책과 책등 등급 */
  shelved: Partial<Record<Book, Grade>>
  /** 서고 퀴즈에서 틀린 구절의 조각 — 자기 전·벤치 읽기에서 먼저 나온다 */
  rereads: string[]
  journal: JournalEntry[]
  inv: Inventory
  needs: Needs
  /** 기름 한 번으로 남은 밤 수 (밝은 등잔이면 두 밤) */
  lampFuel: number
  lampLitDay: number | null
  hearts: Record<string, number>
  talked: string[]
  helped: string[]
  gifted: string[]
  npcs: Record<string, Npc>
  companion: Companion | null
  /** 이야기 진행 표식과 수 (childLetters 등) */
  flags: Record<string, number>
  /** 보여 줄 장면 (차례대로) */
  scenes: string[]
  album: AlbumEntry[]
  giftsGot: ItemId[]
  recipesKnown: RecipeId[]
  myLines: Record<string, string>
  /** 풀밭을 밟은 횟수 → 오솔길 */
  trails: Record<string, number>
  room: Furniture[]
  todayNotes: string[]
  /** 오늘의 일: 아침에 들르는 이웃, 저녁 초대, 이웃 모임 (새 날마다 정한다) */
  today: Today
  /** 닢 */
  coins: number
  /** 오늘 편지 의뢰를 끝낸 날 */
  letterDay: number | null
  lettersDone: number
  /** 플레이어가 고른 주인공 */
  avatar: Avatar | null
  /** 텃밭 ('x,y' → 작물) */
  garden: Record<string, Plot>
  /** 집 단계: 0 작업실, 1 방 하나 더, 2 다락 서재 (목수에게 부탁한 단계는 flags.homeOrder, 다음 날 아침 지어진다) */
  homeLevel: 0 | 1 | 2
  /**
   * 사도행전 방의 여정 판: 놓인 카드 번호(journey.json의 order)의 차례. 얻은 카드는 장을 엮을 때 판에 들어온다.
   * 여정을 다 이으면 flags.actsShip 1 → 다음 날 아침 2 (나루에 배가 들어온다, 장면 actsShip)
   */
  journey: number[]
}

/** 지도(world.tileAt)가 이 게임의 집 단계·사도행전 방 문을 보게 한다. 지도를 읽는 엔진 입구마다 부른다 */
export function syncHome(s: Pick<GameState, 'homeLevel'> & Partial<Pick<GameState, 'flags'>>): void {
  setHomeLevel(s.homeLevel ?? 0)
  setActsOpen(actsRoomOpen(s.flags ?? {}))
}

export interface Today {
  visitor: string | null
  visitGot: boolean
  inviter: string | null
  dined: boolean
  gathering: Gathering | null
}
export const NO_TODAY: Today = { visitor: null, visitGot: false, inviter: null, dined: false, gathering: null }

export type GameEvent =
  | { type: 'arrived'; target: Target }
  | { type: 'moment'; id: string }

// ── 만들기 ──

function defsById(content: GameContent): Record<string, NeighborDef> {
  return Object.fromEntries(content.neighbors.map((n) => [n.id, n]))
}

type GoalState = Pick<GameState, 'clock' | 'flags' | 'progress' | 'hearts' | 'today' | 'shelved'>

/**
 * 서고에 꽂은 복음서 수 — 마을 구역(lockedZones)·서고 권수로 이사 오는 이웃·직업 단계가 이것을 센다.
 * 사도행전(계획 5)은 세지 않는다: 이 흐름들은 복음서 방 네 권을 기준으로 짜였고, 사도행전 방은 그다음 이야기다
 */
export function shelvedCount(s: Pick<GameState, 'shelved'>): number {
  return GOSPELS.filter((b) => s.shelved[b] !== undefined).length
}

/**
 * 아직 이사 오지 않은 이웃 — 마을 단계(joinsAt)가 모자라거나, 서고 권수(joinsAtBooks)로 오는 이웃이면
 * 소개 장면이 나온 아침(잠들 때 세운 movedIn 표식)이 아직 오지 않았다
 */
const notYet = (d: NeighborDef, level: number, flags: Record<string, number>) =>
  (d.joinsAt !== undefined && level < d.joinsAt) || (d.joinsAtBooks !== undefined && !flags[`movedIn:${d.id}`])

function goalContext(s: GoalState, content: GameContent) {
  const w = weatherOf(s.clock.day)
  const m = s.clock.minute
  const special: Record<string, Tile | null> = {}
  // 아직 이사 오지 않은 이웃은 보이지 않는다 — 소개 장면이 나오는 새 날 아침부터 (잠들 때 정한 단계)
  const level = s.flags.villageLevel ?? 0
  for (const d of content.neighbors) if (notYet(d, level, s.flags)) special[d.id] = null
  const joined = (id: string) => !(id in special)
  // 단짝이 된 아이는 오후에 양 우리 곁에서 논다
  if (s.flags['done:friends'] && m >= FRIENDS_FROM && m < FRIENDS_TO && !isWet(w)) special.child = FRIENDS_SPOT
  if (lessonTime(s)) special.child = LESSON_SPOT
  // 아침에 들르는 이웃
  const t = s.today ?? NO_TODAY
  if (t.visitor && !t.visitGot && joined(t.visitor) && m >= VISIT_FROM && m < VISIT_TO) special[t.visitor] = VISIT_SPOT
  // 이웃 모임
  if (t.gathering) {
    const [from, to] = gatheringWindow(t.gathering)
    const spots = t.gathering === 'babyParty' ? BABY_PARTY_SPOTS : HILL_SPOTS
    // 밤 언덕에는 양치기를 두지 않는다 (§2-5)
    const skip = t.gathering === 'starNight' ? 'shepherd' : ''
    if (m >= from && m < to) for (const [id, spot] of Object.entries(spots)) if (joined(id) && id !== skip) special[id] = spot
  }
  // 복음서 방 잔치 저녁: 이사 온 이웃은 모두(상인도) 광장 모닥불 둘레로 — 비가 와도 연다
  if (feastToday(s) && m >= FESTIVAL_FROM && m < FESTIVAL_TO)
    for (const [id, spot] of Object.entries(FESTIVAL_SPOTS)) if (joined(id)) special[id] = spot
  return {
    minute: s.clock.minute,
    wet: isWet(w),
    market: isMarketDay(s.clock.day),
    festival: festivalOf(s.clock.day) !== null && !isWet(w),
    special,
    locked: lockedTiles(shelvedCount(s)),
  }
}

/** 오늘 저녁 아이가 글자를 배우러 오는가 */
export function lessonTime(s: Pick<GameState, 'clock' | 'flags'> & { today?: Today }): boolean {
  const m = s.clock.minute
  return (
    (s.flags.childAsked ?? 0) > 0 &&
    (s.flags.childLetters ?? 0) < LETTERS_TOTAL &&
    s.flags.taughtDay !== s.clock.day &&
    !isWet(weatherOf(s.clock.day)) &&
    // 잔치 날 저녁에는 아이도 모닥불 곁에 있다 (복음서 방 잔치 날도)
    !festivalOf(s.clock.day) &&
    s.flags.gospelFeast !== 1 &&
    // 아기 잔치 날, 아이네가 저녁 초대한 날도 쉰다
    s.today?.gathering !== 'babyParty' &&
    s.today?.inviter !== 'child' &&
    m >= LESSON_FROM &&
    m < LESSON_TO
  )
}

function placeAllNpcs(s: GoalState, content: GameContent): Record<string, Npc> {
  const ctx = goalContext(s, content)
  return Object.fromEntries(content.neighbors.map((d) => [d.id, placeNpc(d, goalFor(d, ctx))]))
}

function todaysOffers(day: number, collected: string[], s: Pick<GameState, 'activeBook' | 'progress'>, content: GameContent, npcs: string[]) {
  if (!s.activeBook) return {}
  // 편지는 이웃이 조각으로 나눠 건네지 않는다 — 편지 나르는 이웃만 장째로 (계획 7 작업 2)
  if (modeOf(s.activeBook) === 'letters') return {}
  const pieces = content.pieces.filter((p) => p.book === s.activeBook)
  return offersForDay({ day, pieces, collected, chapter: currentChapter(pieces, s.progress[s.activeBook].completed), neighborIds: npcs })
}

/**
 * 오늘 편지 나르는 이웃이 가져올 편지: 지금 책이 편지 책이고, 그 이웃이 오늘 나와 있고(present), 오늘 아직 건네지 않았을 때
 * (listened — 책을 바꿔도 같은 날 또 받지 않는다). 다른 이웃은 편지를 건네지 않는다
 */
function todaysPost(day: number, s: Pick<GameState, 'activeBook' | 'collected' | 'listened'>, content: GameContent, present: string[]): string[] {
  const book = s.activeBook
  if (!book || modeOf(book) !== 'letters') return []
  if (!present.includes(POSTMAN) || s.listened.includes(POSTMAN)) return []
  return postForDay({ day, book, chapters: content.pieces.filter((p) => p.book === book), delivered: s.collected })
}

/** 그날 밖에 나오는 이웃 (상인은 장날만, 궂은 날 쉬는 이웃은 빼고) — 이야기는 만날 수 있는 이웃에게만 배정한다 */
function neighborsOfDay(day: number, content: GameContent, level = 0, flags: Record<string, number> = {}): string[] {
  const wet = isWet(weatherOf(day))
  return content.neighbors
    .filter((n) => !n.marketOnly || isMarketDay(day))
    .filter((n) => !notYet(n, level, flags))
    .filter((n) => !wet || n.schedule.some((e) => e.tile && e.wet))
    .map((n) => n.id)
}

/** 오늘 마을에 나와 조각을 건넬 수 있는 이웃 */
export function neighborsPresent(s: GameState, content: GameContent): string[] {
  return neighborsOfDay(s.clock.day, content, s.flags.villageLevel ?? 0, s.flags)
}

export function newGame(content: GameContent, avatar?: Avatar): GameState {
  const clock = newClock()
  // heartPoints: hearts에 점수(0~100)가 들어 있다는 표식 (예전 저장과 구분)
  const flags: Record<string, number> = { heartPoints: 1 }
  const progress = emptyProgress()
  const base = { clock, flags, progress, hearts: {}, today: NO_TODAY, shelved: {} }
  // 새 게임은 넓히기 전 집 — 지도(모듈 전역 집 단계)도 0으로, 사도행전 방은 닫힌 채
  setHomeLevel(0)
  setActsOpen(false)
  return {
    version: 1,
    clock,
    player: { x: START.x, y: START.y, path: [], facing: 'down', walkTime: 0 },
    idle: IDLE_RESET,
    target: null,
    offers: {},
    post: [],
    collected: [],
    todayHeard: [],
    activeBook: null,
    progress,
    listened: [],
    shelved: {},
    rereads: [],
    journal: [],
    inv: { water: 1, bread: 2 },
    needs: FRESH,
    lampFuel: 0,
    lampLitDay: null,
    hearts: {},
    talked: [],
    helped: [],
    gifted: [],
    npcs: placeAllNpcs(base, content),
    companion: null,
    flags,
    scenes: ['welcome'],
    album: [],
    giftsGot: [],
    recipesKnown: [],
    myLines: {},
    trails: {},
    room: [],
    todayNotes: [],
    today: NO_TODAY,
    coins: 0,
    letterDay: null,
    lettersDone: 0,
    avatar: avatar ?? null,
    garden: {},
    homeLevel: 0,
    journey: [],
  }
}

/** 지금 엮을 책을 고른다. 오늘 아직 조각을 건네지 않은 이웃에게 새 책의 조각을 배정한다 */
export function chooseBook(s: GameState, book: Book, content: GameContent): GameState {
  if (!content.pieces.some((p) => p.book === book)) return s
  // 복음서 방 밖의 책은 그 서고 방이 열린 뒤에만 (화면이 막아도 엔진에서 한 번 더)
  if (!bookRoomOpen(book, s.flags)) return s
  const level = s.flags.villageLevel ?? 0
  const present = neighborsOfDay(s.clock.day, content, level, s.flags).filter((id) => !s.listened.includes(id))
  const next = { ...s, activeBook: book }
  return { ...next, offers: todaysOffers(s.clock.day, s.collected, next, content, present), post: todaysPost(s.clock.day, next, content, present) }
}

/** 불러온 뒤 이웃을 제자리에 세운다 (걷던 길은 저장하지 않으므로) */
export function settle(s: GameState, content: GameContent): GameState {
  syncHome(s)
  // 지도를 옮기기 전 저장은 지금은 집 안인 칸에 서 있을 수 있다 — 갇히지 않게 집 앞으로 옮긴다
  const stuck = (t: Tile) => !isWalkable(t) || (!roomAt(t) && !inAttic(t) && findPath(t, START) === null)
  let player = { ...s.player, path: [] as Tile[] }
  if (stuck(playerTile(s))) player = { ...player, x: HOME_DOOR.x, y: HOME_DOOR.y + 1, facing: 'down', walkTime: 0 }
  let companion = s.companion
  if (companion && stuck({ x: Math.round(companion.x), y: Math.round(companion.y) })) {
    const near = companionGoal({ x: Math.round(player.x), y: Math.round(player.y) }, false) ?? { x: Math.round(player.x), y: Math.round(player.y) }
    companion = { ...companion, x: near.x, y: near.y, path: [] }
  }
  return { ...s, npcs: placeAllNpcs(s, content), target: null, idle: IDLE_RESET, player, companion }
}

export function playerTile(s: GameState): Tile {
  return { x: Math.round(s.player.x), y: Math.round(s.player.y) }
}

export function outdoors(s: GameState): boolean {
  return !isIndoor(playerTile(s))
}

function blockersOf(s: GameState): Set<string> {
  return new Set([...Object.values(s.npcs).filter((n) => n.visible).map((n) => key(npcTile(n))), ...solidTiles(s.room), ...lockedTiles(shelvedCount(s))])
}

/** 오늘 들판에 있는 떠돌이 새끼들 */
export function straysToday(s: GameState): Animal[] {
  if (s.companion || s.clock.day < STRAY_DAY || s.flags.strayChosen) return []
  return ['cat', 'dog']
}

// ── 걷기 ──

/** 키보드 이동은 바로 옆의 빈 칸으로만 걷는다. */
export function walkDirection(s: GameState, dx: number, dy: number): GameState {
  if (s.player.path.length || Math.abs(dx) + Math.abs(dy) !== 1) return s
  syncHome(s)
  const from = playerTile(s)
  const to = { x: from.x + dx, y: from.y + dy }
  // 사다리 쪽으로 걸으면 다락으로 올라간다
  if (sameTile(to, LADDER) && placeAt(LADDER) === 'ladder') return { ...s, player: warpTo(s.player, ATTIC.entry), target: null, idle: IDLE_RESET }
  const path = findPath(from, to, blockersOf(s))
  if (!path || path.length !== 1) {
    // 막혀서 못 가도 그쪽을 바라본다 — 스페이스로 앞에 있는 이웃·물건과 상호작용하려면 필요하다
    const facing = facingFor(dx, dy, s.player.facing)
    return facing === s.player.facing ? s : { ...s, player: { ...s.player, facing } }
  }
  return { ...s, player: { ...s.player, path }, target: null, idle: IDLE_RESET }
}

const FRONT: Record<Facing, Tile> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }

/** 그 칸에 누를 만한 것(이웃·길 동물·동반 동물·장소)이 있는가 */
function interactableAt(s: GameState, t: Tile): boolean {
  return (
    Object.values(s.npcs).some((n) => n.visible && sameTile(npcTile(n), t)) ||
    straysToday(s).some((a) => sameTile(STRAY_SPOTS[a], t)) ||
    (!!s.companion && sameTile({ x: Math.round(s.companion.x), y: Math.round(s.companion.y) }, t)) ||
    placeAt(t) !== null
  )
}

/**
 * 키보드의 스페이스: 바라보는 칸을 먼저, 없으면 옆·선 자리에서 상호작용할 칸을 찾는다.
 * 찾은 칸은 그 칸을 누른 것과 똑같이 처리한다(tapTile).
 */
export function interactTile(s: GameState): Tile | null {
  if (s.player.path.length) return null
  syncHome(s)
  const here = playerTile(s)
  const f = FRONT[s.player.facing]
  const front = { x: here.x + f.x, y: here.y + f.y }
  const around = Object.values(FRONT)
    .map((d) => ({ x: here.x + d.x, y: here.y + d.y }))
    .filter((t) => !sameTile(t, front))
  for (const t of [front, ...around, here]) if (interactableAt(s, t)) return t
  return null
}

/** 화면의 한 칸을 눌렀을 때: 그곳(또는 그 사람·물건 옆)으로 걸어가기 시작한다 */
export function tapTile(s: GameState, tile: Tile): GameState {
  syncHome(s)
  const from = playerTile(s)
  if (sameTile(tile, from) && s.player.path.length === 0) {
    return { ...s, player: { ...s.player, facing: 'down' }, idle: greet(), target: null }
  }
  const blockers = blockersOf(s)
  let target: Target
  let path: Tile[] | null
  const npc = Object.values(s.npcs).find((n) => n.visible && sameTile(npcTile(n), tile))
  const stray = straysToday(s).find((a) => sameTile(STRAY_SPOTS[a], tile))
  const pet = s.companion && sameTile({ x: Math.round(s.companion.x), y: Math.round(s.companion.y) }, tile)
  const place = placeAt(tile)
  if (npc) {
    target = { kind: 'neighbor', id: npc.id, tries: 0 }
    path = pathToward(from, tile, blockers)
  } else if (stray) {
    target = { kind: 'stray', animal: stray }
    path = pathToward(from, tile, new Set([...blockers, key(tile)]))
  } else if (pet) {
    target = { kind: 'companion' }
    path = pathToward(from, tile, new Set([...blockers, key(tile)]))
  } else if (place) {
    target = { kind: 'place', id: place, tile }
    const stand = PLACES[place].stand
    path = stand ? findPath(from, stand, blockers) : pathToward(from, tile, blockers)
  } else {
    target = { kind: 'ground' }
    path = findPath(from, tile, blockers)
  }
  if (path === null) return { ...s, idle: IDLE_RESET }
  const snap = s.player.x !== from.x || s.player.y !== from.y ? [from] : []
  return { ...s, player: { ...s.player, path: [...snap, ...path] }, target, idle: IDLE_RESET }
}

function targetTile(s: GameState, target: Target): Tile | null {
  if (target.kind === 'neighbor') {
    const n = s.npcs[target.id]
    return n ? npcTile(n) : null
  }
  if (target.kind === 'place') return target.tile
  if (target.kind === 'stray') return STRAY_SPOTS[target.animal]
  if (target.kind === 'companion' && s.companion) return { x: Math.round(s.companion.x), y: Math.round(s.companion.y) }
  return null
}

function warpTo<T extends GameState['player']>(player: T, to: Tile): T {
  return { ...player, x: to.x, y: to.y, path: [], facing: roomAt(to) || inAttic(to) ? 'up' : 'down' }
}

/** 이웃집 문 앞에서 문을 눌렀을 때 들어간다 (저녁 초대가 없을 때) */
export function enterDoor(s: GameState, door: Tile): GameState {
  const to = WARPS.get(key(door))
  return to && roomAt(to) ? { ...s, player: warpTo(s.player, to), target: null } : s
}

export function tick(s: GameState, dt: number, rng: Rng, content: GameContent): { state: GameState; events: GameEvent[] } {
  const events: GameEvent[] = []
  syncHome(s)
  const clock = advance(s.clock, dt)
  const minutes = clock.minute - s.clock.minute
  const here = playerTile(s)
  const season = seasonOf(clock.day)
  const needs = tickNeeds(s.needs, minutes, {
    indoor: isIndoor(here),
    season,
    phase: phaseOf(clock.minute),
    warm: sameTile(here, HEARTH_STAND),
    hasBlanket: count(s.inv, 'blanket') > 0,
    peace: peaceful(s),
    hot: weatherOf(clock.day) === 'hot',
  })

  // 기록자
  const moving = s.player.path.length > 0
  let player = stepActor(s.player, starving(needs) ? dt * 0.7 : dt).actor
  const now = { x: Math.round(player.x), y: Math.round(player.y) }
  let trails = s.trails
  if (!sameTile(now, here) && tileAt(now.x, now.y) === '.') trails = { ...trails, [key(now)]: (trails[key(now)] ?? 0) + 1 }
  // 이웃집 문을 밟으면 방 안으로, 방의 문깔개를 밟으면 문 앞으로 옮겨 간다
  const warp = !sameTile(now, here) ? WARPS.get(key(now)) : undefined
  if (warp) player = warpTo(player, warp)

  // 이웃
  const defs = defsById(content)
  const gctx = goalContext({ ...s, clock }, content)
  const npcs: Record<string, Npc> = {}
  const furnitureBlockers = new Set([...solidTiles(s.room), ...lockedTiles(shelvedCount(s))])
  for (const [id, n] of Object.entries(s.npcs)) npcs[id] = defs[id] ? stepNpc(n, defs[id], goalFor(defs[id], gctx), dt, furnitureBlockers) : n

  // 도착
  let target = warp ? null : s.target
  if (target && player.path.length === 0) {
    const tt = targetTile({ ...s, npcs }, target)
    if (target.kind === 'neighbor') {
      const n = npcs[target.id]
      if (n?.visible && isNear(now, npcTile(n))) {
        events.push({ type: 'arrived', target })
        target = null
      } else if (n?.visible && target.tries < 3) {
        // 걸어가는 사이 이웃이 움직였다 — 다시 따라간다
        const p = pathToward(now, npcTile(n), new Set([...furnitureBlockers, ...Object.values(npcs).filter((o) => o.visible).map((o) => key(npcTile(o)))]))
        if (p && p.length) {
          player = { ...player, path: p }
          target = { ...target, tries: target.tries + 1 }
        } else target = null
      } else target = null
    } else if (target.kind === 'place' && target.id === 'ladder') {
      // 사다리 앞에 닿으면 다락으로 올라간다
      player = warpTo(player, ATTIC.entry)
      target = null
    } else {
      events.push({ type: 'arrived', target })
      target = null
    }
    if (tt && player.path.length === 0 && !inAttic(player)) player = { ...player, facing: facingFor(tt.x - now.x, tt.y - now.y, player.facing) }
  }

  // 동반 동물
  let companion = s.companion
  if (companion) {
    const rainOut = isWet(weatherOf(clock.day)) && !isIndoor(now)
    companion = stepCompanion(companion, companionGoal(now, rainOut), dt)
  }

  const idle = moving ? IDLE_RESET : stepIdle(s.idle, dt, clock.minute, rng, totalChapters(s) >= 3)
  const next: GameState = { ...s, clock, needs, player, target, idle, npcs, companion, trails }

  const g = (s.today ?? NO_TODAY).gathering
  if (g && !s.flags[`done:${g}`] && inGathering(g, clock.minute, now)) {
    events.push({ type: 'moment', id: g })
    return { state: { ...next, scenes: [...next.scenes, g], flags: { ...next.flags, [`done:${g}`]: 1 } }, events }
  }
  const m = momentNow({ day: clock.day, minute: clock.minute, outdoors: !isIndoor(now), player: now, flags: s.flags })
  if (m && !next.scenes.includes(m)) {
    events.push({ type: 'moment', id: m })
    return { state: { ...next, scenes: [...next.scenes, m], flags: { ...next.flags, [onceKey(m, clock.day)]: 1 } }, events }
  }
  return { state: next, events }
}

/** 시간을 한 번에 흘려보낸다 (손일·쉬기) */
export function passTime(s: GameState, minutes: number): GameState {
  const clock = advance(s.clock, minutes)
  const here = playerTile(s)
  const needs = tickNeeds(s.needs, clock.minute - s.clock.minute, {
    indoor: isIndoor(here),
    season: seasonOf(clock.day),
    phase: phaseOf(clock.minute),
    warm: false,
    hasBlanket: count(s.inv, 'blanket') > 0,
    peace: peaceful(s),
    hot: weatherOf(clock.day) === 'hot',
  })
  return { ...s, clock, needs }
}

// ── 이웃과 말하기 ──

/** 마음 점수를 더한다 (hearts에는 점수 0~100이 들어 있고, 하트 수는 heartsOf로 본다) */
function heartUp(s: GameState, id: string, points: number): GameState {
  const beforePts = s.hearts[id] ?? 0
  const afterPts = Math.min(MAX_POINTS, beforePts + points)
  const before = heartsOf(beforePts)
  const after = heartsOf(afterPts)
  let next: GameState = { ...s, hearts: { ...s.hearts, [id]: afterPts } }
  for (const m of MILESTONES) {
    const gift = MILESTONE_GIFTS[id]?.[m]
    if (gift && before < m && after >= m) {
      next = {
        ...next,
        inv: addGift(next.inv, gift),
        giftsGot: [...new Set([...next.giftsGot, ...(Object.keys(gift) as ItemId[])])],
        scenes: [...next.scenes, `gift:${id}:${m}`],
      }
    }
  }
  if (id === 'child' && after >= CHILD_ASKS_AT && !next.flags.childAsked) {
    next = { ...next, flags: { ...next.flags, childAsked: 1 }, scenes: [...next.scenes, 'childAsks'] }
  }
  return next
}

/** 말을 걸면 그날 처음 한 번 하트가 오른다 */
export function greetNeighbor(s: GameState, id: string): GameState {
  if (s.talked.includes(id)) return s
  return heartUp({ ...s, talked: [...s.talked, id] }, id, GAIN.talk)
}

/**
 * 오늘 이 이웃이 전해 줄 이야기를 듣는다. pieceIds: 받은 조각 모두 (조각은 하나, 편지는 가져온 장 전부).
 * 지금 책이 편지 책이면 편지 나르는 이웃이 오늘 가져온 편지(post)를 한꺼번에 건넨다 — 다른 이웃은 건네지 않는다(offers가 비어 있다)
 */
export function listen(s: GameState, neighborId: string, content: GameContent): { state: GameState; pieceId: string | null; pieceIds: string[] } {
  const none = { state: s, pieceId: null, pieceIds: [] as string[] }
  if (neighborId === POSTMAN && s.activeBook && modeOf(s.activeBook) === 'letters') return receivePost(s, content)
  const pieceId = s.offers[neighborId]
  if (!pieceId || s.collected.includes(pieceId)) return none
  const piece = content.pieces.find((p) => p.id === pieceId)
  if (!piece) return none
  const offers = { ...s.offers }
  delete offers[neighborId]
  const bp = s.progress[piece.book]
  const placed = bp.arrangement[piece.chapter] ?? []
  return {
    state: {
      ...s,
      offers,
      collected: [...s.collected, pieceId],
      todayHeard: [...s.todayHeard, pieceId],
      listened: s.listened.includes(neighborId) ? s.listened : [...s.listened, neighborId],
      progress: { ...s.progress, [piece.book]: { ...bp, arrangement: { ...bp.arrangement, [piece.chapter]: [...placed, pieceId] } } },
    },
    pieceId,
    pieceIds: [pieceId],
  }
}

/** 편지 나르는 이웃이 오늘 가져온 편지를 한꺼번에 받는다 (collected·todayHeard에 넣고 post를 비운다) */
function receivePost(s: GameState, content: GameContent): { state: GameState; pieceId: string | null; pieceIds: string[] } {
  const known = new Map(content.pieces.map((p) => [p.id, p]))
  const ids = (s.post ?? []).filter((id) => known.has(id) && !s.collected.includes(id))
  if (!ids.length) return { state: s, pieceId: null, pieceIds: [] }
  // 책상 순서(arrangement)도 조각과 같게 채워 둔다 — 불러오기(sanitize)가 모은 조각으로 다시 채우는 것과 어긋나지 않게
  let progress = s.progress
  for (const id of ids) {
    const p = known.get(id)!
    const bp = progress[p.book]
    progress = { ...progress, [p.book]: { ...bp, arrangement: { ...bp.arrangement, [p.chapter]: [...(bp.arrangement[p.chapter] ?? []), id] } } }
  }
  return {
    state: {
      ...s,
      post: [],
      collected: [...s.collected, ...ids],
      todayHeard: [...s.todayHeard, ...ids],
      listened: s.listened.includes(POSTMAN) ? s.listened : [...s.listened, POSTMAN],
      progress,
    },
    pieceId: ids[0],
    pieceIds: ids,
  }
}

/** 돕기 보상 (계절에 따라 바뀌는 이웃이 있다) */
export function helpReward(def: NeighborDef, day: number, flags: Record<string, number> = {}): Partial<Record<ItemId, number>> {
  if (def.id === 'grandpa' && grapesRipe(day)) return { grapes: 2 }
  // 새 풀무를 만든 뒤에는 그을음을 넉넉히
  if (def.id === 'smith' && unlocked(flags, 'bigBellows')) return { soot: 2 }
  return def.help.gives
}

export type HelpBlock = 'done' | 'needs' | 'tired' | 'full' | null
export function canHelp(s: GameState, def: NeighborDef): HelpBlock {
  if (s.helped.includes(def.id)) return 'done'
  if (exhausted(s.needs)) return 'tired'
  if (def.help.needs && !has(s.inv, def.help.needs)) return 'needs'
  const paid = def.help.needs ? take(s.inv, def.help.needs)! : s.inv
  if (wouldOverflow(paid, helpReward(def, s.clock.day, s.flags))) return 'full'
  return null
}

export function finishHelp(s: GameState, def: NeighborDef): GameState {
  if (canHelp(s, def)) return s
  const paid = def.help.needs ? take(s.inv, def.help.needs)! : s.inv
  const next = { ...s, inv: add(paid, helpReward(def, s.clock.day, s.flags)), helped: [...s.helped, def.id], needs: work(s.needs, 8) }
  return heartUp(passTime(next, 30), def.id, GAIN.help)
}

/** 선물은 하루에 한 이웃에게 한 번. 좋아하는 것이면 마음이 더 오른다 */
export function giveGift(s: GameState, def: NeighborDef, item: ItemId): { state: GameState; liked: boolean } | null {
  if (s.gifted.includes(def.id)) return null
  const left = take(s.inv, { [item]: 1 })
  if (!left) return null
  const liked = def.likes.includes(item)
  return { state: heartUp({ ...s, inv: left, gifted: [...s.gifted, def.id] }, def.id, liked ? GAIN.giftLiked : GAIN.giftPlain), liked }
}

export const GIFTABLE: readonly ItemId[] = ['bread', 'grapes', 'fig', 'wool', 'olive', 'oil', 'barley', 'honey', 'herb', 'bean']

export interface Trade {
  id: string
  pay: Partial<Record<ItemId, number>>
  get: Partial<Record<ItemId, number>>
  /** 이 변화가 생긴 뒤에만 (상인의 부탁을 들어준 뒤) */
  requires?: string
  /** 닢으로 사는 물건 */
  coins?: number
}
/** 장날 상인과 바꾸기 (돈 대신 물건) */
export const TRADES: readonly Trade[] = [
  { id: 'pen', pay: { grapes: 3, wool: 2 }, get: { goodPen: 1 } },
  { id: 'papyrus', pay: { grapes: 2 }, get: { papyrus: 2 } },
  { id: 'soot', pay: { bread: 2 }, get: { soot: 2 } },
  { id: 'rug', pay: { wool: 2 }, get: { rug: 1 } },
  { id: 'vase', pay: { fig: 2 }, get: { vase: 1 } },
  { id: 'barley', pay: { olive: 2 }, get: { barley: 3 } },
  { id: 'table', pay: { wool: 3, olive: 2 }, get: { table: 1 } },
  { id: 'nightstand', pay: { grapes: 2, fig: 1 }, get: { nightstand: 1 } },
  { id: 'jar', pay: { oil: 1 }, get: { jar: 1 } },
  { id: 'candle', pay: { oil: 1, soot: 1 }, get: { candle: 1 } },
  { id: 'bowl', pay: { barley: 2 }, get: { bowl: 1 }, requires: 'moreTrades' },
  { id: 'bird', pay: { olive: 1, fig: 1 }, get: { bird: 1 }, requires: 'moreTrades' },
  { id: 'honey', pay: { grapes: 1, bread: 1 }, get: { honey: 1 }, requires: 'moreTrades' },
  { id: 'goldLeaf', pay: {}, coins: 30, get: { goldLeaf: 1 } },
  // 가구 20종
  { id: 'chair', pay: { olive: 1, wool: 1 }, get: { chair: 1 } },
  { id: 'bookcase', pay: { grapes: 2, olive: 2 }, get: { bookcase: 1 } },
  { id: 'chest', pay: { olive: 2, fig: 1 }, get: { chest: 1 } },
  { id: 'barrel', pay: { grapes: 3 }, get: { barrel: 1 } },
  { id: 'wheel', pay: { wool: 3 }, get: { wheel: 1 } },
  { id: 'lectern', pay: { olive: 2, papyrus: 1 }, get: { lectern: 1 } },
  { id: 'lampStand', pay: { oil: 2 }, get: { lampStand: 1 } },
  { id: 'bigPlant', pay: { fig: 2, barley: 1 }, get: { bigPlant: 1 } },
  { id: 'longBench', pay: { olive: 3, wool: 1 }, get: { longBench: 1 } },
  { id: 'daybed', pay: { wool: 3, olive: 2 }, get: { daybed: 1 } },
  { id: 'cupboard', pay: { olive: 3, grapes: 2 }, get: { cupboard: 1 } },
  { id: 'roundRug', pay: { wool: 3 }, get: { roundRug: 1 } },
  { id: 'mat', pay: { reed: 3 }, get: { mat: 1 } },
  { id: 'pillows', pay: { wool: 2 }, get: { pillows: 1 } },
  { id: 'teapot', pay: { barley: 2 }, get: { teapot: 1 } },
  { id: 'fruitBowl', pay: { fig: 1, grapes: 1 }, get: { fruitBowl: 1 } },
  { id: 'scrolls', pay: { papyrus: 2 }, get: { scrolls: 1 } },
  { id: 'inkpot', pay: { ink: 1 }, get: { inkpot: 1 } },
  { id: 'dryFlowers', pay: { fig: 1 }, get: { dryFlowers: 1 } },
  { id: 'hourglass', pay: { olive: 1, oil: 1 }, get: { hourglass: 1 } },
  { id: 'seedHerb', pay: {}, coins: 5, get: { seedHerb: 2 } },
  { id: 'seedBean', pay: {}, coins: 4, get: { seedBean: 2 } },
  { id: 'goodPenCoins', pay: {}, coins: 40, get: { goodPen: 1 } },
  { id: 'brightLamp', pay: {}, coins: 60, get: { brightLamp: 1 } },
  { id: 'wideDesk', pay: {}, coins: 80, get: { wideDesk: 1 } },
]

/** 이미 가진 도구를 또 사게 되는 거래인가 (도구는 하나씩) */
export function ownsTradeTool(inv: Inventory, t: Trade): boolean {
  return TOOLS.some((id) => t.get[id] !== undefined && count(inv, id) > 0)
}

export function tradesFor(flags: Record<string, number>): Trade[] {
  return TRADES.filter((t) => !t.requires || unlocked(flags, t.requires))
}

export function trade(s: GameState, t: Trade): GameState | null {
  if (!isMarketDay(s.clock.day)) return null
  if (t.requires && !unlocked(s.flags, t.requires)) return null
  if (ownsTradeTool(s.inv, t)) return null
  if (t.coins !== undefined && s.coins < t.coins) return null
  const left = take(s.inv, t.pay)
  if (!left || wouldOverflow(left, t.get)) return null
  return { ...s, inv: add(left, t.get), coins: s.coins - (t.coins ?? 0) }
}

/** 아이에게 글자 가르치기 (하루 한 번, 저녁에 집으로 올 때) */
export function teach(s: GameState): GameState {
  if (!lessonTime(s)) return s
  const letters = (s.flags.childLetters ?? 0) + 1
  const scenes = letters === 1 ? ['firstLetter'] : letters === LETTERS_TOTAL ? ['childLearned'] : []
  return heartUp(
    passTime({ ...s, flags: { ...s.flags, childLetters: letters, taughtDay: s.clock.day }, scenes: [...s.scenes, ...scenes] }, 30),
    'child',
    GAIN.teach,
  )
}

// ── 마음이 쌓인 이웃들 (bonds.ts) ──

/** 부탁을 듣는다 */
export function askRequest(s: GameState, npc: string): GameState {
  const r = requestFor(npc, s.hearts[npc], s.flags)
  if (!r || reqState(s.flags, r.id) !== 0) return s
  return { ...s, flags: { ...s.flags, [`req:${r.id}`]: 1 }, scenes: [...s.scenes, `ask:${r.id}`] }
}

/** 부탁을 받고 가져다줄 것 (들은 부탁이 있을 때) */
export function activeRequest(s: GameState, npc: string) {
  const r = requestFor(npc, s.hearts[npc], s.flags)
  return r && reqState(s.flags, r.id) === 1 ? r : null
}

const MATERIALS: readonly ItemId[] = ['bread', 'water', 'soot', 'oil', 'wool', 'papyrus', 'honey', 'grapes', 'fig', 'reed', 'olive', 'barley', 'ink']

/** 부탁한 것을 가져다준다 */
export function fulfillRequest(s: GameState, npc: string): GameState | null {
  const r = activeRequest(s, npc)
  if (!r) return null
  const left = take(s.inv, r.needs)
  if (!left) return null
  // 보상이 가방에 들어가지 않으면 아직 건네지 않는다
  if (wouldOverflow(left, r.reward)) return null
  const kept = (Object.keys(r.reward) as ItemId[]).filter((i) => !MATERIALS.includes(i))
  const next: GameState = {
    ...s,
    inv: addGift(left, r.reward),
    giftsGot: [...new Set([...s.giftsGot, ...kept])],
    flags: { ...s.flags, [`req:${r.id}`]: 2, [`unlock:${r.unlock}`]: 1 },
    scenes: [...s.scenes, `done:${r.id}`],
  }
  return heartUp(next, npc, GAIN.request)
}

/** 아침에 들른 이웃이 두고 가는 것 */
export function receiveVisit(s: GameState, npc: string): { state: GameState; gift: Partial<Record<ItemId, number>> } | null {
  const t = s.today ?? NO_TODAY
  if (t.visitor !== npc || t.visitGot) return null
  if (s.clock.minute < VISIT_FROM || s.clock.minute >= VISIT_TO) return null
  const gift = VISIT_GIFTS[npc] ?? {}
  return { state: { ...s, inv: addGift(s.inv, gift), today: { ...t, visitGot: true } }, gift }
}

/** 저녁 초대: 그 집 문 앞에서 */
export function inviteOpen(s: GameState, npc: string): boolean {
  const t = s.today ?? NO_TODAY
  return t.inviter === npc && !t.dined && s.clock.minute >= INVITE_FROM && s.clock.minute < INVITE_TO
}

export function dine(s: GameState, npc: string): GameState | null {
  if (!inviteOpen(s, npc)) return null
  const t = s.today ?? NO_TODAY
  const next = passTime(
    { ...s, today: { ...t, dined: true }, needs: { ...s.needs, hunger: Math.max(0, s.needs.hunger - 60) }, scenes: [...s.scenes, `dinner:${npc}`] },
    90,
  )
  return heartUp(next, npc, GAIN.dinner)
}

/** 누른 칸이 오늘 저녁 초대한 이웃의 집 문인가 */
export function inviterAtDoor(s: GameState, t: Tile): string | null {
  for (const [id, door] of Object.entries(INVITE_DOORS)) if (sameTile(door, t) && inviteOpen(s, id)) return id
  return null
}

/** 언덕 모임(소풍·별 보는 밤) 자리: 언덕 벤치와 이웃이 모이는 자리를 둘러싼 네모 (한 칸 여유) — 벤치를 옮기면 함께 옮겨진다 */
export const HILL_AREA = (() => {
  const ts = [...Object.values(HILL_SPOTS), ...PLACES.hill.tiles, ...(PLACES.hill.stand ? [PLACES.hill.stand] : [])]
  const xs = ts.map((t) => t.x)
  const ys = ts.map((t) => t.y)
  return { x0: Math.min(...xs) - 1, x1: Math.max(...xs) + 1, y0: Math.min(...ys) - 1, y1: Math.max(...ys) + 1 }
})()

/** 아기 잔치 자리: 모임 자리를 둘러싼 네모 (한 칸 여유) */
export const BABY_AREA = (() => {
  const ts = Object.values(BABY_PARTY_SPOTS)
  const xs = ts.map((t) => t.x)
  const ys = ts.map((t) => t.y)
  return { x0: Math.min(...xs) - 1, x1: Math.max(...xs) + 1, y0: Math.min(...ys) - 1, y1: Math.max(...ys) + 1 }
})()

export function inGathering(g: Gathering, minute: number, p: Tile): boolean {
  const [from, to] = gatheringWindow(g)
  if (minute < from || minute >= to) return false
  if (g === 'babyParty') return p.x >= BABY_AREA.x0 && p.x <= BABY_AREA.x1 && p.y >= BABY_AREA.y0 && p.y <= BABY_AREA.y1
  return p.x >= HILL_AREA.x0 && p.x <= HILL_AREA.x1 && p.y >= HILL_AREA.y0 && p.y <= HILL_AREA.y1
}

// ── 곳곳에서 하는 일 ──

export type GatherResult = { gives: Partial<Record<ItemId, number>>; minutes: number } | { blocked: 'notRipe' | 'tired' | 'full' }

/** 우물·갈대·포도·올리브·보리밭에서 얻는 것 */
export function gatherInfo(s: GameState, place: PlaceId): GatherResult | null {
  if (exhausted(s.needs)) return { blocked: 'tired' }
  const day = s.clock.day
  let info: GatherResult
  switch (place) {
    case 'well':
      info = { gives: { water: 1 }, minutes: 10 }
      break
    case 'reeds':
      info = { gives: { reed: 2 }, minutes: 20 }
      break
    case 'olive':
      info = { gives: { olive: 2 }, minutes: 20 }
      break
    case 'vine':
      info = grapesRipe(day) ? { gives: { grapes: 2 }, minutes: 20 } : { blocked: 'notRipe' }
      break
    case 'field':
      info = { gives: { barley: barleyRipe(day) ? 3 : 1 }, minutes: 20 }
      break
    default:
      return null
  }
  // 가방이 넘치면 헛수고가 되므로 미리 막는다
  if ('gives' in info && wouldOverflow(s.inv, info.gives)) return { blocked: 'full' }
  return info
}

/** 넣으면 넘치는가 (넘치는 물건은 사라지므로 미리 막는다) */
export function wouldOverflow(inv: Inventory, gives: Partial<Record<ItemId, number>>): boolean {
  return (Object.entries(gives) as [ItemId, number][]).some(([id, n]) => count(inv, id) + n > MAX_STACK)
}

export function finishGather(s: GameState, place: PlaceId): GameState {
  const info = gatherInfo(s, place)
  if (!info || 'blocked' in info) return s
  return passTime({ ...s, inv: add(s.inv, info.gives), needs: work(s.needs, 4) }, info.minutes)
}

export type CraftBlock = 'needs' | 'tired' | 'full' | 'job' | null
export function canCraft(s: GameState, id: RecipeId): CraftBlock {
  if (id === 'cover' && jobOf(s) < COVER_FROM) return 'job'
  if (exhausted(s.needs)) return 'tired'
  if (!has(s.inv, RECIPES[id].needs)) return 'needs'
  if (wouldOverflow(take(s.inv, RECIPES[id].needs)!, recipeGives(RECIPES[id], s.inv, s.flags))) return 'full'
  return null
}

export function finishCraft(s: GameState, id: RecipeId): GameState {
  if (canCraft(s, id)) return s
  const inv = craft(s.inv, RECIPES[id], s.flags)!
  const recipesKnown = s.recipesKnown.includes(id) ? s.recipesKnown : [...s.recipesKnown, id]
  return passTime({ ...s, inv, recipesKnown, needs: work(s.needs, 5) }, RECIPES[id].minutes)
}

/** 장날에 파는 것: 공방 제품과 텃밭 작물뿐 — 엮은 말씀 책·조각은 팔지 않는다 (exclusion-list §3-3) */
export const SELL_PRICES: Partial<Record<ItemId, number>> = { ink: 8, papyrus: 6, cover: 25, herb: 4, bean: 3 }

/** 장날 하루에 상인이 사는 물건 최대 개수 */
export const SELL_CAP = 10

function soldToday(s: Pick<GameState, 'clock' | 'flags'>): number {
  return s.flags.soldDay === s.clock.day ? (s.flags.soldCount ?? 0) : 0
}

export type SellBlock = 'notMarket' | 'job' | 'none' | 'cap' | null
export function canSell(s: GameState, item: ItemId): SellBlock {
  if (SELL_PRICES[item] === undefined || count(s.inv, item) === 0) return 'none'
  if (!isMarketDay(s.clock.day)) return 'notMarket'
  if (jobOf(s) < SELL_FROM) return 'job'
  if (soldToday(s) >= SELL_CAP) return 'cap'
  return null
}

export function sell(s: GameState, item: ItemId): GameState | null {
  if (canSell(s, item)) return null
  return {
    ...s,
    inv: take(s.inv, { [item]: 1 })!,
    coins: s.coins + SELL_PRICES[item]!,
    flags: { ...s.flags, soldDay: s.clock.day, soldCount: soldToday(s) + 1 },
  }
}

/** 가진 것 중 가장 든든한 것을 먹는다 (빵 → 꿀 → 무화과) */
export function eatBread(s: GameState): GameState | null {
  for (const [id, amount] of FOODS) {
    const left = take(s.inv, { [id]: 1 })
    if (left) return { ...s, inv: left, needs: { ...s.needs, hunger: Math.max(0, s.needs.hunger - amount) } }
  }
  return null
}

export function hasFood(inv: Inventory): boolean {
  return FOODS.some(([id]) => count(inv, id) > 0)
}

export function warmByHearth(s: GameState): GameState {
  return passTime({ ...s, needs: warmUp(s.needs) }, 15)
}

export function restAt(s: GameState): GameState {
  return passTime({ ...s, needs: rest(s.needs) }, 30)
}

/** 담요를 덮어 주면 추위가 가신다 (담요는 닳지 않는다) */
export function coverWithBlanket(s: GameState): GameState | null {
  if (count(s.inv, 'blanket') === 0) return null
  return { ...s, needs: warmUp(s.needs), scenes: s.flags.blanketOnce ? s.scenes : [...s.scenes, 'blanket'], flags: { ...s.flags, blanketOnce: 1 } }
}

export const READ_REST = 30
export const READ_MINUTES = 20
/** 벤치에 앉아 모은 성경구절을 읽을 때마다 피로가 풀린다 (피로가 남아 있었으면 rested) */
export function readScripture(s: GameState, pieceId: string): { state: GameState; rested: boolean } | null {
  if (!s.collected.includes(pieceId)) return null
  // 앉아서 쉰 만큼 먼저 풀고, 그다음 읽는 20분이 흐른다
  const needs = { ...s.needs, fatigue: Math.max(0, s.needs.fatigue - READ_REST) }
  return { state: readOff(passTime({ ...s, needs }, READ_MINUTES), pieceId), rested: s.needs.fatigue > 0 }
}

export function stargaze(s: GameState): GameState {
  const clear = !isWet(weatherOf(s.clock.day)) && weatherOf(s.clock.day) !== 'fog'
  const night = phaseOf(s.clock.minute) === 'night'
  const next = passTime({ ...s, needs: rest(s.needs) }, 20)
  if (clear && night && !s.flags[onceKey('stars', s.clock.day)])
    return { ...next, scenes: [...next.scenes, 'stars'], flags: { ...next.flags, [onceKey('stars', s.clock.day)]: 1 } }
  return next
}

// ── 동반 동물 ──

export function adoptStray(s: GameState, kind: Animal, name: string): GameState {
  if (s.companion) return s
  const at = STRAY_SPOTS[kind]
  return {
    ...s,
    companion: adopt(kind, name, s.clock.day, at),
    // childPet: 아이가 데려간 쪽 (1 고양이, 2 강아지)
    flags: { ...s.flags, strayChosen: 1, childPet: kind === 'cat' ? 2 : 1 },
    scenes: [...s.scenes, 'companionJoined'],
  }
}

// ── 책상 ──

/** 저녁·밤에는 등잔을 켜야 쓸 수 있다 */
export function needsLamp(s: GameState): boolean {
  return s.clock.minute >= 18 * 60 || s.clock.minute < 6 * 60
}

/** 등잔을 켠다. 이미 켰으면 그대로, 기름이 없으면 null */
export function lightLamp(s: GameState): GameState | null {
  if (!needsLamp(s) || s.lampLitDay === s.clock.day) return s
  if (s.lampFuel > 0) return { ...s, lampFuel: s.lampFuel - 1, lampLitDay: s.clock.day, flags: { ...s.flags, lampNights: (s.flags.lampNights ?? 0) + 1 } }
  const left = take(s.inv, { oil: 1 })
  if (!left) return null
  const extra = count(s.inv, 'brightLamp') > 0 ? 1 : 0
  return { ...s, inv: left, lampFuel: extra, lampLitDay: s.clock.day, flags: { ...s.flags, lampNights: (s.flags.lampNights ?? 0) + 1 } }
}

export function setArrangement(s: GameState, book: Book, chapter: number, list: string[]): GameState {
  const bp = s.progress[book]
  return { ...s, progress: { ...s.progress, [book]: { ...bp, arrangement: { ...bp.arrangement, [chapter]: list } } } }
}

export type SubmitResult = ArrangeResult | { kind: 'supplies'; need: Partial<Record<ItemId, number>> } | { kind: 'tired' }

/** 기록할 준비가 되었는가 (순서·재료·몸). 아무것도 쓰지 않는다 — 준비되면 퀴즈를 연다 */
export function chapterReady(s: GameState, book: Book, chapter: number, content: GameContent): SubmitResult {
  const pieces = content.pieces.filter((p) => p.book === book)
  const bp = s.progress[book]
  const result = checkArrangement(pieces, chapter, bp.arrangement[chapter] ?? [], s.collected)
  if (result.kind !== 'done' || bp.completed.includes(chapter)) return result
  if (exhausted(s.needs)) return { kind: 'tired' }
  if (!has(s.inv, CHAPTER_COST)) return { kind: 'supplies', need: CHAPTER_COST }
  return result
}

/** 퀴즈까지 마친 뒤 실제로 기록한다 (재료를 쓰고 장을 완성). 한 권의 마지막 장이면 'bookBound' 장면 */
export function submitChapter(s: GameState, book: Book, chapter: number, content: GameContent): { state: GameState; result: SubmitResult } {
  const result = chapterReady(s, book, chapter, content)
  const bp = s.progress[book]
  if (result.kind !== 'done' || bp.completed.includes(chapter)) return { state: s, result }
  const left = take(s.inv, CHAPTER_COST)!
  const progress = { ...s.progress, [book]: { ...bp, completed: [...bp.completed, chapter] } }
  const scenes = [...s.scenes]
  if (totalChapters(s) === 0) scenes.push('firstChapter')
  if (bookDone({ progress }, book, content)) scenes.push('bookBound')
  const bound = passTime({ ...s, inv: left, progress, scenes, needs: work(s.needs, 6) }, bindMinutes(s))
  // 사도행전 장을 엮으면 그 장에 나오는 곳 카드가 여정 판에 들어온다
  return { state: book === 'ac' ? syncJourney(bound, content) : bound, result }
}

// ── 편지 옮겨 적기 (계획 7 작업 3) ──

export type LetterReady =
  | { kind: 'ready' }
  | { kind: 'recorded' }
  | { kind: 'notReceived' }
  | { kind: 'order' }
  | { kind: 'tired' }
  | { kind: 'supplies'; need: Partial<Record<ItemId, number>> }

/**
 * 편지 한 장을 옮겨 적을 준비가 되었는가 (책상 화면용 — 아무것도 쓰지 않는다):
 * 이미 적은 장, 받지 않은 장(편지 나르는 이웃), 앞 장부터 차례대로, 몸(피로), 재료(조각 장과 같은 CHAPTER_COST)
 */
export function letterReady(s: GameState, book: Book, chapter: number, content: GameContent): LetterReady | null {
  if (modeOf(book) !== 'letters') return null
  const pieces = content.pieces.filter((p) => p.book === book)
  const piece = pieces.find((p) => p.chapter === chapter)
  if (!piece) return null
  const bp = s.progress[book]
  if (bp.completed.includes(chapter)) return { kind: 'recorded' }
  if (!s.collected.includes(piece.id)) return { kind: 'notReceived' }
  if (currentChapter(pieces, bp.completed) !== chapter) return { kind: 'order' }
  if (exhausted(s.needs)) return { kind: 'tired' }
  if (!has(s.inv, CHAPTER_COST)) return { kind: 'supplies', need: CHAPTER_COST }
  return { kind: 'ready' }
}

/**
 * 빈칸을 채워 편지 한 장을 옮겨 적는다: 준비가 되었고(letterReady) picks가 blanksFor의 답과 모두 같을 때만.
 * 재료·피로·걸리는 시간은 조각 장과 같다. 장 기록 퀴즈는 없다 (옮겨 적기가 그 장을 익히는 일).
 * 첫 장이면 'firstChapter', 한 권의 마지막 장이면 'bookBound' 장면. 아니면 그대로 돌려준다
 */
export function recordLetter(s: GameState, book: Book, chapter: number, picks: readonly string[], content: GameContent): GameState {
  if (letterReady(s, book, chapter, content)?.kind !== 'ready' || !content.copy) return s
  const blanks = blanksFor(book, chapter, content.copy(book))
  if (!blanks.length || picks.length !== blanks.length || blanks.some((b, i) => picks[i] !== b.answer)) return s
  const bp = s.progress[book]
  const progress = { ...s.progress, [book]: { ...bp, completed: [...bp.completed, chapter] } }
  const scenes = [...s.scenes]
  if (totalChapters(s) === 0) scenes.push('firstChapter')
  if (bookDone({ progress }, book, content)) scenes.push('bookBound')
  return passTime({ ...s, inv: take(s.inv, CHAPTER_COST)!, progress, scenes, needs: work(s.needs, 6) }, bindMinutes(s))
}

// ── 사도행전 방의 여정 판 (계획 5 작업 5) ──

/** 여정을 다 이었으면 표식(actsShip 1)을 세운다 — 다음 날 아침 나루에 배가 들어온다. 한 번만 */
function markJourney(s: GameState, content: GameContent): GameState {
  if (s.flags.actsShip || !journeyComplete(s.journey, content.journey ?? [])) return s
  return { ...s, flags: { ...s.flags, actsShip: 1 } }
}

/** 엮은 사도행전 장으로 얻은 카드를 판에 맞춘다 (얻은 카드만, 새 카드는 판 끝 가까이에) */
export function syncJourney(s: GameState, content: GameContent): GameState {
  const earned = cardsForChapters(content.journey ?? [], s.progress.ac?.completed ?? [])
  return markJourney({ ...s, journey: placeNewCards(s.journey ?? [], earned) }, content)
}

/** 여정 판의 카드 하나를 위(-1)·아래(+1)로 옮긴다. 다 이은 판은 그대로 둔다 */
export function moveJourneyCard(s: GameState, index: number, delta: number, content: GameContent): GameState {
  if (s.flags.actsShip) return s
  return markJourney({ ...s, journey: moveItem(s.journey, index, delta) }, content)
}

/** 한 장을 엮는 데 드는 분: 기분이 좋으면 45, 아니면 60. 넓은 책상이면 20% 덜 */
export function bindMinutes(s: Pick<GameState, 'needs' | 'clock' | 'room' | 'inv'>): number {
  const base = inGoodMood(s) ? 45 : 60
  return count(s.inv, 'wideDesk') > 0 ? Math.round(base * 0.8) : base
}

// ── 잠과 새 날 ──

/** 잠들기 전에 읽을 조각: 다시 읽을 구절이 먼저, 그다음 오늘 들은 것, 그래도 없으면 모아 둔 것 중 하나 */
export function reviewPick(s: GameState, rng: Rng): string | null {
  if (s.rereads.length) return s.rereads[0]
  if (s.todayHeard.length) return s.todayHeard[Math.min(s.todayHeard.length - 1, Math.floor(rng() * s.todayHeard.length))]
  if (s.collected.length === 0) return null
  return s.collected[Math.min(s.collected.length - 1, Math.floor(rng() * s.collected.length))]
}

/** 오늘이 평안인 날인가 (어젯밤 자기 전에 구절을 읽었다 — 다락 창가에서 읽었으면 그다음 날까지) */
export function peaceful(s: Pick<GameState, 'flags' | 'clock'>): boolean {
  return s.flags.peaceDay === s.clock.day || s.flags.peaceDay2 === s.clock.day
}

/** 이 계절에 보이는 몸 칸: 겨울 추위, 여름 더위, 봄·가을 없음 */
export function seasonalNeed(s: Pick<GameState, 'clock'>): 'cold' | 'heat' | null {
  const season = seasonOf(s.clock.day)
  return season === 'winter' ? 'cold' : season === 'summer' ? 'heat' : null
}

/** 물을 마셔 더위를 식힌다 (물 1) */
export function drinkWater(s: GameState): GameState | null {
  const left = take(s.inv, { water: 1 })
  if (!left) return null
  return passTime({ ...s, inv: left, needs: coolDown(s.needs) }, 5)
}

/**
 * opts.read: 자기 전 복습 구절을 읽고 잔다(평안). opts.pieceId: 그때 읽은 구절 — 다시 읽을 목록에서 뺀다.
 * opts.attic: 다락 창가에서 읽었다 (다락 서재가 있으면 평안이 하루 더 간다).
 * 창만 닫고(더 깨어 있기) 자면 read/pieceId가 없어 목록이 그대로 남는다.
 */
export function goToSleep(s0: GameState, content: GameContent, opts: { read?: boolean; pieceId?: string; attic?: boolean } = {}): GameState {
  syncHome(s0)
  const s = opts.read && opts.pieceId ? readOff(s0, opts.pieceId) : s0
  const sick = fallsSick(s.needs)
  let clock = sleepClock(s.clock)
  if (sick) clock = { ...clock, minute: 10 * 60 }
  const day = clock.day
  const bed = BED_STAND
  const scenes = [...s.scenes]
  if (sick) scenes.push('sick')
  if (day === BABY_DAY) scenes.push('babyBorn')
  if (day === STRAY_DAY && !s.companion) scenes.push('strays')
  let needs = sleepNeeds(s.needs, s.clock.minute)
  if (sick) needs = { hunger: 20, fatigue: 0, cold: 0, heat: 0 }
  const flags = { ...s.flags }
  if (opts.read) flags.peaceDay = day
  else delete flags.peaceDay
  // 다락 창가의 평안: 다음 날과 그다음 날. 지난 것은 지운다
  if (opts.read && opts.attic && s.homeLevel >= 2) flags.peaceDay2 = day + 1
  else if (!(flags.peaceDay2 !== undefined && flags.peaceDay2 >= day)) delete flags.peaceDay2
  // ── 집 넓히기: 부탁해 둔 단계가 아침에 지어진다. 새 모양에 맞지 않는 가구는 가방으로 ──
  let homeLevel = s.homeLevel ?? 0
  let room = s.room
  let inv = s.inv
  const order = flags.homeOrder
  if (order === homeLevel + 1 && (order === 1 || order === 2)) {
    homeLevel = order
    delete flags.homeOrder
    scenes.push(`home:${order}`)
    setHomeLevel(homeLevel)
    const refit = refitRoom(room, inv)
    room = refit.room
    inv = refit.inv
  }
  // ── 마음이 쌓인 마을의 새 날 ──
  const level = villageLevel(s.hearts)
  const prev = s.flags.villageLevel ?? 0
  for (let l = prev + 1; l <= level; l++) scenes.push(`village:${l}`)
  flags.villageLevel = Math.max(prev, level)
  if (!flags['done:friends'] && heartsOf(s.hearts.child) >= FRIENDS_HEARTS && heartsOf(s.hearts.shepherd) >= FRIENDS_HEARTS) {
    flags['done:friends'] = 1
    scenes.push('friends')
  }
  // 서고 권수로 이사 오는 이웃: 처음 보이는 날 아침에 소개
  for (const d of content.neighbors)
    if (d.joinsAtBooks !== undefined && shelvedCount(s) >= d.joinsAtBooks && !flags[`movedIn:${d.id}`]) {
      flags[`movedIn:${d.id}`] = 1
      scenes.push(`movedIn:${d.id}`)
    }
  const present = neighborsOfDay(day, content, level, flags)
  const visitor = clock.minute >= VISIT_TO ? null : pickVisitor(day, s.hearts, flags, present)
  if (visitor) flags[`visitDay:${visitor}`] = day
  let gathering = planGathering(day, level, flags)
  // ── 복음서 방 완성 잔치: 네 권을 다 꽂고 처음 잠든 다음 날 (한 번). 그다음 밤부터는 잔치가 지난 것 ──
  // 아기 잔치 날(정해진 날)이나 마을 행사(수확·모닥불) 저녁과 겹치면 하루 미룬다 — 저녁 모임이 한 저녁에 겹치지 않게
  if (flags.gospelFeast === 1) flags.gospelFeast = 2
  else if (!flags.gospelFeast && gospelRoomFull(s) && gathering !== 'babyParty' && !festivalOf(day)) {
    flags.gospelFeast = 1
    scenes.push('gospelFeast')
    // 잔치 저녁에는 별 보는 밤을 잡지 않는다 (다른 맑은 날에 다시 잡힌다)
    if (gathering === 'starNight') gathering = null
  }
  // ── 여정을 다 이은 다음 날 아침: 호숫가 나루에 큰 배가 들어온다 (한 번) ──
  if (flags.actsShip === 1) {
    flags.actsShip = 2
    scenes.push('actsShip')
  }
  // ── 서고의 다음 방: 앞 방의 책이 모두 꽂힌 날 밤 → 다음 날 아침 열린다 (사도행전 방 다음부터, 방 표 순서) ──
  // 콘텐츠가 없는 방(계획 8·9 전의 히브리서–유다서·요한계시록)은 표식을 세우지 않는다 — 책이 들어온 다음 잠에서 열린다
  for (let i = 2; i < SHELF_ROOMS.length; i++) {
    const prev = SHELF_ROOMS[i - 1]
    const room = SHELF_ROOMS[i]
    if (roomOpen(room.id, flags)) continue
    const prevFull = prev.books.length > 0 && prev.books.every((b) => s.shelved[b] !== undefined)
    const hasContent = content.pieces.some((p) => room.books.includes(p.book))
    if (prevFull && hasContent) {
      flags[`room:${room.id}`] = 1
      scenes.push(`roomOpen:${room.id}`)
    }
  }
  if (gathering) scenes.push(`notice:${gathering}`)
  // 저녁 모임(아기 잔치·별 보는 밤·복음서 방 잔치)이 있는 날은 저녁 초대를 하지 않는다
  const eveningBusy = gathering === 'babyParty' || gathering === 'starNight' || flags.gospelFeast === 1
  const inviter = eveningBusy ? null : pickInviter(day, s.hearts, flags)
  if (inviter) {
    flags[`inviteDay:${inviter}`] = day
    scenes.push(`invite:${inviter}`)
  }
  const today: Today = { visitor, visitGot: false, inviter, dined: false, gathering }
  const next: GameState = {
    ...s,
    today,
    clock,
    needs,
    journal: [...s.journal, { day: s.clock.day, heard: s.todayHeard, notes: s.todayNotes }],
    todayHeard: [],
    todayNotes: [],
    talked: [],
    helped: [],
    gifted: [],
    offers: todaysOffers(day, s.collected, s, content, present),
    // 새 날의 편지 — 편지 나르는 이웃이 오늘 나오지 않으면 빈 채로
    post: todaysPost(day, { ...s, listened: [] }, content, present),
    listened: [],
    garden: growGarden(s.garden, s.clock.day),
    player: { ...s.player, x: bed.x, y: bed.y, path: [], facing: 'down' },
    target: null,
    // 일어나면 먼저 기지개
    idle: { seconds: 0, action: { kind: 'stretch', left: DURATION.stretch }, cooldown: IDLE_GAP },
    scenes,
    flags,
    homeLevel,
    room,
    inv,
  }
  return { ...next, npcs: placeAllNpcs(next, content) }
}

/** 장면을 본 뒤: 앨범과 오늘의 일지에 남긴다 */
export function sceneSeen(s: GameState, id: string, albumIds: readonly string[]): GameState {
  const scenes = s.scenes.filter((x) => x !== id)
  const inAlbum = albumIds.includes(id) && !s.album.some((a) => a.id === id)
  return {
    ...s,
    scenes,
    album: inAlbum ? [...s.album, { id, day: s.clock.day }] : s.album,
    todayNotes: s.todayNotes.includes(id) ? s.todayNotes : [...s.todayNotes, id],
  }
}

/** 나의 한 줄의 책 키 (조각 키는 조각 id 그대로) */
export function bookLineKey(book: Book): string {
  return `book:${book}`
}

/** key: 조각 id 또는 bookLineKey(책). 플레이어의 말이라 금지어 검사 대상이 아니다 */
export function setMyLine(s: GameState, key: string, text: string): GameState {
  const t = text.replace(/\s+/g, ' ').trim().slice(0, 80)
  const myLines = { ...s.myLines }
  if (t) myLines[key] = t
  else delete myLines[key]
  return { ...s, myLines }
}

// ── 방 꾸미기 (규칙은 room.ts) ──

export function placeFurniture(s: GameState, item: ItemId, t: Tile): GameState | null {
  syncHome(s)
  const f = placement(s.room, item, t)
  if (!f) return null
  const left = take(s.inv, { [item]: 1 })
  if (!left) return null
  return { ...s, inv: left, room: [...s.room, f] }
}

/** 치운 가구는 가방으로 (넘치면 치우지 않는다) */
export function removeFurniture(s: GameState, t: Tile): GameState {
  const gone = removal(s.room, t)
  if (!gone.length) return s
  const back: Partial<Record<ItemId, number>> = {}
  for (const f of gone) back[f.item] = (back[f.item] ?? 0) + 1
  if (wouldOverflow(s.inv, back)) return s
  return { ...s, room: s.room.filter((f) => !gone.includes(f)), inv: add(s.inv, back) }
}

// ── 집 넓히기 (목수에게 부탁 — 설계 §7-1: 방 하나 더 → 다락 서재) ──

export interface HomeStage {
  level: 1 | 2
  coins: number
  needs: Partial<Record<ItemId, number>>
}
export const HOME_STAGES: readonly HomeStage[] = [
  { level: 1, coins: 120, needs: { olive: 5 } },
  { level: 2, coins: 200, needs: { papyrus: 5 } },
]

/** 다음에 부탁할 단계 (다 지었으면 null) */
export function nextHomeStage(s: Pick<GameState, 'homeLevel'>): HomeStage | null {
  return HOME_STAGES.find((st) => st.level === (s.homeLevel ?? 0) + 1) ?? null
}

export type HomeOrderBlock = 'done' | 'notMoved' | 'ordered' | 'coins' | 'needs' | null
export function canOrderHome(s: GameState): HomeOrderBlock {
  const st = nextHomeStage(s)
  if (!st) return 'done'
  if (!s.flags['movedIn:carpenter']) return 'notMoved'
  if (s.flags.homeOrder) return 'ordered'
  if (s.coins < st.coins) return 'coins'
  if (!has(s.inv, st.needs)) return 'needs'
  return null
}

/** 목수에게 다음 단계를 부탁한다 (닢과 재료를 내고, 다음 날 아침 지어진다) */
export function orderHome(s: GameState): GameState | null {
  const st = nextHomeStage(s)
  if (!st || canOrderHome(s)) return null
  return { ...s, coins: s.coins - st.coins, inv: take(s.inv, st.needs)!, flags: { ...s.flags, homeOrder: st.level } }
}
