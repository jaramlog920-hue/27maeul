// 엔진 상태 ↔ 화면 연결. 창(모달)이 열려 있으면 시간과 걸음이 멈춘다.
import { create } from 'zustand'
import { CONTENT, neighborById, copySourceFor, LETTER_OPENINGS, pieceById, pieceOfQuestion, piecesOf, quizSourceFor } from '../content/catalog'
import { blanksFor } from '../engine/copy'
import { currentChapter } from '../engine/offers'
import { handEase, leveledUp, XP, type StatId } from '../engine/stats'
import type { FixtureLine } from '../engine/fixtures'
import type { BoardRequest } from '../engine/board'
import { DESTS, type DestId } from '../engine/travel'
import { JOB_GIFTS, kidCoins, type ChildMode } from '../engine/child'
import type { TripReward } from '../engine/trip-board'
import { buildLibraryQuiz, buildQuiz, isCorrect, type Question } from '../engine/quiz'
import { bookRoomOpen, openDoorsFor } from '../engine/books'
import { actsDoorGlows, canShelve, payRetry, poolFor, shelve } from '../engine/library'
import { ALBUM_IDS, fill, itemList, itemName, KID_LETTERS, NEIGHBOR_LINES, roomTitle, SCENES, T, withAnd, withObject, withSubject, callName } from '../content/text'
import { grapesRipe, isWet, weatherOf } from '../engine/calendar'
import { cleanName, type Animal } from '../engine/companion'
import {
  adoptStray,
  canCraft,
  coverWithBlanket,
  eatBread,
  finishCraft,
  finishGather,
  finishHelp,
  gatherInfo,
  giveGift,
  goToSleep,
  greetNeighbor,
  lightLamp,
  listen,
  newGame,
  chooseBook,
  placeFurniture,
  removeFurniture,
  restAt,
  reviewPick,
  sceneSeen,
  setArrangement,
  bookLineKey,
  setMyLine,
  stargaze,
  openMailbox,
  train,
  hallFriendsHere,
  sealBook,
  orderFixture,
  personLine,
  chooseInEvent,
  giveBouquet,
  giveCord,
  dateTea,
  dateSunset,
  spouseGift,
  sellHerbs,
  playHall,
  drinkTea,
  watchSunset,
  clearSky,
  submitChapter,
  tapTile,
  walkDirection,
  interactTile,
  pressTile,
  teach,
  tick,
  trade as doTrade,
  buyRare,
  fulfillBoard,
  takeTrip,
  nameChild,
  recordProgress,
  openEvent,
  nextTripPiece,
  mutterWaiting,
  hearMutter,
  setCompanionStay,
  setChildMode,
  sendToSchool,
  warmByHearth,
  playerTile,
  receiveVisit,
  enterDoor,
  shelvedCount,
  inviterAtDoor,
  dine,
  drinkWater,
  hasFood,
  askRequest,
  fulfillRequest,
  chapterReady,
  letterReady,
  recordLetter,
  readScripture,
  passTime,
  sell,
  sellPrice,
  orderHome,
  orderWork,
  takeFromChest,
  syncHome,
  moveBoardCard,
  type GameState,
  type SubmitResult,
  type Trade,
} from '../engine/game'
import { inAttic, isHome, LOCKED_DOORS, lockedTiles, lockedZones, roomAt, sameTile, zoneAt } from '../engine/world'
import { removal } from '../engine/room'
import { heartsOf } from '../engine/hearts'
import { add, count, RECIPES, type Inventory, type RecipeId } from '../engine/items'
import type { CarpenterWork } from '../engine/easier'
import { work } from '../engine/needs'
import { plant, water, harvest, type CropId } from '../engine/garden'
import { finishNow, HOLD_UP, isDone, startMini, stepMini, tapMini, type MiniState } from '../engine/minigame'
import { finishLetter, letterPay, letterWaiting } from '../engine/requests'
import { POSTMAN } from '../engine/post'
import { arrivesOf, modeOf, roomOf, shelfRoom, type ShelfRoomId } from '../engine/shelf-rooms'
import { saveGame } from '../engine/save'
import { moveItem } from '../engine/scroll'
import type { Book, ItemId, PlaceId, Rng, Target, Tile } from '../engine/types'
import { sfx, setAudioMuted } from '../audio/sound'

export type Pending =
  | { kind: 'gather'; place: PlaceId }
  | { kind: 'craft'; recipe: RecipeId }
  | { kind: 'help'; neighborId: string }
  | { kind: 'teach' }
  | { kind: 'letter' }

export type QuizMode = { kind: 'chapter'; book: Book; chapter: number } | { kind: 'library'; book: Book; retry: boolean }

/** 선반의 칸 */
export type ShelfTab = 'dex' | 'gifts' | 'recipes' | 'album' | 'lines' | 'items' | 'awards'

export type Modal =
  | { kind: 'settings' }
  | { kind: 'guide' }
  | { kind: 'schedule' }
  | { kind: 'talk'; neighborId: string; line: string }
  | { kind: 'passage'; pieceId: string; askLine: boolean; back?: boolean }
  /** lineKey: 조각 id 또는 'book:mk' 같은 책 키. back: 적거나 넘긴 뒤 돌아갈 창 */
  | { kind: 'myLine'; lineKey: string; back?: 'library' | 'shelf' | `room:${ShelfRoomId}` }
  /** copy: 편지 옮겨 적기의 고른 답 (창 상태로만 — 게임 저장에 남지 않는다) */
  | { kind: 'desk'; result: SubmitResult | null; dark: boolean; copy?: CopyPad }
  /** attic: 다락 창가에서 연 자기 전 읽기 */
  | { kind: 'review'; pieceId: string | null; attic?: boolean }
  | { kind: 'journal' }
  | { kind: 'scene'; id: string; chosen?: number }
  /** 부탁하기 창 (계획 13) */
  | { kind: 'orders'; npc: string }
  | { kind: 'mini'; state: MiniState; pending: Pending }
  | { kind: 'gift'; neighborId: string }
  | { kind: 'trade' }
  /** 사랑방 벽의 의뢰 게시판 (계획 13 작업 5) */
  | { kind: 'board' }
  /** 나루의 배: 이웃 마을 여행 (계획 13 작업 6). 주사위 판을 마치고 돌아오면 dest·rewards를 들고 가게로 */
  | { kind: 'travel'; dest?: DestId; rewards?: TripReward[] }
  /** 아이 이름 정하기 (계획 12) */
  | { kind: 'childName' }
  /** 동물 친구·우리 아이: 데리고 다니기·집에 두기 */
  | { kind: 'follow'; who: 'pet' | 'child' }
  /** 마을 지도: 마을 전체를 한 장으로 (설정에서) */
  | { kind: 'villageMap' }
  /** 배움터: 아이 맡기기 */
  | { kind: 'school' }
  | { kind: 'menu'; place: MenuPlace }
  | { kind: 'readPick' }
  | { kind: 'quiz'; mode: QuizMode; questions: Question[]; index: number; wrong: string[]; solved: boolean; misses: number; missed: string[] }
  | { kind: 'care' }
  | { kind: 'bag' }
  | { kind: 'shelf'; tab?: ShelfTab }
  | { kind: 'companion'; animal: Animal }
  | { kind: 'library' }
  /** 서고 방의 선반 (사도행전 방·편지 방·요한계시록 방 — RoomShelf), 벽의 카드 판 (board 없으면 사도행전 방 여정 판) */
  | { kind: 'roomShelf'; room: ShelfRoomId }
  | { kind: 'journey'; board?: 'churches' }
  | { kind: 'letter' }
  | { kind: 'garden'; at: Tile }

/** 편지 한 장 옮겨 적기에서 고른 것: 칸마다 맞힌 낱말(아직이면 null), 흐려진(틀린) 보기, 방금 틀린 칸 */
export interface CopyPad {
  book: Book
  chapter: number
  picks: (string | null)[]
  dimmed: string[][]
  miss: number | null
}

/** 지금 옮겨 적는 장 (편지 책이 아니거나 다 적었으면 null) */
export function copyChapter(game: GameState): { book: Book; chapter: number } | null {
  const book = game.activeBook
  if (!book || modeOf(book) !== 'letters') return null
  const chapter = currentChapter(piecesOf(book), game.progress[book].completed)
  return chapter === null ? null : { book, chapter }
}

/** 창에 남은 고른 답이 지금 장의 것이면 그대로, 아니면 빈 칸들 */
export function copyPadFor(game: GameState, pad: CopyPad | undefined): CopyPad | null {
  const at = copyChapter(game)
  if (!at) return null
  if (pad && pad.book === at.book && pad.chapter === at.chapter) return pad
  const n = blanksFor(at.book, at.chapter, copySourceFor(at.book)).length
  return { ...at, picks: Array(n).fill(null), dimmed: Array.from({ length: n }, () => []), miss: null }
}

/** 서고 방 벽의 카드 판: 사도행전 방 여정 판 / 요한계시록 방 일곱 교회 카드 판 */
export type CardBoard = 'acts' | 'churches'
/** 판마다 게임 상태 칸(game.ts BoardId)·완성 표식·완성 알림 */
const CARD_BOARDS: Record<CardBoard, { field: 'journey' | 'churches'; flag: string; doneToast: string }> = {
  acts: { field: 'journey', flag: 'actsShip', doneToast: T.acts.boardDoneToast },
  churches: { field: 'churches', flag: 'churchesDone', doneToast: T.revRoom.boardDone },
}

/** 나의 한 줄 창을 닫은 뒤 돌아갈 곳 */
function afterMyLine(m: Modal | null): Modal | null {
  if (m?.kind !== 'myLine' || !m.back) return null
  if (m.back === 'shelf') return { kind: 'shelf', tab: 'lines' }
  if (m.back === 'library') return { kind: 'library' }
  return { kind: 'roomShelf', room: m.back.slice('room:'.length) as ShelfRoomId }
}

/** 이 책을 꽂는 선반 창: 복음서는 서고 선반, 그 뒤 책은 자기 방 선반 (방 표) */
function shelfBackOf(book: Book): 'library' | `room:${ShelfRoomId}` {
  const room = roomOf(book).id
  return room === 'gospels' ? 'library' : `room:${room}`
}

interface Store {
  game: GameState
  modal: Modal | null
  toast: { text: string; until: number } | null
  /** 새로 이룬 업적 (알림과 따로, 위쪽 작은 띠) */
  award: { text: string; until: number } | null
  /** 여행 주사위 판 (새 장면) — 저장하지 않는다. 있는 동안 마을 시간은 멈춘다 */
  trip: { dest: DestId; withChild: boolean } | null
  startTripBoard: (dest: DestId, withChild: boolean) => void
  finishTripBoard: (rewards: TripReward[]) => void
  /** 지금 장면 창을 닫은 뒤 띄울 알림 (별 보는 밤: 장면을 먼저 보이고 편지함 알림) */
  afterScene: string | null
  /** 방 꾸미기: 놓을 물건, 또는 치우기 */
  decorating: ItemId | 'pick' | null
  muted: boolean
  /** 터치 화면의 조이스틱 (설정에서 켜고 끈다, 처음엔 꺼짐) */
  joystick: boolean
  /** 조이스틱 모양: 네 방향 패드(기본) 또는 둥근 조이스틱 */
  joystickShape: JoystickShape
  /** 조이스틱 자리: 화면 오른쪽 아래(기본) 또는 왼쪽 아래 */
  joystickSide: JoystickSide
  /** 휴대폰 아래 조작판 (나침반 패드·확인 단추·가방/일지/설정) — 처음부터 켜져 있다 */
  deck: boolean
  /** 화면 확대 (1 = 100% ~ 2 = 200%) */
  zoom: number
  /** 테스트에서 난수를 고정하려고 바꿀 수 있다 */
  rng: Rng
  /** 앨범 사진을 찍는 함수 (캔버스가 등록한다) */
  capture: (() => string | null) | null
  clockMs: number

  load: (game: GameState) => void
  tap: (tile: Tile) => void
  walk: (dx: number, dy: number) => void
  /** 스페이스: 앞에 있는 것을 누른 것처럼 */
  interact: () => boolean
  /** 조이스틱 가운데 단추: 바라보는 앞 칸(없으면 서 있는 칸)을 누른 것과 같다 */
  press: () => void
  frame: (dt: number) => void
  say: (text: string, ms?: number) => void
  closeModal: () => void
  open: (m: Modal) => void

  // 이웃
  listenTo: (neighborId: string) => void
  startHelp: (neighborId: string) => void
  gift: (neighborId: string, item: ItemId) => void
  doTrade: (t: Trade) => void
  sellItem: (item: ItemId) => void
  buyRareItem: (item: ItemId) => void
  doBoard: (r: BoardRequest) => void
  goTrip: (dest: DestId, buys: ItemId[], rewards?: TripReward[]) => void
  setChildName: (name: string) => void
  /** 곁에 선 이웃에게 말 걸기 ('대화하기' 단추) */
  talkTo: (id: string) => void
  petCompanion: () => void
  keepCompanion: (stay: boolean) => void
  keepChild: (mode: ChildMode) => void
  goSchool: (stat: StatId) => void
  startTeach: () => void
  startLetter: () => void
  // 손일
  startCraft: (recipe: RecipeId) => void
  miniTap: (itemId?: number) => void
  quitMini: () => void
  /** 손에 익은 연장이 있으면 손일 놀이를 바로 끝낸다 */
  skipMini: () => void
  warm: () => void
  eat: () => void
  rest: () => void
  playHall: () => void
  sellHerbs: () => void
  /** 서고: 봉인용 밀랍으로 봉인 */
  seal: (book: Book) => void
  /** 목수·대장장이에게 기록 설비 부탁 */
  askFixture: (npc: string, line: FixtureLine) => void
  giveBouquet: (id: string) => void
  giveCord: (id: string) => void
  dateTea: () => void
  dateSunset: () => void
  drinkTea: () => void
  watchSunset: () => void
  sitHill: () => void
  requestAsk: (npc: string) => void
  requestGive: (npc: string) => void
  /** 목수에게 집 넓히기 부탁 */
  askHome: (npc: string) => void
  /** 목수에게 살림 부탁 (재료 궤짝·그을음 받이·갈대 말리는 틀, 계획 11) */
  askWork: (npc: string, id: CarpenterWork['id']) => void
  /** 집 안에서 재료 궤짝의 것을 가방으로 */
  takeChest: (id: ItemId) => void
  readAt: (pieceId: string) => void
  blanket: () => void
  drink: () => void
  plantAt: (at: Tile, crop: CropId) => void
  waterAt: (at: Tile) => void
  harvestAt: (at: Tile) => void
  // 책상·잠
  pickBook: (book: Book) => void
  moveInDesk: (book: Book, chapter: number, index: number, delta: number) => void
  submitDesk: (book: Book, chapter: number) => void
  /** 편지 옮겨 적기: 칸 하나에 보기 하나 (맞으면 채우고, 틀리면 그 보기를 흐린다 — 불이익 없음) */
  copyPick: (blank: number, option: string) => void
  /** 세 칸을 다 채웠으면 옮겨 적는다 (recordLetter) */
  submitCopy: () => void
  answerQuiz: (given: string | string[]) => void
  nextQuiz: () => void
  // 서고
  /** 카드 판(여정 판·일곱 교회 카드 판)의 카드를 위(-1)·아래(+1)로 */
  moveBoard: (board: CardBoard, index: number, delta: number) => void
  startShelve: (book: Book) => void
  startRetry: (book: Book) => void
  sleep: () => void
  saveMyLine: (lineKey: string, text: string) => void
  /** 나의 한 줄을 적지 않고 넘긴다 (나중에 선반에서 적을 수 있다) */
  skipMyLine: () => void
  // 동물·방
  adopt: (animal: Animal, name: string) => void
  startDecorate: (item: ItemId | 'pick') => void
  stopDecorate: () => void
  nextScene: () => void
  chooseScene: (index: number) => void
  setMuted: (m: boolean) => void
  setJoystick: (on: boolean) => void
  setJoystickShape: (shape: JoystickShape) => void
  setJoystickSide: (side: JoystickSide) => void
  setDeck: (on: boolean) => void
  setZoom: (zoom: number) => void
}

function hasStorage(): boolean {
  try {
    return !!globalThis.localStorage
  } catch {
    return false
  }
}

function pick<X>(arr: readonly X[], rng: Rng): X {
  return arr[Math.min(arr.length - 1, Math.floor(rng() * arr.length))]
}

const ALBUM_KEY = (id: string) => `twenty-seven/album/${id}`
export function albumImage(id: string): string | null {
  try {
    return globalThis.localStorage?.getItem(ALBUM_KEY(id)) ?? null
  } catch {
    return null
  }
}
function storeAlbumImage(id: string, data: string | null) {
  if (!data) return
  try {
    globalThis.localStorage?.setItem(ALBUM_KEY(id), data)
  } catch {
    /* 저장소가 가득 차면 사진 없이 글만 남는다 */
  }
}
/**
 * 장면이 열릴 때 앨범 사진: 앨범 장면이면 그 칸에, photoFor가 있으면 그 장면의 칸에 (잔치 아침 → 저녁 모닥불 그림으로 바꾼다).
 * 프레임이 여는 장면과 별 보기가 바로 여는 장면이 함께 쓴다
 */
function snapAlbum(sceneId: string, capture: (() => string | null) | null) {
  const sc = SCENES[sceneId]
  const photo = sc?.photoFor ?? (sc?.album ? sceneId : null)
  if (photo) storeAlbumImage(photo, capture?.() ?? null)
}
/** 아침에 아이가 해 온 일 (계획 12): 한 줄 알림 */
const CHILD_HELP_LINE = ['이웃 이야기를 듣고 왔어요', '파피루스나 잉크를 만들어 왔어요', '이웃에게 대신 인사하고 왔어요', '물이나 갈대를 날라 왔어요', '뜻밖의 선물을 들고 왔어요']
function sayChildHelp(g: GameState, say: (text: string, ms?: number) => void) {
  // 어른이 된 아이의 편지·선물·닢이 먼저
  if (g.child && g.flags.kidMailDay === g.clock.day) {
    const n = g.child.name
    const mk = g.flags.kidMailKind
    if (mk === 0) say(`${n}의 편지: “${KID_LETTERS[(g.clock.day * 7) % KID_LETTERS.length]}”`, 5000)
    else if (mk === 1) say(`${n}에게서 선물이 왔어요 · ${itemList(JOB_GIFTS[g.child.job!])}`, 4000)
    else if (mk === 2) say(`${n}에게서 닢 ${kidCoins(g.clock.day)}이 왔어요`, 4000)
    return
  }
  const k = g.flags.childHelpKind
  if (!g.child || g.flags.childHelpDay !== g.clock.day || k === undefined || k < 0) return
  say(`${g.child.name}: ${CHILD_HELP_LINE[k]}`, 3400)
}

const MUTE_KEY = 'twenty-seven/muted'
const JOYSTICK_KEY = 'twenty-seven/joystick'
const JOYSTICK_SHAPE_KEY = 'twenty-seven/joystick-shape'
const JOYSTICK_SIDE_KEY = 'twenty-seven/joystick-side'
const DECK_KEY = 'twenty-seven/deck'
export type JoystickShape = 'pad' | 'round'
export type JoystickSide = 'right' | 'left'
export function loadJoystickShape(): JoystickShape {
  try {
    return globalThis.localStorage?.getItem(JOYSTICK_SHAPE_KEY) === 'round' ? 'round' : 'pad'
  } catch {
    return 'pad'
  }
}
export function loadJoystickSide(): JoystickSide {
  try {
    return globalThis.localStorage?.getItem(JOYSTICK_SIDE_KEY) === 'left' ? 'left' : 'right'
  } catch {
    return 'right'
  }
}
function remember(key: string, value: string) {
  try {
    globalThis.localStorage?.setItem(key, value)
  } catch {
    /* 저장 불가 시에도 이번 판에는 적용 */
  }
}
const ZOOM_KEY = 'twenty-seven-zoom'
export const ZOOMS = [1, 1.25, 1.5, 1.75, 2] as const
function loadZoom(): number {
  try {
    const saved = Number(globalThis.localStorage?.getItem(ZOOM_KEY))
    return (ZOOMS as readonly number[]).includes(saved) ? saved : 1
  } catch {
    return 1
  }
}
/** 조이스틱은 처음엔 꺼져 있다 — 설정에서 켠 사람만 ('on'으로 저장) */
export function loadJoystick(): boolean {
  try {
    return globalThis.localStorage?.getItem(JOYSTICK_KEY) === 'on'
  } catch {
    return false
  }
}
/** 아래 조작판은 처음엔 켜져 있다 — 끈 사람만 'off'로 저장 */
export function loadDeck(): boolean {
  try {
    return globalThis.localStorage?.getItem(DECK_KEY) !== 'off'
  } catch {
    return true
  }
}
function loadMuted(): boolean {
  try {
    return globalThis.localStorage?.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * 편지 나르는 이웃이 오늘 가져온 편지를 건넬 때의 말 (생활 말 — 편지 내용·보낸 사람을 말하지 않는다).
 * 가져온 편지가 없으면 null (평소 대화 그대로)
 */
export function postLine(game: GameState, neighborId: string): string | null {
  if (neighborId !== POSTMAN || !game.post?.length) return null
  const ps = game.post.map(pieceById).sort((a, b) => a.chapter - b.chapter)
  const book = (T.quiz.books as Record<string, string>)[ps[0].book]
  if (ps.length === 1) return fill(T.post.bringOne, { book, chapter: ps[0].chapter })
  return fill(T.post.bring, { n: ps.length, book, from: ps[0].chapter, to: ps[ps.length - 1].chapter })
}

/**
 * 낮에 편지 나르는 이웃에게 말을 걸면: 지금 책이 별 보는 밤에 오는 책(요한계시록)이고 방이 열렸고 아직 받을 장이 남았으면
 * 언덕 편지함 안내 한 줄 (이웃은 건네지 않는다 — 밤 언덕에는 이웃이 나오지 않는다, 계획 9 작업 2)
 */
export function starPostHint(game: GameState, neighborId: string): string | null {
  const book = game.activeBook
  if (neighborId !== POSTMAN || !book || modeOf(book) !== 'letters' || arrivesOf(book) !== 'stars' || !bookRoomOpen(book, game.flags)) return null
  return piecesOf(book).some((p) => !game.collected.includes(p.id)) ? T.post.revHint : null
}

/** 언덕 편지함에서 꺼낸 장 알림 */
function starsLine(pieceIds: readonly string[]): string {
  const ps = pieceIds.map(pieceById).sort((a, b) => a.chapter - b.chapter)
  const book = (T.quiz.books as Record<string, string>)[ps[0].book]
  if (ps.length === 1) return fill(T.post.starsBringOne, { book, chapter: ps[0].chapter })
  return fill(T.post.starsBring, { n: ps.length, book, from: ps[0].chapter, to: ps[ps.length - 1].chapter })
}

function lineFor(game: GameState, neighborId: string, rng: Rng): string {
  const l = NEIGHBOR_LINES[neighborId]
  if (!l) return ''
  const post = postLine(game, neighborId)
  if (post) return post
  if (game.offers[neighborId]) return pick(l.offer, rng).text
  if (neighborId === 'child' && l.lesson && isHome(playerTile(game))) return l.lesson
  if (isWet(weatherOf(game.clock.day)) && rng() < 0.6) return pick(l.wet, rng).text
  if (heartsOf(game.hearts[neighborId]) >= 7 && rng() < 0.6) return pick(l.close, rng).text
  if (heartsOf(game.hearts[neighborId]) >= 4 && rng() < 0.6) return pick(l.warm, rng).text
  return pick(l.idle, rng).text
}

function gained(before: Inventory, after: Inventory): Partial<Record<ItemId, number>> {
  const out: Partial<Record<ItemId, number>> = {}
  for (const [id, n] of Object.entries(after) as [ItemId, number][]) {
    const d = n - (before[id] ?? 0)
    if (d > 0) out[id] = d
  }
  return out
}

/** 지도의 편지 방(world ROOMS의 owner) → 방 표의 방 id */
const LETTER_ROOM_OF: Partial<Record<string, ShelfRoomId>> = { letters: 'romPhm', hebJud: 'hebJud', rev: 'rev' }

/** 집 안에 막 들어왔으면 누구 집인지 알린다 (다락에 오르면 다락 서재) */
function announceRoom(before: GameState, after: GameState) {
  if (inAttic(playerTile(after)) && !inAttic(playerTile(before))) {
    useGame.getState().say(T.ui.atticRoom, 2200)
    return
  }
  const room = roomAt(playerTile(after))
  if (!room || room === roomAt(playerTile(before))) return
  const who = CONTENT.neighbors.find((d) => d.id === room.owner)?.role
  const letterRoom = LETTER_ROOM_OF[room.owner]
  const name =
    room.owner === 'library'
      ? T.ui.libraryRoom
      : room.owner === 'acts'
        ? T.ui.actsRoom
        : room.owner === 'hall'
          ? T.places.hallRoom
          : room.owner === 'teahouse'
            ? T.places.teaRoom
            : room.owner === 'child'
              ? '배움터'
        : letterRoom
          ? roomTitle(shelfRoom(letterRoom))
          : fill(T.ui.roomOf, { who: who ?? '' })
  useGame.getState().say(name, 2200)
}

/** 연인·약혼자·배우자 이름 (없으면 빈 글자) */
export function partnerName(game: GameState): string {
  const id = game.romance?.partner
  return (id && CONTENT.neighbors.find((n) => n.id === id)?.role) || ''
}

/** 누르면 할 일 창이 뜨는 자리 */
export type MenuPlace = 'hearth' | 'workbench' | 'press' | 'hill' | 'bench' | 'hallTable' | 'teaTable' | 'pavilion'

export const useGame = create<Store>((set, get) => {
  let warnedSaveFail = false
  const persist = (g: GameState) => {
    // 물건 도감·업적: 저장할 때마다 새로 적고, 새로 이룬 업적은 알림과 따로 띄운다
    const { state: game, fresh } = recordProgress(g)
    if (fresh.length) {
      const text = fresh.length === 1 ? `업적 · ${fresh[0].name}` : `업적 ${fresh.length}개 · 선반 → 업적`
      set({ award: { text, until: get().clockMs + 4000 } })
    }
    // 저장 공간이 가득 차는 등으로 실패하면 한 번 알린다 (조용히 진행을 잃지 않도록)
    if (!saveGame(game) && hasStorage() && !warnedSaveFail) {
      warnedSaveFail = true
      get().say(T.ui.saveFailed)
    }
    return game
  }
  // 알림은 프레임 끝에 지금 값을 보고 지운다 — 프레임 시작에 읽은 값을 되쓰면 방금 띄운 알림이 사라진다
  const expireToast = () => {
    const cur = get().toast
    if (cur && cur.until < get().clockMs) set({ toast: null })
    const aw = get().award
    if (aw && aw.until < get().clockMs) set({ award: null })
  }
  const toastGainFrom = (before: Inventory, after: Inventory) => toastGain(before, after)
  const toastGain = (before: Inventory, after: Inventory) => {
    const g = gained(before, after)
    if (Object.keys(g).length) get().say(fill(T.ui.gotLine, { items: itemList(g) }))
  }

  function arrive(game: GameState, target: Target): { game: GameState; modal: Modal | null } {
    const rng = get().rng
    if (target.kind === 'neighbor') {
      // 기다리던 이야기(이벤트)가 있으면 그 장면부터 (계획 6b)
      const ev = openEvent(game, target.id)
      if (ev) {
        sfx('talk')
        return { game: persist(greetNeighbor(ev, target.id)), modal: { kind: 'scene', id: ev.scenes[ev.scenes.length - 1] } }
      }
      let g = greetNeighbor(game, target.id)
      sfx('talk')
      // 배우자는 아침에 처음 말 걸 때 작은 선물을 챙겨 준다 (계획 6)
      const def = CONTENT.neighbors.find((n) => n.id === target.id)
      const sg = def ? spouseGift(g, def) : null
      if (sg) {
        g = sg.state
        get().say(fill(T.romance.spouseGift, { who: withSubject(def!.role), items: itemList(sg.gift) }))
      }
      // 아침에 들른 이웃은 들고 온 것을 건넨다
      const v = receiveVisit(g, target.id)
      if (v) {
        g = v.state
        get().say(fill(T.ui.visitGot, { items: itemList(v.gift) }))
        const l = NEIGHBOR_LINES[target.id]
        return { game: persist(g), modal: { kind: 'talk', neighborId: target.id, line: l?.visit.length ? pick(l.visit, rng).text : lineFor(g, target.id, rng) } }
      }
      // 그 자리에서 흘리던 혼잣말 (계획 6b): 말을 걸면 첫마디로 듣는다 (곁을 지나가기만 해서는 뜨지 않는다)
      const mut = mutterWaiting(g, target.id)
      if (mut) return { game: persist(hearMutter(g, target.id, mut)), modal: { kind: 'talk', neighborId: target.id, line: mut } }
      // 살아 움직이는 사람들 (계획 6b): 지금 상황·사이·기억에 맞는 말 (되풀이하지 않는다)
      const pl = g.offers[target.id] || postLine(g, target.id) ? null : personLine(g, target.id, rng())
      if (pl) return { game: persist(pl.state), modal: { kind: 'talk', neighborId: target.id, line: pl.text } }
      return { game: persist(g), modal: { kind: 'talk', neighborId: target.id, line: lineFor(g, target.id, rng) } }
    }
    if (target.kind === 'stray') return { game, modal: { kind: 'companion', animal: target.animal } }
    if (target.kind === 'companion') {
      sfx(game.companion?.kind === 'dog' ? 'bark' : 'meow')
      // 쓰다듬기·데리고 다니기·집에 두기를 고른다
      return { game, modal: { kind: 'follow', who: 'pet' } }
    }
    if (target.kind === 'child') return { game, modal: { kind: 'follow', who: 'child' } }
    if (target.kind !== 'place') return { game, modal: null }
    switch (target.id) {
      case 'bed': {
        // 다시 읽을 목록에서는 여기서 빼지 않는다 — 읽고 자기(sleep)를 눌렀을 때만 뺀다
        return { game, modal: { kind: 'review', pieceId: reviewPick(game, rng) } }
      }
      case 'atticWindow':
        // 다락 창가에서도 자기 전 읽기를 하고 잘 수 있다 (평안이 하루 더)
        return { game, modal: { kind: 'review', pieceId: reviewPick(game, rng), attic: true } }
      case 'desk': {
        const lit = lightLamp(game)
        // 등잔 기름을 쓴 것은 바로 저장한다 (다시 불러와 기름을 되찾지 못하게)
        return { game: lit ? persist(lit) : game, modal: { kind: 'desk', result: null, dark: lit === null } }
      }
      case 'hearth':
      case 'workbench':
      case 'press':
      case 'hill':
      case 'bench':
      case 'hallTable':
      case 'teaTable':
      case 'pavilion':
        return { game, modal: { kind: 'menu', place: target.id } }
      case 'shelf':
        return { game, modal: { kind: 'shelf' } }
      case 'library':
        return { game, modal: { kind: 'library' } }
      case 'actsShelf':
        return { game, modal: { kind: 'roomShelf', room: 'acts' } }
      case 'lettersShelf':
        return { game, modal: { kind: 'roomShelf', room: 'romPhm' } }
      case 'hebJudShelf':
        return { game, modal: { kind: 'roomShelf', room: 'hebJud' } }
      case 'revShelf':
        return { game, modal: { kind: 'roomShelf', room: 'rev' } }
      case 'hallBoard':
        return { game, modal: { kind: 'board' } }
      case 'boat':
        return { game, modal: { kind: 'travel' } }
      case 'learnTable':
        return { game, modal: { kind: 'school' } }
      case 'journeyBoard':
        return { game, modal: { kind: 'journey' } }
      case 'churchBoard':
        return { game, modal: { kind: 'journey', board: 'churches' } }
      case 'actsTable':
      case 'lettersTable':
      case 'hebJudTable':
      case 'revTable':
        // 읽는 탁자: 벤치처럼 모은 이야기를 골라 읽는다
        if (game.collected.length > 0) return { game, modal: { kind: 'readPick' } }
        get().say(T.acts.tableEmpty)
        return { game, modal: null }
      case 'basket':
        if (letterWaiting(game)) return { game, modal: { kind: 'letter' } }
        get().say(T.letters.none)
        return { game, modal: null }
      case 'mailbox': {
        // 집 앞 편지함: 편지 나르는 이웃을 찾아가지 않아도 오늘 편지를 꺼낸다 (본문은 책상에서)
        const { state, pieceIds } = openMailbox(game, CONTENT)
        if (!pieceIds.length) {
          get().say(T.post.mailboxEmpty)
          return { game, modal: null }
        }
        sfx('scroll')
        get().say(fill(T.post.mailboxTook, { n: pieceIds.length }))
        return { game: persist(state), modal: null }
      }
      case 'house': {
        const who = inviterAtDoor(game, target.tile)
        const dined = who ? dine(game, who) : null
        if (dined) {
          sfx('eat')
          return { game: persist(dined), modal: null }
        }
        // 초대받은 저녁이 아니면 그냥 들어가 본다
        sfx('step')
        const entered = enterDoor(game, target.tile)
        announceRoom(game, entered)
        return { game: persist(entered), modal: null }
      }
      case 'anvil':
        get().say(T.ui.anvilHint)
        return { game, modal: null }
      case 'garden':
        return { game, modal: { kind: 'garden', at: target.tile } }
      default: {
        const info = gatherInfo(game, target.id)
        if (!info) return { game, modal: null }
        if ('blocked' in info) {
          get().say(info.blocked === 'notRipe' ? T.ui.notRipe : info.blocked === 'tired' ? T.ui.tooTired : info.blocked === 'picked' ? T.herbs.picked : T.ui.bagFull)
          return { game, modal: null }
        }
        const kind = target.id === 'well' ? 'hold' : 'pick'
        return { game, modal: { kind: 'mini', state: startMini(kind, rng), pending: { kind: 'gather', place: target.id } } }
      }
    }
  }

  function finishPending(game: GameState, p: Pending, state: MiniState): GameState {
    const before = game.inv
    let next = game
    if (p.kind === 'gather') next = finishGather(game, p.place)
    else if (p.kind === 'craft') next = finishCraft(game, p.recipe)
    else if (p.kind === 'help') {
      const def = CONTENT.neighbors.find((n) => n.id === p.neighborId)
      if (def) {
        next = finishHelp(game, def)
        const l = NEIGHBOR_LINES[def.id]
        const thanks = def.id === 'grandpa' && l.helpSeason && grapesRipe(game.clock.day) ? l.helpSeason.thanks : l.help.thanks
        get().say(thanks)
      }
    } else if (p.kind === 'teach') next = teach(game)
    else if (p.kind === 'letter') {
      const misses = state.kind === 'timing' ? state.misses : 0
      next = finishLetter(game, misses)
      if (next !== game) get().say(fill(T.letters.done, { pay: letterPay(misses) }))
    }
    if (p.kind !== 'help' && p.kind !== 'letter') toastGain(before, next.inv)
    return persist(next)
  }

  return {
    game: newGame(CONTENT),
    modal: null,
    toast: null,
    award: null,
    trip: null,
    startTripBoard: (dest, withChild) => set({ trip: { dest, withChild }, modal: null }),
    finishTripBoard: (rewards) => {
      const t = get().trip
      if (!t) return
      set({ trip: null, modal: { kind: 'travel', dest: t.dest, rewards } })
    },
    afterScene: null,
    decorating: null,
    muted: loadMuted(),
    joystick: loadJoystick(),
    joystickShape: loadJoystickShape(),
    joystickSide: loadJoystickSide(),
    deck: loadDeck(),
    zoom: loadZoom(),
    rng: Math.random,
    capture: null,
    clockMs: 0,

    load: (game) => {
      // 집 단계는 world의 모듈 전역(tileAt이 본다) — 불러온 게임의 단계로 맞춘다
      syncHome(game)
      set({ game, modal: null, decorating: null })
    },

    // 이웃이 부르는 이름은 주인공이 정한 이름으로 ({player})
    say: (text, ms = 2600) => set({ toast: { text: callName(text, get().game.avatar?.name), until: get().clockMs + ms } }),

    walk: (dx, dy) => {
      const { game, modal, decorating } = get()
      if (modal || decorating) return
      const next = walkDirection(game, dx, dy)
      if (next !== game) set({ game: next })
    },

    interact: () => {
      const { game, modal, decorating } = get()
      if (modal || decorating) return false
      const tile = interactTile(game)
      if (!tile) return false
      get().tap(tile)
      return true
    },

    press: () => {
      const { game, modal, decorating } = get()
      if (modal || decorating) return
      get().tap(pressTile(game))
    },

    tap: (tile) => {
      const { modal, decorating, game } = get()
      if (modal) return
      if (decorating) {
        // 물건을 들고 있으면 먼저 놓아 본다 (탁자·협탁 위에 올리기)
        if (decorating !== 'pick') {
          const placed = placeFurniture(game, decorating, tile)
          if (placed) {
            sfx('place')
            set({ game: persist(placed), decorating: (placed.inv[decorating] ?? 0) > 0 ? decorating : 'pick' })
            return
          }
        }
        // 놓을 수 없는 자리에 가구가 있으면 치운다 — 가구가 차지한 칸 어디를 눌러도
        if (removal(game.room, tile).length) {
          const next = removeFurniture(game, tile)
          if (next === game) get().say(T.ui.bagFull)
          else {
            set({ game: persist(next) })
            sfx('place')
          }
        }
        return
      }
      const locked = LOCKED_DOORS.findIndex((d) => sameTile(d, tile))
      // 열린 방의 문은 걸어 들어가는 문이다 (아래 tapTile로) — 방 표로 판정
      if (locked >= 0 && !openDoorsFor(game.flags).includes(locked)) {
        // 잔치 다음 날부터 첫 잠긴 문(사도행전 방)은 문틈으로 불빛이 샌다 — 문은 아직 잠겨 있다
        const line = locked === 0 && actsDoorGlows(game) ? T.library.lockedRoomGlow : T.library.lockedRoomTap
        get().say(fill(line, { room: (T.library.lockedRooms as string[])[locked] }))
        return
      }
      const zone = zoneAt(tile)
      if (zone && lockedTiles(shelvedCount(game)).has(`${tile.x},${tile.y}`)) {
        get().say(fill(T.ui.zoneLocked, { n: zone.books }))
        return
      }
      const selfTap = sameTile(tile, playerTile(game)) && game.player.path.length === 0
      const next = tapTile(game, tile)
      if (selfTap) {
        const n = game.needs
        const canCare =
          (n.hunger >= 30 && hasFood(game.inv)) ||
          (n.cold >= 30 && (game.inv.blanket ?? 0) > 0) ||
          (n.fatigue >= 30 && isHome(tile)) ||
          (n.heat >= 30 && (game.inv.water ?? 0) > 0)
        set({ game: next, modal: canCare ? { kind: 'care' } : null })
        return
      }
      if (next.player.path.length > 0) sfx('step')
      set({ game: next })
    },

    frame: (dt) => {
      const s = get()
      const clockMs = s.clockMs + dt * 1000
      // 20초마다 저장 — 창이 열려 있어도, 걷기만 하다 창을 닫아도 시각·위치가 남도록
      if (Math.floor(clockMs / 20000) !== Math.floor(s.clockMs / 20000)) persist(s.game)
      // 여행 주사위 판 동안 마을은 멈춘다
      if (s.trip) {
        set({ clockMs })
        return
      }
      if (s.modal) {
        // 손일 중에는 활동만 움직인다
        if (s.modal.kind === 'mini') {
          const ms = stepMini(s.modal.state, dt, s.rng)
          set({ clockMs, modal: { ...s.modal, state: ms } })
        } else set({ clockMs })
        expireToast()
        return
      }
      if (s.decorating) {
        set({ clockMs })
        expireToast()
        return
      }
      const r = tick(s.game, dt, s.rng, CONTENT)
      let game = r.state
      announceRoom(s.game, game)
      let modal: Modal | null = null
      for (const e of r.events) {
        // 가까이 지나가면 들리는 혼잣말, 지킨 약속 (계획 6b)
        if (e.type === 'promiseKept') get().say(fill(T.people.promiseKept, { who: withSubject(neighborById(e.npc)?.role ?? '') }), 3400)
        if (e.type === 'arrived') {
          const a = arrive(game, e.target)
          game = a.game
          modal = a.modal ?? modal
        }
      }
      if (!modal && game.scenes.length) modal = { kind: 'scene', id: game.scenes[0] }
      // 아이가 태어난 장면을 본 뒤 이름을 정한다
      if (!modal && game.flags.childNaming && game.child) modal = { kind: 'childName' }
      set({ game, modal, clockMs })
      expireToast()
      if (modal?.kind === 'scene') snapAlbum(modal.id, get().capture)
    },

    open: (m) => set({ modal: m }),
    closeModal: () => set({ modal: null }),

    listenTo: (neighborId) => {
      const { state, pieceId, pieceIds } = listen(get().game, neighborId, CONTENT)
      if (!pieceId) return
      sfx('scroll')
      // 편지는 한꺼번에 받는다 — 본문은 책상에서 장째로 본다
      if (modeOf(pieceById(pieceId).book) === 'letters') {
        set({ game: persist(state), modal: null })
        get().say(fill(T.post.received, { n: pieceIds.length }))
        return
      }
      const onlyHere = pieceById(pieceId).stamps.length === 0
      set({ game: persist(state), modal: { kind: 'passage', pieceId, askLine: onlyHere } })
    },

    startHelp: (neighborId) => {
      const def = CONTENT.neighbors.find((n) => n.id === neighborId)
      if (!def) return
      set({ modal: { kind: 'mini', state: startMini(def.help.minigame, get().rng), pending: { kind: 'help', neighborId } } })
    },

    gift: (neighborId, item) => {
      const def = CONTENT.neighbors.find((n) => n.id === neighborId)
      if (!def) return
      const r = giveGift(get().game, def, item)
      if (!r) return
      sfx('gift')
      const l = NEIGHBOR_LINES[neighborId]
      set({ game: persist(r.state), modal: { kind: 'talk', neighborId, line: r.liked ? l.giftLiked : l.giftPlain } })
    },

    doTrade: (t) => {
      const next = doTrade(get().game, t)
      if (!next) return
      sfx('gift')
      // 설치물은 무엇을 어디에 두었는지 한 줄 (빗물 항아리는 집 앞, 잉크 항아리는 집 안 자리를 고른다)
      if (t.grants) {
        const thing = withObject((T.easy.names as Record<string, string>)[t.grants])
        get().say(fill(Object.keys(t.get).length ? T.easy.boughtInside : T.easy.bought, { thing }))
      } else toastGain(get().game.inv, next.inv)
      set({ game: persist(next) })
    },

    sellItem: (item) => {
      const price = sellPrice(get().game, item)
      const next = sell(get().game, item)
      if (!next) return
      sfx('gift')
      set({ game: persist(next) })
      get().say(fill(T.ui.soldLine, { item: itemName(item), n: price! }))
    },

    buyRareItem: (item) => {
      const next = buyRare(get().game, item)
      if (!next) return
      sfx('gift')
      toastGain(get().game.inv, next.inv)
      set({ game: persist(next) })
    },

    petCompanion: () => {
      get().say(T.ui.pet)
      // 쪼그려 앉아 쓰다듬는 자세가 잠시 보이도록 (renderer: idle.seconds % 12 > 8)
      set({ game: { ...get().game, idle: { seconds: 9, action: null, cooldown: 3 } }, modal: null })
    },
    keepCompanion: (stay) => {
      const g = setCompanionStay(get().game, stay)
      set({ game: persist(g), modal: null })
      get().say(`${g.companion?.name ?? ''} · ${stay ? '집에서 기다려요' : '함께 다녀요'}`)
    },
    goSchool: (stat) => {
      const g = sendToSchool(get().game, stat)
      if (!g) return
      sfx('gift')
      set({ game: persist(g), modal: null })
      get().say(`${g.child?.name ?? '아이'} · 배움터에서 ${withObject((T.stats.names as Record<StatId, string>)[stat])} 배워요 (저녁 여섯 시까지)`, 3400)
    },
    keepChild: (mode) => {
      const g = setChildMode(get().game, mode)
      set({ game: persist(g), modal: null })
      const n = g.child?.name ?? '아이'
      get().say(`${n} · ${mode === 'follow' ? '함께 다녀요' : mode === 'home' ? '집에서 기다려요' : '혼자 마을을 다녀요'}`)
    },

    talkTo: (id) => {
      const a = arrive(get().game, { kind: 'neighbor', id, tries: 0, talk: true })
      set({ game: a.game, modal: a.modal })
      if (a.modal?.kind === 'scene') snapAlbum(a.modal.id, get().capture)
    },

    setChildName: (name) => set({ game: persist(nameChild(get().game, name)), modal: null }),

    goTrip: (dest, buys, rewards = []) => {
      // 성경 구절은 판 위가 아니라 집에 돌아와 조용할 때 — 여행길에서 들은 이야기 한 조각 (원래 쓰던 본문 창)
      const piece = nextTripPiece(get().game, CONTENT)
      const next = takeTrip(get().game, CONTENT, dest, buys, piece ? [...rewards, { kind: 'piece', id: piece }] : rewards)
      if (!next) return
      set({ game: persist(next), modal: piece ? { kind: 'passage', pieceId: piece, askLine: false } : null })
      get().say(piece ? `${DESTS[dest].name}에서 돌아와 여행길에서 들은 이야기를 펼쳐요` : `${DESTS[dest].name}에서 하룻밤 묵고 집으로 돌아왔어요`, 3400)
      sayChildHelp(next, get().say)
    },

    doBoard: (r) => {
      const next = fulfillBoard(get().game, r)
      if (!next) return
      sfx('gift')
      get().say(`${neighborById(r.npc)?.role ?? '이웃'}의 부탁을 들어주었어요 · ${r.coins}닢${r.rare ? ` · ${itemName(r.rare)} 1` : ''}`)
      set({ game: persist(next) })
    },

    startTeach: () => set({ modal: { kind: 'mini', state: startMini('order', get().rng), pending: { kind: 'teach' } } }),
    startLetter: () => set({ modal: { kind: 'mini', state: startMini('timing', get().rng), pending: { kind: 'letter' } } }),

    startCraft: (recipe) => {
      if (canCraft(get().game, recipe)) return
      set({ modal: { kind: 'mini', state: startMini(RECIPES[recipe].minigame, get().rng, handEase(get().game.stats)), pending: { kind: 'craft', recipe } } })
    },

    // 손일을 그만두면 아무것도 쓰지 않았으므로 그냥 닫는다
    quitMini: () => {
      if (get().modal?.kind === 'mini') set({ modal: null })
    },

    skipMini: () => {
      const m = get().modal
      if (m?.kind !== 'mini' || count(get().game.inv, 'handyKit') === 0) return
      sfx('hit')
      set({ game: finishPending(get().game, m.pending, finishNow(m.state)), modal: null })
    },

    miniTap: (itemId) => {
      const m = get().modal
      if (m?.kind !== 'mini') return
      if (isDone(m.state)) {
        // 길게 누르기의 마지막 뗌은 창을 닫지 않는다 (닫기 단추로)
        if (m.state.kind === 'hold' && itemId === HOLD_UP) return
        set({ game: finishPending(get().game, m.pending, m.state), modal: null })
        return
      }
      const state = tapMini(m.state, itemId)
      if (state === m.state) return
      const judged = state.kind === 'timing' || state.kind === 'weave' || state.kind === 'order' || (state.kind === 'hold' && itemId === HOLD_UP)
      sfx(judged && 'flash' in state ? (state.flash === 'hit' ? 'hit' : 'miss') : 'tap')
      set({ modal: { ...m, state } })
    },

    warm: () => set({ game: persist(warmByHearth(get().game)), modal: null }),
    eat: () => {
      const next = eatBread(get().game)
      if (next) {
        sfx('eat')
        set({ game: persist(next), modal: null })
      }
    },
    rest: () => {
      set({ game: persist(restAt(get().game)), modal: null })
      get().say(T.places.sitDone)
    },
    // 모이는 곳 (계획 10): 장면이 있으면 장면 먼저, 없으면 한 줄
    playHall: () => {
      const before = get().game
      const friends = hallFriendsHere(before, CONTENT)
      const next = playHall(before, CONTENT)
      if (next === before) return
      sfx('gift')
      const names = friends.map((id) => CONTENT.neighbors.find((n) => n.id === id)?.role ?? id).join('·')
      set({ game: persist(next), modal: null })
      get().say(fill(T.places.hallDone, { with: withAnd(names) }), 3200)
    },
    // 연애와 결혼 (계획 6): 다발·끈은 장면을 먼저 보인다 (장면은 매 프레임 scenes에서 연다)
    giveBouquet: (id) => {
      const def = CONTENT.neighbors.find((n) => n.id === id)
      if (!def) return
      const next = giveBouquet(get().game, def)
      if (next === get().game) return
      sfx('gift')
      set({ game: persist(next), modal: null })
    },
    giveCord: (id) => {
      const def = CONTENT.neighbors.find((n) => n.id === id)
      if (!def) return
      const next = giveCord(get().game, def)
      if (next === get().game) return
      sfx('gift')
      set({ game: persist(next), modal: null })
      get().say(fill(T.romance.weddingSoon, { day: next.romance.weddingDay ?? 0 }), 4000)
    },
    dateTea: () => {
      const before = get().game
      const next = dateTea(before)
      if (next === before) return
      sfx('eat')
      set({ game: persist(next), modal: null })
      get().say(fill(T.romance.dateDone, { with: withAnd(partnerName(before)) }))
    },
    dateSunset: () => {
      const before = get().game
      const next = dateSunset(before)
      if (next === before) return
      set({ game: persist(next), modal: null })
      get().say(fill(T.romance.dateDone, { with: withAnd(partnerName(before)) }))
    },
    seal: (book) => {
      const next = sealBook(get().game, book)
      if (next === get().game) return
      sfx('gift')
      set({ game: persist(next) })
      get().say(T.care.sealed)
    },
    askFixture: (npc, line) => {
      const next = orderFixture(get().game, line)
      if (!next) return
      sfx('gift')
      set({ game: persist(next), modal: { kind: 'talk', neighborId: npc, line: T.fixtures.ordered } })
    },
    // 약방에 약초 팔기 (장날이 아니어도)
    sellHerbs: () => {
      const r = sellHerbs(get().game)
      if (!r) return
      sfx('gift')
      set({ game: persist(r.state) })
      get().say(fill(T.herbs.sold, { n: r.n, coins: r.coins }))
    },
    drinkTea: () => {
      const next = drinkTea(get().game)
      if (next === get().game) return
      sfx('eat')
      set({ game: persist(next), modal: null })
      get().say(T.places.teaDone)
    },
    watchSunset: () => {
      const next = watchSunset(get().game)
      if (next === get().game) return
      set({ game: persist(next), modal: null })
      get().say(T.places.sunsetDone)
    },
    // 별 보기: 궂은 밤이면 흐림 알림, 편지함에서 꺼냈으면 장면(있으면)을 먼저 보이고 알림
    sitHill: () => {
      const before = get().game
      const { state, pieceIds } = stargaze(before, CONTENT)
      const game = persist(state)
      const line = pieceIds.length ? starsLine(pieceIds) : clearSky(before.clock.day) ? null : T.ui.starsCloudy
      if (pieceIds.length) sfx('scroll')
      const scene = game.scenes.length > before.scenes.length ? game.scenes[game.scenes.length - 1] : null
      if (scene && line) {
        set({ game, modal: { kind: 'scene', id: scene }, afterScene: line })
        snapAlbum(scene, get().capture)
        return
      }
      set({ game, modal: null })
      if (line) get().say(line)
    },
    requestAsk: (npc) => set({ game: persist(askRequest(get().game, npc)), modal: null }),
    requestGive: (npc) => {
      const next = fulfillRequest(get().game, npc)
      // 재료는 있는데 안 되면 보상이 가방에 안 들어가는 것
      if (!next) return get().say(T.ui.bagFull)
      sfx('gift')
      toastGainFrom(get().game.inv, next.inv)
      set({ game: persist(next), modal: null })
    },
    askWork: (npc, id) => {
      const next = orderWork(get().game, id)
      if (!next) return
      sfx('gift')
      set({ game: persist(next), modal: { kind: 'talk', neighborId: npc, line: T.easy.ordered } })
    },
    takeChest: (id) => {
      const next = takeFromChest(get().game, id)
      if (!next) return get().say(T.easy.chestFull)
      sfx('tap')
      set({ game: persist(next) })
    },
    askHome: (npc) => {
      const next = orderHome(get().game)
      if (!next) return
      sfx('gift')
      set({ game: persist(next), modal: { kind: 'talk', neighborId: npc, line: T.ui.homeOrdered } })
    },
    readAt: (pieceId) => {
      const r = readScripture(get().game, pieceId)
      if (!r) return
      sfx('scroll')
      get().say(r.rested ? T.ui.readRested : T.ui.readAgain)
      set({ game: persist(r.state), modal: { kind: 'passage', pieceId, askLine: false } })
    },
    blanket: () => {
      const next = coverWithBlanket(get().game)
      if (next) set({ game: persist(next), modal: null })
    },
    drink: () => {
      const next = drinkWater(get().game)
      if (next) set({ game: persist(next), modal: null })
    },
    plantAt: (at, crop) => {
      const next = plant(get().game, at, crop)
      if (!next) return
      sfx('place')
      set({ game: persist(passTime({ ...next, needs: work(next.needs, 2) }, 10)), modal: null })
    },
    waterAt: (at) => {
      const next = water(get().game, at)
      if (!next) return
      sfx('tap')
      set({ game: persist(passTime({ ...next, needs: work(next.needs, 2) }, 10)), modal: null })
    },
    harvestAt: (at) => {
      const before = get().game.inv
      const next = harvest(get().game, at)
      if (!next) return get().say(T.ui.bagFull)
      sfx('gift')
      toastGain(before, next.inv)
      set({ game: persist(passTime(next, 10)), modal: null })
    },

    pickBook: (book) => {
      sfx('scroll')
      // 밤에 기름 없이 연 책상은 책을 골라도 여전히 어둡다
      const m = get().modal
      set({ game: persist(chooseBook(get().game, book, CONTENT)), modal: { kind: 'desk', result: null, dark: m?.kind === 'desk' ? m.dark : false } })
    },

    moveInDesk: (book, chapter, index, delta) => {
      const game = get().game
      sfx('pen')
      const m = get().modal
      set({
        game: persist(setArrangement(game, book, chapter, moveItem(game.progress[book].arrangement[chapter] ?? [], index, delta))),
        modal: { kind: 'desk', result: null, dark: m?.kind === 'desk' ? m.dark : false },
      })
    },
    submitDesk: (book, chapter) => {
      const ready = chapterReady(get().game, book, chapter, CONTENT)
      if (ready.kind !== 'done') {
        set({ modal: { kind: 'desk', result: ready, dark: false } })
        return
      }
      // 순서·재료가 준비되면 기록하기 전에 다섯 문제 (그 책 안에서)
      sfx('scroll')
      const questions = buildQuiz(piecesOf(book), chapter, get().rng, quizSourceFor([book]))
      set({ modal: { kind: 'quiz', mode: { kind: 'chapter', book, chapter }, questions, index: 0, wrong: [], solved: false, misses: 0, missed: [] } })
    },
    copyPick: (blank, option) => {
      const m = get().modal
      if (m?.kind !== 'desk' || m.dark) return
      const game = get().game
      const pad = copyPadFor(game, m.copy)
      if (!pad || pad.picks[blank] !== null) return
      const b = blanksFor(pad.book, pad.chapter, copySourceFor(pad.book))[blank]
      if (!b || !b.options.includes(option)) return
      if (option === b.answer) {
        sfx('pen')
        const picks = pad.picks.map((p, i) => (i === blank ? option : p))
        set({ modal: { ...m, result: null, copy: { ...pad, picks, miss: null } } })
      } else {
        sfx('miss')
        const dimmed = pad.dimmed.map((d, i) => (i === blank && !d.includes(option) ? [...d, option] : d))
        set({ modal: { ...m, result: null, copy: { ...pad, dimmed, miss: blank } } })
      }
    },
    submitCopy: () => {
      const m = get().modal
      if (m?.kind !== 'desk' || m.dark) return
      const game = get().game
      const pad = copyPadFor(game, m.copy)
      if (!pad || pad.picks.some((p) => p === null)) return
      const next = recordLetter(game, pad.book, pad.chapter, pad.picks as string[], CONTENT)
      if (next === game) {
        // 조각 책상과 같은 안내 (재료·피로). 고른 답은 그대로 남긴다
        const r = letterReady(game, pad.book, pad.chapter, CONTENT)
        const result: SubmitResult | null = r?.kind === 'tired' ? { kind: 'tired' } : r?.kind === 'supplies' ? r : null
        set({ modal: { ...m, result, copy: { ...pad, miss: null } } })
        return
      }
      sfx('done')
      // 요한계시록 2·3장: 일곱 교회 카드가 생겼다
      const newCards = next.churches.length - game.churches.length
      if (newCards > 0) get().say(fill(T.revRoom.cardsGot, { n: newCards }), 3200)
      set({ game: persist(next), modal: { kind: 'desk', result: { kind: 'done' }, dark: false } })
    },
    answerQuiz: (given) => {
      const m = get().modal
      if (m?.kind !== 'quiz' || m.solved) return
      const q = m.questions[m.index]
      if (isCorrect(q, given)) {
        sfx('hit')
        // 한 번에 맞히면 지능이 오른다 (계획 11 작업 4)
        if (m.wrong.length === 0) set({ game: persist(train(get().game, 'wit', XP.quizRight)) })
        set({ modal: { ...m, solved: true } })
      } else {
        sfx('miss')
        const key = Array.isArray(given) ? given.join(' ') : given
        // 한 문제에서 처음 틀렸을 때만 센다 (책등 등급은 처음에 맞힌 수로)
        const first = m.wrong.length === 0
        const pid = first ? pieceOfQuestion(q) : null
        set({ modal: { ...m, wrong: [...m.wrong, key], misses: m.misses + (first ? 1 : 0), missed: pid && !m.missed.includes(pid) ? [...m.missed, pid] : m.missed } })
      }
    },
    nextQuiz: () => {
      const m = get().modal
      if (m?.kind !== 'quiz' || !m.solved) return
      if (m.index + 1 < m.questions.length) {
        set({ modal: { ...m, index: m.index + 1, wrong: [], solved: false } })
        return
      }
      if (m.mode.kind === 'library') {
        const correct = m.questions.length - m.misses
        const firstTime = get().game.shelved[m.mode.book] === undefined
        const next = shelve(get().game, m.mode.book, correct, m.missed)
        sfx('done')
        const grades = T.library.grades as string[]
        get().say(fill(T.library.shelvedToast, { bookObj: withObject((T.quiz.books as Record<string, string>)[m.mode.book]), grade: grades[next.shelved[m.mode.book]!] }) + (m.missed.length ? ' ' + T.library.rereadNote : ''), 4000)
        // 새로 열린 구역
        const opened = lockedZones(shelvedCount(get().game)).filter((z) => shelvedCount(next) >= z.books)
        if (opened.length) setTimeout(() => get().say(fill(T.ui.zoneOpened, { name: (T.ui.zones as Record<string, string>)[opened[0].id] }), 4000), 4200)
        // 처음 꽂은 책이면 그 책에 대한 나의 한 줄을 물어본다 (넘겨도 된다)
        // 사도행전·편지는 자기 방 선반으로 돌아간다 (방 표)
        const back = shelfBackOf(m.mode.book)
        const myLine: Modal = { kind: 'myLine', lineKey: bookLineKey(m.mode.book), back }
        set({ game: persist(next), modal: firstTime ? myLine : afterMyLine(myLine) })
        return
      }
      const { state, result } = submitChapter(get().game, m.mode.book, m.mode.chapter, CONTENT)
      if (result.kind === 'done') sfx('done')
      const newCards = state.journey.length - get().game.journey.length
      if (newCards > 0) get().say(fill(T.acts.cardsGot, { n: newCards }), 3200)
      set({ game: persist(state), modal: { kind: 'desk', result, dark: false } })
    },
    moveBoard: (board, index, delta) => {
      const game = get().game
      const def = CARD_BOARDS[board]
      const next = moveBoardCard(game, def.field, index, delta, CONTENT)
      if (next === game) return
      sfx('pen')
      if (next.flags[def.flag] && !game.flags[def.flag]) {
        sfx('done')
        get().say(def.doneToast, 3200)
      }
      set({ game: persist(next) })
    },
    startShelve: (book) => {
      const game = get().game
      if (canShelve(game, book, CONTENT)) return
      const pool = poolFor(game.shelved, book)
      sfx('scroll')
      const questions = buildLibraryQuiz({ current: book, pool, piecesOf, rng: get().rng, src: quizSourceFor(pool), openings: LETTER_OPENINGS })
      set({ modal: { kind: 'quiz', mode: { kind: 'library', book, retry: false }, questions, index: 0, wrong: [], solved: false, misses: 0, missed: [] } })
    },
    startRetry: (book) => {
      const paid = payRetry(get().game, book)
      if (!paid) return
      // 재도전은 서고에 있는 모든 책에서 낸다 (설계 §3.5)
      const pool = poolFor(paid.shelved, book)
      sfx('scroll')
      const questions = buildLibraryQuiz({ current: book, pool, piecesOf, rng: get().rng, src: quizSourceFor(pool), openings: LETTER_OPENINGS })
      set({ game: persist(paid), modal: { kind: 'quiz', mode: { kind: 'library', book, retry: true }, questions, index: 0, wrong: [], solved: false, misses: 0, missed: [] } })
    },
    sleep: () => {
      sfx('sleep')
      const m = get().modal
      const pieceId = m?.kind === 'review' ? m.pieceId : null
      const attic = m?.kind === 'review' && !!m.attic
      // 집 단계가 바뀌는 곳은 잠뿐: goToSleep이 새 단계로 지도(모듈 전역)를 맞춘다
      const next = goToSleep(get().game, CONTENT, { read: pieceId !== null, pieceId: pieceId ?? undefined, attic })
      set({ game: persist(next), modal: null })
      sayChildHelp(next, get().say)
    },
    saveMyLine: (lineKey, text) => set({ game: persist(setMyLine(get().game, lineKey, text)), modal: afterMyLine(get().modal) }),
    skipMyLine: () => set({ modal: afterMyLine(get().modal) }),

    adopt: (animal, name) => {
      const next = adoptStray(get().game, animal, cleanName(name, animal))
      sfx(animal === 'dog' ? 'bark' : 'meow')
      set({ game: persist(next), modal: null })
    },
    startDecorate: (item) => set({ decorating: item, modal: null }),
    stopDecorate: () => set({ decorating: null }),

    // 이벤트에서 말 고르기 (정답 없음): 고르면 대답이 이어지고, 닫으면 본 것 (계획 6b)
    chooseScene: (index) => {
      const m = get().modal
      if (m?.kind !== 'scene' || m.chosen !== undefined) return
      const game = m.id.startsWith('ev:') ? chooseInEvent(get().game, m.id.slice(3), index) : get().game
      set({ game: persist(game), modal: { ...m, chosen: index } })
    },
    nextScene: () => {
      const m = get().modal
      const id = m?.kind === 'scene' ? m.id : null
      if (!id) return
      const game = persist(sceneSeen(get().game, id, ALBUM_IDS))
      const after = get().afterScene
      set({ game, modal: null, afterScene: null })
      if (after) get().say(after)
    },

    setMuted: (muted) => {
      setAudioMuted(muted)
      try {
        globalThis.localStorage?.setItem(MUTE_KEY, muted ? '1' : '0')
      } catch {
        /* 무시 */
      }
      set({ muted })
    },

    setZoom: (zoom) => {
      if (!(ZOOMS as readonly number[]).includes(zoom)) return
      try {
        globalThis.localStorage?.setItem(ZOOM_KEY, String(zoom))
      } catch {
        /* 저장 불가 시에도 이번 판에는 적용 */
      }
      set({ zoom })
    },

    setJoystick: (on) => {
      try {
        globalThis.localStorage?.setItem(JOYSTICK_KEY, on ? 'on' : 'off')
      } catch {
        /* 저장 불가 시에도 이번 판에는 적용 */
      }
      set({ joystick: on })
    },
    setJoystickShape: (joystickShape) => {
      remember(JOYSTICK_SHAPE_KEY, joystickShape)
      set({ joystickShape })
    },
    setJoystickSide: (joystickSide) => {
      remember(JOYSTICK_SIDE_KEY, joystickSide)
      set({ joystickSide })
    },
    setDeck: (deck) => {
      remember(DECK_KEY, deck ? 'on' : 'off')
      set({ deck })
    },
  }
})

// 능력치 단계가 오르면 아래 칸에 한 줄 (계획 11 작업 4). 같은 날 같은 판에서만 — 저장을 불러오거나 새로 시작할 때는 알리지 않는다
useGame.subscribe((s, prev) => {
  const a = prev.game
  const b = s.game
  if (a === b || a.clock.day !== b.clock.day || b.clock.minute < a.clock.minute || a.avatar !== b.avatar) return
  const ups = leveledUp(a.stats, b.stats)
  if (!ups.length) return
  const id: StatId = ups[0]
  const line = fill(T.stats.up, { name: (T.stats.names as Record<StatId, string>)[id], n: b.stats[id].level })
  // 방금 띄운 알림(얻은 것 등)을 덮지 않게 조금 뒤에
  setTimeout(() => useGame.getState().say(line, 3200), 1800)
})

/** 가방에 물건을 넣는 테스트 도우미 */
export function giveItems(items: Partial<Record<ItemId, number>>) {
  useGame.setState((s) => ({ game: { ...s.game, inv: add(s.game.inv, items) } }))
}
