import { SPOUSE_FURNITURE } from './furniture-defs'
import { initialHomeFurniture, spouseFurniture } from './room'
import type { Club, ClubSession } from './clubs'
import type { Fest } from './fest'
import { expireWorkDay, type WorkDay } from './work-day'
import { expireStall, STALL_GUEST_SPOT, stallGuestNow, type Stall, type StallLook } from './stall'
import { advanceVillage, crewNow, syncVillage, type Village } from './projects'
import type { Skills, SkillLesson } from './skills'
import { placedStyle } from './skill-defs'
import { advancePlans, appointmentSpots, reservedMembers, NO_PLANS, type Plans } from './plans'
// 게임 상태와 규칙의 조합. 순수 함수만 — 화면과 저장은 바깥(store)이 맡는다.
import { festivalOf, FESTIVAL_FROM, FESTIVAL_TO, isMarketDay, isWet, weatherOf, barleyRipe, grapesRipe } from './calendar'
import { advance, newClock, phaseOf, seasonOf, sleepClock, type Clock } from './clock'
import { DURATION, greet, IDLE_GAP, IDLE_RESET, stepIdle, type IdleState } from './autonomy'
import { adopt, companionGoal, STRAY_DAY, STRAY_SPOTS, stepCompanion, type Animal, type Companion } from './companion'
import { add, addGift, CHAPTER_COST, FOODS, count, has, RECIPES, recipeGives, stackCap, take, TOOLS, type Inventory, type RecipeId } from './items'
import { petLife, petStayGoal, type PetEvent } from './pet-life'
import { facingFor, findPath, pathToward, stepActor, type Actor } from './movement'
import { coolDown, exhausted, fallsSick, FRESH, rest, sleepNeeds, starving, tickNeeds, warmUp, work, type Needs } from './needs'
import { inGoodMood } from './mood'
import { footprint, FURNITURE_DEFS, placement, refitRoom, removal, rotation, solidTiles, type Furniture } from './room'
import { familySeats, type FamilyWants, moveInSpaces, pruneSpaces, SPACE_FROM, SPACE_TO, KID_SPACE_FROM, spaceAtTile, type HomeSpace } from './spaces'
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
import { candleKey, candleToBlow, faceToward, weddingEvening } from './event-scene'
import { FESTIVAL_SPOTS, FIRE, goalFor, isNear, npcTile, placeNpc, stepNpc, type Npc } from './neighbors'
import { GAIN, heartsOf, MAX_POINTS } from './hearts'
import { bookDone, bookRoomOpen, chaptersOf, emptyProgress, openDoorsFor, progressOf, totalChapters, type OtProgress, type Progress } from './books'
import { isOtBook, type CopyBook } from './ot-books'
import { modeOf } from './shelf-rooms'
import { currentChapter, mulberry32 } from './offers'
import { drawFragment, fragmentSeed, fragmentsForDay, logPieces, talkGiftOf, type PieceLog } from './fragments'
import { checkCopy, COPY_CHAPTER_XP, copySpot, copyVerses, nextOpenChapter, NO_COPY, NO_COPY_STATS, type CopyCheck, type CopyState, type CopyStats } from './copying'
import { chapterFinds, type GodFind } from './god-records'
import { SPECIAL_COST, type Bindings, type SpecialChoice } from './binding'
import { emptyDayLog, logChapter, logGift, type DayLog } from './daybook'
import { addXp, charmBonus, statScore, freshStats, luckyExtra, rainBonus, sellBonus, tiredScale, visitBonus, XP, type StatId, type Stats } from './stats'
import { HALL_GUESTS, HALL_PLAY_GAIN, HALL_PLAY_MINUTES, HALL_SPOTS, hallGuests, hallOpen, SUNSET_MINUTES, sunsetTime, TEA_MINUTES, TEA_PRICE, teaOpen } from './places'
import {
  BOUQUET_GAIN,
  BOUQUET_HEARTS,
  CORD_GAIN,
  CORD_HEARTS,
  DATE_COUNT_FLAG,
  DATE_FIRST_SCENE,
  DATE_GAIN,
  DATE_TEA_PRICE,
  DATE_VARIANTS,
  DATING_DAYS,
  isCandidateId,
  nextMarketAfter,
  NO_ROMANCE,
  NO_SPOUSE_GIFT,
  SPOUSE_HOME_FROM,
  SPOUSE_HOME_TO,
  PARTNER_WORK,
  STORY_HEARTS,
  WALK_FROM,
  WALK_MINUTES,
  WALK_TO,
  WEDDING_SPOT,
  WORK_HERE,
  type DatePlace,
  type Romance,
} from './romance'
import {
  allSightings,
  depthOf,
  eventById,
  eventCast,
  isOffDay,
  NO_LIFE,
  personOf,
  peopleData,
  pickLine,
  RECENT_KEEP,
  recordExperience,
  rememberTag,
  reqMet,
  routineNow,
  STAGE_POINTS,
  stageOfPoints,
  threadPhase,
  whenMatches,
  type ExperienceInput,
  type Life,
  type Moment,
  type Person,
  type PersonEvent,
  type Routine,
  type Stage,
  type StoryProp,
} from './people'
import { RARE_ITEMS } from './fixtures'
import { HABITS, habitText, NEWS_BY_ID, NEWS_RECENT_DAYS, NEWS_TEXT, newsMutter, newsOfDay, newsPropArt, newsSeasonOk, newsSeenText, newsWeatherOk, type NewsDef } from './news'
import { POSTMAN } from './post'
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
import { propFootprint, HOUSES, PET_HOME, HOME_FRONT, isHome, isIndoor, isWalkable, key, HOME_ENTRY, LOCKED_DOORS, lockedTiles, PLACES, placeAt, roomAt, sameTile, setHomeLevel, setHomeFurniture, setMailbox, setOpenDoors, setSpouseRoom, START, tileAt, WARPS, warpAt } from './world'
import { currentMapId, setActiveMap, type MapId } from './maps'
import { drawOtPiece, OT_PIECE_DAY_FLAG } from './ot-pieces'
import { claimNewland, entryFront, grantNewland, inArchiveRoom, portalAt, revealNewland, roomSlotAt, setNewlandOpen, setNewlandOverlay, setNewlandRevealed, setNewlandWarps } from './newland'
import { advanceBuilds, overlayFor, warpsFor, type NewlandState } from './newland-build'
import { roomOf, roomTarget, withRoomOf } from './newland-rooms'
import { ARCHIVE, NEWLAND_PORTAL, TRAVEL_FROM_MINUTE, TRAVEL_LAST_MINUTE, TRAVEL_MINUTES, VILLAGE_PORTAL } from './newland-config'
import { SPOUSE_ROOM_STAND } from './spouse-room'
import type { Cooking } from './cooking'
import { BOOKS, type Book, type Facing, type GameContent, type ItemId, type NeighborDef, type PlaceId, type Rng, type Target, type Tile } from './types'
import { withLookDefaults, type Avatar, type FullAvatar } from './avatar'
import { BOARD_GAIN, boardFor, type BoardRequest } from './board'
import type { Minigame } from './types'
import { newlyAchieved, withFound, type Achievement } from './achievements'
import { familyMorning } from './family-days'
import { adultJob, JOB_GIFTS, kidCoins, kidMailFor, CHILD_AFTER_WEDDING, childMode, childStage, CRADLE_SPOT, helperSpot, helpStat, newChild, type Child, type ChildMode } from './child'
import { DESTS, TRIP_FRIEND_GAIN, TRIP_LEAVE_BY, tripCost, type DestId } from './travel'
import type { TripReward } from './trip-board'
import { BIRTHDAY_MUL, isBirthday, NO_NOTEBOOK, noteGift, noteGot, noteHeard, noteMet, noteNews, noteSeen, noteTaste, noteObservedTaste, seenLabel, type Notebook } from './notebook'
import { CARPENTER_WORKS, fromChest, hasStock, INK_JAR_HOLD, LIGHT_SHOES, owns, RACK_HOLD, RACK_PAPER, RAIN_WATER, SOOT_CATCH, stash, stashOverflows, stock, takeStock, walkMul, type CarpenterWork, type EasyId } from './easier'

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
  workDay?: WorkDay
  /** 내 작은 장날 좌판 (계획 16 작업 19) — 옛 저장은 없음. stallLook: 고른 외형(다음 장날에도 유지) */
  stall?: Stall
  stallLook?: StallLook
  /** 주민이 함께 바꾸는 마을 (계획 16 작업 20): 진행 중인 사업과 기여 — 옛 저장은 없음. 설치 여부는 flags['story:village:<id>']만 본다 */
  village?: Village
  skills?: Skills
  skillLesson?: SkillLesson
  /** 직접 요리하고 함께 먹는 생활 (계획 16 작업 25): 배운 요리·하던 요리·식탁에 차린 음식 — 옛 저장은 없음 */
  cooking?: Cooking
  version: 1
  plans: Plans
  clubs: Club[]
  clubSessions: Record<string, ClubSession>
  clubWorks: Record<string, { item: 'cushion'; color: string; place: PlaceId }>
  /** 내가 준비하는 작은 행사 (계획 16 작업 16) — 옛 저장은 빈 목록 */
  fests: Fest[]
  /** 집 안 공간별 쓰임 (계획 16 작업 23): 정해 둔 차 자리·손일 자리·가족 쉼터·동물 쉼터·읽는 자리 — 옛 저장은 빈 목록. 쓸 수 있는지는 지금 가구로 다시 따진다 */
  spaces: HomeSpace[]
  clock: Clock
  player: Actor
  idle: IdleState
  target: Target | null
  /**
   * 이웃 id → 오늘 특별한 대화로 건넬 말씀 조각 id (계획 14 작업 5: 드물게 — 조각 오는 날에 많아야 한 명, fragments.ts).
   * 옛 저장은 그날 몫이 남아 있을 수 있다
   */
  offers: Record<string, string>
  /** 오늘 온 편지에 든 말씀 조각 id (편지 나르는 이웃에게서든 문 앞 편지 바구니에서든 한 번) — 조각 오는 날에 많아야 하나 */
  post: string[]
  /** 받은 말씀 조각 (말씀 탭의 말씀 조각 도감) */
  collected: string[]
  /** 받은 말씀 조각의 기록: 받은 날·어디서 (옛 저장의 조각은 기록이 없다 — 화면은 "언제 받았는지 남아 있지 않은 조각") */
  pieceLog: PieceLog
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
  /** 가족 옷장 (2026-09-30 사용자): 배우자(이웃 id)·아이('child')의 머리·옷 — 피부는 바꾸지 않는다 */
  looks?: Record<string, Avatar>
  /** 텃밭 ('x,y' → 작물) */
  garden: Record<string, Plot>
  /** 집 단계: 0 작업실, 1 배우자방, 2 아이방, 3 생활방 (목수에게 부탁한 단계는 flags.homeOrder, 다음 날 아침 지어진다) */
  homeLevel: 0 | 1 | 2 | 3
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
  /** 이웃 수첩: 만난 이웃·알게 된 좋아하는 것과 싫어하는 것·마주친 자리·들은 이야기 */
  notebook: Notebook
  /** 아이 (계획 12): 결혼 뒤 태어난다 */
  child: Child | null
  /** 물건 도감: 한 번이라도 가져 본 물건 */
  found: ItemId[]
  /** 이룬 업적과 처음 이룬 날 */
  achieved: { id: string; day: number }[]
  /** 필사 (계획 14): 지금 쓰는 책, 책마다 다음에 쓸 절(쓰다 만 입력 포함), 예전에 엮은 장 */
  copy: CopyState
  /** 나의 필사 기록: 절·글자·장·권·처음 기록한 날 */
  copyStats: CopyStats
  /** 구약 책별 진행 (계획 20 작업 5) — 선택 필드, 없으면 빈 진행. 신약 progress 27키와 섞이지 않는다 */
  otProgress?: OtProgress
  /** 받은 구약 말씀 조각 id ('ot:gen:1') — 신약 collected와 섞지 않는다. 옛 저장은 없음 (새 터를 받은 뒤에만 쌓인다) */
  otCollected?: string[]
  /** 구약 필사 기록 — 신약 copyStats와 섞이지 않는다. 없으면 빈 기록 */
  otCopyStats?: CopyStats
  /** 하나님 기록 (계획 14): 장을 다 필사해 발견한 줄 — 키워드·근거 구절·발견한 날 */
  godRecords: GodFind[]
  /**
   * 제본한 책 (계획 14 작업 4): 그대로 또는 특별하게(표지 색·무늬·책등 장식), 제본한 날.
   * 제본했지만 서고에 꽂지 않은 책 = 가방 속 완성본. 예전에 꽂은 책은 기록이 없어도 그대로 꽂혀 있다
   */
  bound: Bindings
  /** 오늘의 기록 (계획 14 작업 6): 그날 필사로 마친 장·받은 선물 — 잠들기 전 작은 일기에 쓰고, 잠들면 새 날의 빈 기록 */
  dayLog: DayLog
  /** 집 책장 (계획 14 작업 8): 집 책장 가구에 둔 다 쓴 책 (몇 권까지 — 서고의 책은 그대로, 한 부 더 두는 것) */
  homeShelf: Book[]
  /**
   * 지금 하는 짧은 동작 (계획 17 작업 3): 쉬기·잠·벤치 읽기·만들기·화덕·찻집 차 — 그림만 바뀐다.
   * left는 남은 실제 초(tick이 줄인다), 걷기 시작하면 끝. 저장하지 않는다(serialize가 뺀다)
   */
  act?: PlayerAct
  /**
   * 지금 있는 지도 (계획 20 작업 3): 없으면 첫 마을. 새 터는 flags.newlandGift 뒤에만 — player의 칸은 이 지도의 칸이다.
   * 새 터에 있는 동안 첫 마을의 이웃·동물·아이는 움직이지 않고 보이지 않는다 (같은 이웃이 두 곳에 있지 않다)
   */
  map?: MapId
  /** 지도마다 마지막으로 서 있던 칸 (떠날 때 적는다). 저장에서 불러올 때 걸을 수 없는 칸이면 그 지도의 입구 앞으로 */
  mapAt?: Partial<Record<MapId, Tile>>
  /**
   * 새 터의 건축 (계획 20 작업 6): 지은 것·공사 중인 것·깐 길과 정원. 땅이 드러났는지는 flags.newlandRevealed 하나로 본다.
   * 없으면 아무것도 짓지 않은 땅 (옛 저장·건물 0채)
   */
  newland?: NewlandState
  /** 새 터 입주 주택 안 가구 — 소유 공간별 ('newland:<건물 id>', 계획 20 작업 7). 첫 마을 집의 room과 섞이지 않는다 */
  rooms?: Record<string, Furniture[]>
}

/** 가구를 쓰는 동작 종류 — 그리는 쪽이 furnitureUseFrame/extraUseFrame으로 옮긴다 (blowCandle은 생일 빵 촛불 불기 — eventMotionFrame) */
export type ActKind = 'sit' | 'read' | 'drink' | 'craft' | 'knead' | 'reach' | 'rise' | 'blowCandle'
export interface PlayerAct {
  kind: ActKind
  /** 남은 시간 (실제 초) */
  left: number
  /** 처음 길이 (실제 초) — 단발 동작의 몇째 박자인지 셈한다 */
  total: number
  /** 그리는 방향 */
  facing: Facing
  /** 앉거나 눕는 자리(벤치·침대 칸) — 없으면 서 있는 칸에서 */
  at?: Tile
}
/** 동작 길이(실제 초): 사용 동작 한두 바퀴 (USE_INFO 프레임 시간 합 1.4~1.9초), 잠에서 깨기는 누운 채 잠깐 + 일어나기 */
export const ACT_SECONDS: Record<ActKind, number> = { sit: 1.8, read: 1.8, drink: 1.8, craft: 1.9, knead: 1.8, reach: 1.2, rise: 2, blowCandle: 1.4 }
/** 그 위에 앉는 자리 — 바라보는 앞 칸이 이것이면 그 칸 위에 앉아 앞을 본다 */
const SEAT_PLACES: readonly PlaceId[] = ['bench', 'homeBench', 'pavilion', 'hill']

/** 동작을 시작한다 (그림만). at을 주지 않으면 바라보는 앞 칸이 앉는 자리일 때 그 칸 위에 */
export function startAct(s: GameState, kind: ActKind, at?: Tile): GameState {
  const here = playerTile(s)
  const f = FRONT[s.player.facing]
  const front = { x: here.x + f.x, y: here.y + f.y }
  const place = placeAt(front)
  const seat = at ?? (place && SEAT_PLACES.includes(place) ? front : undefined)
  return { ...s, act: { kind, left: ACT_SECONDS[kind], total: ACT_SECONDS[kind], facing: seat ? 'down' : s.player.facing, ...(seat ? { at: seat } : {}) } }
}

/** 지도(world.tileAt)가 이 게임의 집 단계·열린 서고 방 문(방 표)을 보게 한다. 지도를 읽는 엔진 입구마다 부른다 */
export function syncHome(s: Pick<GameState, 'homeLevel'> & Partial<Pick<GameState, 'flags' | 'romance' | 'room' | 'village' | 'map' | 'newland'>>): void {
  // 지금 어느 지도에 있는가, 새 터의 입구가 열렸는가 (계획 20 작업 3)
  setActiveMap(s.map ?? 'village')
  setNewlandOpen(!!s.flags?.newlandGift)
  setNewlandRevealed(!!s.flags?.newlandRevealed)
  setNewlandOverlay(overlayFor(s.newland))
  setNewlandWarps(warpsFor(s.newland))
  setHomeLevel(s.homeLevel ?? 0)
  setHomeFurniture(s.room ?? initialHomeFurniture())
  setSpouseRoom(s.romance?.stage === 'married' ? s.romance.partner : null)
  setOpenDoors(openDoorsFor(s.flags ?? {}))
  // 집 앞 편지함(우체통)은 없앴다 — 편지는 문 앞 편지 바구니로 (2026-09-30 사용자)
  setMailbox(false)
  // 마을 공동 시설: 진행 중이거나 완성된 자리만 누를 수 있다 (계획 16 작업 20)
  syncVillage({ flags: s.flags ?? {}, village: s.village })
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
  /** 새 터 서고 문을 처음 밟았다 (계획 20 작업 4 — 아침빛과 본문 카드는 화면이 맡는다) */
  | { type: 'firstLight' }
  /** 새 터 서고에 들어서서 구약 조각 하나를 받았다 (하루 한 번 — 알림은 화면이 맡는다) */
  | { type: 'otPiece'; id: string }
  /** 지킨 약속 (계획 6b) */
  | { type: 'promiseKept'; npc: string }
  /** 동물의 작은 반응 한 줄 (계획 16 작업 21 — 글은 life-text pet.events) */
  | ({ type: 'pet' } & PetEvent)

// ── 만들기 ──

function defsById(content: GameContent): Record<string, NeighborDef> {
  return Object.fromEntries(content.neighbors.map((n) => [n.id, n]))
}

type GoalState = Pick<GameState, 'clock' | 'flags' | 'progress' | 'hearts' | 'today' | 'shelved'> & Partial<Pick<GameState, 'romance' | 'homeLevel' | 'life' | 'avatar' | 'plans' | 'npcs' | 'room' | 'stall' | 'village' | 'spaces' | 'player' | 'act' | 'child' | 'companion'>>

/**
 * 서고에 꽂은 책 수 (복음서·사도행전·편지 모두) — 마을 구역(lockedZones)과 서고 권수로 이사 오는 이웃이 이것을 센다.
 * 1권 목수 · 2권 약방 주인 · 3권 어부 · 4권 나루(여행) · 5권 포도밭 · 6권 벌통 (2026-09-30 사용자) · 7권 베 짜는 이웃
 * (2026-10-05: 2권에 약방과 겹치던 것을 7권으로 — 이미 이사 온 옛 저장은 movedIn 표식으로 그대로 산다).
 * 직업 단계(job.ts)와 복음서 방 잔치는 복음서만 따로 센다
 */
export function shelvedCount(s: Pick<GameState, 'shelved'>): number {
  return Object.values(s.shelved).filter((g) => g !== undefined).length
}

/**
 * 아직 이사 오지 않은 이웃 — 마을 단계(joinsAt)가 모자라거나, 서고 권수(joinsAtBooks)로 오는 이웃이면
 * 소개 장면이 나온 아침(잠들 때 세운 movedIn 표식)이 아직 오지 않았다
 */
export const notYet = (d: NeighborDef, level: number, flags: Record<string, number>) =>
  (d.joinsAt !== undefined && level < d.joinsAt) ||
  (d.joinsAtBooks !== undefined && !flags[`movedIn:${d.id}`]) ||
  (!!d.joinsWithFamily && !!d.family && !flags[`movedIn:${d.family}`])

function goalContext(s: GoalState, content: GameContent) {
  rememberDefs(content)
  const special: Record<string, Tile | null> = {}
  const meet = meetContext(s, content)
  for (const d of content.neighbors) if (!meet.joined(d.id)) special[d.id] = null
  // 살아 움직이는 사람들 (계획 6b): 이벤트 자리 > 목격 자리 > 일과 (아래 잔치·모임·사랑방이 덮는다).
  // 아직 열리지 않은 구역(나루·벌통 들…) 안의 자리는 건너뛰고 시간표로 (goalFor가 열린 자리를 고른다)
  for (const d of content.neighbors) if (meet.joined(d.id)) {
    const at = personSpot(s, d.id, meet)
    if (at === 'away') special[d.id] = null
    else if (at && !meet.locked.has(key(at))) special[d.id] = at
  }
  Object.assign(special, meet.late, appointmentSpots(s))
  const w = weatherOf(s.clock.day)
  return {
    minute: s.clock.minute,
    wet: isWet(w),
    market: isMarketDay(s.clock.day),
    festival: festivalOf(s.clock.day) !== null && !isWet(w),
    special,
    locked: meet.locked,
  }
}

/** 일과를 고를 때 보는 것 (계획 16 작업 3): 이사 온 이웃, 열리지 않은 칸, 일과 위에 덮이는 자리 */
interface MeetContext {
  joined: (id: string) => boolean
  locked: ReadonlySet<string>
  /** 일과 위에 덮이는 자리 (아이 놀이·배움, 아침 손님, 이웃 모임, 배우자, 사랑방, 잔치·결혼 잔치) */
  late: Record<string, Tile>
}

function meetContext(s: GoalState, content: Pick<GameContent, 'neighbors'>): MeetContext {
  // 아직 이사 오지 않은 이웃은 보이지 않는다 — 소개 장면이 나오는 새 날 아침부터 (잠들 때 정한 단계)
  const level = s.flags.villageLevel ?? 0
  const notJoined = new Set(content.neighbors.filter((d) => notYet(d, level, s.flags)).map((d) => d.id))
  const joined = (id: string) => !notJoined.has(id)
  return { joined, locked: lockedTiles(shelvedCount(s)), late: lateSpots(s, content, joined) }
}

/** 일과 위에 덮이는 자리 — 우선순위는 이벤트 > 목격 > 일과 > (이것들) */
function lateSpots(s: GoalState, content: Pick<GameContent, 'neighbors'>, joined: (id: string) => boolean): Record<string, Tile> {
  const w = weatherOf(s.clock.day)
  const m = s.clock.minute
  const special: Record<string, Tile> = {}
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
  if (r.stage === 'married' && r.partner && (m >= SPOUSE_HOME_FROM || m < SPOUSE_HOME_TO)) special[r.partner] = homeSeatsNow(s).spouse ?? safeHomeSpot(SPOUSE_ROOM_STAND, s.room ?? [])
  // 마을 사랑방 (계획 10): 모임·잔치·저녁 초대가 없는 저녁, 이웃 셋이 긴 탁자 둘레에 모인다 (비 와도 — 집 안이라)
  if (hallOpen(m)) hallGuestsToday(s, content).forEach((id, i) => (special[id] = HALL_SPOTS[i]))
  // 복음서 방 잔치 저녁: 이사 온 이웃은 모두(상인도) 광장 모닥불 둘레로 — 비가 와도 연다
  if (feastToday(s) && m >= FESTIVAL_FROM && m < FESTIVAL_TO)
    for (const [id, spot] of Object.entries(FESTIVAL_SPOTS)) if (joined(id)) special[id] = spot
  // 결혼 잔치 저녁 (계획 6): 이사 온 이웃은 모두 광장 모닥불 둘레로, 약혼자는 모닥불 바로 위 — 비가 와도 연다
  // 모닥불에 닿아 부부가 된 뒤에도 그날 잔치 시간 동안은 그대로 (계획 17 작업 4 — 결혼식 동작을 보이게)
  if (weddingEvening(s)) {
    for (const [id, spot] of Object.entries(FESTIVAL_SPOTS)) if (joined(id)) special[id] = spot
    special[r.partner!] = WEDDING_SPOT
  }
  // 마을 잔치 저녁 (맑은 날): 일과보다 모닥불이 먼저 (계획 16 작업 3 — 예전엔 일과가 있는 이웃이 일과 자리에 남았다).
  // 장날만 오는 상인은 장날 잔치에만, 이미 다른 자리(결혼 잔치·배우자…)가 정해진 이웃은 그대로
  if (festivalOf(s.clock.day) && !isWet(w) && m >= FESTIVAL_FROM && m < FESTIVAL_TO)
    for (const d of content.neighbors)
      if (joined(d.id) && FESTIVAL_SPOTS[d.id] && !(d.id in special) && (!d.marketOnly || isMarketDay(s.clock.day))) special[d.id] = FESTIVAL_SPOTS[d.id]
  Object.assign(special, appointmentSpots(s))
  // 내 좌판 손님 (계획 16 작업 19): 맞이하는 동안 좌판 곁에 서 있다 — 잔치·약속은 그대로 우선
  const guest = stallGuestNow(s)
  if (guest && joined(guest) && !(guest in special)) special[guest] = STALL_GUEST_SPOT
  // 마을 공동 시설을 짓는 오전 (계획 16 작업 20): 보탤 몫이 남은 관심 이웃이 현장에 모인다 — 잔치·약속·이야기를 기다리는 이웃은 그대로 우선
  for (const [id, spot] of Object.entries(crewNow(s, content, joined))) if (!(id in special) && !eventNow(s, id)) special[id] = spot
  return special
}

/**
 * 오늘 저녁 사랑방에 모이는 이웃 (계획 10). 마을 잔치·이웃 모임·복음서 방 잔치 날 저녁은 모두 그쪽에 가므로 없다.
 * 이사 온 이웃 중에서 (상인·아이 빼고) 날 씨앗으로 셋, 오늘 저녁 초대한 이웃은 제 집에 있으니 뺀다
 */
export function hallGuestsToday(s: GoalState, content: Pick<GameContent, 'neighbors'>): string[] {
  const t = s.today ?? NO_TODAY
  if (festivalOf(s.clock.day) || feastToday(s) || weddingToday(s) || t.gathering === 'babyParty' || t.gathering === 'starNight') return []
  const level = s.flags.villageLevel ?? 0
  const joined = content.neighbors.filter((d) => !d.marketOnly && !notYet(d, level, s.flags)).map((d) => d.id)
  // 배우자는 저녁에 집에 있다
  const spouse = s.romance?.stage === 'married' ? s.romance.partner : null
  return hallGuests(s.clock.day, joined.filter((id) => id !== t.inviter && id !== spouse && !reservedMembers(s).includes(id))).slice(0, HALL_GUESTS)
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

/**
 * 오늘의 말씀 조각 (계획 14 작업 5): 날마다 이웃 여럿이 건네던 조각(예전 offers)을 드문 조각으로 —
 * 조각 오는 날(일주일에 몇 번, 날 씨앗)에 편지 하나(post) 또는 오늘 나온 이웃 한 명의 특별한 대화(offers).
 * 고른 책·필사하는 책과 묶지 않는다 (27권 어느 책의 조각이든). 편지는 그 이웃이 나오지 않는 날에도 문 앞 편지 바구니에 든다
 */
function todaysFragments(day: number, collected: readonly string[], content: GameContent, present: readonly string[]): { offers: Record<string, string>; post: string[] } {
  return fragmentsForDay({ day, pieces: content.pieces, collected, present })
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
  // homeLayout: 지금 집 배치(작업실·배우자방·아이방·생활방)라는 표식 (그 전 저장은 불러올 때 집 안을 새로 놓는다 — save.ts)
  const flags: Record<string, number> = { heartPoints: 1, homeLayout: 2 }
  const progress = emptyProgress()
  const base = { clock, flags, progress, hearts: {}, today: NO_TODAY, shelved: {} }
  // 새 게임은 넓히기 전 집 — 지도(모듈 전역 집 단계)도 0으로, 서고의 방 문은 모두 닫힌 채
  setActiveMap('village')
  setNewlandOpen(false)
  setHomeLevel(0)
  setHomeFurniture(initialHomeFurniture())
  setSpouseRoom(null)
  setOpenDoors([])
  setMailbox(false)
  syncVillage({ flags })
  return {
    version: 1,
    plans: { ...NO_PLANS, appts: [] },
    clubs: [], clubSessions: {}, clubWorks: {}, fests: [], spaces: [],
    clock,
    player: { x: START.x, y: START.y, path: [], facing: 'down', walkTime: 0 },
    idle: IDLE_RESET,
    target: null,
    offers: {},
    post: [],
    collected: [],
    pieceLog: {},
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
    room: initialHomeFurniture(),
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
    notebook: NO_NOTEBOOK,
    child: null,
    found: [],
    achieved: [],
    copy: NO_COPY,
    copyStats: NO_COPY_STATS,
    godRecords: [],
    bound: {},
    dayLog: emptyDayLog(clock.day),
    homeShelf: [],
  }
}

/**
 * 예전 엮기의 지금 책을 고른다 (계획 14부터 책상은 필사 — 이 길은 옛 흐름과 테스트용).
 * 말씀 조각은 고른 책과 묶지 않으므로 오늘의 조각(offers·post)은 그대로 둔다 (계획 14 작업 5)
 */
export function chooseBook(s: GameState, book: Book, content: GameContent): GameState {
  if (!content.pieces.some((p) => p.book === book)) return s
  // 복음서 방 밖의 책은 그 서고 방이 열린 뒤에만 (화면이 막아도 엔진에서 한 번 더)
  if (!bookRoomOpen(book, s.flags)) return s
  return { ...s, activeBook: book }
}

/** 불러온 뒤 이웃을 제자리에 세운다 (걷던 길은 저장하지 않으므로) */
export function settle(s: GameState, content: GameContent): GameState {
  // 아래 따라잡기들은 첫 마을의 일이다 — 새 터에서 불러와도 먼저 첫 마을 지도로 (아래 syncHome이 저장의 지도로 맞춘다)
  setActiveMap('village')
  s = furnishSpouse(s)
  s = expireStall(expireWorkDay(s))
  // 옛 저장에서 이미 잔치가 지났으면 불러온 뒤 첫 기회에 받는다 (한 번 — 플래그 newlandGift)
  s = grantNewland(s)
  s = advancePlans(s, content)
  // 접속하지 않은 사이 이웃이 보탠 몫을 하루씩 따라잡는다 (같은 날은 한 번만)
  s = advanceVillage(s, content)
  syncHome(s)
  // 지도를 옮기기 전 저장은 지금은 집 안인 칸에 서 있을 수 있다 — 갇히지 않게 집 앞으로 옮긴다
  // (방·내 집 안은 마을과 이어지지 않으므로 걸을 수 있기만 하면 된다)
  const away = currentMapId() === 'newland'
  const stuck = (t: Tile) => !isWalkable(t) || (!away && !roomAt(t) && !isHome(t) && findPath(t, HOME_FRONT) === null)
  let player = { ...s.player, path: [] as Tile[] }
  if (stuck(playerTile(s))) {
    const at = away ? entryFront('newland') : HOME_FRONT
    player = { ...player, x: at.x, y: at.y, facing: 'down', walkTime: 0 }
  }
  let companion = s.companion
  // 동물은 첫 마을에 남는다 — 새 터에서는 그 자리를 새 터 지도로 따지지 않는다
  if (companion && !away && stuck({ x: Math.round(companion.x), y: Math.round(companion.y) })) {
    const near = companionGoal({ x: Math.round(player.x), y: Math.round(player.y) }, false) ?? { x: Math.round(player.x), y: Math.round(player.y) }
    companion = { ...companion, x: near.x, y: near.y, path: [] }
  }
  return { ...s, npcs: placeAllNpcs(s, content), target: null, idle: IDLE_RESET, act: undefined, player, companion }
}

export function playerTile(s: GameState): Tile {
  return { x: Math.round(s.player.x), y: Math.round(s.player.y) }
}

export function outdoors(s: GameState): boolean {
  return !isIndoor(playerTile(s))
}

function blockersOf(s: GameState): Set<string> {
  // 새 터: 첫 마을의 이웃·가구·잠긴 구역은 이 지도에 없다
  // (입주 주택 안 방에서는 그 방의 길 막는 가구만)
  if (currentMapId() === 'newland') return solidTiles(roomOf(s))
  return new Set([...Object.values(s.npcs).filter((n) => n.visible).map((n) => key(npcTile(n))), ...solidTiles(s.room), ...lockedTiles(shelvedCount(s)), ...closedDoors(s), ...storyPropBlockers(s)])
}

/** 아직 이사 오지 않은 이웃의 집 — 열리기 전에는 덤불로 덮이고 들어갈 수 없다 (2026-09-30 사용자) */
export function closedHouseIds(s: Pick<GameState, 'flags'>): string[] {
  const level = s.flags.villageLevel ?? 0
  return [...CONTENT_DEFS.values()].filter((d) => notYet(d, level, s.flags) && HOUSES.some((h) => h.id === d.id)).map((d) => d.id)
}
function closedDoors(s: Pick<GameState, 'flags'>): string[] {
  const ids = closedHouseIds(s)
  return HOUSES.filter((h) => ids.includes(h.id)).map((h) => `${h.doorX},${h.y1}`)
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
  const path = findPath(from, to, blockersOf(s))
  if (!path || path.length !== 1) {
    // 막혀서 못 가도 그쪽을 바라본다 — 스페이스로 앞에 있는 이웃·물건과 상호작용하려면 필요하다
    const facing = facingFor(dx, dy, s.player.facing)
    return facing === s.player.facing ? s : { ...s, player: { ...s.player, facing } }
  }
  return { ...s, player: { ...s.player, path }, target: null, idle: IDLE_RESET, act: undefined }
}

const FRONT: Record<Facing, Tile> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }

/** 그 칸에 누를 만한 것(이웃·길 동물·동반 동물·장소)이 있는가 */
function interactableAt(s: GameState, t: Tile): boolean {
  if (portalAt(t)) return true
  if (currentMapId() === 'newland') return false
  return (
    Object.values(s.npcs).some((n) => n.visible && sameTile(npcTile(n), t)) ||
    straysToday(s).some((a) => sameTile(STRAY_SPOTS[a], t)) ||
    (!!s.companion && sameTile({ x: Math.round(s.companion.x), y: Math.round(s.companion.y) }, t)) ||
    placeAt(t) !== null ||
    bookcaseAt(s, t) || !!spaceAtTile(s, t) || s.room.some(f => f.item.startsWith('spouse:') && footprint(f).some(p => sameTile(p, t)))
  )
}

/** 그 칸에 집 책장(놓은 책장 가구)이 있는가 — 누르면 집 책장 창 (계획 14 작업 8) */
export function bookcaseAt(s: Pick<GameState, 'room'>, t: Tile): boolean {
  return s.room.some((f) => f.item === 'bookcase' && !f.on && footprint(f).some((p) => sameTile(p, t)))
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
  const portal = portalAt(tile)
  if (portal) return tapPortal(s, tile, portal)
  if (currentMapId() === 'newland') return tapNewland(s, tile)
  if (sameTile(tile, from) && s.player.path.length === 0) {
    return { ...s, player: { ...s.player, facing: 'down' }, idle: greet(), target: null }
  }
  const blockers = blockersOf(s)
  let target: Target
  let path: Tile[] | null
  const npc = Object.values(s.npcs).find((n) => n.visible && sameTile(npcTile(n), tile))
  const stray = straysToday(s).find((a) => sameTile(STRAY_SPOTS[a], tile))
  const pet = s.companion && sameTile({ x: Math.round(s.companion.x), y: Math.round(s.companion.y) }, tile)
  const kid = childTile(s)
  const place = placeAt(tile)
  const custom = s.room.find(f => f.item.startsWith('spouse:') && footprint(f).some(p => sameTile(p, tile)))
  if (!npc && !place && custom) {
    const meta = SPOUSE_FURNITURE[custom.item]
    if (isNear(from, tile) && !s.player.path.length) {
      const kind: ActKind = meta.id.includes('desk') ? 'craft' : meta.id.includes('personal') || meta.id.includes('bookcase') ? 'read' : meta.id.includes('sideboard') || meta.id.includes('keepsake') ? 'reach' : 'sit'
      return startAct({ ...s, target: null }, kind, tile)
    }
    const path = pathToward(from, tile, blockers)
    return path ? { ...s, player: { ...s.player, path }, target: { kind: 'ground' }, idle: IDLE_RESET } : s
  }
  if (kid && sameTile(kid, tile) && !npc) {
    target = { kind: 'child' }
    path = sameTile(kid, from) ? [] : pathToward(from, tile, new Set([...blockers, key(tile)]))
  } else if (npc) {
    target = { kind: 'neighbor', id: npc.id, tries: 0, talk: isNear(from, tile) }
    path = pathToward(from, tile, blockers)
  } else if (stray) {
    target = { kind: 'stray', animal: stray }
    path = isNear(from, tile) ? [] : pathToward(from, tile, new Set([...blockers, key(tile)]))
  } else if (pet) {
    target = { kind: 'companion' }
    path = isNear(from, tile) ? [] : pathToward(from, tile, new Set([...blockers, key(tile)]))
  } else if (!place && !bookcaseAt(s, tile) && spaceAtTile(s, tile)) {
    // 정해 둔 자리의 의자·탁자: 곁에 서 있으면 바로, 아니면 곁으로 걸어가 쓰임 메뉴를 연다
    target = { kind: 'space', id: spaceAtTile(s, tile)!.id, tile }
    path = isNear(from, tile) ? [] : pathToward(from, tile, blockers)
  } else if (!place && bookcaseAt(s, tile)) {
    // 집 책장: 곁에 서 있으면 그 자리에서 바로, 아니면 곁으로 걸어가서 연다
    target = { kind: 'bookcase', tile }
    path = isNear(from, tile) ? [] : pathToward(from, tile, blockers)
  } else if (place) {
    target = { kind: 'place', id: place, tile }
    const stand = PLACES[place].stand
    // 이미 곁에 서 있으면 정해진 자리로 옮겨 가지 않고 그 자리에서 바로 연다 (2026-10-04 사용자)
    const near = PLACES[place].tiles.some((t) => Math.max(Math.abs(t.x - from.x), Math.abs(t.y - from.y)) <= 1) || (!!stand && sameTile(from, stand))
    path = near ? [] : stand ? findPath(from, stand, blockers) : pathToward(from, tile, blockers)
  } else {
    target = { kind: 'ground' }
    path = findPath(from, tile, blockers)
  }
  if (path === null) return { ...s, idle: IDLE_RESET }
  const snap = s.player.x !== from.x || s.player.y !== from.y ? [from] : []
  return { ...s, player: { ...s.player, path: [...snap, ...path] }, target, idle: IDLE_RESET }
}

function targetTile(s: GameState, target: Target): Tile | null {
  if (target.kind === 'portal') return currentMapId() === 'newland' ? NEWLAND_PORTAL : VILLAGE_PORTAL
  if (target.kind === 'neighbor') {
    const n = s.npcs[target.id]
    return n ? npcTile(n) : null
  }
  if (target.kind === 'place' || target.kind === 'bookcase' || target.kind === 'space') return target.tile
  if (target.kind === 'stray') return STRAY_SPOTS[target.animal]
  if (target.kind === 'companion' && s.companion) return { x: Math.round(s.companion.x), y: Math.round(s.companion.y) }
  if (target.kind === 'child') return childTile(s)
  return null
}

function warpTo<T extends GameState['player']>(player: T, to: Tile): T {
  return { ...player, x: to.x, y: to.y, path: [], facing: roomAt(to) || isHome(to) ? 'up' : 'down' }
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
  if (currentMapId() === 'newland') return tickNewland(s, dt, rng)
  const clock = advance(s.clock, dt)
  const minutes = clock.minute - s.clock.minute
  const here = playerTile(s)
  const season = seasonOf(clock.day)
  const needs = tickNeeds(s.needs, minutes, {
    indoor: isIndoor(here),
    season,
    phase: phaseOf(clock.minute),
    warm: !!PLACES.hearth.stand && sameTile(here, PLACES.hearth.stand),
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
  s = advanceVillage(advancePlans({ ...s, clock }, content), content)
  const apptAt = appointmentSpots(s)
  const gctx = goalContext({ ...s, clock }, content)
  const npcs: Record<string, Npc> = {}
  const furnitureBlockers = new Set([...solidTiles(s.room), ...lockedTiles(shelvedCount(s)), ...storyPropBlockers(s)])
  for (const [id, n] of Object.entries(s.npcs)) npcs[id] = defs[id] ? stepNpc(n, defs[id], goalFor(defs[id], gctx), dt, furnitureBlockers) : n

  for (const [id, at] of Object.entries(apptAt)) if (npcs[id]) npcs[id] = { ...npcs[id], ...at, path: [], visible: true }

  // 도착
  let target = warp ? null : s.target
  if (target && player.path.length === 0) {
    const tt = targetTile({ ...s, npcs }, target)
    if (target.kind === 'neighbor') {
      const n = npcs[target.id]
      if (n?.visible && isNear(now, npcTile(n))) {
        // 곁에서 누른 것만 바로 대화 — 걸어와 닿으면 곁에 서 있고, 화면의 '대화하기' 단추로 말을 건다
        if (target.talk) events.push({ type: 'arrived', target })
        target = null
      } else if (n?.visible && target.tries < 3) {
        // 걸어가는 사이 이웃이 움직였다 — 다시 따라간다
        const p = pathToward(now, npcTile(n), new Set([...furnitureBlockers, ...Object.values(npcs).filter((o) => o.visible).map((o) => key(npcTile(o)))]))
        if (p && p.length) {
          player = { ...player, path: p }
          target = { ...target, tries: target.tries + 1 }
        } else target = null
      } else target = null
    } else {
      events.push({ type: 'arrived', target })
      target = null
    }
    if (tt && player.path.length === 0) player = { ...player, facing: facingFor(tt.x - now.x, tt.y - now.y, player.facing) }
  }

  // 동반 동물
  let companion = s.companion
  if (companion?.motion) companion = { ...companion, motion: companion.motion.left > dt ? { ...companion.motion, left: companion.motion.left - dt } : undefined }
  if (companion?.stay) {
    const occupied = new Set([...furnitureBlockers, ...Object.values(npcs).filter(n=>n.visible).map(n=>key(npcTile(n))), key(now)])
    // 집에 두기가 습관보다 먼저: 좋아하는 자리·낮잠·놀이 자리를 시각·날씨·계절·성향에서 고르고, 꾸미기로 자리가 사라지면 안전한 다른 칸으로 옮긴다
    const homeGoal = petStayGoal({ ...s, clock, player, idle: s.idle }, companion, occupied, now)
    const here = { x: Math.round(companion.x), y: Math.round(companion.y) }
    if (!isHome(here) || occupied.has(key(here))) companion = { ...companion, x: homeGoal.x, y: homeGoal.y, path: [] }
    else companion = stepCompanion(companion, homeGoal, dt * pace, occupied)
  }
  // 집에 둔 동물은 집 안 자리에서 기다린다 (따라오지 않는다)
  if (companion && !companion.stay) {
    const rainOut = isWet(weatherOf(clock.day)) && !isIndoor(now)
    // 내 집 문을 드나들면 동물도 함께 (집 안은 지도 아래 따로 된 방이라 걸어서는 못 따라온다)
    const homeWarp = warp && (isHome(warp) || isHome(now))
    const near = homeWarp ? besideNotDoor(warp) : null
    if (near) companion = { ...companion, x: near.x, y: near.y, path: [] }
    // 동물도 신의 배수만큼 빨리 — 늘 기록자보다 조금 빠르게 따라온다
    else companion = stepCompanion(companion, companionGoal(now, rainOut), dt * pace, furnitureBlockers)
  }

  const idle = moving ? IDLE_RESET : stepIdle(s.idle, dt, clock.minute, rng, totalChapters(s) >= 3)
  // 가구 쓰는 동작: 걷기 시작하면(길이 생기면) 끝, 아니면 실제 시간만큼 줄어 다 되면 끝
  const act = !s.act || moving || player.path.length > 0 || s.act.left <= dt ? undefined : { ...s.act, left: s.act.left - dt }
  const base: GameState = { ...s, clock, needs, player, target, idle, act, npcs, companion, trails }
  const lived = liveNearby(petLife(base, now, events, childTile(base)), now, events)
  if (lived.scenes.length > s.scenes.length) return { state: lived, events }
  const next: GameState = blowCandle(lived)

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

/**
 * 생일 빵 촛불 (계획 17 작업 5): 오늘 선물한 생일 이웃 곁의 빵 옆에 서면 그날 처음 한 번 촛불을 분다 —
 * 꺼진 초 상태를 그날로 한 번 적어 두고(다시 켜지지 않는다) 촛불 부는 동작만. 보상은 없다
 */
function blowCandle(s: GameState): GameState {
  const b = candleToBlow(s)
  if (!b) return s
  const facing = faceToward(playerTile(s), b.at, s.player.facing)
  return { ...s, flags: { ...s.flags, [candleKey(b.id)]: s.clock.day }, act: { kind: 'blowCandle', left: ACT_SECONDS.blowCandle, total: ACT_SECONDS.blowCandle, facing } }
}

// ── 두 맵 왕래 (계획 20 작업 3) ──

/** 건너갈 수 없는 까닭 — 'here' 이미 그 지도 · 'locked' 새 터가 아직 열리지 않음 · 'copy' 필사창이 열려 있음 · 'scene' 장면이 남아 있음 · 'late' 날이 저묾 · 'appt' 약속이 진행 중 */
export type TravelBlock = 'here' | 'locked' | 'copy' | 'scene' | 'late' | 'appt'

/** 그 지도로 건너갈 수 없는 까닭 하나 (건널 수 있으면 null). 돌아가기는 날이 저물어도, 약속이 있어도 막지 않는다 */
export function canTravel(s: GameState, to: MapId, opts: { copyOpen?: boolean } = {}): TravelBlock | null {
  if (to === (s.map ?? 'village')) return 'here'
  if (to === 'newland' && !s.flags.newlandGift) return 'locked'
  if (opts.copyOpen) return 'copy'
  if (s.scenes.length > 0) return 'scene'
  if (to === 'newland') {
    const m = Math.floor(s.clock.minute)
    if (m < TRAVEL_FROM_MINUTE || m > TRAVEL_LAST_MINUTE) return 'late'
    if (Object.keys(appointmentSpots(s)).length > 0) return 'appt'
  }
  return null
}

/**
 * 건너간다: 30분이 흐르고(같은 날 안에서 — 날짜는 바뀌지 않는다), 지도가 바뀌고, 기록자는 그 지도의 입구 앞에 선다.
 * 떠난 지도의 자리는 mapAt에 적는다. 첫 마을로 돌아오면 이웃을 그 시각의 자리에 한 번 놓는다
 * (새 터에 있는 동안 이웃은 움직이지도 보이지도 않았다). 가구·소지품·돈·관계·필사 진행은 건드리지 않는다
 */
export function travel(s0: GameState, to: MapId, content: GameContent, opts: { copyOpen?: boolean } = {}): GameState {
  syncHome(s0)
  if (canTravel(s0, to, opts)) return s0
  const from = s0.map ?? 'village'
  const front = entryFront(to)
  const mapAt = { ...s0.mapAt, [from]: playerTile(s0) }
  const player = { ...s0.player, x: front.x, y: front.y, path: [] as Tile[], facing: to === 'newland' ? ('right' as const) : ('left' as const), walkTime: 0 }
  if (to === 'newland') {
    // 30분은 떠나는 첫 마을에서 흐른다 (이웃·약속의 정산이 첫 마을의 일이므로)
    const timed = passTime(s0, TRAVEL_MINUTES)
    const next: GameState = { ...timed, map: to, mapAt, player, target: null, act: undefined, idle: IDLE_RESET }
    syncHome(next)
    return next
  }
  const arrived: GameState = { ...s0, map: to, mapAt, player, target: null, act: undefined, idle: IDLE_RESET }
  syncHome(arrived)
  const timed = passTime(arrived, TRAVEL_MINUTES)
  const next: GameState = { ...timed, npcs: placeAllNpcs(timed, content) }
  syncHome(next)
  return next
}

/** 왕래 표식을 눌렀을 때: 표식 바로 앞까지 걸어가 서고, 닿으면 건너가는 창이 열린다 (store의 arrive) */
function tapPortal(s: GameState, tile: Tile, to: MapId): GameState {
  const from = playerTile(s)
  const path = findPath(from, tile, blockersOf(s))
  if (path === null) return { ...s, idle: IDLE_RESET }
  const snap = s.player.x !== from.x || s.player.y !== from.y ? [from] : []
  return { ...s, player: { ...s.player, path: [...snap, ...path.slice(0, -1)] }, target: { kind: 'portal', to }, idle: IDLE_RESET }
}

/** 새 터의 땅을 눌렀을 때: 걸어갈 수 있는 곳이면 걸어간다 (이웃·가구는 이 지도에 없고, 장소는 서고 안 책상·책장뿐) */
function tapNewland(s: GameState, tile: Tile): GameState {
  const from = playerTile(s)
  const place = placeAt(tile)
  if (place) {
    const stand = PLACES[place].stand
    // 이미 곁에 서 있으면 정해진 자리로 옮겨 가지 않고 그 자리에서 바로 연다 (집 책상과 같다)
    const near = PLACES[place].tiles.some((t) => Math.max(Math.abs(t.x - from.x), Math.abs(t.y - from.y)) <= 1) || (!!stand && sameTile(from, stand))
    const path = near ? [] : stand ? findPath(from, stand) : null
    if (path === null) return { ...s, idle: IDLE_RESET }
    const snap = s.player.x !== from.x || s.player.y !== from.y ? [from] : []
    return { ...s, player: { ...s.player, path: [...snap, ...path] }, target: { kind: 'place', id: place, tile }, idle: IDLE_RESET }
  }
  if (sameTile(tile, from) && s.player.path.length === 0) return { ...s, player: { ...s.player, facing: 'down' }, idle: greet(), target: null }
  const path = findPath(from, tile)
  if (path === null) return { ...s, idle: IDLE_RESET }
  const snap = s.player.x !== from.x || s.player.y !== from.y ? [from] : []
  return { ...s, player: { ...s.player, path: [...snap, ...path] }, target: { kind: 'ground' }, idle: IDLE_RESET }
}

/**
 * 새 터에서의 한 걸음: 시간·몸 상태·걷기·서고 문 드나들기·도착 알림만. 첫 마을의 이웃·동물·아이·약속·행사·목격·말 걸기는 모두 건너뛴다
 * (그들은 첫 마을에 그대로 있고, 돌아오면 travel이 한 번 다시 놓는다)
 */
function tickNewland(s: GameState, dt: number, rng: Rng): { state: GameState; events: GameEvent[] } {
  const events: GameEvent[] = []
  const clock = advance(s.clock, dt)
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
  const moving = s.player.path.length > 0
  let player = stepActor(s.player, (starving(needs) ? dt * 0.7 : dt) * walkMul(s.inv)).actor
  const now = { x: Math.round(player.x), y: Math.round(player.y) }
  const warp = !sameTile(now, here) ? warpAt(now) : undefined
  if (warp) player = { ...player, x: warp.x, y: warp.y, path: [], facing: inArchiveRoom(warp) || roomSlotAt(warp) >= 0 ? 'up' : 'down' }
  let target = warp ? null : s.target
  // 서고 문을 처음 밟는 순간 (한 번 — 플래그 newlandLight): 어두운 안이 아침빛으로 밝아지고 본문 카드가 이어진다
  let flags = s.flags
  // 새 터에 처음 들어온 뒤 첫 걸음 (표식만 남긴다 — 필사·건축과 무관)
  if (!flags.newlandVisited) flags = { ...flags, newlandVisited: 1 }
  if (warp && !flags.newlandLight && now.x === ARCHIVE.door.x && now.y === ARCHIVE.door.y) {
    flags = { ...flags, newlandLight: 1 }
    events.push({ type: 'firstLight' })
  }
  // 구약 조각: 새 터에 있는 날 서고에 처음 들어설 때 하루 한 번 — 아직 없는 구약 조각 중 날 씨앗으로 하나 (보상·필사 조건 아님)
  let otCollected = s.otCollected
  if (warp && inArchiveRoom(warp) && flags.newlandGift && flags[OT_PIECE_DAY_FLAG] !== clock.day) {
    flags = { ...flags, [OT_PIECE_DAY_FLAG]: clock.day }
    const id = drawOtPiece(otCollected ?? [], clock.day)
    if (id) {
      otCollected = [...(otCollected ?? []), id]
      events.push({ type: 'otPiece', id })
    }
  }
  if (target && player.path.length === 0) {
    events.push({ type: 'arrived', target })
    const tt = targetTile(s, target)
    if (tt) player = { ...player, facing: facingFor(tt.x - now.x, tt.y - now.y, player.facing) }
    target = null
  }
  const idle = moving ? IDLE_RESET : stepIdle(s.idle, dt, clock.minute, rng, totalChapters(s) >= 3)
  const act = !s.act || moving || player.path.length > 0 || s.act.left <= dt ? undefined : { ...s.act, left: s.act.left - dt }
  return { state: { ...s, clock, needs, player, target, idle, act, flags, ...(otCollected ? { otCollected } : {}) }, events }
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
  const content = { neighbors: [...CONTENT_DEFS.values()] }
  return advanceVillage(advancePlans({ ...s, clock, needs }, content), content)
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

function reqCtx(s: GoalState, npc: string, propsReady = true) {
  const r = s.romance ?? NO_ROMANCE
  const def = CONTENT_DEFS.get(npc)
  let placed: readonly string[] | null = null
  return {
    life: s.life ?? NO_LIFE,
    npc,
    day: s.clock.day,
    lover: r.partner === npc && !!r.stage,
    suitor: !!def?.romanceable && !!def.look && def.look !== (s.avatar?.look ?? 'f'),
    threads: peopleData().threads,
    // 계획 16 작업 2: 사이(rel·minStage)·이야기 완료 표식(story)
    stage: stageWith(s, npc),
    romance: r.partner === npc ? r.stage : null,
    flags: s.flags,
    // 지금 놓여 있는 이야기 뒤 소품 (계획 16 작업 4) — 쓸 때만 센다. 소품 조건 안에서는 다른 소품을 보지 않는다(되묻기 없음)
    get placed(): readonly string[] {
      if (!propsReady) return []
      return (placed ??= storyPropsNow(s).map((p) => p.id))
    },
    // 계획 16 작업 11: 아직 이사 오지 않은 이웃 (notJoined) — 그 이웃 없이 끝나는 다른 길
    joined: (id: string) => {
      const d = CONTENT_DEFS.get(id)
      return !d || !notYet(d, s.flags.villageLevel ?? 0, s.flags)
    },
  }
}

// ── 이야기 이후의 변화 (계획 16 작업 4): 완료 표식 하나로 소품·일과·말 ──

/** 지금 보이는 이야기 뒤 소품 (주인이 이사 와 있고 조건·때가 맞는 것) */
export function storyPropsNow(s: GoalState): (StoryProp & { npc: string })[] {
  const out: (StoryProp & { npc: string })[] = []
  const m = momentOf(s)
  for (const p of Object.values(peopleData().people)) {
    if (!p.props?.length) continue
    const def = CONTENT_DEFS.get(p.id)
    if (def && notYet(def, s.flags.villageLevel ?? 0, s.flags)) continue
    const ctx = reqCtx(s, p.id, false)
    for (const pr of p.props) if (whenMatches(pr.when, m) && reqMet(pr.req, ctx)) out.push({ ...pr, npc: p.id })
  }
  return out
}

/** 길을 막는 이야기 뒤 소품 칸 (기존 가구 중 막는 것, 또는 solid로 적은 것) */
function storyPropBlockers(s: GoalState): string[] {
  return storyPropsNow(s)
    .filter((p) => (p.item ? FURNITURE_DEFS[p.item]?.layer === 'solid' : !!p.solid))
    .flatMap((p) => propFootprint(p.at, p.item, p.size).map(key))
}

/**
 * 이야기를 끝낸다: 완료 표식 story:<id> (1, 갈래면 outcome+1) — 이미 있으면 바꾸지 않는다(다른 갈래가 섞이지 않게, 한 번만).
 * 실제로 등장한 주민 모두에게 경험 story:<id>, 남는 물건이 있으면 가방에 하나. 다른 표식·해금·사건 단계는 건드리지 않는다
 */
function completeStory(s: GameState, owner: string, e: PersonEvent, choice?: number): GameState {
  if (!e.completes) return s
  const flag = `story:${e.completes}`
  if (s.flags[flag]) return s
  const outcome = choice !== undefined ? e.choices?.[choice]?.outcome : undefined
  let next: GameState = { ...s, flags: { ...s.flags, [flag]: outcome !== undefined ? outcome + 1 : 1 } }
  next = recordExperienceIn(next, { id: flag, kind: 'story', with: eventCast(owner, e, choice), ...(choice !== undefined ? { choice } : {}) })
  if (e.keepsake) next = { ...next, inv: add(next.inv, { [e.keepsake]: 1 }) }
  return next
}

/** 이 사건은 다 겪기 전에 이어 갈 것이 있는가 (고를 말로 끝나는 이야기, 손일을 함께하는 말) */
const needsFollowUp = (e: PersonEvent) => !!e.choices?.length && (!!e.completes || e.choices.some((c) => c.mini))

/**
 * 이 이웃과 이어 갈 이야기 (계획 16 작업 4): 손일 놀이가 남았으면 'mini', 고를 말이 남았으면 'scene'.
 * 놀이 도중 나가거나 다시 들어와도 그 사건 앞에서 이어 간다 (마음·장면은 두 번 오르지 않는다)
 */
export function storyResume(s: GameState, npc: string): { event: string; mini?: Minigame } | null {
  const w = s.life?.storyWait
  if (!w || w.npc !== npc || !s.npcs[npc]?.visible) return null
  return w.mini ? { event: w.event, mini: w.mini } : { event: w.event }
}

/** 함께한 손일 놀이가 끝났다 — 잘했든 못했든 이야기는 다음으로 (완료 표식이 있으면 지금 남긴다) */
export function finishStoryMini(s: GameState): GameState {
  const w = s.life?.storyWait
  if (!w?.mini) return s
  const found = eventById(w.event)
  const next: GameState = { ...s, life: { ...s.life, storyWait: null } }
  return found ? completeStory(next, found.owner, found.event, w.choice) : next
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
  // 이어 갈 이야기 사건이 하나 남아 있으면(다른 이웃의 손일·고를 말) 이어 갈 것이 생기는 사건은 그것을 마친 뒤에 — 이어 갈 자리는 하나뿐
  const busy = (e: PersonEvent) => needsFollowUp(e) && !!life.storyWait && life.storyWait.event !== e.id
  const castHere = (e: PersonEvent) => (e.with ?? []).every(id => {
    const def = CONTENT_DEFS.get(id), actor = s.npcs?.[id]
    return !!def && !notYet(def, s.flags.villageLevel ?? 0, s.flags) && !!actor?.visible && near(npcTile(actor), e.at, 2)
  })
  return p.events.find((e) => !life.seen.includes(e.id) && stage >= e.stage && whenMatches(e.when, m) && reqMet(e.req, ctx) && (!e.confess || ctx.suitor) && !busy(e) && castHere(e)) ?? null
}

/** 이 사람이 지금 이야기(이벤트)를 품고 제자리에 와 있는가 — 머리 위에 말풍선, 말을 걸면 열린다 */
export function eventWaiting(s: GameState, npc: string): PersonEvent | null {
  const n = s.npcs[npc]
  const e = n?.visible ? eventNow(s, npc) : null
  return e && near(npcTile(n), e.at, 1) ? e : null
}

/** 그 자리에서 벌어지는 목격 장면 — 곁을 지나가기만 해서는 열리지 않고, 말을 걸면 열린다 */
export function sightingWaiting(s: GameState, npc: string) {
  const n = s.npcs[npc]
  const w = n?.visible ? sightingNow(s, npc) : undefined
  return w && near(npcTile(n), w.at, 1) ? w : null
}

/** 지금 하던 말 (예전의 혼잣말) — 대화하기를 누르면 첫마디로 듣는다 (하루 한 번) */
export function mutterWaiting(s: GameState, npc: string): string | null {
  const n = s.npcs[npc]
  if (!n?.visible) return null
  const life = s.life ?? NO_LIFE
  if (life.mutterDay === s.clock.day && life.muttered.includes(npc)) return null
  const r = routineOf(s, npc)
  // 혼잣말은 따로 뜨지 않는다 — 대화하기를 누르면 지금 하던 말(이웃끼리 나누던 말 포함)이 첫마디로 (자리와 상관없이, 하루 한 번)
  if (!r?.mutter?.length) return null
  return r.mutter[Math.floor((((s.clock.day * 7 + npc.length) % 97) / 97) * r.mutter.length)]
}

/**
 * 둘이 함께인 일과에서 첫마디를 나누는 상대 (계획 16 작업 3) — 지금 일과가 누구와 함께이고 그 사람이 곁(두 칸 안)에 보일 때만.
 * 화면은 혼잣말을 상대 이름과 함께 한 줄로 띄운다
 */
export function mutterPartner(s: GameState, npc: string): string | null {
  const n = s.npcs[npc]
  const o = n?.visible ? routineOf(s, npc)?.with : undefined
  const m = o ? s.npcs[o] : undefined
  return o && m?.visible && near(npcTile(m), npcTile(n), 2) ? o : null
}

/** 혼잣말을 들은 것으로 적는다 */
export function hearMutter(s: GameState, npc: string, text: string): GameState {
  let life = s.life ?? NO_LIFE
  if (life.mutterDay !== s.clock.day) life = { ...life, mutterDay: s.clock.day, muttered: [] }
  // 작은 근황(계획 16 작업 24)이면 수첩 "요즘"에 본 모습으로 (이웃이 그 자리에서 하던 것을 직접 듣고 본 것)
  const news = routineOf(s, npc)?.news
  const notebook = news ? noteNews(s.notebook ?? NO_NOTEBOOK, npc, news, s.clock.day) : s.notebook
  return { ...s, notebook, life: { ...life, muttered: [...life.muttered, npc], heard: { npc, text } } }
}

/** 말을 걸면 열릴 이야기(이벤트·목격)가 있는지 — 머리 위 말풍선과 대화하기 단추 표시용 */
export function storyWaiting(s: GameState, npc: string): boolean {
  return !!eventWaiting(s, npc) || !!sightingWaiting(s, npc) || !!storyResume(s, npc)
}

/** 말을 걸었을 때 기다리던 이야기가 열린다 (계획 6b 이벤트 — 가까이 가기만 해서는 열리지 않는다) */
export function openEvent(s: GameState, npc: string): GameState | null {
  const e = eventWaiting(s, npc)
  const life = s.life ?? NO_LIFE
  if (!e) {
    const w = sightingWaiting(s, npc)
    if (!w) return null
    return { ...s, life: remember({ ...life, seen: [...life.seen, w.id] }, npc, w.memory, s), scenes: [...s.scenes, `saw:${w.id}`] }
  }
  const wait = needsFollowUp(e) ? { event: e.id, npc } : (life.storyWait ?? null)
  let next: GameState = { ...s, life: { ...life, seen: [...life.seen, e.id], storyWait: wait }, scenes: [...s.scenes, `ev:${e.id}`] }
  if (e.gain) next = heartUp(next, npc, e.gain)
  if (e.cool) next = { ...next, life: { ...next.life, cool: { ...next.life.cool, [npc]: s.clock.day + e.cool } } }
  // 고를 말이 없는 마지막 사건은 보는 것으로 이야기가 끝난다
  if (!needsFollowUp(e)) next = completeStory(next, npc, e)
  return next
}

// ── 데리고 다니기·집에 두기 (동물 친구·우리 아이) ──

/** 동물 친구를 집에 두거나(집 안 자리로) 다시 데리고 다닌다(기록자 곁으로) */
export function setCompanionStay(s: GameState, stay: boolean): GameState {
  const c = s.companion
  if (!c) return s
  if (stay) return { ...s, companion: { ...c, stay: true, x: PET_HOME.x, y: PET_HOME.y, path: [] } }
  const near = besideNotDoor(playerTile(s)) ?? playerTile(s)
  return { ...s, companion: { ...c, stay: false, x: near.x, y: near.y, path: [] } }
}

/** 아이를 데리고 다니기·집에 두기·혼자 다니게 두기 */
export function setChildMode(s: GameState, mode: ChildMode): GameState {
  return s.child ? { ...s, child: { ...s.child, mode } } : s
}

// ── 배움터 (2026-09-30): 닢을 내고 아이를 맡기면 고른 능력치가 자란다 (하루 한 번, 저녁 여섯 시까지 배움터에) ──
export const SCHOOL_FEE = 15
export const SCHOOL_XP = 15
/** 맡긴 아이가 앉는 자리 (배움 탁자 곁) */
export const SCHOOL_SEAT: Tile = { x: 21, y: 45 }
export const SCHOOL_UNTIL = 18 * 60
const SCHOOL_STATS: readonly StatId[] = ['wit', 'hand', 'charm', 'strength', 'luck']

export type SchoolBlock = 'noChild' | 'baby' | 'away' | 'done' | 'late' | 'coins' | null
export function canSchool(s: GameState): SchoolBlock {
  const c = s.child
  if (!c) return 'noChild'
  if (childStage(c, s.clock.day) === 'baby') return 'baby'
  if (childMode(c, s.clock.day) === 'away') return 'away'
  if (s.flags.schoolDay === s.clock.day) return 'done'
  if (s.clock.minute >= SCHOOL_UNTIL) return 'late'
  if (s.coins < SCHOOL_FEE) return 'coins'
  return null
}

export function sendToSchool(s: GameState, stat: StatId): GameState | null {
  if (canSchool(s)) return null
  const c = s.child!
  return {
    ...s,
    coins: s.coins - SCHOOL_FEE,
    child: { ...c, stats: addXp(c.stats, stat, SCHOOL_XP) },
    flags: { ...s.flags, schoolDay: s.clock.day, schoolStat: SCHOOL_STATS.indexOf(stat) },
  }
}

/** 오늘 배움터에 맡긴 아이가 아직 거기 있는가 */
export function childAtSchool(s: Pick<GameState, 'flags' | 'clock'>): boolean {
  return s.flags.schoolDay === s.clock.day && s.clock.minute < SCHOOL_UNTIL
}

/**
 * 아이가 지금 있는 칸 (누르면 데리고 다닐지 정한다): 아기와 집에 둔 아이는 요람 곁, 따라다니는 아이는 기록자 곁(보는 쪽 반대),
 * 혼자 다니는 아이는 때마다 정한 자리
 */
/**
 * 저녁 집 안에서 배우자와 아이가 앉을 자리 (계획 16 작업 23): 정해 둔 자리가 있고 저녁(배우자) 또는 집에 있는 때(걷는 아이·저녁의 돕는 아이)이면
 * 배우자는 취향 맞는 자리, 아이는 단계에 맞는 놀이·탁자 자리. 기록자가 서 있는 칸·동물 칸은 피한다. 자리가 없으면 빈 값(기존 자리 그대로)
 */
type SeatState = Pick<GameState, 'clock'> & Partial<Pick<GameState, 'room' | 'spaces' | 'romance' | 'child' | 'player' | 'act' | 'companion' | 'flags'>>
export function homeSeatsNow(s: SeatState): { spouse?: Tile; child?: Tile } {
  if (!s.room || !s.spaces?.length) return {}
  const m = s.clock.minute
  const r = s.romance ?? NO_ROMANCE
  const want: FamilyWants = {}
  if (r.stage === 'married' && r.partner && m >= SPACE_FROM && m < SPACE_TO) want.spouse = r.partner
  const c = s.child
  if (c && m < SPACE_TO && !(s.flags && childAtSchool({ flags: s.flags, clock: s.clock }))) {
    const mode = childMode(c, s.clock.day), stage = childStage(c, s.clock.day)
    if ((stage === 'toddler' || stage === 'helper') && ((mode === 'home' && m >= KID_SPACE_FROM) || (mode === 'roam' && m >= 20 * 60))) want.child = { stage }
  }
  if (!want.spouse && !want.child) return {}
  const occupied = new Set<string>()
  if (s.player) {
    occupied.add(key({ x: Math.round(s.player.x), y: Math.round(s.player.y) }))
    if (s.act?.at) occupied.add(key(s.act.at))
  }
  if (s.companion) occupied.add(key({ x: Math.round(s.companion.x), y: Math.round(s.companion.y) }))
  return familySeats({ room: s.room, spaces: s.spaces }, want, occupied)
}

export function childTile(s: Pick<GameState, 'child' | 'clock' | 'player'> & Partial<Pick<GameState, 'flags' | 'room' | 'spaces' | 'romance' | 'act' | 'companion'>>): Tile | null {
  const c = s.child
  if (!c) return null
  const mode = childMode(c, s.clock.day)
  if (mode === 'away') return null
  if (s.flags && childAtSchool(s as Pick<GameState, 'flags' | 'clock'>)) return SCHOOL_SEAT
  if (mode === 'cradle' || mode === 'home') {
    const crib = s.room?.find(f => f.item === 'homeCradle')
    const at = crib ? { x: crib.x, y: crib.y } : HOME_ENTRY
    if (mode === 'cradle') return at
    // 놀이·탁자 자리가 있으면 그 곁 (작업 23) — 없으면 요람 곁
    return homeSeatsNow(s).child ?? safeHomeSpot(at, s.room ?? [])
  }
  if (mode === 'roam') {
    const at = helperSpot(s.clock.minute)
    if (!sameTile(at, CRADLE_SPOT)) return at
    const crib = s.room?.find(f => f.item === 'homeCradle')
    return homeSeatsNow(s).child ?? safeHomeSpot(crib ? { x: crib.x, y: crib.y } : HOME_ENTRY, s.room ?? [])
  }
  const back = { left: { x: 1, y: 0 }, right: { x: -1, y: 0 }, up: { x: 0, y: 1 }, down: { x: 0, y: -1 } }[s.player.facing]
  return { x: Math.round(s.player.x) + back.x, y: Math.round(s.player.y) + back.y }
}

/** 기록자 곁(한 칸)에 서 있는 이웃 — '대화하기' 단추 */
export function neighborBeside(s: GameState): string | null {
  if (s.player.path.length || (s.map ?? 'village') !== 'village') return null
  const here = playerTile(s)
  const n = Object.values(s.npcs).find((o) => o.visible && isNear(here, npcTile(o)))
  return n?.id ?? null
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

/**
 * 지금 이 사람의 일과. 계획 16 작업 3: 조건(req)이 맞지 않는 일과는 고르지 않고,
 * 함께하는 일과(with)는 상대가 이사 와 있고 다른 특별한 자리(이벤트·목격·방문·모임·사랑방·잔치)에 가 있지 않으며
 * 상대의 지금 일과도 곁(거리 2 이내)일 때만 — 아니면 그 일과를 건너뛰고 다음 후보로 (혼자 상대를 기다리지 않는다)
 */
export function routineOf(s: GoalState, npc: string, meet?: MeetContext): Routine | null {
  return routineIn(s, npc, meet ?? meetContext(s, { neighbors: [...CONTENT_DEFS.values()] }), 0)
}

function routineIn(s: GoalState, npc: string, meet: MeetContext, depth: number): Routine | null {
  const p = personOf(npc)
  if (!p) return null
  const ctx = reqCtx(s, npc)
  const base = routineNow(p, momentOf(s), peopleData().threads, (r) => reqMet(r.req, ctx) && (!r.with || partnerHere(s, r, npc, meet, depth)))
  // 작은 근황 (계획 16 작업 24): 평소 일과 위, 조건이 달린 일과(이야기 뒤·함께하는 자리)·벗어나는 날·마을 사건 일과 아래
  if (base && (base.req || base.with || base.away)) return base
  const n = newsRoutine(s, npc, meet)
  return n && (!n.with || partnerHere(s, n, npc, meet, depth)) ? n : base
}

// ── 주민들의 작은 근황 (계획 16 작업 24, news.ts) ──

/** 이 이웃의 오늘 하루 일과가 마을 사건 단계로 따로 정해져 있는가 (진행 중 사건과 겹치면 근황은 쉬어 간다) */
function threadBusy(npc: string, day: number): boolean {
  return peopleData().threads.some((t) => {
    const p = threadPhase(t, day)
    return p >= 0 && p < t.phases.length && !!t.phases[p].routines?.[npc]?.length
  })
}

let newsMemo: { flags: GoalState['flags']; life: Life; shelved: GoalState['shelved']; romance: GoalState['romance']; day: number; picks: NewsDef[] } | null = null

/**
 * 오늘의 근황 (하루 두세 건, 날 씨앗). 이사 온 이웃·열린 칸·날씨·계절·이야기 조건으로만 거르고 저장하지 않는다 —
 * 같은 날 같은 상태에서는 다시 접속해도 같다. 잔치 날은 쉰다. 연인·배우자의 일과는 연애·함께 가기가 이미 쓰므로 건드리지 않는다. 같은 상태를 매 화면마다 다시 따지지 않게 한 칸만 기억해 둔다
 */
export function newsPicks(s: GoalState, meet: MeetContext): NewsDef[] {
  const life = s.life ?? NO_LIFE
  const day = s.clock.day
  const m = newsMemo
  if (m && m.flags === s.flags && m.life === life && m.shelved === s.shelved && m.romance === s.romance && m.day === day) return m.picks
  let picks: NewsDef[] = []
  if (!festivalOf(day)) {
    const w = weatherOf(day)
    const season = seasonOf(day)
    const here = (npc: string) => {
      const p = personOf(npc)
      const d = CONTENT_DEFS.get(npc)
      return !!p && meet.joined(npc) && !(d?.marketOnly && !isMarketDay(day)) && !isOffDay(p, day) && !threadBusy(npc, day) && life.storyWait?.npc !== npc && s.romance?.partner !== npc
    }
    picks = newsOfDay(
      day,
      (d) => newsWeatherOk(d, w) && newsSeasonOk(d, season) && d.who.every((x) => here(x.npc) && !meet.locked.has(key(x.at))) && reqMet(d.req, reqCtx(s, d.who[0].npc, false)),
    )
  }
  newsMemo = { flags: s.flags, life, shelved: s.shelved, romance: s.romance, day, picks }
  return picks
}

/** 지금 이 이웃이 하고 있는 근황 (오늘의 근황 중 지금 시각에 맞는 것) */
function newsRoutine(s: GoalState, npc: string, meet: MeetContext): Routine | null {
  const minute = s.clock.minute
  const d = newsPicks(s, meet).find((x) => x.from <= minute && minute < x.to && x.who.some((w) => w.npc === npc))
  if (!d) return null
  const me = d.who.find((w) => w.npc === npc)!
  const other = d.who.find((w) => w.npc !== npc)
  const mutter = newsMutter(d.id, npc)
  return { when: { from: d.from, to: d.to }, at: me.at, ...(me.doing ? { doing: me.doing } : {}), ...(other ? { with: other.npc } : {}), ...(mutter.length ? { mutter } : {}), news: d.id }
}

/** 지금 놓여 있는 근황 소품 (그 근황의 주인이 실제로 그 자리에서 하고 있을 때만 — 근황이 끝나면 걷힌다) */
export function newsPropsNow(s: GoalState): { id: string; art: string; at: Tile }[] {
  const meet = meetContext(s, { neighbors: [...CONTENT_DEFS.values()] })
  const minute = s.clock.minute
  const out: { id: string; art: string; at: Tile }[] = []
  for (const d of newsPicks(s, meet)) {
    if (!d.prop || minute < d.from || minute >= d.to) continue
    const art = newsPropArt(d, s.clock.day)
    if (art) out.push({ id: d.id, art, at: d.prop.at })
  }
  return out
}

/** 수첩 "요즘": 직접 본 가장 최근의 근황 한 줄, 그리고 지금 사실로 남은 생활의 변화 (끝난 이야기·함께 지은 시설). 없으면 빈 목록 */
export function newsRecent(s: GameState, npc: string): string[] {
  const out: string[] = []
  const seen = s.notebook?.news?.[npc]
  if (seen && s.clock.day - seen.day <= NEWS_RECENT_DAYS && NEWS_BY_ID.has(seen.id)) {
    const text = newsSeenText(seen.id, npc)
    if (text) out.push((seen.day === s.clock.day ? NEWS_TEXT.seenToday : NEWS_TEXT.seenOn).replace('{day}', String(seen.day)).replace('{text}', text))
  }
  const ctx = reqCtx(s, npc, false)
  for (const h of HABITS) {
    if (h.npc !== npc || !reqMet(h.req, ctx)) continue
    const text = habitText(h.id)
    if (text && !out.includes(text)) out.push(text)
    if (out.length >= 3) break
  }
  return out
}

/** 함께하는 일과의 상대가 지금 곁에 올 수 있는가 (상대 쪽에서 한 번만 되묻는다 — 서로 끝없이 묻지 않게) */
function partnerHere(s: GoalState, r: Routine, npc: string, meet: MeetContext, depth: number): boolean {
  const o = r.with!
  if (meet.locked.has(key(r.at)) || !meet.joined(o) || o in meet.late) return false
  if (eventNow(s, o) || sightingNow(s, o)) return false
  if (depth > 0) return true
  const theirs = routineIn(s, o, meet, depth + 1)
  return !!theirs && !theirs.away && !meet.locked.has(key(theirs.at)) && near(theirs.at, r.at, 2) && (!theirs.with || theirs.with === npc)
}

/** 이 사람이 지금 가 있을 곳 (없으면 neighbors.json 시간표). 'away' = 그때만 마을에 없다 (집 문으로 들어가 보이지 않는다) */
function personSpot(s: GoalState, npc: string, meet: MeetContext): Tile | 'away' | null {
  const e = eventNow(s, npc)
  if (e) return e.at
  const w = sightingNow(s, npc)
  if (w) return w.at
  const r = routineOf(s, npc, meet)
  return r?.away ? 'away' : (r?.at ?? null)
}

const near = (a: Tile, b: Tile, d: number) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= d

function remember(life: Life, npc: string, tag: string, s: Pick<GameState, 'clock'>): Life {
  return rememberTag(life, npc, tag, momentOf(s))
}

/**
 * 의미 있는 경험을 남긴다 (계획 16 작업 2): 같은 id는 한 항목 — 횟수·최근 날만 바뀌고, 참여한 주민마다 exp:<id> 기억 한 번.
 * 입구는 이야기 완료·이벤트 선택·지킨 약속·좋아한 첫 선물·함께하기 결과뿐 (인사·클릭은 남기지 않는다)
 */
export function recordExperienceIn(s: GameState, exp: ExperienceInput): GameState {
  return { ...s, life: recordExperience(s.life ?? NO_LIFE, exp, momentOf(s)) }
}

/**
 * 가까이 있는 사람들의 삶: 약속(그 시각 그 자리에 오면 지킨 것).
 * 이벤트·목격 장면·혼잣말은 곁을 지나가기만 해서는 열리지 않는다 — 대화하기 단추로 (openEvent·mutterWaiting)
 */
function liveNearby(s: GameState, now: Tile, events: GameEvent[]): GameState {
  let life = s.life ?? NO_LIFE
  let next = s
  if (life.mutterDay !== s.clock.day) life = { ...life, mutterDay: s.clock.day, muttered: [] }
  // 약속: 그날 그 시각 그 자리에 오면 지킨 것
  const kept = life.promises.find((p) => p.day === s.clock.day && s.clock.minute >= p.from && s.clock.minute < p.to && near(now, p.at, 2))
  if (kept) {
    life = remember({ ...life, promises: life.promises.filter((p) => p !== kept) }, kept.npc, `kept:${kept.id}`, s)
    life = recordExperience(life, { id: `promise:${kept.id}`, kind: 'promise', with: [kept.npc] }, momentOf(s))
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
    // 주요 선택은 경험으로 (이벤트마다 한 항목 — 고른 갈래)
    life = recordExperience(life, { id: `choice:${e.id}`, kind: 'choice', with: eventCast(p.id, e, index), choice: index }, momentOf(s))
    if (c.promise) life = { ...life, promises: [...life.promises, { id: c.promise.id, npc: p.id, day: s.clock.day + 1, at: c.promise.at, from: c.promise.from, to: c.promise.to }] }
    // 계획 16 작업 4: 손일을 함께하는 말이면 놀이가 끝날 때까지 이어 갈 사건으로, 아니면 여기서 이야기가 끝난다(완료 표식)
    const waiting = life.storyWait?.event === e.id
    if (c.mini) life = { ...life, storyWait: { event: e.id, npc: p.id, choice: index, mini: c.mini } }
    else if (waiting) life = { ...life, storyWait: null }
    let next: GameState = { ...s, life }
    if (!c.mini) next = completeStory(next, p.id, e, index)
    // 친구로 지내겠다는 말(stayFriends)을 고르면 연인이 되지 않는다 — 벌점·서먹함 없이, 고백은 다시 묻지 않는다 (계획 16 작업 12b)
    if (e.confess && !c.stayFriends && !s.romance?.partner && reqCtx(s, p.id).suitor) {
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
export function personLine(s: GameState, id: string, rnd: number): { state: GameState; text: string; special: boolean } | null {
  const p = personOf(id)
  if (!p) return null
  const life = s.life ?? NO_LIFE
  const ctx = reqCtx(s, id)
  const cool = (life.cool[id] ?? 0) >= s.clock.day
  const line = pickLine(p, { ...ctx, m: momentOf(s), depth: depthOf(stageWith(s, id), ctx.lover), cool, here: playerTile(s) }, rnd)
  if (!line) return null
  const recent = [...(life.recent[id] ?? []).filter((x) => x !== line.id), line.id].slice(-RECENT_KEEP)
  const notebook = line.reveals ? noteTaste(s.notebook ?? NO_NOTEBOOK, id, line.reveals) : s.notebook
  // 함께 겪은 이야기·기억에 걸린 말만 특별한 말(팝업). 때·자리·사이·취향만 맞춘 말은 늘 하는 말 (2026-10-07 사용자)
  const r = line.req
  const special = !!r && !!(r.seen?.length || r.seenAny?.length || r.story?.length || r.memory?.length || r.exp?.length || r.recent || r.thread)
  return { state: { ...s, notebook, life: { ...life, recent: { ...life.recent, [id]: recent } } }, text: line.text, special }
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

export function heartUp(s: GameState, id: string, points: number, maxGain = Infinity): GameState {
  const p = personOf(id)
  if (p && points > 0) {
    // 사람마다 마음이 열리는 빠르기, 서먹할 땐 반만, 문턱에서 멈춘다
    const cool = (s.life?.cool[id] ?? 0) >= s.clock.day ? 0.5 : 1
    const scaled = Math.max(1, Math.round(points * p.pace * cool))
    const room = Math.max(0, gateCap(s, p) - (s.hearts[id] ?? 0))
    return heartUpRaw(s, id, Math.min(scaled, room), Math.min(room, maxGain))
  }
  return heartUpRaw(s, id, points, maxGain)
}

/** 이웃에게 받은 것: 오늘의 기록(잠들기 전 일기)과 이웃 수첩(일지 › 이웃 수첩의 받은 선물)에 함께 적는다 */
function logGiftFrom(s: GameState, npc: string, gift: Partial<Record<ItemId, number>>): GameState {
  const items = (Object.entries(gift) as [ItemId, number][]).filter(([, n]) => n > 0).map(([id]) => id)
  if (!items.length) return s
  return logGift({ ...s, notebook: noteGot(s.notebook ?? NO_NOTEBOOK, npc, items) }, npc, gift)
}

function heartUpRaw(s: GameState, id: string, points: number, maxGain = Infinity): GameState {
  const beforePts = s.hearts[id] ?? 0
  // 매력 단계만큼 조금 더 (3단계 +1점, 5단계 +2점)
  const afterPts = Math.min(MAX_POINTS, beforePts + Math.min(maxGain, points + (points > 0 ? charmBonus(s.stats) : 0)))
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
      next = logGiftFrom(next, id, gift)
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
    next = logGiftFrom(next, LIGHT_SHOES.npc, { lightShoes: 1 })
  }
  // 연애 후보의 이야기 (계획 6): 마음 4·6이 되면 그 사람의 옛이야기 (같은 모습이면 친구로 듣는다) — 한 번씩
  if (isCandidateId(id))
    STORY_HEARTS.forEach((h, i) => {
      const key = `romance${i + 1}:${id}`
      if (after >= h && !next.flags[key]) next = { ...next, flags: { ...next.flags, [key]: 1 }, scenes: [...next.scenes, key] }
    })
  if (id === 'child' && after >= CHILD_ASKS_AT && !next.flags.childAsked) {
    next = { ...next, flags: { ...next.flags, childAsked: 1 }, scenes: [...next.scenes, 'childAsks'] }
  }
  return next
}

/** 말을 걸면 그날 처음 한 번 하트가 오른다 */
export function greetNeighbor(s: GameState, id: string): GameState {
  if (s.talked.includes(id)) return s
  const n = s.npcs[id]
  let notebook = noteMet(s.notebook ?? NO_NOTEBOOK, id)
  if (n) {
    const routine = routineOf(s, id)
    notebook = noteSeen(notebook, id, s.clock.minute, seenLabel(npcTile(n), routine?.doing))
    if (n.visible && near(playerTile(s), npcTile(n), 2) && routine && near(npcTile(n), routine.at, 1)) notebook = noteObservedTaste(notebook, id, routine.doing, personOf(id)?.tastes?.activity)
    if (n.visible && near(playerTile(s), npcTile(n), 3) && routine?.news && near(npcTile(n), routine.at, 1)) notebook = noteNews(notebook, id, routine.news, s.clock.day)
  }
  return train(heartUp(greetMemories({ ...s, talked: [...s.talked, id], notebook }, id), id, GAIN.talk), 'charm', XP.greet)
}

/**
 * 오늘 이 이웃에게 말씀 조각을 받는다 (특별한 대화 — 계획 14 작업 5). pieceIds: 받은 조각 모두.
 * 편지 나르는 이웃은 오늘 온 편지(post)를 건넨다 (문 앞 편지 바구니와 같은 편지 — 어느 쪽에서 받든 한 번).
 * 받은 조각은 받은 날·누구에게서와 함께 남는다 (pieceLog)
 */
export function listen(s: GameState, neighborId: string, content: GameContent): { state: GameState; pieceId: string | null; pieceIds: string[] } {
  const none = { state: s, pieceId: null, pieceIds: [] as string[] }
  if (neighborId === POSTMAN && (s.post ?? []).length) {
    const r = receivePost(s, content)
    return r.pieceIds.length ? { ...r, state: { ...r.state, notebook: noteHeard(r.state.notebook ?? NO_NOTEBOOK, POSTMAN, r.pieceIds) } } : r
  }
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
      // 조각을 건넨 날에는 같은 이웃이 직업 선물을 또 주지 않는다 (offers가 지워져도 막히게)
      flags: { ...s.flags, [`talkGift:${neighborId}`]: s.clock.day },
      collected: [...s.collected, pieceId],
      pieceLog: logPieces(s.pieceLog, [pieceId], s.clock.day, `npc:${neighborId}`),
      todayHeard: [...s.todayHeard, pieceId],
      listened: s.listened.includes(neighborId) ? s.listened : [...s.listened, neighborId],
      notebook: noteHeard(s.notebook ?? NO_NOTEBOOK, neighborId, [pieceId]),
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
  const got = takeChapters(s, ids, content, 'letter')
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
  const { state, pieceIds } = receivePost(s, content)
  return { state, pieceIds }
}

/** 오늘 문 앞 편지 바구니에 편지 책의 편지가 들어 있는가 (그림·안내용) — 예전 집 앞 편지함 대신 */
export function mailboxHasPost(s: Pick<GameState, 'flags' | 'post' | 'collected'>): boolean {
  return (s.post ?? []).some((id) => !s.collected.includes(id))
}

/**
 * 받은 조각을 collected·todayHeard에 넣고 받은 기록(pieceLog)을 남긴다 (편지·언덕 편지함·여행·열람석·두루마리·아이의 편지가 함께 쓴다).
 * from: 어디서 받았나 (fragments.PieceGot)
 */
function takeChapters(s: GameState, ids: readonly string[], content: GameContent, from: string): GameState {
  const known = new Map(content.pieces.map((p) => [p.id, p]))
  // 책상 순서(arrangement)도 조각과 같게 채워 둔다 — 불러오기(sanitize)가 모은 조각으로 다시 채우는 것과 어긋나지 않게
  let progress = s.progress
  for (const id of ids) {
    const p = known.get(id)!
    const bp = progress[p.book]
    progress = { ...progress, [p.book]: { ...bp, arrangement: { ...bp.arrangement, [p.chapter]: [...(bp.arrangement[p.chapter] ?? []), id] } } }
  }
  return { ...s, collected: [...s.collected, ...ids], pieceLog: logPieces(s.pieceLog, ids, s.clock.day, from), todayHeard: [...s.todayHeard, ...ids], progress }
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
export function giveGift(s: GameState, def: NeighborDef, item: ItemId, content?: GameContent): { state: GameState; liked: boolean; pieceId?: string } | null {
  if (s.gifted.includes(def.id)) return null
  const left = take(s.inv, { [item]: 1 })
  if (!left) return null
  // 향유(희귀품)는 누구나 반기는 귀한 선물
  const liked = def.likes.includes(item) || item === PRECIOUS_GIFT
  // 싫어하는 것을 건넨 첫날은 기억에 남는다 (나중에 웃음거리가 된다 — 계획 6b)
  const disliked = dislikesOf(def).includes(item)
  const base = disliked ? { ...s, life: remember(s.life ?? NO_LIFE, def.id, 'badGift', s) } : s
  const notebook = noteGift(s.notebook ?? NO_NOTEBOOK, def.id, item, liked, disliked)
  // 생일에 건넨 선물은 마음이 두 배로 오른다 (싫어하는 것은 생일에도 그대로)
  const mul = isBirthday(def.id, s.clock.day) ? BIRTHDAY_MUL : 1
  const given = heartUp({ ...base, inv: left, gifted: [...s.gifted, def.id], notebook }, def.id, disliked ? 0 : (liked ? GAIN.giftLiked : GAIN.giftPlain) * mul)
  // 좋아한 선물은 그 이웃에게 첫 번째만 경험으로 남긴다 (계획 16 작업 2)
  const firstLiked = liked && !(given.life ?? NO_LIFE).experiences?.[`gift:${def.id}`]
  const kept = firstLiked ? recordExperienceIn(given, { id: `gift:${def.id}`, kind: 'gift', with: [def.id], item }) : given
  const trained = train(kept, 'charm', XP.gift)
  // 선물은 생활 루프 — 마음만 오른다. 말씀 조각은 선물·직업과 묶지 않는다 (계획 14 작업 5: 예전엔 친한 이웃이 조각을 더 들려줬다)
  void content
  return { state: trained, liked }
}

/** 이웃이 싫어하는 것 (neighbors.json과 people.json을 함께 본다) */
export function dislikesOf(def: Pick<NeighborDef, 'id' | 'dislikes'>): ItemId[] {
  const out = [...(def.dislikes ?? [])]
  for (const x of (personOf(def.id)?.dislikes ?? []) as ItemId[]) if (!out.includes(x)) out.push(x)
  return out
}

export const PRECIOUS_GIFT: ItemId = 'perfumeOil'
export const GIFTABLE: readonly ItemId[] = ['bread', 'grapes', 'fig', 'wool', 'olive', 'oil', 'barley', 'honey', 'herb', 'bean', 'scentCandle', PRECIOUS_GIFT]

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
  // 꾸미기 (계획 13 작업 7): 자주색 천으로 짠 귀한 깔개
  { id: 'purpleRug', pay: { purpleCloth: 1, wool: 2 }, get: { purpleRug: 1 } },
  // 꾸미기 재료 (계획 14): 푸른 염료 — 포도로, 또는 예전에 모아 둔 잉크 두 병과 바꾼다 (잉크 항아리가 없어도 특별 제본을 할 수 있게)
  { id: 'blueDye', pay: { grapes: 2 }, get: { blueDye: 1 } },
  { id: 'blueDyeInk', pay: { ink: 2 }, get: { blueDye: 1 } },
  { id: 'seedHerb', pay: {}, coins: 5, get: { seedHerb: 2 } },
  { id: 'seedBean', pay: {}, coins: 4, get: { seedBean: 2 } },
  { id: 'goodPenCoins', pay: {}, coins: 40, get: { goodPen: 1 } },
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

// ── 장날 희귀 좌판 (계획 13 작업 2): 희귀품 다섯 중 셋이 날마다 돌아가며 나온다 ──

/** 희귀품 값 — 며칠 모아야 사는 값 (편지 대필 12~30닢/일) */
export const RARE_PRICES: Partial<Record<ItemId, number>> = { finePapyrus: 18, sealWax: 35, perfumeOil: 60, purpleCloth: 90, bronzeOrnament: 110 }
export const RARE_STALL_SIZE = 3

/** 이 장날 희귀 좌판에 나온 것 (날 씨앗 — 같은 날은 늘 같다) */
export function rareStall(day: number): ItemId[] {
  const pool = [...RARE_ITEMS]
  const rnd = mulberry32(day * 977 + 5)
  const out: ItemId[] = []
  while (out.length < RARE_STALL_SIZE && pool.length) out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0])
  return out
}

export type RareBlock = 'notMarket' | 'notHere' | 'bought' | 'coins' | 'full' | null
/** 희귀품은 장날에 한 가지씩 하나만 */
export function canBuyRare(s: GameState, item: ItemId): RareBlock {
  if (!isMarketDay(s.clock.day)) return 'notMarket'
  if (!rareStall(s.clock.day).includes(item)) return 'notHere'
  if (s.flags[`rare:${item}`] === s.clock.day) return 'bought'
  if (s.coins < (RARE_PRICES[item] ?? Infinity)) return 'coins'
  if (overflows(s, { [item]: 1 })) return 'full'
  return null
}

export function buyRare(s: GameState, item: ItemId): GameState | null {
  if (canBuyRare(s, item)) return null
  return { ...putAway(s, { [item]: 1 }), coins: s.coins - RARE_PRICES[item]!, flags: { ...s.flags, [`rare:${item}`]: s.clock.day } }
}

// ── 의뢰 게시판 (계획 13 작업 5, 부탁 고르기는 board.ts) ──

/** 오늘 게시판의 부탁 (장날에만 오는 상인은 빼고, 지금 마을에 사는 이웃만) */
export function boardToday(s: Pick<GameState, 'clock' | 'flags'>, content: GameContent): BoardRequest[] {
  const level = s.flags.villageLevel ?? 0
  return boardFor(
    s.clock.day,
    content.neighbors.filter((d) => !d.marketOnly && !notYet(d, level, s.flags)),
  )
}

export type BoardBlock = 'done' | 'needs' | 'full' | null
export function canFulfillBoard(s: GameState, r: BoardRequest): BoardBlock {
  if (s.flags[`board:${r.id}`]) return 'done'
  const need = { [r.item]: r.n }
  if (!haveStock(s, need)) return 'needs'
  if (r.rare && overflows(useStock(s, need)!, { [r.rare]: 1 })) return 'full'
  return null
}

/** 부탁을 들어준다: 물건을 건네고 닢·마음, 덤으로 희귀품 */
export function fulfillBoard(s: GameState, r: BoardRequest): GameState | null {
  if (canFulfillBoard(s, r)) return null
  let next = useStock(s, { [r.item]: r.n })!
  if (r.rare) next = putAway(next, { [r.rare]: 1 })
  next = { ...next, coins: next.coins + r.coins, flags: { ...next.flags, [`board:${r.id}`]: 1 } }
  return train(heartUp(next, r.npc, BOARD_GAIN), 'charm', XP.gift)
}

// ── 이웃 마을 여행 (계획 13 작업 6, 여행지는 travel.ts) ──

export type TripBlock = 'late' | 'tired' | 'coins' | 'food' | 'full' | null
/** 떠날 수 있는가: 아침(정오 전), 지치지 않았고, 배삯·숙박비·산 물건 값과 길양식이 있다 */
export function canTrip(s: GameState, id: DestId, buys: readonly ItemId[] = [], returning = false): TripBlock {
  const d = DESTS[id]
  // 돌아갈 때는 시각·피로로 막지 않는다 — 판을 이미 돌았으니 집에는 늘 돌아갈 수 있어야 한다 (2026-10-07)
  if (!returning && s.clock.minute >= TRIP_LEAVE_BY) return 'late'
  if (!returning && exhausted(s.needs)) return 'tired'
  if (s.coins < tripCost(d, buys)) return 'coins'
  if (!haveStock(s, d.food)) return 'food'
  const got = Object.fromEntries(buys.map((b) => [b, 1]))
  if (buys.length && overflows(useStock(s, d.food)!, got)) return 'full'
  return null
}

/**
 * 여행을 다녀온다 (한꺼번에 — 도중에 저장되지 않는다): 값을 치르고, 산 것을 챙기고, 처음 간 곳이면 이야기가 앨범·일지에 남고
 * 이어진 이웃의 마음이 오른다. 하룻밤 묵고 다음 날 아침 집에서 눈을 뜬다
 */
export function takeTrip(s: GameState, content: GameContent, id: DestId, buys: readonly ItemId[] = [], rewards: readonly TripReward[] = []): GameState | null {
  const d = DESTS[id]
  const items = [...new Set(buys)].filter((b) => d.shop[b] !== undefined)
  if (canTrip(s, id, items, true)) return null
  let next = useStock(s, d.food)!
  next = putAway({ ...next, coins: next.coins - tripCost(d, items) }, Object.fromEntries(items.map((b) => [b, 1])))
  const visits = s.flags[`trip:${id}`] ?? 0
  next = { ...next, flags: { ...next.flags, [`trip:${id}`]: visits + 1 } }
  const note = `trip:${id}`
  if (!visits) {
    next = heartUp({ ...next, inv: addGift(next.inv, d.keepsake) }, d.friend, TRIP_FRIEND_GAIN)
    next = { ...next, album: next.album.some((a) => a.id === note) ? next.album : [...next.album, { id: note, day: s.clock.day }] }
  }
  next = { ...next, todayNotes: next.todayNotes.includes(note) ? next.todayNotes : [...next.todayNotes, note] }
  next = applyTripRewards(next, rewards, content, `trip:${id}`)
  return goToSleep(next, content)
}

/** 여행 보드게임에서 얻은 것 (돌아올 때 한꺼번에): 성경 조각, 능력치(나·아이), 재료, 닢 */
export function applyTripRewards(s: GameState, rewards: readonly TripReward[], content: GameContent, from = 'trip:'): GameState {
  let next = s
  const pieces = rewards.flatMap((r) => (r.kind === 'piece' && !s.collected.includes(r.id) ? [r.id] : []))
  if (pieces.length) next = train(takeChapters(next, [...new Set(pieces)], content, from), 'wit', XP.listen * pieces.length)
  for (const r of rewards) {
    if (r.kind === 'stat' && r.who === 'me') next = train(next, r.stat, r.xp)
    else if (r.kind === 'stat' && r.who === 'child' && next.child) next = { ...next, child: { ...next.child, stats: addXp(next.child.stats, r.stat, r.xp) } }
    else if (r.kind === 'items') next = putAway(next, r.items)
    else if (r.kind === 'coins') next = { ...next, coins: next.coins + r.n }
  }
  return next
}

// ── 성경 이야기를 더 모으는 길 (2026-09-30 사용자): 밤 필사·이웃 선물·서고 열람석·떠돌이 상인의 두루마리·어른이 된 아이의 편지 ──

/**
 * 말씀 조각 하나를 모은다 (2026-10-06 사용자 결정): 어느 길(from)로든 27권 전체의 아직 없는 조각 중 무작위 하나 —
 * 지금 고른 책이나 장 순서와 무관하다 (fragments.drawFragment). 같은 날 같은 길은 같은 조각 (불러와도 그대로)
 */
export function extraPiece(s: GameState, content: GameContent, from: string): { state: GameState; pieceId: string } | null {
  const id = nextTripPiece(s, content, [], from)
  if (!id) return null
  return { state: train(takeChapters(s, [id], content, from), 'wit', XP.listen), pieceId: id }
}

/** 사본 옮겨 적기: 시간이나 생활 재료를 요구하지 않는다. */
export const NIGHT_COPY_MINUTES = 40
export type ExtraBlock = 'noPiece' | 'coins' | 'done' | 'notMarket' | null
export function canNightCopy(s: GameState, content: GameContent): ExtraBlock {
  if (!nextTripPiece(s, content)) return 'noPiece'
  return null
}
export function nightCopy(s: GameState, content: GameContent): { state: GameState; pieceId: string } | null {
  if (canNightCopy(s, content)) return null
  const r = extraPiece(s, content, 'night')!
  return { state: passTime({ ...r.state, needs: work(r.state.needs, 4) }, NIGHT_COPY_MINUTES), pieceId: r.pieceId }
}

/** 서고 열람석: 닢 셋을 내고 한 조각을 옮겨 적어 온다 (하루 두 번까지) */
export const LIBRARY_READ_PRICE = 3
export const LIBRARY_READS_PER_DAY = 2
export function canLibraryRead(s: GameState, content: GameContent): ExtraBlock {
  const used = s.flags.libReadDay === s.clock.day ? s.flags.libReads ?? 0 : 0
  if (used >= LIBRARY_READS_PER_DAY) return 'done'
  if (s.coins < LIBRARY_READ_PRICE) return 'coins'
  if (!nextTripPiece(s, content)) return 'noPiece'
  return null
}
export function libraryRead(s: GameState, content: GameContent): { state: GameState; pieceId: string } | null {
  if (canLibraryRead(s, content)) return null
  const used = s.flags.libReadDay === s.clock.day ? s.flags.libReads ?? 0 : 0
  const paid = { ...s, coins: s.coins - LIBRARY_READ_PRICE, flags: { ...s.flags, libReadDay: s.clock.day, libReads: used + 1 } }
  const r = extraPiece(paid, content, 'library')!
  return { state: passTime(r.state, 30), pieceId: r.pieceId }
}

/** 떠돌이 상인의 옛 두루마리: 장날에만, 한 장날에 두 개까지 */
export const SCROLL_PRICE = 12
export const SCROLLS_PER_MARKET = 2
export function canBuyScroll(s: GameState, content: GameContent): ExtraBlock {
  if (!isMarketDay(s.clock.day)) return 'notMarket'
  const used = s.flags.scrollDay === s.clock.day ? s.flags.scrolls ?? 0 : 0
  if (used >= SCROLLS_PER_MARKET) return 'done'
  if (s.coins < SCROLL_PRICE) return 'coins'
  if (!nextTripPiece(s, content)) return 'noPiece'
  return null
}
export function buyScroll(s: GameState, content: GameContent): { state: GameState; pieceId: string } | null {
  if (canBuyScroll(s, content)) return null
  const used = s.flags.scrollDay === s.clock.day ? s.flags.scrolls ?? 0 : 0
  return extraPiece({ ...s, coins: s.coins - SCROLL_PRICE, flags: { ...s.flags, scrollDay: s.clock.day, scrolls: used + 1 } }, content, 'scroll')
}

/** 이웃에게 선물: 마음이 친구(10) 이상인 이웃은 선물을 받으면 이야기 한 조각을 더 들려준다 */
export const GIFT_STORY_HEARTS = 10

/**
 * 아직 모으지 않은 조각 중 무작위 하나 (밤 필사·열람석·두루마리·여행·아이의 편지·별 보기가 쓴다) — 27권 전체, 한 번에 한 조각.
 * 오늘 편지 바구니(post)·이웃(offers)에 이미 든 조각과 taken은 빼서 겹치지 않게 한다. 모두 모았으면 null
 */
export function nextTripPiece(s: Pick<GameState, 'collected' | 'clock'> & Partial<Pick<GameState, 'post' | 'offers'>>, content: GameContent, taken: readonly string[] = [], from = 'trip'): string | null {
  const skip = [...s.collected, ...(s.post ?? []), ...Object.values(s.offers ?? {}), ...taken]
  return drawFragment(content.pieces, skip, fragmentSeed(s.clock.day, from))
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
    notebook: noteGot(s.notebook ?? NO_NOTEBOOK, npc, kept),
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
  return { state: logGiftFrom({ ...s, inv: addGift(s.inv, gift), today: { ...t, visitGot: true } }, npc, gift), gift }
}

/**
 * 평소 대화의 직업 선물 (계획 14 작업 5, 두 루프의 생활 루프): 마음이 열린 이웃이 가끔 말을 걸 때 자기 일에서 난 것을 챙겨 준다
 * (fragments.talkGiftOf — 날 씨앗, 하루 한 번). 오늘 특별한 대화로 말씀 조각을 건넬 이웃은 조각을 건넨다 (선물과 겹치지 않게).
 * 조각과 직업 선물은 서로 묶지 않는다
 */
export function receiveTalkGift(s: GameState, npc: string): { state: GameState; gift: Partial<Record<ItemId, number>> } | null {
  if (s.offers[npc]) return null
  const gift = talkGiftOf(npc, s.clock.day, s.hearts, s.flags)
  if (!gift) return null
  const giftsGot = [...new Set([...s.giftsGot, ...(Object.keys(gift) as ItemId[])])]
  return { state: logGiftFrom({ ...s, inv: addGift(s.inv, gift), giftsGot, flags: { ...s.flags, [`talkGift:${npc}`]: s.clock.day } }, npc, gift), gift }
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
export const APOTHECARY = 'apothecary'
// 캔 약초는 장날 좌판에서 판다 (SELL_PRICES.herb) — 약방에 따로 팔던 단추는 2026-10-05에 지웠다

function herbPicksToday(s: Pick<GameState, 'clock' | 'flags'>): number {
  return s.flags.herbDay === s.clock.day ? (s.flags.herbPicks ?? 0) : 0
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
export function useStock(s: GameState, need: Partial<Record<ItemId, number>>): GameState | null {
  const r = takeStock(s.inv, chestOf(s), need)
  return r ? { ...s, inv: r.inv, chest: r.chest ?? s.chest } : null
}

/** 받은 것을 넣는다 — 가방이 차면 궤짝으로 */
export function putAway(s: GameState, gives: Partial<Record<ItemId, number>>): GameState {
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
  // 화덕을 쓰면 그을음 받이에 그을음이 모인다. 그림: 화덕은 반죽, 작업대는 손일, 기름틀은 꺼내고 넣기
  return startAct(r.at === 'hearth' ? catchSoot(done) : done, r.at === 'hearth' ? 'knead' : r.at === 'press' ? 'reach' : 'craft')
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

/**
 * 장날에 파는 것: 공방 제품·들과 텃밭에서 거둔 것 — 엮은 말씀 책·조각은 팔지 않는다 (exclusion-list §3-3).
 * 판매용 생산물 (계획 13 작업 4): 올리브·양털·포도·기름·향초·꿀
 */
export const SELL_PRICES: Partial<Record<ItemId, number>> = {
  ink: 8,
  papyrus: 6,
  cover: 25,
  herb: 4,
  bean: 3,
  olive: 2,
  wool: 4,
  grapes: 3,
  oil: 7,
  honey: 6,
  scentCandle: 9,
}

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
  return startAct(catchSoot(passTime({ ...s, needs: warmUp(s.needs) }, 15)), 'sit')
}

export function restAt(s: GameState): GameState {
  return startAct(passTime({ ...s, needs: rest(s.needs) }, 30), 'sit')
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
  return startAct(passTime(next, TEA_MINUTES), 'drink')
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
  return furnishSpouse({
    ...s,
    romance: { ...s.romance, stage: 'married', weddingDay: null, marriedDay: s.clock.day },
    scenes: [...s.scenes, `wedding:${id}`],
    flags: { ...s.flags, [onceKey('wedding', s.clock.day)]: 1 },
  })
}

/** 배우자의 아침 선물 (하루 한 번, 처음 말 걸 때): 배우자 집안 일에서 나는 것 하나 */
export function spouseGift(s: GameState, def: NeighborDef): { state: GameState; gift: Partial<Record<ItemId, number>> } | null {
  if (romanceWith(s, def.id) !== 'married' || s.flags.spouseGiftDay === s.clock.day || NO_SPOUSE_GIFT.includes(def.id)) return null
  const [id] = Object.keys(def.help.gives) as ItemId[]
  const gift = { [id]: 1 } as Partial<Record<ItemId, number>>
  return { state: { ...putAway(s, gift), flags: { ...s.flags, spouseGiftDay: s.clock.day } }, gift }
}

/**
 * 배우자가 아이방 이야기를 꺼낸다: 결혼하고 아이가 올 날이 지났는데 아이방(2단계)이 없을 때,
 * 사흘에 한 번 처음 말 걸 때 (아이는 아이방이 있어야 온다 — childMorning). 목수에게 부탁해 두었으면 꺼내지 않는다
 */
export function babyRoomTalk(s: GameState, id: string): GameState | null {
  const r = s.romance ?? NO_ROMANCE
  if (r.stage !== 'married' || r.partner !== id || r.marriedDay === null || s.child) return null
  if (s.homeLevel >= 2 || s.flags.homeOrder === 2 || s.clock.day < r.marriedDay + CHILD_AFTER_WEDDING) return null
  const last = s.flags.babyRoomTalkDay
  if (last !== undefined && s.clock.day < last + 3) return null
  return { ...s, flags: { ...s.flags, babyRoomTalkDay: s.clock.day } }
}

export type DateBlock ='noPartner' | 'away' | 'busy' | 'done' | 'closed' | 'coins' | 'notYet' | 'cloudy' | 'wet' | null

/**
 * 연인이 지금 함께 갈 수 있는가 (계획 10 작업 4):
 * - 오늘 마을에 나와 있어야 한다 (궂은 날 집에 있는 사람, 아직 이사 오지 않은 집안, 지금 일과가 마을 밖(away)이면 'away').
 * - 그 사람의 집안 일(PARTNER_WORK)을 하는 중이면 바쁘다 ('busy'). 점심처럼 누구와 함께 있는 때는 쉬는 때.
 *   찻집이 일터인 파피는 찻집 탁자에서는 잠깐 마주 앉을 수 있다.
 */
export function partnerFree(s: GameState, content: GameContent, place: DatePlace): 'noPartner' | 'away' | 'busy' | null {
  const r = s.romance ?? NO_ROMANCE
  if (!r.partner || !r.stage) return 'noPartner'
  if (!neighborsPresent(s, content).includes(r.partner)) return 'away'
  const work = isCandidateId(r.partner) ? PARTNER_WORK[r.partner] : undefined
  const now = routineOf(s, r.partner)
  if (now?.away) return 'away'
  if (work && now?.doing === work && !now.with && WORK_HERE[work] !== place) return 'busy'
  return null
}

/** 둘이 가는 곳 (계획 10 작업 4): 연인·약혼·부부만, 하루 한 번 (찻집이든 정자든 언덕이든), 그 사람이 마을에 있고 일하는 중이 아닐 때 */
export function canDate(s: GameState, place: DatePlace, content: GameContent): DateBlock {
  const who = partnerFree(s, content, place)
  if (who === 'noPartner') return who
  if (s.flags.dateDay === s.clock.day) return 'done'
  if (place === 'tea') {
    if (!teaOpen(s.clock.minute)) return 'closed'
    if (s.coins < DATE_TEA_PRICE) return 'coins'
  } else if (place === 'sunset') {
    const sun = canWatchSunset(s)
    if (sun) return sun
  } else {
    const m = s.clock.minute
    if (m < WALK_FROM || m >= WALK_TO) return 'closed'
    if (isWet(weatherOf(s.clock.day))) return 'wet'
  }
  return who
}

const DATE_MINUTES: Record<DatePlace, number> = { tea: TEA_MINUTES, sunset: SUNSET_MINUTES, walk: WALK_MINUTES }

/**
 * 함께 가기: 짧은 장면 하나 (곳마다 처음이면 앨범에 남는 장면, 그다음부터는 날마다 다른 짧은 장면),
 * 둘 다 쉬고, 마음 +5점, 오늘 기분 + (mood.ts가 dateDay를 본다). 찻집은 닢 4, 노을은 그날 처음이면 운.
 */
export function goOnDate(s: GameState, place: DatePlace, content: GameContent): GameState {
  if (canDate(s, place, content)) return s
  const countKey = DATE_COUNT_FLAG[place]
  const first = !s.flags[countKey]
  const variant = Math.floor(mulberry32(s.clock.day * 613 + place.charCodeAt(0))() * DATE_VARIANTS)
  const scene = first ? DATE_FIRST_SCENE[place] : `date:${place}:${variant}`
  const flags: Record<string, number> = { ...s.flags, dateDay: s.clock.day, [countKey]: (s.flags[countKey] ?? 0) + 1 }
  const sunKey = onceKey('sunset', s.clock.day)
  const lucky = place === 'sunset' && !s.flags[sunKey]
  if (place === 'sunset') flags[sunKey] = 1
  const next: GameState = {
    ...s,
    coins: place === 'tea' ? s.coins - DATE_TEA_PRICE : s.coins,
    needs: rest(s.needs),
    flags,
  }
  // 함께 간 장면을 마음이 오르며 열린 이야기보다 먼저 보인다
  const warmed = heartUp(next, s.romance.partner!, DATE_GAIN)
  const done = passTime({ ...warmed, scenes: [...s.scenes, scene, ...warmed.scenes.slice(s.scenes.length)] }, DATE_MINUTES[place])
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
  return { state: startAct(readOff(passTime({ ...s, needs }, READ_MINUTES), pieceId), 'read'), rested: s.needs.fatigue > 0 }
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
 * 오늘 밤 언덕 편지함에서 꺼낼 조각: 맑은 밤 별이 보이는 때이고 오늘 밤 아직 꺼내지 않았을 때 (flags.starPostDay — 궂은 밤 몫은 쌓이지 않는다).
 * 책이나 방과 상관없이 27권 중 아직 없는 조각 하나 (2026-10-06 사용자 결정 — 요한계시록만 별로 오던 것을 없앴다)
 */
function starPostTonight(s: GameState, content: GameContent): string[] {
  if (!clearSky(s.clock.day) || !starsOut(s.clock.minute) || s.flags.starPostDay === s.clock.day) return []
  const id = nextTripPiece(s, content, [], 'stars')
  return id ? [id] : []
}

/**
 * 별 보기: 앉아 쉬고 20분, 맑은 밤이면 stars 장면(한 번). 맑은 밤이면 벤치 곁 편지함에서 오늘 밤 몫(말씀 조각 하나)을 꺼낸다.
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
  const got = takeChapters(next, ids, content, 'stars')
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

/** 저녁·밤의 조명 표현. 필사 가능 여부와 무관하다. */
export function needsLamp(s: GameState): boolean {
  return s.clock.minute >= 18 * 60 || s.clock.minute < 6 * 60
}

/** 등잔은 자동 조명이다. 기름이나 연료를 소비하지 않는다. */
export function lightLamp(s: GameState): GameState {
  if (!needsLamp(s) || s.lampLitDay === s.clock.day) return s
  return { ...s, lampLitDay: s.clock.day, flags: { ...s.flags, lampNights: (s.flags.lampNights ?? 0) + 1 } }
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
  // 재료는 들지 않는다 (계획 14 — 필사에 파피루스·잉크 요구 없음)
  return result
}

// ── 정성 들인 장 (계획 13, 규칙은 fixtures.ts) ──

/** 예전에 한 장에 들던 것 (정성 등급은 없앴다 — 2026-09-30 사용자). 계획 14부터 장 기록·필사는 이것을 쓰지 않는다 */
export function chapterCost(_s?: unknown): Partial<Record<ItemId, number>> {
  return CHAPTER_COST
}

/** 오늘 먹었고 배고프지 않으면 집중 */
export function focused(s: Pick<GameState, 'flags' | 'clock' | 'needs'>): boolean {
  return s.flags.ateDay === s.clock.day && s.needs.hunger < 70
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

// ── 제본 (계획 14 작업 4): 다 필사한 책 → 완성본(가방) → 서고에 직접 가져가 꽂는다 ──

export type BindBlock = 'notDone' | 'bound' | null
/** 제본할 수 있는가: 다 필사한 책이고 아직 제본하지 않았다 (이미 꽂힌 옛 책도 제본 기록이 없으면 다시 묶지 않는다 — 꾸미기만) */
export function canBind(s: GameState, book: Book, content: GameContent): BindBlock {
  if (!bookDone(s, book, content)) return 'notDone'
  if (s.bound[book] !== undefined || s.shelved[book] !== undefined) return 'bound'
  return null
}

/**
 * 한 권을 제본한다. special이 없으면 그대로 제본하기 — 무료, 늘 가능. special이면 재료(SPECIAL_COST, 가방 먼저 그다음 궤짝)를
 * 쓰고 고른 표지 색·무늬·책등 장식을 남긴다 (모자라면 그대로 돌려준다).
 * 그 책의 서고 방이 닫혀 있으면 연다 (방 표식, 문 장면 — 사도행전 방은 장면 없이). 기다리던 'bookBound' 장면 하나를 거둔다
 */
export function bindBook(s: GameState, book: Book, content: GameContent, special?: SpecialChoice): GameState {
  if (canBind(s, book, content)) return s
  const paid = special ? useStock(s, SPECIAL_COST) : s
  if (!paid) return s
  const scenes = [...paid.scenes]
  const waiting = scenes.indexOf('bookBound')
  if (waiting >= 0) scenes.splice(waiting, 1)
  const flags = { ...paid.flags }
  const binding = special ? { day: s.clock.day, special } : { day: s.clock.day }
  return { ...paid, flags, scenes, bound: { ...paid.bound, [book]: binding } }
}

/** 제본한 책(완성본 또는 꽂은 책 — 제본 기록이 없는 옛 책 포함)의 표지를 재료로 다시 꾸민다. 등급·제본한 날은 그대로 */
export function decorateBook(s: GameState, book: Book, special: SpecialChoice): GameState {
  const before = s.bound[book]
  if (before === undefined && s.shelved[book] === undefined) return s
  const paid = useStock(s, SPECIAL_COST)
  if (!paid) return s
  return { ...paid, bound: { ...paid.bound, [book]: { day: before?.day ?? s.clock.day, special } } }
}

/** 퀴즈까지 마친 뒤 실제로 기록한다 (재료 없이 장을 완성 — 계획 14). 한 권의 마지막 장이면 'bookBound' 장면 */
export function submitChapter(s: GameState, book: Book, chapter: number, content: GameContent): { state: GameState; result: SubmitResult } {
  const result = chapterReady(s, book, chapter, content)
  const bp = s.progress[book]
  if (result.kind !== 'done' || bp.completed.includes(chapter)) return { state: s, result }
  const progress = { ...s.progress, [book]: { ...bp, completed: [...bp.completed, chapter] } }
  const scenes = [...s.scenes]
  if (totalChapters(s) === 0) scenes.push('firstChapter')
  if (bookDone({ progress }, book, content)) scenes.push('bookBound')
  const bound = passTime({ ...s, progress, scenes, needs: work(s.needs, 6) }, bindMinutes(s))
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
 * 이미 적은 장, 앞 장부터 차례대로, 몸(피로). 받은 장인지·재료는 보지 않는다 (계획 14). 'notReceived'·'supplies'는 더 나오지 않는다
 */
export function letterReady(s: GameState, book: Book, chapter: number, content: GameContent): LetterReady | null {
  if (modeOf(book) !== 'letters') return null
  const pieces = content.pieces.filter((p) => p.book === book)
  const piece = pieces.find((p) => p.chapter === chapter)
  if (!piece) return null
  const bp = s.progress[book]
  if (bp.completed.includes(chapter)) return { kind: 'recorded' }
  // 받은 장인지·재료는 보지 않는다 (계획 14 — 조각·편지는 필사 재료가 아니다)
  if (currentChapter(pieces, bp.completed) !== chapter) return { kind: 'order' }
  return { kind: 'ready' }
}

/**
 * 빈칸을 채워 편지 한 장을 옮겨 적는다: 준비가 되었고(letterReady) picks가 blanksFor의 답과 모두 같을 때만.
 * 피로·걸리는 시간은 조각 장과 같다 (재료는 들지 않는다 — 계획 14). 장 기록 퀴즈는 없다 (옮겨 적기가 그 장을 익히는 일).
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
  const recorded = passTime({ ...s, progress, scenes, needs: work(s.needs, 6) }, bindMinutes(s))
  // 요한계시록 2·3장을 옮겨 적으면 그 장의 교회 카드가 일곱 교회 판에 들어온다
  return book === 'rev' ? syncBoard(recorded, 'churches', content) : recorded
}

// ── 필사 (계획 14 작업 1): 한 절씩 따라 적기, 재료 없음 ──

/** 책상에서 쓸 책을 고른다 — 27권 어느 책이든 (서고 방이 열리지 않아도). 필사할 장이 없는 책이면 그대로 */
export function startCopy(s: GameState, book: CopyBook, content: GameContent): GameState {
  // 구약은 새 터를 받은 뒤에만 (집 책상·새 터 책상 모두) — 본문을 아직 안 불러왔으면 그대로 (책상이 먼저 불러온다)
  if (isOtBook(book) ? !s.flags.newlandGift : !(BOOKS as readonly Book[]).includes(book)) return s
  if (!copyVerses(book, chaptersOf(book, content)[0] ?? 0, content).length) return s
  return { ...s, copy: { ...s.copy, book } }
}

/**
 * 쓰다 만 입력을 그 절 자리에 저장한다 (자동 저장 — 나갔다 오면 그 절, 그 입력부터).
 * pasted(붙여넣기·끌어 놓기 표식)면 받지 않는다. 한꺼번에 여러 글자가 들어온 입력은 화면이 copying.acceptInput으로 먼저 거른다
 */
export function saveCopyDraft(s: GameState, book: CopyBook, input: string, content: GameContent, pasted = false): GameState {
  const spot = copySpot(s, book, content)
  if (!spot) return s
  const draft = pasted ? spot.draft : input
  return { ...s, copy: { ...s.copy, at: { ...s.copy.at, [book]: { chapter: spot.chapter, verse: spot.verse.verse, ...(draft ? { draft } : {}) } } } }
}

export type VerseResult =
  /** 다 마친 책 (쓸 절이 없다) */
  | { kind: 'none' }
  /** 아직 다 쓰지 않았다 — 입력은 자리에 저장된다 */
  | { kind: 'notYet'; check: CopyCheck }
  /** 한 절을 기록했다 */
  | { kind: 'verse'; chapter: number; verse: number }
  /**
   * 한 장을 마쳤다: 그 장의 절 수·글자 수, 오른 능력치 점수(1–100 화면 값의 차이, 5단계면 0), 이 장으로 한 권을 마쳤는가.
   * next: 이어 쓸 장 (없으면 null)
   */
  | {
      kind: 'chapter'
      chapter: number
      verse: number
      verses: number
      chars: number
      gains: { wit: number; hand: number }
      bookDone: boolean
      next: number | null
      /** 이 장을 마쳐 새로 발견한 하나님 기록 (없으면 빈 목록) */
      finds: GodFind[]
    }

/**
 * 한 절을 적는다: 입력이 그 절 본문과 다 맞으면(띄어쓰기·문장부호 무시) 기록하고 다음 절로.
 * 장의 마지막 절이면 장을 마친다 — progress[book].completed에 더하고(서고·방 흐름 그대로, 첫 장이면 'firstChapter',
 * 한 권의 마지막 장이면 'bookBound' 장면), 지능·손재주 경험치, 시간·피로는 예전 엮기와 같은 크기 (copyMinutes — 넓은 책상 효과 없음, 피로 6).
 * 재료·조각·받은 편지는 보지 않는다. 덜 맞으면 입력만 자리에 저장한다 (pasted면 그것도 받지 않는다)
 */
export function writeVerse(s: GameState, book: CopyBook, input: string, content: GameContent, pasted = false): { state: GameState; result: VerseResult } {
  const spot = copySpot(s, book, content)
  if (!spot) return { state: s, result: { kind: 'none' } }
  const text = pasted ? spot.draft : input
  const check = checkCopy(text, spot.verse.text)
  if (!check.done) return { state: saveCopyDraft(s, book, text, content), result: { kind: 'notYet', check } }
  const { chapter } = spot
  const verses = copyVerses(book, chapter, content)
  const day = s.clock.day
  // 구약 가지 (계획 20 작업 5, D9): 본문 비교·장 완료·시간·피로는 신약과 같은 코드. 다른 것은 아래 셋뿐이다 —
  // 진행은 otProgress, 기록은 otCopyStats, 그리고 경험치·하나님 기록·판 동기화·'제본·첫 장' 장면·일기 기록은 건너뛴다 (말씀은 보상이 아니다)
  const ot = isOtBook(book)
  const baseStats = ot ? (s.otCopyStats ?? NO_COPY_STATS) : s.copyStats
  const stats: CopyStats = {
    ...baseStats,
    verses: baseStats.verses + 1,
    chars: baseStats.chars + spot.verse.chars,
    firstDay: baseStats.firstDay ?? day,
  }
  // 이 책을 쓰기 시작한 날 (완성본 첫 쪽 — 작업 8). 처음 적은 절의 날 그대로 둔다.
  // 이 칸이 생기기 전에 이미 장을 마친 책이면 언제 시작했는지 모르므로 비워 둔다 (지금을 시작한 날로 속이지 않는다)
  const started = s.copy.days?.[book]
  const partlyDone = progressOf(s, book).completed.length > 0
  const days = started || partlyDone ? (s.copy.days ?? {}) : { ...s.copy.days, [book]: { start: day } }
  /** 구약 첫 절이면 새 터의 땅이 드러난다 (땅 둘러보기와 같은 표식 — 비용 없음). 지도를 맞추는 syncHome도 함께 */
  const revealed = <T extends GameState>(st: T): T => {
    if (!ot) return st
    const r = revealNewland(st)
    if (r !== st) syncHome(r)
    return r
  }
  const last = spot.index === verses.length - 1
  if (!last) {
    const nextVerse = verses[spot.index + 1].verse
    const state = revealed({
      ...s,
      ...(ot ? { otCopyStats: stats } : { copyStats: stats }),
      copy: { ...s.copy, days, at: { ...s.copy.at, [book]: { chapter, verse: nextVerse } } },
    })
    return { state, result: { kind: 'verse', chapter, verse: spot.verse.verse } }
  }
  // 장을 마쳤다
  const bp = progressOf(s, book)
  const completed = bp.completed.includes(chapter) ? bp.completed : [...bp.completed, chapter]
  const progress = ot ? s.progress : { ...s.progress, [book]: { ...bp, completed } }
  const otProgress = ot ? { ...s.otProgress, [book]: { ...bp, completed } } : s.otProgress
  const finished = bookDone({ progress, otProgress }, book, content)
  const scenes = [...s.scenes]
  if (!ot) {
    if (totalChapters(s) === 0) scenes.push('firstChapter')
    if (finished) scenes.push('bookBound')
  }
  const before = s.stats
  const after = ot ? before : addXp(addXp(before, 'wit', COPY_CHAPTER_XP), 'hand', COPY_CHAPTER_XP)
  const next = nextOpenChapter(book, completed, chapter, content)
  const nextVerse = next === null ? null : copyVerses(book, next, content)[0]?.verse
  const at = { ...s.copy.at }
  if (next !== null && nextVerse !== undefined && nextVerse !== null) at[book] = { chapter: next, verse: nextVerse }
  else delete at[book]
  // 하나님 기록: 그 장의 줄 중 아직 발견하지 않은 것 (장을 마친 날과 함께 남는다 — 쓰는 도중에는 보이지 않는다). 구약에는 없다
  const finds = ot ? [] : chapterFinds(content.godRecords ?? [], s.godRecords, book as Book, chapter, day)
  const chapterStats = { ...stats, chapters: stats.chapters + 1, books: stats.books + (finished ? 1 : 0) }
  let state: GameState = passTime(
    {
      ...s,
      progress,
      ...(ot ? { otProgress } : {}),
      scenes,
      stats: after,
      // 피로는 장을 마칠 때만 붙는다 (지쳐도 쓸 수는 있다 — 사용자 결정 2026-10-04)
      needs: work(s.needs, 6),
      godRecords: ot ? s.godRecords : [...s.godRecords, ...finds],
      // 이 장으로 한 권을 마쳤으면 마친 날을 남긴다
      copy: {
        ...s.copy,
        at,
        days: finished ? { ...days, [book]: { ...(days[book]?.start !== undefined ? { start: days[book]!.start } : {}), end: day } } : days,
        // 필사로 실제로 따라 적은 장 (조각 엮기·편지 옮겨 적기로 마친 장은 여기 들어오지 않는다)
        copied: { ...s.copy.copied, [book]: [...new Set([...(s.copy.copied?.[book] ?? []), chapter])] },
      },
      ...(ot ? { otCopyStats: chapterStats } : { copyStats: chapterStats }),
    },
    copyMinutes(s),
  )
  state = revealed(state)
  if (!ot) {
    const nt = book as Book
    // 오늘의 기록: 그날 필사로 마친 장 (잠들기 전 일기)
    state = logChapter(state, nt, chapter)
    // 사도행전 장은 여정 판에, 요한계시록 2·3장은 일곱 교회 판에 카드가 들어온다 (예전 엮기·옮겨 적기와 같다)
    if (nt === 'ac') state = syncJourney(state, content)
    if (nt === 'rev') state = syncBoard(state, 'churches', content)
  }
  const gains = { wit: statScore(after.wit) - statScore(before.wit), hand: statScore(after.hand) - statScore(before.hand) }
  const chars = verses.reduce((n, v) => n + v.chars, 0)
  return { state, result: { kind: 'chapter', chapter, verse: spot.verse.verse, verses: verses.length, chars, gains, bookDone: finished, next, finds } }
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

/**
 * 필사로 한 장을 마칠 때 흐르는 분 (계획 14): 기분이 좋으면 45, 아니면 60 — 예전 엮기와 같은 크기.
 * 넓은 책상·책상 고치기는 필사를 빠르게 하지 않는다 (꾸미기 물건으로 바뀐다)
 */
export function copyMinutes(s: Pick<GameState, 'needs' | 'clock' | 'room' | 'inv'> & Partial<Pick<GameState, 'flags'>>): number {
  return inGoodMood(s) ? 45 : 60
}

/** 예전 엮기·옮겨 적기로 한 장을 마칠 때 흐르는 분 — 필사와 같다 (계획 14: 넓은 책상·기록대는 빠르게 하지 않는 꾸미기 물건) */
export function bindMinutes(s: Pick<GameState, 'needs' | 'clock' | 'room' | 'inv'> & Partial<Pick<GameState, 'flags'>>): number {
  return copyMinutes(s)
}

// ── 잠과 새 날 ──

/** 잠들기 전에 읽을 조각: 다시 읽을 구절이 먼저, 그다음 오늘 들은 것, 그래도 없으면 모아 둔 것 중 하나 */
export function reviewPick(s: GameState, rng: Rng): string | null {
  if (s.rereads.length) return s.rereads[0]
  if (s.todayHeard.length) return s.todayHeard[Math.min(s.todayHeard.length - 1, Math.floor(rng() * s.todayHeard.length))]
  if (s.collected.length === 0) return null
  return s.collected[Math.min(s.collected.length - 1, Math.floor(rng() * s.collected.length))]
}

/** 오늘이 평안인 날인가 (어젯밤 자기 전에 구절을 읽었다 */
export function peaceful(s: Pick<GameState, 'flags' | 'clock'>): boolean {
  return s.flags.peaceDay === s.clock.day
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
 * 창만 닫고(더 깨어 있기) 자면 read/pieceId가 없어 목록이 그대로 남는다.
 */
export function goToSleep(s0: GameState, content: GameContent, opts: { read?: boolean; pieceId?: string } = {}): GameState {
  // 새 터에는 침대가 없다 — 억지로 잠들면 첫 마을 침대에서 깬다 (계획 20 D6)
  if (s0.map && s0.map !== 'village') s0 = { ...s0, map: 'village' }
  syncHome(s0)
  const s = opts.read && opts.pieceId ? readOff(s0, opts.pieceId) : s0
  const sick = fallsSick(s.needs)
  let clock = sleepClock(s.clock)
  if (sick) clock = { ...clock, minute: 10 * 60 }
  const day = clock.day
  const bed = PLACES.bed.stand ?? HOME_ENTRY
  const scenes = [...s.scenes]
  if (sick) scenes.push('sick')
  if (day === BABY_DAY) scenes.push('babyBorn')
  if (day === STRAY_DAY && !s.companion) scenes.push('strays')
  let needs = sleepNeeds(s.needs, s.clock.minute)
  if (sick) needs = { hunger: 20, fatigue: 0, cold: 0, heat: 0 }
  const flags = { ...s.flags }
  if (opts.read) flags.peaceDay = day
  else delete flags.peaceDay
  delete flags.peaceDay2 // 없앤 다락 창가의 평안 (옛 저장)
  // ── 집 넓히기: 부탁해 둔 단계가 아침에 지어진다. 새 모양에 맞지 않는 가구는 가방으로 ──
  let homeLevel = s.homeLevel ?? 0
  let room = s.room
  let inv = s.inv
  const order = flags.homeOrder
  if (order === homeLevel + 1 && (order === 1 || order === 2 || order === 3)) {
    homeLevel = order
    delete flags.homeOrder
    scenes.push(`home:${order}`)
    setHomeLevel(homeLevel)
    const refit = refitRoom(room, inv)
    room = refit.room
    inv = refit.inv
    if (order === 2 && !flags.cradleFurniture) {
      syncHome({ ...s, homeLevel, room })
      const cradle = placement(room, 'homeCradle', CRADLE_SPOT)
      if (cradle) room = [...room, cradle]
      else inv = addGift(inv, { homeCradle: 1 })
      flags.cradleFurniture = 1
    }
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
  // ── 신약 완필 보상: 잔치가 지난 아침 새 터와 작은 서고를 받는다 (저장당 한 번 — 플래그 newlandGift) ──
  claimNewland(s.shelved, flags, scenes)
  // ── 여정을 다 이은 다음 날 아침: 호숫가 나루에 큰 배가 들어온다 (한 번) ──
  if (flags.actsShip === 1) {
    flags.actsShip = 2
    scenes.push('actsShip')
  }
  // (서고의 방은 모두 처음부터 열려 있다 — 예전의 "앞 방이 차면 다음 방" 열림 장면은 없앴다)
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
    // 오늘의 기록은 새 날의 빈 기록으로 (어제 것은 잠들기 전 일기로 보았다)
    dayLog: emptyDayLog(day),
    talked: [],
    helped: [],
    gifted: [],
    // 새 날의 말씀 조각 (드물게 — 편지 하나 또는 특별한 대화 한 명, 계획 14 작업 5)
    ...todaysFragments(day, s.collected, content, present),
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
    spaces: pruneSpaces(s.spaces ?? [], room),
    inv,
  }
  // 가족 생일 아침 (계획 12): 배우자·아이 생일 장면
  const morning = advanceBuilds(advanceVillage(familyMorning(childMorning(forgetPromises(morningSupplies(expireStall(expireWorkDay(next)), s.clock.day), day), content)), content))
  // 침대 위에서 눈을 뜨고 일어난다 (그림만)
  return startAct({ ...morning, npcs: placeAllNpcs(morning, content) }, 'rise', PLACES.bed.tiles[0])
}

/** 아이가 하루 한 번 해 오는 것 (근력·손재주·운 — 한 개씩, 날마다 번갈아) */
const CHILD_FINDS: Partial<Record<StatId, [ItemId, ItemId]>> = { strength: ['water', 'reed'], hand: ['papyrus', 'ink'], luck: ['fig', 'honey'] }
/** 아이가 돕는 일로 오르는 아이 자신의 경험치 */
export const CHILD_HELP_XP = 10

/**
 * 아이의 아침 (계획 12): 결혼하고 CHILD_AFTER_WEDDING일이 지난 아침에 태어나고(이름을 정한다),
 * 걷기 시작하는 날·돕기 시작하는 날엔 장면, 돕는 아이는 하루 한 번 자기 능력치에 맞는 일을 한다
 */
function childMorning(s: GameState, content: GameContent): GameState {
  const day = s.clock.day
  const r = s.romance ?? NO_ROMANCE
  let next = s
  if (!next.child) {
    if (s.homeLevel < 2 || r.stage !== 'married' || r.marriedDay === null || day < r.marriedDay + CHILD_AFTER_WEDDING) return s
    const spouse = content.neighbors.find((d) => d.id === r.partner)
    return {
      ...next,
      child: newChild(day, next.stats, spouse?.stat),
      scenes: [...next.scenes, 'childBorn'],
      flags: { ...next.flags, childNaming: 1 },
    }
  }
  let child = next.child!
  const stage = childStage(child, day)
  if (stage !== 'baby' && !next.flags.childWalked) next = { ...next, scenes: [...next.scenes, 'childWalks'], flags: { ...next.flags, childWalked: 1 } }
  if (stage === 'adult') {
    // 어른이 된 아침: 가장 높은 능력치로 일이 정해지고, 남거나 떠난다
    if (!child.job) {
      const j = adultJob(child)
      child = { ...child, job: j.job, jobConfirmed: false, left: j.left, ...(j.left ? { mode: undefined } : {}) }
      next = { ...next, child, scenes: [...next.scenes, j.left ? 'childLeaves' : 'childStays'] }
    }
    // 가끔 편지·선물·닢 (떠난 아이가 더 자주)
    const mail = kidMailFor(child, day)
    if (mail) {
      if (mail === 'gift') next = { ...next, inv: addGift(next.inv, JOB_GIFTS[child.job!]) }
      if (mail === 'coins') next = { ...next, coins: next.coins + kidCoins(day) }
      // 필경사·학자가 된 아이는 편지에 이야기 한 조각을 넣어 보낸다
      if (mail === 'letter' && (child.job === 'scribe' || child.job === 'scholar')) {
        const story = extraPiece(next, content, 'child')
        if (story) next = { ...story.state, flags: { ...story.state.flags, kidMailPiece: day } }
      }
      next = { ...next, todayNotes: [...next.todayNotes, `kidMail:${mail}`], flags: { ...next.flags, kidMailDay: day, kidMailKind: ['letter', 'gift', 'coins'].indexOf(mail) } }
    }
    // 떠난 아이는 날마다 돕지 않는다
    if (child.left) return next
  } else if (stage !== 'helper') return next
  if (!next.flags.childHelping) next = { ...next, scenes: [...next.scenes, 'childHelps'], flags: { ...next.flags, childHelping: 1 } }
  const kind = helpStat(child)
  const finds = CHILD_FINDS[kind]
  let helped = true
  if (finds) {
    // 운은 이틀에 한 번꼴 뜻밖의 선물
    if (kind === 'luck' && day % 2) helped = false
    else next = putAway(next, { [finds[day % 2]]: 1 })
  } else if (kind === 'charm') {
    // 대신 인사하러 간다: 오늘 마을에 나온 이웃 한 명 (배우자는 빼고)
    const level = next.flags.villageLevel ?? 0
    const who = content.neighbors.filter((d) => !d.marketOnly && d.id !== r.partner && !notYet(d, level, next.flags))
    if (who.length) next = heartUp(next, who[day % who.length].id, GAIN.talk)
  } else if (kind === 'wit') {
    // 이웃 이야기를 사흘에 한 번 먼저 들어 온다 (다른 날엔 일지에 이웃 이야기 한 줄)
    const [teller] = Object.keys(next.offers)
    if (teller && day % 3 === 0) next = listen(next, teller, content).state
  }
  const notes = helped ? [...next.todayNotes, `childHelp:${kind}`] : next.todayNotes
  return {
    ...next,
    child: { ...child, stats: addXp(child.stats, kind, CHILD_HELP_XP) },
    todayNotes: notes,
    flags: { ...next.flags, childHelpDay: day, childHelpKind: helped ? STAT_ORDER.indexOf(kind) : -1 },
  }
}
const STAT_ORDER: readonly StatId[] = ['wit', 'hand', 'charm', 'strength', 'luck']

/** 물건 도감과 업적을 새로 적는다 (저장할 때마다): 새로 이룬 업적을 돌려준다 */
export function recordProgress(s: GameState): { state: GameState; fresh: Achievement[] } {
  const found = withFound(s.found ?? [], s.inv, s.chest ?? {})
  const base: GameState = found === s.found ? s : { ...s, found }
  const achieved = base.achieved ?? []
  const fresh = newlyAchieved({ ...base, romance: base.romance ?? NO_ROMANCE, notebook: base.notebook ?? NO_NOTEBOOK }, achieved)
  if (!fresh.length) return { state: base, fresh }
  return { state: { ...base, achieved: [...achieved, ...fresh.map((a) => ({ id: a.id, day: s.clock.day }))] }, fresh }
}

/** 아이 이름 정하기: '다른 이름'으로 다시 뽑고, 정하면 끝 */
export function nameChild(s: GameState, name: string): GameState {
  if (!s.child) return s
  const flags = { ...s.flags }
  delete flags.childNaming
  return { ...s, child: { ...s.child, name }, flags }
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
  // 계획 14: 틀은 크림색 종이, 항아리는 푸른 염료 (특별 제본의 꾸미기 재료 — 하루 양은 예전 그대로)
  if (owns(s.flags, 'reedRack')) {
    if (stockOf(next, 'creamPaper') < RACK_HOLD) next = putAway(next, { creamPaper: RACK_PAPER })
    if (!next.flags.rackSeen) next = { ...next, scenes: [...next.scenes, 'reedRack'], flags: { ...next.flags, rackSeen: 1 } }
  }
  if (owns(s.flags, 'inkJar') && stockOf(next, 'blueDye') < INK_JAR_HOLD) {
    const paid = useStock(next, { water: 1 })
    if (paid) next = putAway(paid, { blueDye: 1 })
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
  // 꾸밀 방: 첫 마을은 내 집, 새 터는 지금 들어와 있는 입주 주택 방 (방 밖이면 없음)
  const at = roomTarget(s)
  if (!at) return null
  const f = placement(at.room, item, t, undefined, at.ctx)
  if (!f) return null
  const left = take(s.inv, { [item]: 1 })
  if (!left) return null
  // 배운 생활 기술의 모습 (기획 11) — 고른 모습만, 쓰임은 같다
  const finish = placedStyle(s.flags, item)
  const piece: Furniture = finish ? { ...f, finish } : f
  return { ...withRoomOf(s, at.key, [...at.room, piece]), inv: left }
}

/** 놓인 가구를 한 번 돌린다 (계획 17 작업 2 — 못 돌리면 null, 자리·가방은 그대로) */
export function rotateFurniture(s: GameState, f: Furniture): GameState | null {
  syncHome(s)
  const at = roomTarget(s)
  if (!at) return null
  const turned = rotation(at.room, f, at.ctx)
  if (!turned) return null
  return withRoomOf(s, at.key, at.room.map((o) => (o === f ? turned : o)))
}

/** 가방을 거치지 않고 탁자 위 물건까지 한 번에 옮긴다. 실패하면 원래 배치를 보존한다. */
export function moveFurniture(s: GameState, f: Furniture, to: Tile): GameState | null {
  const at = roomTarget(s)
  if (!at || !at.room.includes(f)) return null
  const tiles = footprint(f)
  const carried = [f, ...at.room.filter(o => o !== f && o.on && tiles.some(t => sameTile(t, o)))]
  let room = at.room.filter(o => !carried.includes(o))
  // 집은 옮기는 동안 붙박이 가구의 자리(PLACES)도 함께 맞춘다
  const home = at.key === null
  if (home) syncHome({ ...s, room })
  for (const piece of carried) {
    const dest = { x: to.x + piece.x - f.x, y: to.y + piece.y - f.y }
    if (home) syncHome({ ...s, room: [...room, { ...piece, ...dest }] })
    const ok = placement(room, piece.item, dest, piece.facing, at.ctx)
    if (!ok) { syncHome(s); return null }
    room = [...room, { ...piece, ...ok }]
  }
  if (!home) return withRoomOf(s, at.key, room)
  // 옮긴 가구를 따라 정해 둔 자리도 함께 옮겨 간다 (쓸 수 있는지는 새 자리에서 다시 따진다)
  let spaces = s.spaces ?? []
  for (const piece of carried) spaces = moveInSpaces(spaces, piece, { item: piece.item, x: to.x + piece.x - f.x, y: to.y + piece.y - f.y })
  const next = { ...s, room, spaces }
  syncHome(next)
  return next
}

/** 치운 가구는 가방으로 (넘치면 치우지 않는다) */
export function removeFurniture(s: GameState, t: Tile): GameState {
  const at = roomTarget(s)
  if (!at) return s
  const gone = removal(at.room, t)
  if (!gone.length) return s
  const back: Partial<Record<ItemId, number>> = {}
  for (const f of gone) back[f.item] = (back[f.item] ?? 0) + 1
  if (wouldOverflow(s.inv, back)) return s
  const room = at.room.filter((f) => !gone.includes(f))
  if (at.key !== null) return { ...withRoomOf(s, at.key, room), inv: add(s.inv, back) }
  return { ...s, room, spaces: pruneSpaces(s.spaces ?? [], room), inv: add(s.inv, back) }
}

// ── 집 넓히기 (목수에게 부탁 — 설계 §7-1: 배우자방 → 아이방 → 생활방) ──

export interface HomeStage {
  level: 1 | 2 | 3
  coins: number
  needs: Partial<Record<ItemId, number>>
}
export const HOME_STAGES: readonly HomeStage[] = [
  { level: 1, coins: 120, needs: { olive: 5 } },
  { level: 2, coins: 200, needs: { papyrus: 5 } },
  { level: 3, coins: 300, needs: { olive: 8, papyrus: 5 } },
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

/** 목수에게 다음 단계를 부탁한다 (닢과 재료를 내고, 다음 날 아침 지어진다) */
export function orderHome(s: GameState): GameState | null {
  const st = nextHomeStage(s)
  if (!st || canOrderHome(s)) return null
  return { ...s, coins: s.coins - st.coins, inv: take(s.inv, st.needs)!, flags: { ...s.flags, homeOrder: st.level } }
}

// ── 가족 옷장: 머리부터 옷·장신구·색까지 (피부만 그대로) ──
export type WardrobeWho = 'me' | 'spouse' | 'child'
/** 지금 그 사람의 모습 (옷장을 연 적이 없으면 원래 모습) */
export function lookOf(s: Pick<GameState, 'avatar' | 'looks' | 'romance' | 'child'>, who: WardrobeWho, content: GameContent): FullAvatar | null {
  if (who === 'me') return s.avatar ? withLookDefaults(s.avatar) : null
  if (who === 'spouse') {
    const id = s.romance?.stage === 'married' ? s.romance.partner : null
    const def = id ? content.neighbors.find((d) => d.id === id) : null
    if (!def?.avatar || !def.look) return null
    return withLookDefaults({ look: def.look, name: def.role, ...def.avatar, ...(s.looks?.[def.id] ?? {}) })
  }
  if (!s.child) return null
  const base = withLookDefaults({ look: s.child.look === 'boy' ? 'm' : 'f', name: s.child.name, skin: s.avatar?.skin })
  return withLookDefaults({ ...base, ...(s.looks?.child ?? {}) })
}
/** 옷장에서 고른 모습을 입힌다 — 피부는 원래 것을 지킨다 */
export function dressUp(s: GameState, who: WardrobeWho, a: FullAvatar, content: GameContent): GameState {
  const cur = lookOf(s, who, content)
  if (!cur) return s
  const next: FullAvatar = { ...a, skin: cur.skin, look: cur.look, name: cur.name }
  if (who === 'me') return { ...s, avatar: { ...next, name: s.avatar!.name } }
  const key = who === 'child' ? 'child' : s.romance!.partner!
  return { ...s, looks: { ...(s.looks ?? {}), [key]: next } }
}

/** 결혼 첫날 또는 옛 저장에서 한 번만 지급한다. 옮기거나 보관한 가구는 다시 만들지 않는다. */
export function furnishSpouse(s: GameState): GameState {
  const partner = s.romance?.stage === 'married' ? s.romance.partner : null
  if (!partner || s.homeLevel < 1 || s.flags[`spouseFurniture:${partner}`]) return s
  syncHome(s)
  let room = [...s.room], inv = { ...s.inv }
  for (const f of spouseFurniture(partner)) {
    const ok = placement(room, f.item, f, f.facing)
    if (ok) room.push(ok)
    else inv = addGift(inv, { [f.item]: 1 })
  }
  const next = { ...s, room, inv, flags: { ...s.flags, [`spouseFurniture:${partner}`]: 1 } }
  syncHome(next)
  return next
}

function safeHomeSpot(at: Tile, room: readonly Furniture[]): Tile {
  const blockers = solidTiles(room)
  for (let radius = 0; radius < 12; radius++) {
    for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
      const t = { x: at.x + dx, y: at.y + dy }
      if (isHome(t) && isWalkable(t, blockers) && findPath(HOME_ENTRY, t, blockers)) return t
    }
  }
  return HOME_ENTRY
}
