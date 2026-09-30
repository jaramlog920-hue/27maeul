// 게임 상태와 규칙의 조합. 순수 함수만 — 화면과 저장은 바깥(store)이 맡는다.
import { festivalOf, FESTIVAL_FROM, FESTIVAL_TO, isMarketDay, isWet, weatherOf, barleyRipe, grapesRipe } from './calendar'
import { advance, newClock, phaseOf, seasonOf, sleepClock, type Clock } from './clock'
import { DURATION, greet, IDLE_GAP, IDLE_RESET, stepIdle, type IdleState } from './autonomy'
import { adopt, companionGoal, STRAY_DAY, STRAY_SPOTS, stepCompanion, type Animal, type Companion } from './companion'
import { add, addGift, CHAPTER_COST, FOODS, count, has, RECIPES, recipeGives, stackCap, take, TOOLS, type Inventory, type RecipeId } from './items'
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
  STARS_FROM,
  unlocked,
  villageLevel,
  VISIT_FROM,
  VISIT_GIFTS,
  VISIT_SPOT,
  VISIT_TO,
  type Gathering,
} from './bonds'
import { COVER_FROM, jobOf, SELL_FROM } from './job'
import { FESTIVAL_SPOTS, FIRE, goalFor, isNear, npcTile, placeNpc, stepNpc, type Npc } from './neighbors'
import { GAIN, heartsOf, MAX_POINTS } from './hearts'
import { bookDone, bookRoomOpen, emptyProgress, openDoorsFor, roomOpen, totalChapters, type Progress } from './books'
import { arrivesOf, modeOf, SHELF_ROOMS } from './shelf-rooms'
import { currentChapter, offersForDay } from './offers'
import { addXp, charmBonus, freshStats, luckyExtra, rainBonus, sellBonus, tiredScale, visitBonus, XP, type StatId, type Stats } from './stats'
import { HALL_GUESTS, HALL_PLAY_GAIN, HALL_PLAY_MINUTES, HALL_SPOTS, hallGuests, hallOpen, SUNSET_MINUTES, sunsetTime, TEA_MINUTES, TEA_PRICE, teaOpen } from './places'
import {
  BOUQUET_GAIN,
  BOUQUET_HEARTS,
  CORD_GAIN,
  CORD_HEARTS,
  DATE_GAIN,
  DATE_TEA_PRICE,
  DATING_DAYS,
  isCandidateId,
  nextMarketAfter,
  NO_ROMANCE,
  SPOUSE_HOME_FROM,
  SPOUSE_HOME_TO,
  SPOUSE_SPOT,
  STORY_HEARTS,
  WEDDING_SPOT,
  type Romance,
} from './romance'
import {
  allSightings,
  depthOf,
  hasMemory,
  NO_LIFE,
  personOf,
  peopleData,
  pickLine,
  RECENT_KEEP,
  reqMet,
  routineNow,
  STAGE_POINTS,
  stageOfPoints,
  whenMatches,
  type Life,
  type Moment,
  type Person,
  type PersonEvent,
  type Routine,
  type Stage,
} from './people'
import { CAREFUL_AT, careScore, fixtureTier, FIXTURE_STEPS, lampNightsPerOil, nextFixture, type FixtureLine, type FixtureStep } from './fixtures'
import { POSTMAN, postForDay, starPostFor } from './post'
import { blanksFor } from './copy'
import { checkArrangement, moveItem, type ArrangeResult } from './scroll'
import { cardsForChapters, journeyComplete, placeNewCards, type JourneyCard } from './journey'
import { growGarden, type Plot } from './garden'
import { allFeastReady, feastToday, gospelRoomFull, readOff, type Grade } from './library'
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
import { ATTIC, BED_STAND, HEARTH_STAND, HOME_FRONT, inAttic, isHome, isIndoor, isWalkable, key, LADDER, LOCKED_DOORS, lockedTiles, PLACES, placeAt, roomAt, sameTile, setHomeLevel, setMailbox, setOpenDoors, START, tileAt, WARPS } from './world'
import { GOSPELS, type Book, type Facing, type GameContent, type ItemId, type NeighborDef, type PlaceId, type Rng, type Target, type Tile } from './types'
import type { Avatar } from './avatar'
import { CARPENTER_WORKS, fromChest, hasStock, HOME_MAILBOX, INK_JAR_HOLD, LIGHT_SHOES, owns, RACK_HOLD, RACK_PAPYRUS, RAIN_WATER, SOOT_CATCH, stash, stashOverflows, stock, takeStock, walkMul, type CarpenterWork, type EasyId } from './easier'

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
  /**
   * 요한계시록 방의 일곱 교회 판 (계획 9 작업 3): 놓인 카드 번호(churches.json의 order)의 차례. 2·3장을 옮겨 적으면 카드가 들어온다.
   * 다 맞추면 flags.churchesDone 1 (한 번, 장면 없음 — 스물일곱 권 잔치의 조건)
   */
  churches: number[]
  /** 재료 궤짝 (계획 11 작업 1): 가방이 차면 남는 재료가 들어가고, 책상·작업대가 꺼내 쓴다. 궤짝이 없으면 비어 있다 */
  chest: Inventory
  /** 능력치 다섯 (계획 11 작업 4): 지능·손재주·매력·근력·운 — 단계·경험치·타고난 값 */
  stats: Stats
  /** 연애와 결혼 (계획 6): 연인·약혼자·배우자 한 명 */
  romance: Romance
  /** 살아 움직이는 사람들 (계획 6b): 본 장면·기억·관계의 색·최근 말·서먹함·약속 */
  life: Life
  /** 살림과 서고 (계획 13): 책마다 정성 들인 장 번호 */
  careful: Record<string, number[]>
  /** 봉인용 밀랍으로 봉인한 책 */
  sealed: string[]
}

/** 지도(world.tileAt)가 이 게임의 집 단계·열린 서고 방 문(방 표)을 보게 한다. 지도를 읽는 엔진 입구마다 부른다 */
export function syncHome(s: Pick<GameState, 'homeLevel'> & Partial<Pick<GameState, 'flags'>>): void {
  setHomeLevel(s.homeLevel ?? 0)
  setOpenDoors(openDoorsFor(s.flags ?? {}))
  setMailbox(owns(s.flags ?? {}, 'homeMailbox'))
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
  /** 지킨 약속 (계획 6b) */
  | { type: 'promiseKept'; npc: string }

// ── 만들기 ──

function defsById(content: GameContent): Record<string, NeighborDef> {
  return Object.fromEntries(content.neighbors.map((n) => [n.id, n]))
}

type GoalState = Pick<GameState, 'clock' | 'flags' | 'progress' | 'hearts' | 'today' | 'shelved'> & Partial<Pick<GameState, 'romance' | 'homeLevel' | 'life' | 'avatar'>>

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
  (d.joinsAt !== undefined && level < d.joinsAt) ||
  (d.joinsAtBooks !== undefined && !flags[`movedIn:${d.id}`]) ||
  (!!d.joinsWithFamily && !!d.family && !flags[`movedIn:${d.family}`])

function goalContext(s: GoalState, content: GameContent) {
  rememberDefs(content)
  const w = weatherOf(s.clock.day)
  const m = s.clock.minute
  const special: Record<string, Tile | null> = {}
  // 아직 이사 오지 않은 이웃은 보이지 않는다 — 소개 장면이 나오는 새 날 아침부터 (잠들 때 정한 단계)
  const level = s.flags.villageLevel ?? 0
  for (const d of content.neighbors) if (notYet(d, level, s.flags)) special[d.id] = null
  // 이사 오지 않은 이웃만 따로 기억한다 (아래에서 일과 자리를 넣어도 '이사 옴'은 그대로)
  const notJoined = new Set(Object.keys(special))
  const joined = (id: string) => !notJoined.has(id)
  // 살아 움직이는 사람들 (계획 6b): 이벤트 자리 > 목격 자리 > 일과 (아래 잔치·모임·사랑방이 덮는다).
  // 아직 열리지 않은 구역(나루·벌통 들…) 안의 자리는 건너뛰고 시간표로 (goalFor가 열린 자리를 고른다)
  const lockedNow = lockedTiles(shelvedCount(s))
  for (const d of content.neighbors) if (joined(d.id)) {
    const at = personSpot(s, d.id)
    if (at && !lockedNow.has(key(at))) special[d.id] = at
  }
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
  // 배우자 (계획 6): 저녁 일곱 시부터 아침 일곱 시까지 내 집 넓힌 방에서 지낸다 (잔치·모임이 있으면 아래에서 그쪽으로)
  const r = s.romance ?? NO_ROMANCE
  if (r.stage === 'married' && r.partner && (m >= SPOUSE_HOME_FROM || m < SPOUSE_HOME_TO)) special[r.partner] = SPOUSE_SPOT
  // 마을 사랑방 (계획 10): 모임·잔치·저녁 초대가 없는 저녁, 이웃 셋이 긴 탁자 둘레에 모인다 (비 와도 — 집 안이라)
  if (hallOpen(m)) hallGuestsToday(s, content).forEach((id, i) => (special[id] = HALL_SPOTS[i]))
  // 복음서 방 잔치 저녁: 이사 온 이웃은 모두(상인도) 광장 모닥불 둘레로 — 비가 와도 연다
  if (feastToday(s) && m >= FESTIVAL_FROM && m < FESTIVAL_TO)
    for (const [id, spot] of Object.entries(FESTIVAL_SPOTS)) if (joined(id)) special[id] = spot
  // 결혼 잔치 저녁 (계획 6): 이사 온 이웃은 모두 광장 모닥불 둘레로, 약혼자는 모닥불 바로 위 — 비가 와도 연다
  if (weddingToday(s) && m >= FESTIVAL_FROM && m < FESTIVAL_TO) {
    for (const [id, spot] of Object.entries(FESTIVAL_SPOTS)) if (joined(id)) special[id] = spot
    special[r.partner!] = WEDDING_SPOT
  }
  return {
    minute: s.clock.minute,
    wet: isWet(w),
    market: isMarketDay(s.clock.day),
    festival: festivalOf(s.clock.day) !== null && !isWet(w),
    special,
    locked: lockedTiles(shelvedCount(s)),
  }
}

/**
 * 오늘 저녁 사랑방에 모이는 이웃 (계획 10). 마을 잔치·이웃 모임·복음서 방 잔치 날 저녁은 모두 그쪽에 가므로 없다.
 * 이사 온 이웃 중에서 (상인·아이 빼고) 날 씨앗으로 셋, 오늘 저녁 초대한 이웃은 제 집에 있으니 뺀다
 */
export function hallGuestsToday(s: GoalState, content: GameContent): string[] {
  const t = s.today ?? NO_TODAY
  if (festivalOf(s.clock.day) || feastToday(s) || weddingToday(s) || t.gathering === 'babyParty' || t.gathering === 'starNight') return []
  const level = s.flags.villageLevel ?? 0
  const joined = content.neighbors.filter((d) => !d.marketOnly && !notYet(d, level, s.flags)).map((d) => d.id)
  // 배우자는 저녁에 집에 있다
  const spouse = s.romance?.stage === 'married' ? s.romance.partner : null
  return hallGuests(s.clock.day, joined.filter((id) => id !== t.inviter && id !== spouse)).slice(0, HALL_GUESTS)
}

/** 오늘 저녁 아이가 글자를 배우러 오는가 */
export function lessonTime(s: Pick<GameState, 'clock' | 'flags'> & { today?: Today }): boolean {
  const m = s.clock.minute
  return (
    (s.flags.childAsked ?? 0) > 0 &&
    (s.flags.childLetters ?? 0) < LETTERS_TOTAL &&
    s.flags.taughtDay !== s.clock.day &&
    !isWet(weatherOf(s.clock.day)) &&
    // 잔치 날 저녁에는 아이도 모닥불 곁에 있다 (복음서 방·스물일곱 권 잔치 날도)
    !festivalOf(s.clock.day) &&
    !feastToday(s) &&
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
  // 이야기 조각은 마을 이웃이 건넨다 — 연애 후보(계획 6)는 건네지 않는다 (필사 흐름의 빠르기가 바뀌지 않게)
  const tellers = npcs.filter((id) => !content.neighbors.find((d) => d.id === id)?.romanceable)
  return offersForDay({ day, pieces, collected, chapter: currentChapter(pieces, s.progress[s.activeBook].completed), neighborIds: tellers })
}

/**
 * 오늘 편지 나르는 이웃이 가져올 편지: 지금 책이 편지 책이고, 그 이웃이 오늘 나와 있고(present), 오늘 아직 건네지 않았을 때
 * (listened — 책을 바꿔도 같은 날 또 받지 않는다). 다른 이웃은 편지를 건네지 않는다.
 * 요한계시록(arrives 'stars')은 낮에 건네지 않는다 — 언덕 편지함에서 맑은 밤에 꺼낸다 (stargaze)
 * 집 앞 편지함이 섰으면 그 이웃이 나오지 않는 날(궂은 날 등)에도 편지함에 넣어 둔다 (계획 11 작업 3)
 */
function todaysPost(day: number, s: Pick<GameState, 'activeBook' | 'collected' | 'listened' | 'flags'>, content: GameContent, present: string[]): string[] {
  const book = s.activeBook
  if (!book || modeOf(book) !== 'letters' || arrivesOf(book) !== 'post') return []
  if (s.listened.includes(POSTMAN)) return []
  if (!present.includes(POSTMAN) && !owns(s.flags, 'homeMailbox')) return []
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
  // homeRoom: 집 안이 지도 아래 따로 된 방이라는 표식 (그 전 저장은 불러올 때 자리를 옮긴다 — save.ts)
  const flags: Record<string, number> = { heartPoints: 1, homeRoom: 1 }
  const progress = emptyProgress()
  const base = { clock, flags, progress, hearts: {}, today: NO_TODAY, shelved: {} }
  // 새 게임은 넓히기 전 집 — 지도(모듈 전역 집 단계)도 0으로, 서고의 방 문은 모두 닫힌 채
  setHomeLevel(0)
  setOpenDoors([])
  setMailbox(false)
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
    churches: [],
    chest: {},
    stats: freshStats(),
    romance: NO_ROMANCE,
    life: NO_LIFE,
    careful: {},
    sealed: [],
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
  // (방·다락·내 집 안은 마을과 이어지지 않으므로 걸을 수 있기만 하면 된다)
  const stuck = (t: Tile) => !isWalkable(t) || (!roomAt(t) && !inAttic(t) && !isHome(t) && findPath(t, HOME_FRONT) === null)
  let player = { ...s.player, path: [] as Tile[] }
  if (stuck(playerTile(s))) player = { ...player, x: HOME_FRONT.x, y: HOME_FRONT.y, facing: 'down', walkTime: 0 }
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

/**
 * 조이스틱 가운데 단추: 바라보는 앞 칸에 누를 것(이웃·장소·문·잠긴 문)이 있으면 그 칸,
 * 없으면 서 있는 칸. 돌려준 칸은 화면에서 그 칸을 누른 것과 똑같이 처리한다(tap).
 */
export function pressTile(s: GameState): Tile {
  syncHome(s)
  const here = playerTile(s)
  const f = FRONT[s.player.facing]
  const front = { x: here.x + f.x, y: here.y + f.y }
  return interactableAt(s, front) || LOCKED_DOORS.some((d) => sameTile(d, front)) ? front : here
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
  return { ...player, x: to.x, y: to.y, path: [], facing: roomAt(to) || inAttic(to) || isHome(to) ? 'up' : 'down' }
}

/**
 * 문을 건너온 기록자 곁에 동물을 둘 칸: 위·왼쪽·오른쪽·아래 차례로, 문·문깔개(WARPS) 칸은 피한다
 * (문깔개에 세우면 동물이 다시 밖으로 나가는 문 위에 서 있게 된다)
 */
function besideNotDoor(t: Tile): Tile | null {
  for (const d of [FRONT.up, FRONT.left, FRONT.right, FRONT.down]) {
    const n = { x: t.x + d.x, y: t.y + d.y }
    if (isWalkable(n) && !WARPS.has(key(n))) return n
  }
  return null
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

  // 기록자 — 신을 신으면 빨리 걷는다(×1.2·×1.4). 걸음 그림(walkTime)도 같은 배수로 흘러 발이 미끄러지지 않는다
  const moving = s.player.path.length > 0
  const pace = walkMul(s.inv)
  let player = stepActor(s.player, (starving(needs) ? dt * 0.7 : dt) * pace).actor
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
    // 내 집 문을 드나들면 동물도 함께 (집 안은 지도 아래 따로 된 방이라 걸어서는 못 따라온다)
    const homeWarp = warp && (isHome(warp) || isHome(now))
    const near = homeWarp ? besideNotDoor(warp) : null
    if (near) companion = { ...companion, x: near.x, y: near.y, path: [] }
    // 동물도 신의 배수만큼 빨리 — 늘 기록자보다 조금 빠르게 따라온다
    else companion = stepCompanion(companion, companionGoal(now, rainOut), dt * pace)
  }

  const idle = moving ? IDLE_RESET : stepIdle(s.idle, dt, clock.minute, rng, totalChapters(s) >= 3)
  const lived = liveNearby({ ...s, clock, needs, player, target, idle, npcs, companion, trails }, now, events)
  if (lived.scenes.length > s.scenes.length) return { state: lived, events }
  const next: GameState = lived

  // 결혼 잔치 (계획 6): 약혼한 다음 장날 저녁, 광장 모닥불 둘레에 오면 잔치가 열리고 부부가 된다
  if (weddingToday(next) && clock.minute >= FESTIVAL_FROM && clock.minute < FESTIVAL_TO && atWeddingFire(now)) {
    events.push({ type: 'moment', id: `wedding:${next.romance.partner}` })
    return { state: train(marry(next), 'luck', XP.festival), events }
  }
  const g = (s.today ?? NO_TODAY).gathering
  if (g && !s.flags[`done:${g}`] && inGathering(g, clock.minute, now)) {
    events.push({ type: 'moment', id: g })
    // 이웃 모임에 함께하면 운이 조금 (계획 11 작업 4)
    return { state: train({ ...next, scenes: [...next.scenes, g], flags: { ...next.flags, [`done:${g}`]: 1 } }, 'luck', XP.festival), events }
  }
  const m = momentNow({ day: clock.day, minute: clock.minute, outdoors: !isIndoor(now), player: now, flags: s.flags })
  if (m && !next.scenes.includes(m)) {
    events.push({ type: 'moment', id: m })
    const seen = { ...next, scenes: [...next.scenes, m], flags: { ...next.flags, [onceKey(m, clock.day)]: 1 } }
    // 마을 잔치에 함께하면 운이 조금 (계획 11 작업 4)
    return { state: m.startsWith('festival:') ? train(seen, 'luck', XP.festival) : seen, events }
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
// ── 살아 움직이는 사람들 (계획 6b, 판단은 people.ts) ──

export function momentOf(s: Pick<GameState, 'clock'>): Moment {
  return { day: s.clock.day, minute: s.clock.minute, weather: weatherOf(s.clock.day), season: seasonOf(s.clock.day) }
}

/** 이 사람과의 사이 단계 (0 낯선 사람 … 5 연애 가능) */
export function stageWith(s: Pick<GameState, 'hearts'>, id: string): Stage {
  return stageOfPoints(s.hearts[id] ?? 0)
}

function reqCtx(s: GoalState, npc: string) {
  const r = s.romance ?? NO_ROMANCE
  const def = CONTENT_DEFS.get(npc)
  return {
    life: s.life ?? NO_LIFE,
    npc,
    day: s.clock.day,
    lover: r.partner === npc && !!r.stage,
    suitor: !!def?.romanceable && !!def.look && def.look !== (s.avatar?.look ?? 'f'),
    threads: peopleData().threads,
  }
}
/** 이웃 정의 (people 판단이 모습·후보 여부를 볼 때) — newGame·settle 때 채운다 */
const CONTENT_DEFS = new Map<string, NeighborDef>()
function rememberDefs(content: GameContent) {
  if (CONTENT_DEFS.size !== content.neighbors.length) for (const d of content.neighbors) CONTENT_DEFS.set(d.id, d)
}

/** 지금 열릴 수 있는 이 사람의 이벤트 (조건이 맞고 아직 안 본 것 — 먼저 적힌 것부터) */
export function eventNow(s: GoalState, npc: string): PersonEvent | null {
  const p = personOf(npc)
  if (!p?.events) return null
  const life = s.life ?? NO_LIFE
  const ctx = reqCtx(s, npc)
  const m = momentOf(s)
  const stage = stageWith(s, npc)
  return p.events.find((e) => !life.seen.includes(e.id) && stage >= e.stage && whenMatches(e.when, m) && reqMet(e.req, ctx) && (!e.confess || ctx.suitor)) ?? null
}

/** 지금 벌어지는 목격 장면 (플레이어가 보든 안 보든 그 사람은 그 자리에 간다) */
function sightingNow(s: GoalState, npc: string) {
  const life = s.life ?? NO_LIFE
  const m = momentOf(s)
  const ctx = reqCtx(s, npc)
  const stage = stageWith(s, npc)
  return allSightings().find(
    (x) =>
      x.npc === npc &&
      !life.seen.includes(x.id) &&
      (x.stage === undefined || stage >= x.stage) &&
      (x.thread === undefined || threadPhaseOf(x.thread) === x.phase) &&
      whenMatches(x.when, m) &&
      reqMet(x.req, ctx),
  )
  function threadPhaseOf(id: string) {
    const t = peopleData().threads.find((t) => t.id === id)
    if (!t) return -9
    let at = -1
    t.phases.forEach((p, i) => {
      if (s.clock.day >= p.day) at = i
    })
    return s.clock.day >= t.end ? t.phases.length : at
  }
}

/** 지금 이 사람의 일과 */
export function routineOf(s: GoalState, npc: string): Routine | null {
  const p = personOf(npc)
  return p ? routineNow(p, momentOf(s), peopleData().threads) : null
}

/** 이 사람이 지금 가 있을 곳 (없으면 neighbors.json 시간표) */
function personSpot(s: GoalState, npc: string): Tile | null {
  const e = eventNow(s, npc)
  if (e) return e.at
  const w = sightingNow(s, npc)
  if (w) return w.at
  return routineOf(s, npc)?.at ?? null
}

const near = (a: Tile, b: Tile, d: number) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= d
const sameArea = (a: Tile, b: Tile) => roomAt(a) === roomAt(b) && isHome(a) === isHome(b)

function remember(life: Life, npc: string, tag: string, s: Pick<GameState, 'clock'>): Life {
  if (hasMemory(life, npc, tag)) return life
  const m = momentOf(s)
  return { ...life, memories: { ...life.memories, [npc]: [...(life.memories[npc] ?? []), { tag, day: m.day, weather: m.weather, season: m.season }] } }
}

/**
 * 가까이 있는 사람들의 삶: 이벤트(그 사람이 그 자리에 와 있고 플레이어가 곁에 오면), 목격(모르는 사이에 보게 되는 장면),
 * 혼잣말(가까이 지나가면 하루 한 번), 약속(그 시각 그 자리에 오면 지킨 것)
 */
function liveNearby(s: GameState, now: Tile, events: GameEvent[]): GameState {
  let life = s.life ?? NO_LIFE
  let next = s
  if (life.mutterDay !== s.clock.day) life = { ...life, mutterDay: s.clock.day, muttered: [] }
  for (const [id, n] of Object.entries(s.npcs)) {
    if (!n.visible) continue
    const at = npcTile(n)
    if (!sameArea(at, now)) continue
    const e = eventNow({ ...s, life }, id)
    if (e && near(at, e.at, 1) && near(now, e.at, 3)) {
      life = { ...life, seen: [...life.seen, e.id] }
      next = { ...next, life, scenes: [...next.scenes, `ev:${e.id}`] }
      if (e.gain) next = heartUp(next, id, e.gain)
      if (e.cool) next = { ...next, life: { ...next.life, cool: { ...next.life.cool, [id]: s.clock.day + e.cool } } }
      events.push({ type: 'moment', id: `ev:${e.id}` })
      return next
    }
    const w = sightingNow({ ...s, life }, id)
    if (w && near(at, w.at, 1) && near(now, w.at, 4)) {
      life = remember({ ...life, seen: [...life.seen, w.id] }, id, w.memory, s)
      events.push({ type: 'moment', id: `saw:${w.id}` })
      return { ...next, life, scenes: [...next.scenes, `saw:${w.id}`] }
    }
    const r = routineOf({ ...s, life }, id)
    // 무언가 하러 가는 길(target)에는 혼잣말을 흘려듣는다 — 도착 알림이 먼저
    if (r?.mutter?.length && !s.target && near(at, r.at, 0) && near(now, at, 2) && !life.muttered.includes(id)) {
      const text = r.mutter[Math.floor((((s.clock.day * 7 + id.length) % 97) / 97) * r.mutter.length)]
      life = { ...life, muttered: [...life.muttered, id], heard: { npc: id, text } }
    }
  }
  // 약속: 그날 그 시각 그 자리에 오면 지킨 것
  const kept = life.promises.find((p) => p.day === s.clock.day && s.clock.minute >= p.from && s.clock.minute < p.to && near(now, p.at, 2))
  if (kept) {
    life = remember({ ...life, promises: life.promises.filter((p) => p !== kept) }, kept.npc, `kept:${kept.id}`, s)
    next = heartUp({ ...next, life }, kept.npc, PROMISE_GAIN)
    events.push({ type: 'promiseKept', npc: kept.npc })
    return next
  }
  return life === s.life ? next : { ...next, life }
}
export const PROMISE_GAIN = 4
/** 잊은 약속: 며칠 서먹 (영영 닫히지 않는다) */
export const FORGOT_COOL = 3

/** 잠든 사이 지난 약속은 잊은 것 — 기억과 며칠의 서먹함 */
function forgetPromises(s: GameState, day: number): GameState {
  let life = s.life ?? NO_LIFE
  for (const p of life.promises.filter((p) => p.day < day)) {
    life = remember(life, p.npc, `forgot:${p.id}`, s)
    life = { ...life, cool: { ...life.cool, [p.npc]: day + FORGOT_COOL } }
  }
  return { ...s, life: { ...life, promises: life.promises.filter((p) => p.day >= day) } }
}

/** 이벤트에서 고른 말 (정답 없음): 기억·관계의 색·약속, 연애 시작 이벤트면 연인 (고르지 않고 닫아도 이벤트는 본 것) */
export function chooseInEvent(s: GameState, eventId: string, index: number): GameState {
  for (const p of Object.values(peopleData().people)) {
    const e = p.events?.find((x) => x.id === eventId)
    if (!e) continue
    const c = e.choices?.[index]
    if (!c) return s
    let life = s.life ?? NO_LIFE
    life = { ...life, colors: { ...life.colors, [p.id]: { ...life.colors[p.id], [c.color]: (life.colors[p.id]?.[c.color] ?? 0) + 1 } } }
    if (c.memory) life = remember(life, p.id, c.memory, s)
    if (c.promise) life = { ...life, promises: [...life.promises, { id: c.promise.id, npc: p.id, day: s.clock.day + 1, at: c.promise.at, from: c.promise.from, to: c.promise.to }] }
    let next: GameState = { ...s, life }
    if (e.confess && !s.romance?.partner && reqCtx(s, p.id).suitor) {
      next = { ...next, romance: { ...NO_ROMANCE, partner: p.id, stage: 'dating', since: s.clock.day }, flags: { ...next.flags, 'unlock:dating': 1 } }
    }
    return next
  }
  return s
}

/** 말 걸 때 저절로 남는 기억: 비 오는 날 함께 있었던 일 (아는 사이부터) */
function greetMemories(s: GameState, id: string): GameState {
  if (!personOf(id) || stageWith(s, id) < 1) return s
  if (isWet(weatherOf(s.clock.day))) return { ...s, life: remember(s.life ?? NO_LIFE, id, 'rain', s) }
  return s
}

/** 지금 이 사람이 할 말 (people.json의 말 풀). 말 풀이 없거나 맞는 말이 없으면 null — 예전 대사로 */
export function personLine(s: GameState, id: string, rnd: number): { state: GameState; text: string } | null {
  const p = personOf(id)
  if (!p) return null
  const life = s.life ?? NO_LIFE
  const ctx = reqCtx(s, id)
  const cool = (life.cool[id] ?? 0) >= s.clock.day
  const line = pickLine(p, { ...ctx, m: momentOf(s), depth: depthOf(stageWith(s, id), ctx.lover), cool, here: playerTile(s) }, rnd)
  if (!line) return null
  const recent = [...(life.recent[id] ?? []).filter((x) => x !== line.id), line.id].slice(-RECENT_KEEP)
  return { state: { ...s, life: { ...life, recent: { ...life.recent, [id]: recent } } }, text: line.text }
}

/** 마음 점수의 문턱: 다음 사이로 넘어가려면 그 사람의 이벤트(opens)를 겪어야 한다 — 점수는 그 문턱 바로 아래에서 멈춘다 */
function gateCap(s: GameState, p: Person): number {
  const life = s.life ?? NO_LIFE
  for (const st of [1, 2, 3, 4, 5] as Stage[]) {
    // 한 문턱에 이벤트가 여럿이면(목격했는지에 따라 갈래가 다른 것) 그중 하나만 겪으면 된다
    const gates = p.events?.filter((e) => e.opens === st) ?? []
    if (gates.length && !gates.some((e) => life.seen.includes(e.id))) return STAGE_POINTS[st] - 1
  }
  return MAX_POINTS
}

function heartUp(s: GameState, id: string, points: number): GameState {
  const p = personOf(id)
  if (p && points > 0) {
    // 사람마다 마음이 열리는 빠르기, 서먹할 땐 반만, 문턱에서 멈춘다
    const cool = (s.life?.cool[id] ?? 0) >= s.clock.day ? 0.5 : 1
    const scaled = Math.max(1, Math.round(points * p.pace * cool))
    const room = Math.max(0, gateCap(s, p) - (s.hearts[id] ?? 0))
    return heartUpRaw(s, id, Math.min(scaled, room))
  }
  return heartUpRaw(s, id, points)
}

function heartUpRaw(s: GameState, id: string, points: number): GameState {
  const beforePts = s.hearts[id] ?? 0
  // 매력 단계만큼 조금 더 (3단계 +1점, 5단계 +2점)
  const afterPts = Math.min(MAX_POINTS, beforePts + points + (points > 0 ? charmBonus(s.stats) : 0))
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
  // 가벼운 신 (계획 11 작업 2): 장날 튼튼한 신을 산 뒤, 양치기와 마음 5 — 마음이 오를 때(인사·돕기·선물) 한 번
  if (id === LIGHT_SHOES.npc && after >= LIGHT_SHOES.hearts && count(next.inv, 'sturdyShoes') > 0 && count(next.inv, 'lightShoes') === 0) {
    next = {
      ...next,
      inv: addGift(next.inv, { lightShoes: 1 }),
      giftsGot: next.giftsGot.includes('lightShoes') ? next.giftsGot : [...next.giftsGot, 'lightShoes'],
      scenes: [...next.scenes, 'lightShoes'],
    }
  }
  // 연애 후보의 이야기 (계획 6): 마음 4·6이 되면 그 사람의 옛이야기 (같은 모습이면 친구로 듣는다) — 한 번씩
  if (isCandidateId(id))
    STORY_HEARTS.forEach((h, i) => {
      const key = `romance${i + 1}:${id}`
      if (after >= h && !next.flags[key]) next = { ...next, flags: { ...next.flags, [key]: 1 }, scenes: [...next.scenes, key] }
    })
  // 집 앞 편지함 (계획 11 작업 3): 편지 나르는 이웃과 마음 4 — 한 번
  if (id === HOME_MAILBOX.npc && after >= HOME_MAILBOX.hearts && !owns(next.flags, 'homeMailbox')) {
    next = { ...next, flags: { ...next.flags, 'unlock:homeMailbox': 1 }, scenes: [...next.scenes, 'homeMailbox'] }
  }
  if (id === 'child' && after >= CHILD_ASKS_AT && !next.flags.childAsked) {
    next = { ...next, flags: { ...next.flags, childAsked: 1 }, scenes: [...next.scenes, 'childAsks'] }
  }
  return next
}

/** 말을 걸면 그날 처음 한 번 하트가 오른다 */
export function greetNeighbor(s: GameState, id: string): GameState {
  if (s.talked.includes(id)) return s
  return train(heartUp(greetMemories({ ...s, talked: [...s.talked, id] }, id), id, GAIN.talk), 'charm', XP.greet)
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
    // 이웃 이야기를 들으면 지능이 오른다 (계획 11 작업 4)
    state: train({
      ...s,
      offers,
      collected: [...s.collected, pieceId],
      todayHeard: [...s.todayHeard, pieceId],
      listened: s.listened.includes(neighborId) ? s.listened : [...s.listened, neighborId],
      progress: { ...s.progress, [piece.book]: { ...bp, arrangement: { ...bp.arrangement, [piece.chapter]: [...placed, pieceId] } } },
    }, 'wit', XP.listen),
    pieceId,
    pieceIds: [pieceId],
  }
}

/** 편지 나르는 이웃이 오늘 가져온 편지를 한꺼번에 받는다 (collected·todayHeard에 넣고 post를 비운다) */
function receivePost(s: GameState, content: GameContent): { state: GameState; pieceId: string | null; pieceIds: string[] } {
  const known = new Map(content.pieces.map((p) => [p.id, p]))
  const ids = (s.post ?? []).filter((id) => known.has(id) && !s.collected.includes(id))
  if (!ids.length) return { state: s, pieceId: null, pieceIds: [] }
  const got = takeChapters(s, ids, content)
  return {
    state: { ...got, post: [], listened: s.listened.includes(POSTMAN) ? s.listened : [...s.listened, POSTMAN] },
    pieceId: ids[0],
    pieceIds: ids,
  }
}

/**
 * 집 앞 편지함 (계획 11 작업 3): 편지 나르는 이웃을 찾아가지 않아도 오늘 편지를 꺼낸다.
 * 이웃에게 받는 것과 같은 편지(post)다 — 어느 쪽에서 받든 한 번. 편지함이 없거나 비었으면 pieceIds가 빈다
 */
export function openMailbox(s: GameState, content: GameContent): { state: GameState; pieceIds: string[] } {
  if (!owns(s.flags, 'homeMailbox') || !s.activeBook || modeOf(s.activeBook) !== 'letters') return { state: s, pieceIds: [] }
  const { state, pieceIds } = receivePost(s, content)
  return { state, pieceIds }
}

/** 오늘 집 앞 편지함에 편지가 들어 있는가 (그림·안내용) */
export function mailboxHasPost(s: Pick<GameState, 'flags' | 'post' | 'collected'>): boolean {
  return owns(s.flags, 'homeMailbox') && (s.post ?? []).some((id) => !s.collected.includes(id))
}

/** 받은 장 조각을 collected·todayHeard에 넣는다 (편지 나르는 이웃·언덕 편지함이 함께 쓴다) */
function takeChapters(s: GameState, ids: readonly string[], content: GameContent): GameState {
  const known = new Map(content.pieces.map((p) => [p.id, p]))
  // 책상 순서(arrangement)도 조각과 같게 채워 둔다 — 불러오기(sanitize)가 모은 조각으로 다시 채우는 것과 어긋나지 않게
  let progress = s.progress
  for (const id of ids) {
    const p = known.get(id)!
    const bp = progress[p.book]
    progress = { ...progress, [p.book]: { ...bp, arrangement: { ...bp.arrangement, [p.chapter]: [...(bp.arrangement[p.chapter] ?? []), id] } } }
  }
  return { ...s, collected: [...s.collected, ...ids], todayHeard: [...s.todayHeard, ...ids], progress }
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
  if (overflows({ ...s, inv: paid }, helpReward(def, s.clock.day, s.flags))) return 'full'
  return null
}

export function finishHelp(s: GameState, def: NeighborDef): GameState {
  if (canHelp(s, def)) return s
  const paid = def.help.needs ? take(s.inv, def.help.needs)! : s.inv
  const next = { ...putAway({ ...s, inv: paid }, helpReward(def, s.clock.day, s.flags)), helped: [...s.helped, def.id], needs: toil(s, 8) }
  // 돕기는 마음(매력)과 몸(근력)을 함께 쓴다
  return train(train(heartUp(passTime(next, 30), def.id, GAIN.help), 'charm', XP.help), 'strength', XP.help)
}

/** 선물은 하루에 한 이웃에게 한 번. 좋아하는 것이면 마음이 더 오른다 */
export function giveGift(s: GameState, def: NeighborDef, item: ItemId): { state: GameState; liked: boolean } | null {
  if (s.gifted.includes(def.id)) return null
  const left = take(s.inv, { [item]: 1 })
  if (!left) return null
  const liked = def.likes.includes(item)
  // 싫어하는 것을 건넨 첫날은 기억에 남는다 (나중에 웃음거리가 된다 — 계획 6b)
  const disliked = !!personOf(def.id)?.dislikes?.includes(item)
  const base = disliked ? { ...s, life: remember(s.life ?? NO_LIFE, def.id, 'badGift', s) } : s
  const given = heartUp({ ...base, inv: left, gifted: [...s.gifted, def.id] }, def.id, disliked ? 0 : liked ? GAIN.giftLiked : GAIN.giftPlain)
  return { state: train(given, 'charm', XP.gift), liked }
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
  /** 한 번 사면 계속 쓰는 설치물 (계획 11): flags[`unlock:${grants}`]. 가진 뒤에는 다시 사지 않는다 */
  grants?: EasyId
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
  // 편해지는 살림 (계획 11 작업 1): 빗물 항아리는 집 앞에 놓인다, 잉크 항아리는 그을음 받이를 단 뒤에 (집 안 자리를 고른다)
  { id: 'rainJar', pay: {}, coins: 40, get: {}, grants: 'rainJar' },
  { id: 'inkJar', pay: {}, coins: 100, get: { inkJar: 1 }, grants: 'inkJar', requires: 'sootCatcher' },
  // 가방과 신 (계획 11 작업 2): 가죽 가방은 한 칸 18, 튼튼한 신은 걷는 속도 ×1.2 (가벼운 신은 양치기의 선물)
  { id: 'leatherBag', pay: {}, coins: 120, get: { leatherBag: 1 } },
  { id: 'sturdyShoes', pay: {}, coins: 60, get: { sturdyShoes: 1 } },
  // 손에 익은 연장: 손일 놀이를 건너뛸 수 있다 (사용자 요청 — 놀이가 번거로운 날을 위해)
  { id: 'handyKit', pay: {}, coins: 180, get: { handyKit: 1 } },
  // 연애와 결혼 (계획 6): 들꽃 다발은 늘, 약속의 끈은 연인이 생긴 뒤에
  { id: 'bouquet', pay: {}, coins: 30, get: { bouquet: 1 } },
  { id: 'promiseCord', pay: {}, coins: 150, get: { promiseCord: 1 }, requires: 'dating' },
]

/** 이미 가진 도구·설치물을 또 사게 되는 거래인가 (도구는 하나씩) */
export function ownsTradeTool(inv: Inventory, t: Trade, flags: Record<string, number> = {}): boolean {
  if (t.grants && owns(flags, t.grants)) return true
  return TOOLS.some((id) => t.get[id] !== undefined && count(inv, id) > 0)
}

export function tradesFor(flags: Record<string, number>): Trade[] {
  return TRADES.filter((t) => !t.requires || unlocked(flags, t.requires))
}

export function trade(s: GameState, t: Trade): GameState | null {
  if (!isMarketDay(s.clock.day)) return null
  if (t.requires && !unlocked(s.flags, t.requires)) return null
  if (ownsTradeTool(s.inv, t, s.flags)) return null
  if (t.coins !== undefined && s.coins < t.coins) return null
  const left = take(s.inv, t.pay)
  if (!left || overflows({ ...s, inv: left }, t.get)) return null
  const got = putAway({ ...s, inv: left }, t.get)
  const flags = t.grants ? { ...s.flags, [`unlock:${t.grants}`]: 1 } : s.flags
  return { ...got, coins: s.coins - (t.coins ?? 0), flags }
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

export type GatherResult = { gives: Partial<Record<ItemId, number>>; minutes: number } | { blocked: 'notRipe' | 'tired' | 'full' | 'picked' }

// ── 들 약초와 약방 (주막 자리에 약방 — 2026-09-30) ──
/** 들 약초는 하루에 이만큼 캔다 (네 군데 한 번씩) */
export const HERB_PICKS_PER_DAY = 4
/** 약방이 하루에 사 주는 약초 수 */
export const HERB_SELL_CAP = 12
export const APOTHECARY = 'apothecary'

function herbPicksToday(s: Pick<GameState, 'clock' | 'flags'>): number {
  return s.flags.herbDay === s.clock.day ? (s.flags.herbPicks ?? 0) : 0
}
function herbsSoldToday(s: Pick<GameState, 'clock' | 'flags'>): number {
  return s.flags.herbSoldDay === s.clock.day ? (s.flags.herbSold ?? 0) : 0
}

/** 약방에 약초를 판다 (장날이 아니어도 — 한 줌에 약초 값, 매력 3단계부터 +1닢). 하루 12줌까지. 판 게 없으면 null */
export function sellHerbs(s: GameState): { state: GameState; n: number; coins: number } | null {
  const n = Math.min(count(s.inv, 'herb'), HERB_SELL_CAP - herbsSoldToday(s))
  if (n <= 0) return null
  const coins = n * sellPrice(s, 'herb')!
  return {
    state: { ...s, inv: take(s.inv, { herb: n })!, coins: s.coins + coins, flags: { ...s.flags, herbSoldDay: s.clock.day, herbSold: herbsSoldToday(s) + n } },
    n,
    coins,
  }
}

/** 약방이 오늘 더 사 줄 수 있는 약초 수 */
export function herbsSellLeft(s: Pick<GameState, 'clock' | 'flags'>): number {
  return HERB_SELL_CAP - herbsSoldToday(s)
}

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
    case 'wildHerb':
      // 겨울엔 캘 것이 없고, 하루에 네 번까지 (네 군데 한 번씩)
      info = seasonOf(day) === 'winter' ? { blocked: 'notRipe' } : herbPicksToday(s) >= HERB_PICKS_PER_DAY ? { blocked: 'picked' } : { gives: { herb: 1 }, minutes: 15 }
      break
    default:
      return null
  }
  // 가방이 넘치면 헛수고가 되므로 미리 막는다
  if ('gives' in info && overflows(s, info.gives)) return { blocked: 'full' }
  return info
}

/** 넣으면 넘치는가 (넘치는 물건은 사라지므로 미리 막는다). 한도는 가방에 따라 9 또는 18 */
export function wouldOverflow(inv: Inventory, gives: Partial<Record<ItemId, number>>): boolean {
  return (Object.entries(gives) as [ItemId, number][]).some(([id, n]) => count(inv, id) + n > stackCap(inv))
}

// ── 가방과 재료 궤짝 (계획 11 작업 1, 규칙은 easier.ts) ──

/** 재료 궤짝이 있으면 그 안의 것 (없으면 null — 가방만 쓴다) */
export function chestOf(s: Pick<GameState, 'flags' | 'chest'>): Inventory | null {
  return owns(s.flags, 'supplyChest') ? (s.chest ?? {}) : null
}

/** 가방 + 궤짝에 있는 수 */
export function stockOf(s: Pick<GameState, 'inv' | 'flags' | 'chest'>, id: ItemId): number {
  return stock(s.inv, chestOf(s), id)
}

/** 책상·작업대·기름틀에서 쓸 것이 가방과 궤짝에 있는가 */
export function haveStock(s: Pick<GameState, 'inv' | 'flags' | 'chest'>, need: Partial<Record<ItemId, number>>): boolean {
  return hasStock(s.inv, chestOf(s), need)
}

/** 가방에서 먼저, 모자라면 궤짝에서 꺼내 쓴다 */
function useStock(s: GameState, need: Partial<Record<ItemId, number>>): GameState | null {
  const r = takeStock(s.inv, chestOf(s), need)
  return r ? { ...s, inv: r.inv, chest: r.chest ?? s.chest } : null
}

/** 받은 것을 넣는다 — 가방이 차면 궤짝으로 */
function putAway(s: GameState, gives: Partial<Record<ItemId, number>>): GameState {
  const r = stash(s.inv, chestOf(s), gives)
  return { ...s, inv: r.inv, chest: r.chest ?? s.chest }
}

/** 넣으면 넘쳐서 버려지는가 (궤짝이 있으면 궤짝까지 친다) */
export function overflows(s: Pick<GameState, 'inv' | 'flags' | 'chest'>, gives: Partial<Record<ItemId, number>>): boolean {
  return stashOverflows(s.inv, chestOf(s), gives)
}

/** 집 안에서 궤짝의 것을 가방으로 꺼낸다 (가방에 들어가는 만큼) */
export function takeFromChest(s: GameState, id: ItemId): GameState | null {
  const box = chestOf(s)
  if (!box) return null
  syncHome(s)
  if (!isHome(playerTile(s))) return null
  const r = fromChest(s.inv, box, id)
  return r ? { ...s, inv: r.inv, chest: r.chest } : null
}

// ── 능력치 (계획 11 작업 4, 규칙은 stats.ts) ──

/** 능력치 경험치를 쌓는다 */
export function train(s: GameState, id: StatId, xp: number): GameState {
  return { ...s, stats: addXp(s.stats, id, xp) }
}

/** 몸을 쓰는 일의 피로 — 근력 단계만큼 덜 */
function toil(s: GameState, amount: number): Needs {
  return work(s.needs, Math.round(amount * tiredScale(s.stats) * 10) / 10)
}

/** 가끔 하나 더 (손재주·근력, 운이 거든다): 받는 것 중 첫 물건에 하나 — 넘치면 더하지 않는다 */
function withExtra(s: GameState, gives: Partial<Record<ItemId, number>>, id: 'hand' | 'strength', salt: number): Partial<Record<ItemId, number>> {
  const first = (Object.keys(gives) as ItemId[]).find((k) => !TOOLS.includes(k))
  if (!first || !luckyExtra(s.stats, id, s.clock.day, salt, s.clock.minute)) return gives
  const more = { ...gives, [first]: (gives[first] ?? 0) + 1 }
  return overflows(s, more) ? gives : more
}

const GATHER_SALT: Partial<Record<PlaceId, number>> = { well: 1, reeds: 2, olive: 3, vine: 4, field: 5, wildHerb: 6 }

export function finishGather(s: GameState, place: PlaceId): GameState {
  const info = gatherInfo(s, place)
  if (!info || 'blocked' in info) return s
  const gives = withExtra(s, info.gives, 'strength', GATHER_SALT[place] ?? 0)
  const flags = place === 'wildHerb' ? { ...s.flags, herbDay: s.clock.day, herbPicks: herbPicksToday(s) + 1 } : s.flags
  return train(passTime({ ...putAway({ ...s, flags }, gives), needs: toil(s, 4) }, info.minutes), 'strength', XP.gather)
}

export type CraftBlock = 'needs' | 'tired' | 'full' | 'job' | null
export function canCraft(s: GameState, id: RecipeId): CraftBlock {
  if (id === 'cover' && jobOf(s) < COVER_FROM) return 'job'
  if (exhausted(s.needs)) return 'tired'
  // 재료 궤짝이 있으면 궤짝의 것도 쓴다
  if (!haveStock(s, RECIPES[id].needs)) return 'needs'
  if (overflows(useStock(s, RECIPES[id].needs)!, recipeGives(RECIPES[id], s.inv, s.flags))) return 'full'
  return null
}

export function finishCraft(s: GameState, id: RecipeId): GameState {
  if (canCraft(s, id)) return s
  const r = RECIPES[id]
  const paid = useStock(s, r.needs)!
  const made = putAway(paid, withExtra(paid, recipeGives(r, s.inv, s.flags), 'hand', 10 + Object.keys(RECIPES).indexOf(id)))
  const recipesKnown = s.recipesKnown.includes(id) ? s.recipesKnown : [...s.recipesKnown, id]
  const done = train(passTime({ ...made, recipesKnown, needs: work(s.needs, 5) }, r.minutes), 'hand', XP.craft)
  // 화덕을 쓰면 그을음 받이에 그을음이 모인다
  return r.at === 'hearth' ? catchSoot(done) : done
}

/**
 * 그을음 받이: 화덕을 쓸 때마다(빵 굽기·불 쬐기) 그을음 1이 가방(차면 궤짝)으로 — 하루 SOOT_CATCH.perDay번까지,
 * 가방과 궤짝의 그을음이 SOOT_CATCH.hold개면 더 모이지 않는다
 */
export function catchSoot(s: GameState): GameState {
  if (!owns(s.flags, 'sootCatcher')) return s
  const today = s.flags.sootDay === s.clock.day ? (s.flags.sootCaught ?? 0) : 0
  if (today >= SOOT_CATCH.perDay || stockOf(s, 'soot') >= SOOT_CATCH.hold) return s
  return { ...putAway(s, { soot: 1 }), flags: { ...s.flags, sootDay: s.clock.day, sootCaught: today + 1 } }
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

/** 장날 파는 값 — 매력 3단계부터 +1닢 */
export function sellPrice(s: Pick<GameState, 'stats'>, item: ItemId): number | undefined {
  const base = SELL_PRICES[item]
  return base === undefined ? undefined : base + sellBonus(s.stats)
}

export function sell(s: GameState, item: ItemId): GameState | null {
  if (canSell(s, item)) return null
  return {
    ...s,
    inv: take(s.inv, { [item]: 1 })!,
    coins: s.coins + sellPrice(s, item)!,
    flags: { ...s.flags, soldDay: s.clock.day, soldCount: soldToday(s) + 1 },
  }
}

/** 가진 것 중 가장 든든한 것을 먹는다 (빵 → 꿀 → 무화과) */
export function eatBread(s: GameState): GameState | null {
  for (const [id, amount] of FOODS) {
    const left = take(s.inv, { [id]: 1 })
    // 먹은 날은 집중 (정성 들인 장 — 계획 13)
    if (left) return { ...s, inv: left, needs: { ...s.needs, hunger: Math.max(0, s.needs.hunger - amount) }, flags: { ...s.flags, ateDay: s.clock.day } }
  }
  return null
}

export function hasFood(inv: Inventory): boolean {
  return FOODS.some(([id]) => count(inv, id) > 0)
}

export function warmByHearth(s: GameState): GameState {
  return catchSoot(passTime({ ...s, needs: warmUp(s.needs) }, 15))
}

export function restAt(s: GameState): GameState {
  return passTime({ ...s, needs: rest(s.needs) }, 30)
}

// ── 모이는 곳과 둘이 가는 곳 (계획 10, 때와 값은 places.ts) ──

export type HallBlock = 'closed' | 'empty' | 'played' | 'tired' | null
/** 사랑방 놀이: 저녁 모임 때, 모인 이웃이 방에 와 있고, 오늘 아직 놀지 않았을 때 */
export function canPlayHall(s: GameState, content: GameContent): HallBlock {
  if (!hallOpen(s.clock.minute)) return 'closed'
  if (s.flags.hallDay === s.clock.day) return 'played'
  if (exhausted(s.needs)) return 'tired'
  if (hallFriendsHere(s, content).length === 0) return 'empty'
  return null
}

/** 사랑방 방석 자리에 와 앉은 이웃 */
export function hallFriendsHere(s: GameState, content: GameContent): string[] {
  return hallGuestsToday(s, content).filter((id, i) => {
    const n = s.npcs[id]
    return n?.visible && sameTile(npcTile(n), HALL_SPOTS[i])
  })
}

/**
 * 사랑방에서 이웃과 수수께끼·실뜨기 놀이 (하루 한 번): 함께 논 이웃마다 마음 +3점, 매력이 조금 오른다.
 * 처음 한 번은 짧은 장면 (hallNight)
 */
export function playHall(s: GameState, content: GameContent): GameState {
  if (canPlayHall(s, content)) return s
  let next: GameState = { ...s, flags: { ...s.flags, hallDay: s.clock.day, hallPlays: (s.flags.hallPlays ?? 0) + 1 } }
  for (const id of hallFriendsHere(s, content)) next = heartUp(next, id, HALL_PLAY_GAIN)
  if (!s.flags.hallPlays) next = { ...next, scenes: [...next.scenes, 'hallNight'] }
  return train(passTime(next, HALL_PLAY_MINUTES), 'charm', XP.help)
}

export type TeaBlock = 'closed' | 'coins' | null
export function canDrinkTea(s: GameState): TeaBlock {
  if (!teaOpen(s.clock.minute)) return 'closed'
  if (s.coins < TEA_PRICE) return 'coins'
  return null
}

/** 찻집에서 차 한 잔 (닢 2): 쉬어서 피로가 풀리고 배도 조금 부르다. 처음 한 번은 짧은 장면 (teaFirst) */
export function drinkTea(s: GameState): GameState {
  if (canDrinkTea(s)) return s
  const needs = rest({ ...s.needs, hunger: Math.max(0, s.needs.hunger - 10) })
  const first = !s.flags.teaCups
  const next: GameState = { ...s, coins: s.coins - TEA_PRICE, needs, flags: { ...s.flags, teaCups: (s.flags.teaCups ?? 0) + 1 }, scenes: first ? [...s.scenes, 'teaFirst'] : s.scenes }
  return passTime(next, TEA_MINUTES)
}

export type SunsetBlock = 'notYet' | 'cloudy' | null
export function canWatchSunset(s: GameState): SunsetBlock {
  if (!sunsetTime(s.clock.minute)) return 'notYet'
  if (!clearSky(s.clock.day)) return 'cloudy'
  return null
}

/** 호숫가 정자에서 노을 보기: 쉬고, 그날 처음이면 운이 조금, 처음 한 번은 장면 (sunset — 앨범) */
export function watchSunset(s: GameState): GameState {
  if (canWatchSunset(s)) return s
  const key = onceKey('sunset', s.clock.day)
  if (s.flags[key]) return passTime({ ...s, needs: rest(s.needs) }, SUNSET_MINUTES)
  const first = !s.flags.sunsets
  const next: GameState = {
    ...s,
    needs: rest(s.needs),
    flags: { ...s.flags, [key]: 1, sunsets: (s.flags.sunsets ?? 0) + 1 },
    scenes: first ? [...s.scenes, 'sunset'] : s.scenes,
  }
  return train(passTime(next, SUNSET_MINUTES), 'luck', XP.stars)
}

// ── 연애와 결혼 (계획 6, 단계와 값은 romance.ts) ──

/** 주인공 모습 (옛 저장처럼 고르지 않았으면 여자) */
export function playerLook(s: Pick<GameState, 'avatar'>): 'f' | 'm' {
  return s.avatar?.look ?? 'f'
}

/** 연애할 수 있는 후보: 주인공과 다른 모습 */
export function isSuitor(s: Pick<GameState, 'avatar'>, def: NeighborDef | undefined): boolean {
  return !!def?.romanceable && !!def.look && def.look !== playerLook(s)
}

/** 이 이웃과의 사이: 친구·연인·약혼·부부 */
export function romanceWith(s: Pick<GameState, 'romance'>, id: string): 'friend' | 'dating' | 'engaged' | 'married' {
  const r = s.romance ?? NO_ROMANCE
  return r.partner === id && r.stage ? r.stage : 'friend'
}

export type BouquetBlock = 'notSuitor' | 'taken' | 'already' | 'hearts' | 'noItem' | null
export function canGiveBouquet(s: GameState, def: NeighborDef): BouquetBlock {
  if (!isSuitor(s, def)) return 'notSuitor'
  const r = s.romance ?? NO_ROMANCE
  if (r.partner === def.id) return 'already'
  if (r.partner) return 'taken'
  if (heartsOf(s.hearts[def.id]) < BOUQUET_HEARTS) return 'hearts'
  if (count(s.inv, 'bouquet') === 0) return 'noItem'
  return null
}

/** 들꽃 다발을 건네면 연인이 된다 (한 명만). 장면 confess:<id>(앨범), 장날 약속의 끈을 살 수 있게 된다 */
export function giveBouquet(s: GameState, def: NeighborDef): GameState {
  if (canGiveBouquet(s, def)) return s
  const next: GameState = {
    ...s,
    inv: take(s.inv, { bouquet: 1 })!,
    romance: { ...NO_ROMANCE, partner: def.id, stage: 'dating', since: s.clock.day },
    flags: { ...s.flags, 'unlock:dating': 1 },
    scenes: [...s.scenes, `confess:${def.id}`],
  }
  return heartUp(next, def.id, BOUQUET_GAIN)
}

export type CordBlock = 'notPartner' | 'stage' | 'days' | 'hearts' | 'room' | 'noItem' | null
export function canGiveCord(s: GameState, def: NeighborDef): CordBlock {
  const r = s.romance ?? NO_ROMANCE
  if (r.partner !== def.id) return 'notPartner'
  if (r.stage !== 'dating') return 'stage'
  if (s.clock.day - (r.since ?? s.clock.day) < DATING_DAYS) return 'days'
  if (heartsOf(s.hearts[def.id]) < CORD_HEARTS) return 'hearts'
  // 함께 살 방이 있어야 한다 (집 넓히기 1단계)
  if (s.homeLevel < 1) return 'room'
  if (count(s.inv, 'promiseCord') === 0) return 'noItem'
  return null
}

/** 약속의 끈을 건네면 약혼 — 다음 장날 저녁 광장에서 마을 잔치로 결혼한다. 장면 propose:<id> */
export function giveCord(s: GameState, def: NeighborDef): GameState {
  if (canGiveCord(s, def)) return s
  return heartUp(
    {
      ...s,
      inv: take(s.inv, { promiseCord: 1 })!,
      romance: { ...s.romance, stage: 'engaged', weddingDay: nextMarketAfter(s.clock.day) },
      scenes: [...s.scenes, `propose:${def.id}`],
    },
    def.id,
    CORD_GAIN,
  )
}

/** 오늘이 결혼 잔치 날인가 */
export function weddingToday(s: Pick<GameState, 'clock'> & Partial<Pick<GameState, 'romance'>>): boolean {
  const r = s.romance ?? NO_ROMANCE
  return r.stage === 'engaged' && !!r.partner && r.weddingDay === s.clock.day
}

/** 결혼 잔치 자리: 광장 모닥불 둘레 (이 안에 들어오면 잔치가 열린다) */
function atWeddingFire(p: Tile): boolean {
  return Math.abs(p.x - FIRE.x) + Math.abs(p.y - FIRE.y) <= 4
}

/** 결혼 (잔치 장면이 열릴 때): 부부가 되고, 그날 밤부터 배우자가 내 집에서 지낸다 */
function marry(s: GameState): GameState {
  const id = s.romance.partner!
  return {
    ...s,
    romance: { ...s.romance, stage: 'married', weddingDay: null, marriedDay: s.clock.day },
    scenes: [...s.scenes, `wedding:${id}`],
    flags: { ...s.flags, [onceKey('wedding', s.clock.day)]: 1 },
  }
}

/** 배우자의 아침 선물 (하루 한 번, 처음 말 걸 때): 배우자 집안 일에서 나는 것 하나 */
export function spouseGift(s: GameState, def: NeighborDef): { state: GameState; gift: Partial<Record<ItemId, number>> } | null {
  if (romanceWith(s, def.id) !== 'married' || s.flags.spouseGiftDay === s.clock.day) return null
  const [id] = Object.keys(def.help.gives) as ItemId[]
  const gift = { [id]: 1 } as Partial<Record<ItemId, number>>
  return { state: { ...putAway(s, gift), flags: { ...s.flags, spouseGiftDay: s.clock.day } }, gift }
}

export type DateBlock = 'noPartner' | 'done' | 'closed' | 'coins' | 'notYet' | 'cloudy' | null
/** 둘이 가는 곳 (계획 10 작업 4): 연인·약혼·부부만, 하루 한 번 (찻집이든 정자든) */
function dateBlock(s: GameState): DateBlock {
  const r = s.romance ?? NO_ROMANCE
  if (!r.partner || !r.stage) return 'noPartner'
  if (s.flags.dateDay === s.clock.day) return 'done'
  return null
}
export function canDateTea(s: GameState): DateBlock {
  const b = dateBlock(s)
  if (b) return b
  if (!teaOpen(s.clock.minute)) return 'closed'
  if (s.coins < DATE_TEA_PRICE) return 'coins'
  return null
}
export function canDateSunset(s: GameState): DateBlock {
  const b = dateBlock(s)
  if (b) return b
  const sun = canWatchSunset(s)
  return sun === 'notYet' ? 'notYet' : sun === 'cloudy' ? 'cloudy' : null
}

/** 함께 차 마시기 (닢 4): 둘 다 쉬고, 마음 +5점. 처음 한 번 장면 dateTea */
export function dateTea(s: GameState): GameState {
  if (canDateTea(s)) return s
  const first = !s.flags.dateTeas
  const next: GameState = {
    ...s,
    coins: s.coins - DATE_TEA_PRICE,
    needs: rest(s.needs),
    flags: { ...s.flags, dateDay: s.clock.day, dateTeas: (s.flags.dateTeas ?? 0) + 1 },
    scenes: first ? [...s.scenes, 'dateTea'] : s.scenes,
  }
  return passTime(heartUp(next, s.romance.partner!, DATE_GAIN), TEA_MINUTES)
}

/** 함께 노을 보기: 쉬고, 마음 +5점, 그날 처음이면 운. 처음 한 번 장면 dateSunset */
export function dateSunset(s: GameState): GameState {
  if (canDateSunset(s)) return s
  const first = !s.flags.dateSunsets
  const key = onceKey('sunset', s.clock.day)
  const lucky = !s.flags[key]
  const next: GameState = {
    ...s,
    needs: rest(s.needs),
    flags: { ...s.flags, dateDay: s.clock.day, dateSunsets: (s.flags.dateSunsets ?? 0) + 1, [key]: 1 },
    scenes: first ? [...s.scenes, 'dateSunset'] : s.scenes,
  }
  const done = passTime(heartUp(next, s.romance.partner!, DATE_GAIN), SUNSET_MINUTES)
  return lucky ? train(done, 'luck', XP.stars) : done
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

/** 별이 보이는 때: 저녁 여덟 시(STARS_FROM) 이후 — 시간이 멈추는 02:00까지 — 나 새벽 다섯 시 전 */
export function starsOut(minute: number): boolean {
  return minute >= STARS_FROM || minute % 1440 < 5 * 60
}

/** 별이 보이는 맑은 하늘 (비·눈·안개가 아닌 날) */
export function clearSky(day: number): boolean {
  const w = weatherOf(day)
  return !isWet(w) && w !== 'fog'
}

/**
 * 오늘 밤 언덕 편지함에서 꺼낼 장: 지금 책이 별 보는 밤에 오는 책(요한계시록)이고, 그 방이 열렸고,
 * 맑은 밤 별이 보이는 때이고, 오늘 밤 아직 꺼내지 않았을 때 (flags.starPostDay — 궂은 밤 몫은 쌓이지 않는다)
 */
function starPostTonight(s: GameState, content: GameContent): string[] {
  const book = s.activeBook
  if (!book || modeOf(book) !== 'letters' || arrivesOf(book) !== 'stars' || !bookRoomOpen(book, s.flags)) return []
  if (!clearSky(s.clock.day) || !starsOut(s.clock.minute) || s.flags.starPostDay === s.clock.day) return []
  return starPostFor({ day: s.clock.day, book, chapters: content.pieces.filter((p) => p.book === book), delivered: s.collected })
}

/**
 * 별 보기: 앉아 쉬고 20분, 맑은 밤이면 stars 장면(한 번). 요한계시록을 엮는 중이면 벤치 곁 편지함에서 오늘 밤 몫(1–2장)을 꺼낸다.
 * 자리와 무관한 함수다 — 지금은 언덕 메뉴에만 붙어 있지만 다른 "별 보는 밤" 자리(계획 10 호숫가 정자 등)도 이것을 부르면 된다.
 */
export function stargaze(s: GameState, content: GameContent): { state: GameState; pieceIds: string[] } {
  const night = phaseOf(s.clock.minute) === 'night'
  let next = passTime({ ...s, needs: rest(s.needs) }, 20)
  // 맑은 밤 별을 보면 운이 조금 (하루 한 번 — 계획 11 작업 4)
  if (clearSky(s.clock.day) && night && !s.flags[onceKey('stars', s.clock.day)])
    next = train({ ...next, scenes: [...next.scenes, 'stars'], flags: { ...next.flags, [onceKey('stars', s.clock.day)]: 1 } }, 'luck', XP.stars)
  const ids = starPostTonight(s, content)
  if (!ids.length) return { state: next, pieceIds: [] }
  const got = takeChapters(next, ids, content)
  return { state: { ...got, flags: { ...got.flags, starPostDay: s.clock.day } }, pieceIds: ids }
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
  // 책상 곁이라 궤짝의 기름도 쓴다
  const left = useStock(s, { oil: 1 })
  if (!left) return null
  // 기름 한 병으로 켜는 밤: 작은 등잔 1, 두 심지 2, 청동 3 (계획 13)
  const extra = lampNightsPerOil(s) - 1
  return { ...left, lampFuel: extra, lampLitDay: s.clock.day, flags: { ...s.flags, lampNights: (s.flags.lampNights ?? 0) + 1 } }
}

export function setArrangement(s: GameState, book: Book, chapter: number, list: string[]): GameState {
  const bp = s.progress[book]
  return { ...s, progress: { ...s.progress, [book]: { ...bp, arrangement: { ...bp.arrangement, [chapter]: list } } } }
}

/** letters: 편지 책은 조각 엮기로 기록하지 않는다 (옮겨 적기 recordLetter로만) */
export type SubmitResult = ArrangeResult | { kind: 'supplies'; need: Partial<Record<ItemId, number>> } | { kind: 'tired' } | { kind: 'letters' }

/** 기록할 준비가 되었는가 (순서·재료·몸). 아무것도 쓰지 않는다 — 준비되면 퀴즈를 연다. 조각 책만 */
export function chapterReady(s: GameState, book: Book, chapter: number, content: GameContent): SubmitResult {
  if (modeOf(book) !== 'pieces') return { kind: 'letters' }
  const pieces = content.pieces.filter((p) => p.book === book)
  const bp = s.progress[book]
  const result = checkArrangement(pieces, chapter, bp.arrangement[chapter] ?? [], s.collected)
  if (result.kind !== 'done' || bp.completed.includes(chapter)) return result
  if (exhausted(s.needs)) return { kind: 'tired' }
  if (!haveStock(s, chapterCost(s))) return { kind: 'supplies', need: chapterCost(s) }
  return result
}

/** 퀴즈까지 마친 뒤 실제로 기록한다 (재료를 쓰고 장을 완성). 한 권의 마지막 장이면 'bookBound' 장면 */
// ── 정성 들인 장 (계획 13, 규칙은 fixtures.ts) ──

/** 한 장에 드는 것: 책상에서 '좋은 파피루스로 쓰기'를 켜고 좋은 파피루스가 있으면 그것으로 */
export function chapterCost(s: Pick<GameState, 'inv' | 'flags' | 'chest'>): Partial<Record<ItemId, number>> {
  return s.flags.useFine && stockOf(s, 'finePapyrus') > 0 ? { finePapyrus: 1, ink: 1 } : CHAPTER_COST
}

/** 오늘 먹었고 배고프지 않으면 집중 */
export function focused(s: Pick<GameState, 'flags' | 'clock' | 'needs'>): boolean {
  return s.flags.ateDay === s.clock.day && s.needs.hunger < 70
}

/** 지금 기록하면 정성 점수 몇 점인가 (책상 화면에 미리 보인다) */
export function careNow(s: GameState): { score: number; fine: boolean; focused: boolean; goodLight: boolean; deskTier: number } {
  const fine = 'finePapyrus' in chapterCost(s)
  const night = needsLamp(s)
  const c = { fine, focused: focused(s), goodLight: !night || fixtureTier(s, 'lamp') >= 1, deskTier: fixtureTier(s, 'desk') }
  return { ...c, score: careScore(c) }
}

/** 장을 기록할 때 재료를 쓰고, 정성 들인 장이면 적어 둔다 */
function payChapter(s: GameState, book: Book, chapter: number): GameState {
  const care = careNow(s)
  const paid = useStock(s, chapterCost(s))!
  if (care.score < CAREFUL_AT) return paid
  const list = s.careful?.[book] ?? []
  return { ...paid, careful: { ...s.careful, [book]: list.includes(chapter) ? list : [...list, chapter] } }
}

export type SealBlock = 'notShelved' | 'sealed' | 'noWax' | null
/** 서고에 꽂은 책을 봉인용 밀랍으로 봉인한다 (책등에 붉은 봉인) */
export function canSeal(s: GameState, book: Book): SealBlock {
  if (s.shelved[book] === undefined) return 'notShelved'
  if ((s.sealed ?? []).includes(book)) return 'sealed'
  if (stockOf(s, 'sealWax') === 0) return 'noWax'
  return null
}
export function sealBook(s: GameState, book: Book): GameState {
  if (canSeal(s, book)) return s
  return { ...useStock(s, { sealWax: 1 })!, sealed: [...(s.sealed ?? []), book] }
}

export function submitChapter(s: GameState, book: Book, chapter: number, content: GameContent): { state: GameState; result: SubmitResult } {
  const result = chapterReady(s, book, chapter, content)
  const bp = s.progress[book]
  if (result.kind !== 'done' || bp.completed.includes(chapter)) return { state: s, result }
  const paid = payChapter(s, book, chapter)
  const progress = { ...s.progress, [book]: { ...bp, completed: [...bp.completed, chapter] } }
  const scenes = [...s.scenes]
  if (totalChapters(s) === 0) scenes.push('firstChapter')
  if (bookDone({ progress }, book, content)) scenes.push('bookBound')
  const bound = passTime({ ...paid, progress, scenes, needs: work(s.needs, 6) }, bindMinutes(s))
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
  if (!haveStock(s, chapterCost(s))) return { kind: 'supplies', need: chapterCost(s) }
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
  const recorded = passTime({ ...payChapter(s, book, chapter), progress, scenes, needs: work(s.needs, 6) }, bindMinutes(s))
  // 요한계시록 2·3장을 옮겨 적으면 그 장의 교회 카드가 일곱 교회 판에 들어온다
  return book === 'rev' ? syncBoard(recorded, 'churches', content) : recorded
}

// ── 카드 판: 사도행전 방의 여정 판 (계획 5 작업 5), 요한계시록 방의 일곱 교회 판 (계획 9 작업 3) ──

/** GameState의 판 칸 */
export type BoardId = 'journey' | 'churches'

/** 판마다: 카드를 주는 책, 카드 목록, 완성 표식 */
const BOARD_DEFS: Record<BoardId, { book: Book; cards: (content: GameContent) => readonly JourneyCard[]; flag: string }> = {
  // 여정을 다 이으면 actsShip 1 → 다음 날 아침 2 (나루에 배가 들어온다)
  journey: { book: 'ac', cards: (c) => c.journey ?? [], flag: 'actsShip' },
  // 일곱 교회를 다 맞추면 churchesDone 1 (한 번, 장면 없음)
  churches: { book: 'rev', cards: (c) => c.churches ?? [], flag: 'churchesDone' },
}

/** 판을 다 맞췄으면 완성 표식을 세운다. 한 번만 */
function markBoard(s: GameState, board: BoardId, content: GameContent): GameState {
  const def = BOARD_DEFS[board]
  if (s.flags[def.flag] || !journeyComplete(s[board], def.cards(content))) return s
  return { ...s, flags: { ...s.flags, [def.flag]: 1 } }
}

/** 기록한 장으로 얻은 카드를 판에 맞춘다 (얻은 카드만, 새 카드는 판 끝 가까이에) */
export function syncBoard(s: GameState, board: BoardId, content: GameContent): GameState {
  const def = BOARD_DEFS[board]
  const earned = cardsForChapters(def.cards(content), s.progress[def.book]?.completed ?? [])
  return markBoard({ ...s, [board]: placeNewCards(s[board] ?? [], earned) }, board, content)
}

/** 판의 카드 하나를 위(-1)·아래(+1)로 옮긴다. 다 맞춘 판은 그대로 둔다 */
export function moveBoardCard(s: GameState, board: BoardId, index: number, delta: number, content: GameContent): GameState {
  if (s.flags[BOARD_DEFS[board].flag]) return s
  return markBoard({ ...s, [board]: moveItem(s[board], index, delta) }, board, content)
}

/** 엮은 사도행전 장으로 얻은 카드를 여정 판에 맞춘다 */
export function syncJourney(s: GameState, content: GameContent): GameState {
  return syncBoard(s, 'journey', content)
}

/** 여정 판의 카드 하나를 위(-1)·아래(+1)로 옮긴다. 다 이은 판은 그대로 둔다 */
export function moveJourneyCard(s: GameState, index: number, delta: number, content: GameContent): GameState {
  return moveBoardCard(s, 'journey', index, delta, content)
}

/** 한 장을 엮는 데 드는 분: 기분이 좋으면 45, 아니면 60. 넓은 책상이면 20% 덜 */
export function bindMinutes(s: Pick<GameState, 'needs' | 'clock' | 'room' | 'inv'> & Partial<Pick<GameState, 'flags'>>): number {
  const base = inGoodMood(s) ? 45 : 60
  return fixtureTier({ flags: s.flags ?? {}, inv: s.inv }, 'desk') >= 1 ? Math.round(base * 0.8) : base
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
  const visitor = clock.minute >= VISIT_TO ? null : pickVisitor(day, s.hearts, flags, present, visitBonus(s.stats))
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
  // ── 스물일곱 권 잔치: 요한계시록을 꽂고 일곱 교회 판을 다 놓은 날 밤 → 다음 날 아침 (한 번, 복음서 방 잔치와 같은 짜임) ──
  if (flags.allFeast === 1) flags.allFeast = 2
  else if (!flags.allFeast && allFeastReady({ shelved: s.shelved, flags }) && gathering !== 'babyParty' && !festivalOf(day)) {
    flags.allFeast = 1
    scenes.push('allFeast')
    if (gathering === 'starNight') gathering = null
  }
  // ── 여정을 다 이은 다음 날 아침: 호숫가 나루에 큰 배가 들어온다 (한 번) ──
  if (flags.actsShip === 1) {
    flags.actsShip = 2
    scenes.push('actsShip')
  }
  // ── 서고의 다음 방: 앞 방의 책이 모두 꽂힌 날 밤 → 다음 날 아침 열린다 (사도행전 방 다음부터, 방 표 순서) ──
  // 콘텐츠가 없는 방은 표식을 세우지 않는다 — 책이 들어온 다음 잠에서 열린다 (요한계시록 방은 계획 9부터 콘텐츠가 있다)
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
  // 저녁 모임(아기 잔치·별 보는 밤·복음서 방 잔치·스물일곱 권 잔치)이 있는 날은 저녁 초대를 하지 않는다
  const eveningBusy = gathering === 'babyParty' || gathering === 'starNight' || feastToday({ flags })
  const inviter = eveningBusy ? null : pickInviter(day, s.hearts, flags)
  if (inviter) {
    flags[`inviteDay:${inviter}`] = day
    scenes.push(`invite:${inviter}`)
  }
  const today: Today = { visitor, visitGot: false, inviter, dined: false, gathering }
  // 결혼 잔치 날 저녁을 놓쳤으면 다음 장날로 미룬다
  const romance = s.romance?.stage === 'engaged' && s.romance.weddingDay !== null && s.romance.weddingDay < day ? { ...s.romance, weddingDay: nextMarketAfter(day - 1) } : (s.romance ?? NO_ROMANCE)
  const next: GameState = {
    ...s,
    romance,
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
  const morning = forgetPromises(morningSupplies(next, s.clock.day), day)
  return { ...morning, npcs: placeAllNpcs(morning, content) }
}

/**
 * 아침에 저절로 생기는 재료 (계획 11 작업 1). s는 새 날 아침 상태, endedDay는 방금 지난 날.
 * 빗물 항아리 → 갈대 말리는 틀 → 잉크 항아리 차례 (항아리가 아침 물을 쓸 수 있게). 넣을 곳은 가방, 차면 궤짝.
 * 틀은 설치한 다음 날 아침에 한 번만 장면(reedRack: 어부가 몰래 갈대를 채워 두고 간다), 그 뒤로는 말없이.
 * 그다음 목수에게 부탁해 둔 것이 지어진다 (오늘 지어진 틀은 오늘 밤부터 채워진다)
 */
function morningSupplies(s: GameState, endedDay: number): GameState {
  let next = s
  if (owns(s.flags, 'rainJar')) next = putAway(next, { water: weatherOf(endedDay) === 'rain' ? RAIN_WATER.afterRain + rainBonus(s.stats) : RAIN_WATER.usual })
  if (owns(s.flags, 'reedRack')) {
    if (stockOf(next, 'papyrus') < RACK_HOLD) next = putAway(next, { papyrus: RACK_PAPYRUS })
    if (!next.flags.rackSeen) next = { ...next, scenes: [...next.scenes, 'reedRack'], flags: { ...next.flags, rackSeen: 1 } }
  }
  if (owns(s.flags, 'inkJar') && stockOf(next, 'ink') < INK_JAR_HOLD) {
    const paid = useStock(next, { soot: 1, water: 1 })
    if (paid) next = putAway(paid, { ink: 1 })
  }
  // 부탁해 둔 기록 설비가 설치된다 (계획 13)
  for (const line of ['desk', 'lamp', 'shelf', 'inkStand'] as FixtureLine[]) {
    const tier = next.flags[`fixOrder:${line}`]
    if (!tier) continue
    const flags = { ...next.flags, [`fix:${line}`]: tier }
    delete flags[`fixOrder:${line}`]
    next = { ...next, flags, scenes: [...next.scenes, `fixed:${line}:${tier}`] }
  }
  for (const w of CARPENTER_WORKS) {
    if (!next.flags[`order:${w.id}`]) continue
    const flags = { ...next.flags, [`unlock:${w.id}`]: 1 }
    delete flags[`order:${w.id}`]
    next = { ...next, flags, scenes: [...next.scenes, `built:${w.id}`], inv: w.item ? addGift(next.inv, { [w.item]: 1 }) : next.inv }
  }
  return next
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

// ── 목수에게 부탁하는 살림 (계획 11 작업 1: 재료 궤짝·그을음 받이·갈대 말리는 틀 — 집 넓히기처럼 다음 날 아침 지어진다) ──

export type WorkBlock = 'notMoved' | 'owned' | 'ordered' | 'coins' | null
export function canOrderWork(s: GameState, id: CarpenterWork['id']): WorkBlock {
  const w = CARPENTER_WORKS.find((x) => x.id === id)
  if (!w) return 'owned'
  if (!s.flags['movedIn:carpenter']) return 'notMoved'
  if (owns(s.flags, id)) return 'owned'
  if (s.flags[`order:${id}`]) return 'ordered'
  if (s.coins < w.coins) return 'coins'
  return null
}

/** 닢을 내고 부탁한다 (다음 날 아침 지어진다) */
export function orderWork(s: GameState, id: CarpenterWork['id']): GameState | null {
  const w = CARPENTER_WORKS.find((x) => x.id === id)
  if (!w || canOrderWork(s, id)) return null
  return { ...s, coins: s.coins - w.coins, flags: { ...s.flags, [`order:${id}`]: 1 } }
}

// ── 기록 설비 부탁 (계획 13): 목수(기록대·서가·잉크 제조대), 대장장이(등잔) — 다음 날 아침 설치 ──

export type FixtureBlock = 'notMoved' | 'done' | 'ordered' | 'coins' | 'needs' | null
/** 이 이웃에게 부탁할 수 있는 다음 설비들 */
export function fixtureOffers(s: GameState, maker: FixtureStep['maker']): { step: FixtureStep; block: FixtureBlock }[] {
  const lines = [...new Set(FIXTURE_STEPS.filter((x) => x.maker === maker).map((x) => x.line))]
  return lines.flatMap((line) => {
    const step = nextFixture(s, line)
    return step && step.maker === maker ? [{ step, block: canOrderFixture(s, line) }] : []
  })
}

export function canOrderFixture(s: GameState, line: FixtureLine): FixtureBlock {
  const step = nextFixture(s, line)
  if (!step) return 'done'
  if (step.maker === 'carpenter' && !s.flags['movedIn:carpenter']) return 'notMoved'
  if (s.flags[`fixOrder:${line}`]) return 'ordered'
  if (s.coins < step.coins) return 'coins'
  if (!haveStock(s, step.needs)) return 'needs'
  return null
}

export function orderFixture(s: GameState, line: FixtureLine): GameState | null {
  const step = nextFixture(s, line)
  if (!step || canOrderFixture(s, line)) return null
  const paid = useStock(s, step.needs)!
  return { ...paid, coins: s.coins - step.coins, flags: { ...paid.flags, [`fixOrder:${line}`]: step.tier } }
}

/** 목수에게 다음 단계를 부탁한다 (닢과 재료를 내고, 다음 날 아침 지어진다) */
export function orderHome(s: GameState): GameState | null {
  const st = nextHomeStage(s)
  if (!st || canOrderHome(s)) return null
  return { ...s, coins: s.coins - st.coins, inv: take(s.inv, st.needs)!, flags: { ...s.flags, homeOrder: st.level } }
}
