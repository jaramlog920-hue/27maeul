import { WORKSHOP, PARTNER_ROOM, BABY_ROOM, LIVING_ROOM } from '../engine/home-layout'
import { moveFurniture } from '../engine/game'
import { clubWeaveDone } from '../engine/clubs'
// 엔진 상태 ↔ 화면 연결. 창(모달)이 열려 있으면 시간과 걸음이 멈춘다.
import type { FullAvatar } from '../engine/avatar'
import type { DatePlace } from '../engine/romance'
import { create } from 'zustand'
import { CONTENT, neighborById, copySourceFor, LETTER_OPENINGS, pieceById, pieceOfQuestion, piecesOf, quizSourceFor } from '../content/catalog'
import { blanksFor } from '../engine/copy'
import { acceptInput, checkVoice, copySpot, withGuideFolded, type InputHow, type VoiceCheck } from '../engine/copying'
import { answerDesk, deskAsks, deskKidVerse, doKidAct, eatSupper, familyTrip, type KidAct } from '../engine/family'
import { currentChapter } from '../engine/offers'
import { handEase, leveledUp, XP, type StatId } from '../engine/stats'
import type { BoardRequest } from '../engine/board'
import { DESTS, type DestId } from '../engine/travel'
import { JOB_GIFTS, kidCoins, ADULT_JOBS, childStage, type AdultJob, type ChildMode } from '../engine/child'
import type { TripReward } from '../engine/trip-board'
import { buildLibraryQuiz, buildQuiz, isCorrect, type Question } from '../engine/quiz'
import { bookRoomOpen } from '../engine/books'
import { allShelved, canShelve, payRetry, poolFor, shelve, shelveNow as shelveQuick } from '../engine/library'
import { DEFAULT_CHOICE, type SpecialChoice } from '../engine/binding'
import { ALBUM_IDS, fill, itemList, itemName, KID_LETTERS, NEIGHBOR_LINES, roomTitle, SCENES, T, withAnd, withObject, withSubject, callName } from '../content/text'
import { grapesRipe, isWet, weatherOf } from '../engine/calendar'
import { cleanName, interactPet, petWays, type Animal } from '../engine/companion'
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
  saveCopyDraft,
  listen,
  newGame,
  chooseBook,
  placeFurniture,
  rotateFurniture,
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
  personLine,
  chooseInEvent,
  giveBouquet,
  giveCord,
  goOnDate,
  spouseGift,
  babyRoomTalk,
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
  storyResume,
  finishStoryMini,
  dressUp,
  type WardrobeWho,
  nightCopy,
  libraryRead,
  buyScroll,
  nextTripPiece,
  mutterWaiting,
  mutterPartner,
  hearMutter,
  setCompanionStay,
  setChildMode,
  sendToSchool,
  warmByHearth,
  playerTile,
  receiveVisit,
  receiveTalkGift,
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
  startCopy,
  writeVerse,
  bindBook,
  canBind,
  decorateBook,
  type VerseResult,
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
import { isHome, lockedTiles, lockedZones, roomAt, sameTile, zoneAt } from '../engine/world'
import { footprint, removal, type Furniture } from '../engine/room'
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
import { isFinished, toggleHomeBook } from '../engine/finished-books'
import { moveItem } from '../engine/scroll'
import type { Book, ItemId, PlaceId, Rng, Target, Tile } from '../engine/types'
import { isBuilt } from '../engine/projects'
import { facilityOfPlace, type FacilityId, type FacilityPlace } from '../engine/village-sites'
import { sfx, setAudioMuted } from '../audio/sound'

export type Pending =
  | { kind: 'club'; id: string }
  | { kind: 'gather'; place: PlaceId }
  | { kind: 'craft'; recipe: RecipeId }
  | { kind: 'help'; neighborId: string }
  | { kind: 'teach' }
  | { kind: 'letter' }
  /** 이야기 속에서 함께하는 손일 (계획 16 작업 4) — 잘하든 못하든 끝나면 이야기가 다음으로 */
  | { kind: 'story'; event: string; npc: string }

export type QuizMode = { kind: 'chapter'; book: Book; chapter: number } | { kind: 'library'; book: Book; retry: boolean }

/** 일지의 칸: 하루 기록 · 이웃 수첩(받은 선물 포함) · 앨범 · 업적 */
export type JournalTab = 'days' | 'neighbors' | 'album' | 'awards'
/** 가방의 칸: 물건 · 만들기(만들 줄 아는 것) · 물건 도감 */
export type BagTab = 'items' | 'make' | 'dex'

export type Modal =
  | { kind: 'settings' }
  | { kind: 'guide' }
  | { kind: 'schedule' }
  | { kind: 'clubs' }
  | { kind: 'clubSession'; id: string }
  | { kind: 'fests' }
  | { kind: 'festSession'; id: string }
  /** 내 작은 장날 좌판 (계획 16 작업 19) */
  | { kind: 'stall' }
  /** 마을 공동 시설 현장 (계획 16 작업 20): 진행 중인 사업의 현장 — 몫·거들기·선택 장식 */
  | { kind: 'village'; id: FacilityId }
  /** letter: 편지 나르는 이웃이 말을 걸자마자 편지를 건넸을 때 대화에 보일 편지 말 한 줄 */
  | { kind: 'talk'; neighborId: string; line: string; letter?: string }
  | { kind: 'passage'; pieceId: string; askLine: boolean; back?: boolean; said?: string }
  /** lineKey: 조각 id 또는 'book:mk' 같은 책 키. back: 적거나 넘긴 뒤 돌아갈 창 ('word' = 📖 말씀 › 서고) */
  | { kind: 'myLine'; lineKey: string; back?: 'library' | 'word' | `room:${ShelfRoomId}` }
  /** copy: 편지 옮겨 적기의 고른 답 (창 상태로만 — 게임 저장에 남지 않는다) */
  | { kind: 'desk'; result: SubmitResult | null; dark: boolean; copy?: CopyPad }
  /**
   * 필사 책상 (계획 14 작업 2): 집 책상을 누르면 이것이 열린다 — 마을·위 줄·조작판·마을 소리가 사라진 조용한 화면.
   * view: 'menu' 책상 메뉴(이어서 필사·다른 책 선택), 'pick' 27권 고르기, 'write' 한 절씩 따라 적기, 'done' 장 완료 화면.
   * last: 방금 적은 절·마친 장, resume: 들어올 때 "…부터 이어집니다" 알림을 보일까 (창 상태로만)
   */
  | { kind: 'copy'; view: CopyView; last?: VerseResult | null; resume?: boolean }
  | { kind: 'review'; pieceId: string | null }
  | { kind: 'journal'; tab?: JournalTab }
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
  | { kind: 'bag'; tab?: BagTab }
  | { kind: 'family' }
  | { kind: 'wardrobe'; who: WardrobeWho }
  | { kind: 'companion'; animal: Animal }
  | { kind: 'library' }
  /** 서고 방의 선반 (사도행전 방·편지 방·요한계시록 방 — RoomShelf), 벽의 카드 판 (board 없으면 사도행전 방 여정 판) */
  | { kind: 'roomShelf'; room: ShelfRoomId }
  /**
   * 제본 창 (계획 14 작업 4): step 'choose' [그대로 제본하기] [특별하게 제본하기], 'decorate' 표지 색·무늬·책등 장식 고르기,
   * 'made' 실제 책이 된 모습. redo: 이미 제본한 책을 다시 꾸민다. choice: 고르는 중인 모습. back: 닫은 뒤 돌아갈 창
   */
  | { kind: 'bind'; book: Book; step: 'choose' | 'decorate' | 'made'; redo?: boolean; choice?: SpecialChoice; back?: BindBack }
  /** 스물일곱 번째 책을 꽂은 날: 처음의 빈 서고와 지금을 나란히, 그리고 평소 마을로 */
  | { kind: 'shelfDone' }
  | { kind: 'journey'; board?: 'churches' }
  | { kind: 'letter' }
  | { kind: 'garden'; at: Tile }
  /** 📖 말씀 탭 (계획 14 작업 5): 필사본 · 말씀 조각 · 하나님 기록 · 서고 */
  | { kind: 'word'; tab?: WordTab }
  /**
   * 완성본 펼쳐 보기 (계획 14 작업 8): 첫 쪽 나의 필사 기록 → [펼쳐 보기] 내가 필사한 본문 / [이 책에서 발견한 하나님 기록].
   * back: 닫은 뒤 돌아갈 창 (말씀 › 서고, 서고·방 선반, 집 책장)
   */
  | { kind: 'bookView'; book: Book; back?: BookBack }
  /** 집 책장 (계획 14 작업 8): 놓은 책장 가구를 누르면 — 다 쓴 책을 몇 권 골라 둔다 */
  | { kind: 'homeShelf' }
  /** 아이와 함께 보내는 시간 (계획 12): 고르기, done이면 방금 한 일의 짧은 장면과 결과 */
  | { kind: 'kidTime'; done?: KidDone }

/** 방금 아이와 함께한 일 (창 상태로만) */
export interface KidDone {
  act: KidAct
  variant: number
  gains: Partial<Record<StatId, number>>
  got: Partial<Record<ItemId, number>>
  who: string | null
  burnt: boolean
  /** 처음 있는 일이라 가족 앨범에 한 장 (창을 닫으면 장면이 열린다) */
  album: boolean
}

/** 완성본 창을 닫은 뒤 돌아갈 곳 */
export type BookBack = 'word' | 'library' | 'homeShelf' | `room:${ShelfRoomId}`

/** 완성본 창을 닫은 뒤 돌아갈 창 (없으면 마을로) */
export function bookBackModal(back: BookBack | undefined): Modal | null {
  if (!back) return null
  if (back === 'word') return { kind: 'word', tab: 'library' }
  if (back === 'library') return { kind: 'library' }
  if (back === 'homeShelf') return { kind: 'homeShelf' }
  return { kind: 'roomShelf', room: back.slice('room:'.length) as ShelfRoomId }
}

/** 말씀 탭의 칸 */
export type WordTab = 'copy' | 'pieces' | 'god' | 'links' | 'library'

/** 필사 책상의 화면 (계획 14 작업 2) */
export type CopyView = 'menu' | 'pick' | 'write' | 'done' | 'ask'
/** 제본 창을 닫은 뒤 돌아갈 곳: 서고·방 선반·가방 (없으면 마을로) */
export type BindBack = 'library' | 'bag' | `room:${ShelfRoomId}`
/** 필사 입력이 들어온 모양: 붙여넣기 표식·입력 종류 + 한글을 조합하는 중인가 (화면이 compositionstart/end로 안다) */
export type CopyHow = Omit<InputHow, 'target'> & { composing?: boolean }

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
  if (m.back === 'word') return { kind: 'word', tab: 'library' }
  if (m.back === 'library') return { kind: 'library' }
  return { kind: 'roomShelf', room: m.back.slice('room:'.length) as ShelfRoomId }
}

/** 이 책을 꽂는 선반 창: 복음서는 서고 선반, 그 뒤 책은 자기 방 선반 (방 표) */
function shelfBackOf(book: Book): 'library' | `room:${ShelfRoomId}` {
  const room = roomOf(book).id
  return room === 'gospels' ? 'library' : `room:${room}`
}

/** 제본 창을 닫은 뒤 돌아갈 창 */
function bindBackModal(back: BindBack | undefined): Modal | null {
  if (!back) return null
  if (back === 'library') return { kind: 'library' }
  if (back === 'bag') return { kind: 'bag' }
  return { kind: 'roomShelf', room: back.slice('room:'.length) as ShelfRoomId }
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
  /** 방 꾸미기에서 고른 놓인 가구 (왼쪽 위 칸·탁자 위인지) — 돌리기·치우기 (계획 17 작업 2). 저장하지 않는다 */
  decorSel: Pick<Furniture, 'item' | 'x' | 'y' | 'on'> | null
  decorMoving: boolean
  /** 방 꾸미기에서 화면에 비출 방의 칸 (기록자는 그대로 두고 카메라만 옮긴다). 저장하지 않는다 */
  decorLook: Tile | null
  moveSelected: () => void
  showDecorRoom: (room: 'workshop' | 'partner' | 'baby' | 'living') => void
  muted: boolean
  /** 떠 있는 조이스틱 (설정에서 켜고 끈다, 처음엔 꺼짐 — 마우스·터치 모두) */
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
  petActivity: (action: 'play' | 'rest') => void
  chooseChildCareer: (job: AdultJob) => void
  setChildResidence: (away: boolean) => void
  keepCompanion: (stay: boolean) => void
  keepChild: (mode: ChildMode) => void
  goSchool: (stat: StatId) => void
  /** 아이와 함께하기 (계획 12): 짧은 장면과 결과를 보인다 */
  kidAct: (act: KidAct) => void
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
  /** 서고: 봉인용 밀랍으로 봉인 */
  seal: (book: Book) => void
  /** 목수·대장장이에게 기록 설비 부탁 */
  giveBouquet: (id: string) => void
  giveCord: (id: string) => void
  /** 연인과 함께 가기 (계획 10 작업 4): 찻집·정자·언덕 — 짧은 장면 뒤 한 줄 알림 */
  goDate: (place: DatePlace) => void
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
  /** 성경 이야기를 더 모으는 길: 밤 필사·서고 열람석·옛 두루마리 (모으면 원래 본문 창) */
  nightCopy: () => void
  /** 가족 옷장: 고른 모습을 입힌다 (피부는 그대로) */
  dressUp: (who: WardrobeWho, a: FullAvatar) => void
  libraryRead: () => void
  buyScroll: () => void
  blanket: () => void
  drink: () => void
  plantAt: (at: Tile, crop: CropId) => void
  waterAt: (at: Tile) => void
  harvestAt: (at: Tile) => void
  // 책상·잠
  pickBook: (book: Book) => void
  moveInDesk: (book: Book, chapter: number, index: number, delta: number) => void
  submitDesk: (book: Book, chapter: number) => void
  /** 필사: 쓸 책을 고른다 (27권 어느 책이든) */
  copyBook: (book: Book) => void
  /**
   * 필사: 입력이 바뀌었다. how: 붙여넣기 표식·입력 종류(InputEvent.inputType)·한글 조합 중인가.
   * 조합 중에는 쓰다 만 입력만 남기고 절을 마치지 않는다 (조합이 끝나면 다시 부른다).
   * 한 절을 다 맞게 쓰면 기록하고 다음 절로. 받았으면 true, 받지 않았으면(붙여넣기·자동완성 뭉치) false
   */
  copyType: (text: string, how?: CopyHow) => boolean
  /**
   * 필사 소리 내어 읽기: 음성 인식이 받아 적은 글을 지금 절과 견준다 (checkVoice). 받으면 본문 그대로를 손으로 다 쓴 것과
   * 똑같이 기록한다 (통계·장 완료·하나님 기록·소리 모두 같다). 받지 않으면 아무것도 바꾸지 않는다. 쓰는 화면이 아니면 null
   */
  copyVoice: (transcript: string) => VoiceCheck | null
  /** 필사 책상의 화면을 바꾼다 (메뉴·책 고르기·쓰기). 'write'로 갈 때 resume이면 "…부터 이어집니다"를 보인다 */
  copyView: (view: CopyView, resume?: boolean) => void
  /** 필사 책상에서 나간다 — 쓰다 만 입력을 저장하고 마을로 */
  copyExit: () => void
  /** 아이가 옆에 앉고 싶어 할 때: [같이 있기](true) / [혼자 쓰기](false) — 그다음 책상 메뉴(또는 책 고르기) */
  deskAnswer: (together: boolean) => void
  /** 말씀 탭의 [이어서 필사하기]: 쓰던 책이 있으면 그 절부터 필사 화면, 없으면 책 고르기 */
  wordContinue: () => void
  /** 쓰다 만 입력을 지금 저장한다 (잠깐 손을 멈췄을 때) */
  copySave: () => void
  /** 필사 길잡이를 접는다(true)·펼친다(false) — 플레이어 저장에 남는다 */
  copyGuide: (folded: boolean) => void
  /** 편지 옮겨 적기: 칸 하나에 보기 하나 (맞으면 채우고, 틀리면 그 보기를 흐린다 — 불이익 없음) */
  copyPick: (blank: number, option: string) => void
  /** 세 칸을 다 채웠으면 옮겨 적는다 (recordLetter) */
  submitCopy: () => void
  answerQuiz: (given: string | string[]) => void
  nextQuiz: () => void
  // 서고
  /** 카드 판(여정 판·일곱 교회 카드 판)의 카드를 위(-1)·아래(+1)로 */
  moveBoard: (board: CardBoard, index: number, delta: number) => void
  /** 퀴즈 풀고 금박 책등: 서고 퀴즈를 풀고 꽂는다 (맞힌 만큼 은박·금박) */
  startShelve: (book: Book) => void
  /** 바로 꽂기: 퀴즈 없이 꽂는다 (불이익 없음) */
  shelveNow: (book: Book) => void
  startRetry: (book: Book) => void
  /** 제본 창을 연다: 아직 제본하지 않은 책은 고르기부터, 제본한 책(꽂은 책 포함)은 표지 꾸미기부터 */
  openBind: (book: Book, back?: BindBack) => void
  /** 완성본 펼쳐 보기를 연다 (다 쓴 책 — 제본했거나 꽂은 책 — 만) */
  openBook: (book: Book, back?: BookBack) => void
  /** 집 책장에 두기·내려놓기 */
  toggleHomeBook: (book: Book) => void
  /** 제본 창: 그대로 제본하기 (무료) */
  bindPlain: () => void
  /** 제본 창: 고른 모습으로 특별하게 제본하기 / 다시 꾸미기 (재료가 모자라면 그대로) */
  bindSpecial: (choice: SpecialChoice) => void
  /** 제본 창을 닫는다 — 열기 전 창(서고·방 선반·가방)으로 */
  closeBind: () => void
  sleep: () => void
  saveMyLine: (lineKey: string, text: string) => void
  /** 필사 길잡이의 한 줄: 저장만 하고 창(필사 화면)은 그대로 */
  saveGuideLine: (lineKey: string, text: string) => void
  /** 나의 한 줄을 적지 않고 넘긴다 (나중에 선반에서 적을 수 있다) */
  skipMyLine: () => void
  // 동물·방
  adopt: (animal: Animal, name: string) => void
  startDecorate: (item: ItemId | 'pick') => void
  stopDecorate: () => void
  /** 고른 가구를 한 번 돌린다 (못 돌리면 한 줄로 알린다) */
  turnSelected: () => void
  /** 고른 가구를 가방으로 */
  removeSelected: () => void
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
const CHILD_HELP_LINE = ['이웃집 사본을 보고 한 대목 베껴 왔어요', '파피루스나 잉크를 만들어 왔어요', '이웃에게 대신 인사하고 왔어요', '물이나 갈대를 날라 왔어요', '뜻밖의 선물을 들고 왔어요']
function sayChildHelp(g: GameState, say: (text: string, ms?: number) => void) {
  // 어른이 된 아이의 편지·선물·닢이 먼저
  if (g.child && g.flags.kidMailDay === g.clock.day) {
    const n = g.child.name
    const mk = g.flags.kidMailKind
    if (mk === 0) say(`${n}의 편지: “${KID_LETTERS[(g.clock.day * 7) % KID_LETTERS.length]}”${g.flags.kidMailPiece === g.clock.day ? ' · 편지에 사본 한 장이 들어 있었어요' : ''}`, 5000)
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
  // 편지에 든 말씀 조각은 열어 볼 때 — 편지 나르는 이웃은 편지가 왔다는 것만 말한다 (계획 14 작업 5)
  return T.word.letterBring
}

/** 받은 말씀 조각 알림 (하나면 제목, 여럿이면 개수) */
function gotLine(pieceIds: readonly string[], one: string, many: string): string {
  return pieceIds.length === 1 ? fill(one, { title: pieceById(pieceIds[0]).title }) : fill(many, { n: pieceIds.length })
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

/** 집 안에 막 들어왔으면 누구 집인지 알린다 */
function announceRoom(before: GameState, after: GameState, door = true) {
  const room = roomAt(playerTile(after))
  if (!room || room === roomAt(playerTile(before))) return
  if (door) sfx('door')
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
export type MenuPlace = 'hearth' | 'workbench' | 'press' | 'hill' | 'bench' | 'homeBench' | 'hallTable' | 'teaTable' | 'pavilion' | FacilityPlace

/** 방 꾸미기에서 고른 가구 (방이 바뀌어 없어졌으면 undefined) */
export function selectedPiece(room: readonly Furniture[], sel: Pick<Furniture, 'item' | 'x' | 'y' | 'on'> | null): Furniture | undefined {
  if (!sel) return undefined
  return room.find((f) => f.item === sel.item && f.x === sel.x && f.y === sel.y && !!f.on === !!sel.on)
}

export const useGame = create<Store>((set, get) => {
  let warnedSaveFail = false
  const persist = (g: GameState) => {
    // 물건 도감·업적: 저장할 때마다 새로 적고, 새로 이룬 업적은 알림과 따로 띄운다
    syncHome(g)
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
  /**
   * 필사 한 절 입력을 적는다 (writeVerse): 덜 맞으면 쓰다 만 입력만, 다 맞으면 기록 — 등잔·아이·소리·화면까지.
   * 손으로 쓴 것(copyType)과 소리 내어 읽은 것(copyVoice)이 같은 길을 지난다
   */
  const commitVerse = (game: GameState, book: Book, text: string): boolean => {
    const { state, result } = writeVerse(game, book, text, CONTENT)
    if (result.kind === 'notYet') {
      // 쓰다 만 입력: 상태에만 (화면이 손을 멈추면 copySave로, 나갈 때·절을 마칠 때 저장된다)
      set({ game: state })
      return true
    }
    if (result.kind === 'none') return true
    // 밤에 한 절을 적으면 기름이 있을 때 등잔을 켠다 (그림의 불빛 — 없어도 쓴다). 곁에 앉은 아이는 그림 그리다 졸다 잠든다
    const lit = deskKidVerse(lightLamp(state) ?? state)
    // 한 절은 펜을 책상에 내려놓는 소리(도장), 한 장을 마치면 책장 넘기는 소리와 마침 소리
    if (result.kind === 'chapter') {
      sfx('page')
      sfx('done')
    } else sfx('stamp')
    set({ game: persist(lit), modal: { kind: 'copy', view: result.kind === 'chapter' ? 'done' : 'write', last: result, resume: false } })
    return true
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
  /**
   * 책을 꽂은 뒤 (바로 꽂기·퀴즈 풀고 금박 책등·다시 도전 모두): 책등 알림, 새로 열린 구역 알림, 처음 꽂은 책이면 나의 한 줄.
   * 스물일곱 번째 책을 처음 꽂았으면 처음의 빈 서고와 지금을 나란히 보이는 창 (한 줄은 선반에서 나중에 적을 수 있다)
   */
  const afterShelved = (prev: GameState, next: GameState, book: Book, missed: readonly string[]) => {
    const firstTime = prev.shelved[book] === undefined
    sfx('shelve')
    const grades = T.library.grades as string[]
    get().say(fill(T.library.shelvedToast, { bookObj: withObject((T.quiz.books as Record<string, string>)[book]), grade: grades[next.shelved[book]!] }) + (missed.length ? ' ' + T.library.rereadNote : ''), 4000)
    // 새로 열린 구역
    const opened = lockedZones(shelvedCount(prev)).filter((z) => shelvedCount(next) >= z.books)
    if (opened.length) setTimeout(() => get().say(fill(T.ui.zoneOpened, { name: (T.ui.zones as Record<string, string>)[opened[0].id] }), 4000), 4200)
    if (firstTime && allShelved(next) && !allShelved(prev)) {
      set({ game: persist(next), modal: { kind: 'shelfDone' } })
      return
    }
    // 처음 꽂은 책이면 그 책에 대한 나의 한 줄을 물어본다 (넘겨도 된다). 사도행전·편지는 자기 방 선반으로 돌아간다 (방 표)
    const myLine: Modal = { kind: 'myLine', lineKey: bookLineKey(book), back: shelfBackOf(book) }
    set({ game: persist(next), modal: firstTime ? myLine : afterMyLine(myLine) })
  }

  /**
   * 오늘 이 이웃이 건넬 말씀 조각(편지 나르는 이웃은 편지)을 받는다 — 받을 것이 없으면 null.
   * 받은 조각은 말씀 탭의 말씀 조각 도감에 저절로 담긴다 (계획 14 작업 5). said: 본문 위에 보일 그 이웃의 말
   */
  function handOver(game: GameState, neighborId: string, said?: string): { game: GameState; modal: Modal | null } | null {
    const { state, pieceId, pieceIds } = listen(game, neighborId, CONTENT)
    if (!pieceId) return null
    const letter = neighborId === POSTMAN
    sfx(letter ? 'letter' : 'scroll')
    get().say(gotLine(pieceIds, letter ? T.word.letterGot : T.word.got, T.word.gotMany), 3400)
    // 장째로 된 조각(편지 책·요한계시록)이나 여럿이면 창을 닫는다 — 본문은 말씀 탭 [본문에서 보기]로
    if (pieceIds.length > 1 || modeOf(pieceById(pieceId).book) === 'letters') return { game: persist(state), modal: null }
    const onlyHere = pieceById(pieceId).stamps.length === 0
    return { game: persist(state), modal: { kind: 'passage', pieceId, askLine: onlyHere, ...(said ? { said } : {}) } }
  }

  function arrive(game: GameState, target: Target): { game: GameState; modal: Modal | null } {
    const rng = get().rng
    if (target.kind === 'neighbor') {
      // 이어 갈 이야기 (계획 16 작업 4): 손일 놀이가 남았으면 그 놀이부터, 고를 말이 남았으면 그 장면부터 — 마음·장면은 다시 오르지 않는다
      const resume = storyResume(game, target.id)
      if (resume) {
        sfx('talk')
        const g = greetNeighbor(game, target.id)
        return resume.mini
          ? { game: persist(g), modal: { kind: 'mini', state: startMini(resume.mini, rng), pending: { kind: 'story', event: resume.event, npc: target.id } } }
          : { game: persist(g), modal: { kind: 'scene', id: `ev:${resume.event}` } }
      }
      // 기다리던 이야기(이벤트)가 있으면 그 장면부터 (계획 6b)
      const ev = openEvent(game, target.id)
      if (ev) {
        sfx('talk')
        return { game: persist(greetNeighbor(ev, target.id)), modal: { kind: 'scene', id: ev.scenes[ev.scenes.length - 1] } }
      }
      // 배우자와 저녁 (계획 12): 저녁에 가끔, 집에서 말을 걸면 같이 먹는 짧은 장면
      if (target.id === game.romance?.partner) {
        const sup = eatSupper(game)
        if (sup) {
          sfx('talk')
          return { game: persist(greetNeighbor(sup, target.id)), modal: { kind: 'scene', id: sup.scenes[sup.scenes.length - 1] } }
        }
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
      // 아이방이 없으면 아이가 오지 않는다 — 배우자가 가끔 아이방 이야기를 꺼낸다 (선물 알림과 겹치지 않게 다음 말 걸 때)
      const baby = def && !sg ? babyRoomTalk(g, def.id) : null
      if (baby) {
        g = baby
        get().say(fill(T.romance.babyRoomTalk, { who: withSubject(def!.role) }))
      }
      // 편지 나르는 이웃 (2026-10-05): 오늘 온 편지는 말을 걸면 그 자리에서 건넨다 — 받기 단추 없이, 대화에 편지 말 한 줄.
      // 조각 하나짜리 편지(편지 책이 아닌 조각)는 말씀 조각처럼 그 말과 함께 본문 창으로. 편지 책의 장·여러 통이면 대화 창에 편지 말
      let letter: { letter?: string } = {}
      if (target.id === POSTMAN && postLine(g, POSTMAN)) {
        const said = T.word.letterBring
        const h = handOver(g, POSTMAN, `${def?.role ?? ''} · ${said}`)
        if (h?.modal) return h
        if (h) {
          g = h.game
          letter = { letter: said }
        }
      }
      // 아침에 들른 이웃은 들고 온 것을 건넨다
      const v = receiveVisit(g, target.id)
      if (v) {
        g = v.state
        get().say(fill(T.ui.visitGot, { items: itemList(v.gift) }))
        const l = NEIGHBOR_LINES[target.id]
        return { game: persist(g), modal: { kind: 'talk', neighborId: target.id, line: l?.visit.length ? pick(l.visit, rng).text : lineFor(g, target.id, rng), ...letter } }
      }
      // 특별한 대화 (2026-10-05): 오늘 말씀 조각을 건넬 이웃은 말을 걸면 그 자리에서 건넨다 — 받기 단추 없이, 그 이웃의 말과 함께 본문으로
      if (g.offers[target.id] && target.id !== POSTMAN) {
        const l = NEIGHBOR_LINES[target.id]
        const said = l?.offer.length ? `${def?.role ?? ''} · ${callName(pick(l.offer, rng).text, g.avatar?.name)}` : undefined
        const h = handOver(g, target.id, said)
        if (h) return h
      }
      // 평소 대화의 직업 선물 (계획 14 작업 5): 마음이 열린 이웃은 가끔 자기 일에서 난 것을 챙겨 준다 (말씀 조각과는 따로)
      const tg = def ? receiveTalkGift(g, target.id) : null
      if (tg) {
        g = tg.state
        get().say(fill(T.word.talkGift, { who: withSubject(def!.role), items: itemList(tg.gift) }), 3200)
      }
      // 그 자리에서 흘리던 혼잣말 (계획 6b): 말을 걸면 첫마디로 듣는다 (곁을 지나가기만 해서는 뜨지 않는다)
      const mut = mutterWaiting(g, target.id)
      if (mut) {
        // 둘이 함께인 일과 (계획 16 작업 3): 곁에 상대가 있으면 둘이 나누던 한 줄로 — 상대 이름과 함께
        const other = mutterPartner(g, target.id)
        const role = other ? neighborById(other)?.role : undefined
        const line = role ? fill(T.people.together, { otherAnd: withAnd(role), text: mut }) : mut
        return { game: persist(hearMutter(g, target.id, mut)), modal: { kind: 'talk', neighborId: target.id, line, ...letter } }
      }
      // 살아 움직이는 사람들 (계획 6b): 지금 상황·사이·기억에 맞는 말 (되풀이하지 않는다)
      const pl = g.offers[target.id] || postLine(g, target.id) ? null : personLine(g, target.id, rng())
      if (pl) return { game: persist(pl.state), modal: { kind: 'talk', neighborId: target.id, line: pl.text, ...letter } }
      return { game: persist(g), modal: { kind: 'talk', neighborId: target.id, line: lineFor(g, target.id, rng), ...letter } }
    }
    if (target.kind === 'stray') return { game, modal: { kind: 'companion', animal: target.animal } }
    if (target.kind === 'companion') {
      sfx(game.companion?.kind === 'dog' ? 'bark' : 'meow')
      // 쓰다듬기·데리고 다니기·집에 두기를 고른다
      return { game, modal: { kind: 'follow', who: 'pet' } }
    }
    if (target.kind === 'child') return { game, modal: { kind: 'follow', who: 'child' } }
    // 집에 놓은 책장: 다 쓴 책을 몇 권 둔다 (계획 14 작업 8)
    if (target.kind === 'bookcase') return { game, modal: { kind: 'homeShelf' } }
    if (target.kind !== 'place') return { game, modal: null }
    switch (target.id) {
      case 'bed': {
        // 다시 읽을 목록에서는 여기서 빼지 않는다 — 읽고 자기(sleep)를 눌렀을 때만 뺀다
        return { game, modal: { kind: 'review', pieceId: reviewPick(game, rng) } }
      }
      case 'desk': {
        // 계획 14: 책상은 필사 책상 — 재료·조각·등잔 기름 없이도 쓴다 (예전 엮기·옮겨 적기 창으로 가는 길은 닫았다).
        // 앉기만 해서는 기름을 쓰지 않는다 — 밤에 실제로 한 절을 적을 때 기름이 있으면 등잔을 켠다 (copyType)
        // 가족과 함께 있는 필사 (계획 14 작업 10): 아이가 자랐으면 가끔 옆에 앉고 싶어 한다 — 하루 한 번만 묻는다
        if (deskAsks(game)) return { game: persist({ ...game, flags: { ...game.flags, deskAskDay: game.clock.day } }), modal: { kind: 'copy', view: 'ask' } }
        return { game, modal: { kind: 'copy', view: game.copy.book ? 'menu' : 'pick' } }
      }
      case 'hearth':
      case 'workbench':
      case 'press':
      case 'hill':
      case 'homeBench':
      case 'bench':
      case 'hallTable':
      case 'teaTable':
      case 'pavilion':
        return { game, modal: { kind: 'menu', place: target.id } }
      case 'shelf':
        // 집 선반 = 📖 말씀 › 서고 (2026-10-04: 따로 있던 선반 창은 말씀·가방·일지로 나눠 합쳤다)
        return { game, modal: { kind: 'word', tab: 'library' } }
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
      // 마을 공동 시설 (계획 16 작업 20): 짓는 중이면 현장, 다 지었으면 쓰는 자리
      case 'commonBench':
      case 'flowerBed':
      case 'shadeSpot':
      case 'signPost': {
        const fid = facilityOfPlace(target.id)
        if (!fid) return { game, modal: null }
        return { game, modal: isBuilt(game.flags, fid) ? { kind: 'menu', place: target.id } : { kind: 'village', id: fid } }
      }
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
      case 'basket': {
        // 문 앞 편지 바구니: 오늘 온 편지(말씀 조각이 든 편지)를 먼저 꺼내고, 오늘 의뢰 편지가 있으면 연다
        const { state, pieceIds } = openMailbox(game, CONTENT)
        if (pieceIds.length) {
          sfx('letter')
          get().say(gotLine(pieceIds, T.word.letterGot, T.word.gotMany), 3400)
        }
        if (letterWaiting(state)) return { game: pieceIds.length ? persist(state) : state, modal: { kind: 'letter' } }
        if (!pieceIds.length) get().say(T.letters.none)
        return { game: pieceIds.length ? persist(state) : state, modal: null }
      }
      case 'mailbox': {
        // 집 앞 편지함: 편지 나르는 이웃을 찾아가지 않아도 오늘 편지를 꺼낸다 (본문은 책상에서)
        const { state, pieceIds } = openMailbox(game, CONTENT)
        if (!pieceIds.length) {
          get().say(T.post.mailboxEmpty)
          return { game, modal: null }
        }
        sfx('letter')
        get().say(gotLine(pieceIds, T.word.letterGot, T.word.gotMany), 3400)
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
        sfx('door')
        const entered = enterDoor(game, target.tile)
        announceRoom(game, entered, false)
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
    if (p.kind === 'gather') {
      next = finishGather(game, p.place)
      if (next !== game) sfx(p.place === 'well' ? 'splash' : 'harvest')
    }
    else if (p.kind === 'club') next = clubWeaveDone(game,p.id)
    else if (p.kind === 'craft') next = finishCraft(game, p.recipe)
    else if (p.kind === 'help') {
      const def = CONTENT.neighbors.find((n) => n.id === p.neighborId)
      if (def) {
        next = finishHelp(game, def)
        const l = NEIGHBOR_LINES[def.id]
        const thanks = def.id === 'grandpa' && l.helpSeason && grapesRipe(game.clock.day) ? l.helpSeason.thanks : l.help.thanks
        get().say(thanks)
      }
    } else if (p.kind === 'story') next = finishStoryMini(game)
    else if (p.kind === 'teach') next = teach(game)
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
    startTripBoard: (dest, withChild) => {
      sfx('splash')
      set({ trip: { dest, withChild }, modal: null })
    },
    finishTripBoard: (rewards) => {
      const t = get().trip
      if (!t) return
      // 아이를 데리고 다녀왔으면 가까움, 처음이면 가족 앨범 (계획 12 가족 여행 — 여행 판은 그대로)
      if (t.withChild && get().game.child) set({ game: persist(familyTrip(get().game)) })
      set({ trip: null, modal: { kind: 'travel', dest: t.dest, rewards } })
    },
    afterScene: null,
    decorating: null,
    decorSel: null,
    decorMoving: false,
    decorLook: null,
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
      set({ game, modal: null, decorating: null, decorSel: null })
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
        if (get().decorMoving) {
          const f = selectedPiece(game.room, get().decorSel)
          const next = f && moveFurniture(game, f, tile)
          if (!next) { get().say('그 자리는 가구가 겹치거나 통로가 막혀요.'); return }
          const moved = next.room.find(o => o.item === f!.item && o.x === tile.x && o.y === tile.y)!
          set({ game: persist(next), decorMoving: false, decorSel: moved })
          sfx('place')
          return
        }
        // 물건을 들고 있으면 먼저 놓아 본다 (탁자·협탁 위에 올리기)
        if (decorating !== 'pick') {
          const placed = placeFurniture(game, decorating, tile)
          if (placed) {
            sfx('place')
            // 방금 놓은 것을 고른 채로 둔다 (바로 돌릴 수 있게)
            const f = placed.room[placed.room.length - 1]
            set({ game: persist(placed), decorating: (placed.inv[decorating] ?? 0) > 0 ? decorating : 'pick', decorSel: { item: f.item, x: f.x, y: f.y, on: f.on } })
            return
          }
        }
        // 놓을 수 없는 자리에 가구가 있으면 고른다 — 가구가 차지한 칸 어디를 눌러도. 고른 것을 한 번 더 누르면 치운다
        const hit = removal(game.room, tile)[0]
        if (!hit) {
          set({ decorSel: null })
          return
        }
        if (selectedPiece(game.room, get().decorSel) === hit) get().removeSelected()
        else set({ decorSel: { item: hit.item, x: hit.x, y: hit.y, on: hit.on } })
        return
      }
      // 서고의 방 문은 모두 처음부터 열려 있다 (걸어 들어가는 문 — 아래 tapTile로)
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
      if (!modal && game.scenes.length) {
        modal = { kind: 'scene', id: game.scenes[0] }
        sfx('bell')
      }
      // 아이가 태어난 장면을 본 뒤 이름을 정한다
      if (!modal && game.flags.childNaming && game.child) modal = { kind: 'childName' }
      set({ game, modal, clockMs })
      expireToast()
      if (modal?.kind === 'scene') snapAlbum(modal.id, get().capture)
    },

    open: (m) => set({ modal: m }),
    closeModal: () => set({ modal: null }),

    listenTo: (neighborId) => {
      const h = handOver(get().game, neighborId)
      if (h) set(h)
    },

    startHelp: (neighborId) => {
      const def = CONTENT.neighbors.find((n) => n.id === neighborId)
      if (!def) return
      set({ modal: { kind: 'mini', state: startMini(def.help.minigame, get().rng), pending: { kind: 'help', neighborId } } })
    },

    gift: (neighborId, item) => {
      const def = CONTENT.neighbors.find((n) => n.id === neighborId)
      if (!def) return
      const r = giveGift(get().game, def, item, CONTENT)
      if (!r) return
      sfx('gift')
      const l = NEIGHBOR_LINES[neighborId]
      // 선물은 마음만 오른다 — 말씀 조각과 묶지 않는다 (계획 14 작업 5)
      set({ game: persist(r.state), modal: { kind: 'talk', neighborId, line: r.liked ? l.giftLiked : l.giftPlain } })
    },

    doTrade: (t) => {
      const next = doTrade(get().game, t)
      if (!next) return
      sfx('coin')
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
      sfx('coin')
      set({ game: persist(next) })
      get().say(fill(T.ui.soldLine, { item: itemName(item), n: price! }))
    },

    buyRareItem: (item) => {
      const next = buyRare(get().game, item)
      if (!next) return
      sfx('coin')
      toastGain(get().game.inv, next.inv)
      set({ game: persist(next) })
    },

    petCompanion: () => {
      get().say(T.ui.pet)
      // 쪼그려 앉아 쓰다듬는 자세가 잠시 보이도록 (renderer: idle.seconds % 12 > 8)
      set({ game: { ...get().game, idle: { seconds: 9, action: null, cooldown: 3 } }, modal: null })
    },
    petActivity: (action) => {
      const g = get().game, c = g.companion
      if (!c || Math.abs(c.x - g.player.x) + Math.abs(c.y - g.player.y) > 2) return
      const next = interactPet(c, action, g.clock.day, g.clock.minute)
      if (!next) { get().say(T.pet.wait); return }
      const ways = petWays(next)
      get().say(action === 'play' ? ways.energy > 0 ? T.pet.playActive : T.pet.playQuiet : ways.distance > 0 ? T.pet.restApart : T.pet.restNear)
      set({ game: persist({ ...g, companion: next, idle: { seconds: 9, action: null, cooldown: 3 } }) })
    },
    chooseChildCareer: (job) => {
      const g = get().game, c = g.child
      if (!c || childStage(c,g.clock.day)!=='adult' || c.jobConfirmed !== false || !ADULT_JOBS.includes(job)) return
      set({ game: persist({ ...g, child: { ...c, job, jobConfirmed: true } }) })
    },
    setChildResidence: (away) => {
      const g=get().game,c=g.child
      if(!c || childStage(c,g.clock.day)!=='adult' || !c.job || c.jobConfirmed === false) return
      set({ game:persist({ ...g,child:{...c,left:away,mode:away?undefined:'roam'} }) })
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
    kidAct: (act) => {
      const before = get().game
      const r = doKidAct(before, act, CONTENT)
      if (!r) return
      sfx('gift')
      const album = r.state.scenes.length > before.scenes.length
      set({ game: persist(r.state), modal: { kind: 'kidTime', done: { act, variant: r.variant, gains: r.gains, got: r.got, who: r.who, burnt: r.burnt, album } } })
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
      get().say(piece ? `${DESTS[dest].name} 회당에서 베껴 온 사본을 펼쳐요` : `${DESTS[dest].name}에서 하룻밤 묵고 집으로 돌아왔어요`, 3400)
      sayChildHelp(next, get().say)
    },

    doBoard: (r) => {
      const next = fulfillBoard(get().game, r)
      if (!next) return
      sfx('coin')
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
      set({ game: finishPending(get().game, m.pending, finishNow(m.state)), modal: m.pending.kind === 'club' ? { kind: 'clubSession', id: m.pending.id } : null })
    },

    miniTap: (itemId) => {
      const m = get().modal
      if (m?.kind !== 'mini') return
      if (isDone(m.state)) {
        // 길게 누르기의 마지막 뗌은 창을 닫지 않는다 (닫기 단추로)
        if (m.state.kind === 'hold' && itemId === HOLD_UP) return
        set({ game: finishPending(get().game, m.pending, m.state), modal: m.pending.kind === 'club' ? { kind: 'clubSession', id: m.pending.id } : null })
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
    goDate: (place) => {
      const before = get().game
      const next = goOnDate(before, place, CONTENT)
      if (next === before) return
      if (place === 'tea') sfx('eat')
      const game = persist(next)
      const scene = game.scenes.find((id) => !before.scenes.includes(id) && id.startsWith('date')) ?? game.scenes[game.scenes.length - 1]
      set({ game, modal: { kind: 'scene', id: scene }, afterScene: fill(T.romance.dateDone, { with: withAnd(partnerName(before)) }) })
      snapAlbum(scene, get().capture)
    },
    seal: (book) => {
      const next = sealBook(get().game, book)
      if (next === get().game) return
      sfx('gift')
      set({ game: persist(next) })
      get().say(T.care.sealed)
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
    dressUp: (who, a) => {
      const next = dressUp(get().game, who, a, CONTENT)
      set({ game: persist(next), modal: { kind: 'family' } })
      get().say('새 옷으로 갈아입었어요')
    },
    nightCopy: () => {
      const r = nightCopy(get().game, CONTENT)
      if (!r) return
      sfx('scroll')
      get().say('등잔 아래에서 빌려 온 사본을 옮겨 적었어요')
      set({ game: persist(r.state), modal: { kind: 'passage', pieceId: r.pieceId, askLine: false } })
    },
    libraryRead: () => {
      const r = libraryRead(get().game, CONTENT)
      if (!r) return
      sfx('scroll')
      get().say('서고 열람석에서 사본을 옮겨 적었어요')
      set({ game: persist(r.state), modal: { kind: 'passage', pieceId: r.pieceId, askLine: false } })
    },
    buyScroll: () => {
      const r = buyScroll(get().game, CONTENT)
      if (!r) return
      sfx('coin')
      get().say('떠돌이 상인에게서 다른 마을의 옛 사본을 샀어요')
      set({ game: persist(r.state), modal: { kind: 'passage', pieceId: r.pieceId, askLine: false } })
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
      sfx('splash')
      set({ game: persist(passTime({ ...next, needs: work(next.needs, 2) }, 10)), modal: null })
    },
    harvestAt: (at) => {
      const before = get().game.inv
      const next = harvest(get().game, at)
      if (!next) return get().say(T.ui.bagFull)
      sfx('harvest')
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
    copyBook: (book) => {
      const game = get().game
      const next = startCopy(game, book, CONTENT)
      if (next === game && game.copy.book !== book) return
      sfx('page')
      // 이미 쓰던 책(이어 쓸 자리나 마친 장이 있다)이면 "…부터 이어집니다"를 보인다
      const resume = !!next.copy.at[book] || next.progress[book].completed.length > 0
      set({ game: persist(next), modal: { kind: 'copy', view: 'write', last: null, resume } })
    },
    copyView: (view, resume = false) => {
      const m = get().modal
      if (m?.kind !== 'copy') return
      if (view === 'write' && !get().game.copy.book) return
      set({ modal: { kind: 'copy', view, last: null, resume: view === 'write' && resume } })
    },
    deskAnswer: (together) => {
      const m = get().modal
      if (m?.kind !== 'copy' || m.view !== 'ask') return
      const game = persist(answerDesk(get().game, together))
      set({ game, modal: { kind: 'copy', view: game.copy.book ? 'menu' : 'pick' } })
    },
    copyExit: () => {
      if (get().modal?.kind !== 'copy') return
      set({ game: persist(get().game), modal: null })
    },
    copySave: () => {
      if (get().modal?.kind === 'copy') saveGame(get().game)
    },
    copyGuide: (folded) => {
      const game = get().game
      const copy = withGuideFolded(game.copy, folded)
      if (copy === game.copy) return
      set({ game: persist({ ...game, copy }) })
    },
    wordContinue: () => {
      const game = get().game
      const book = game.copy.book
      if (!book) {
        set({ modal: { kind: 'copy', view: 'pick' } })
        return
      }
      sfx('page')
      const spot = copySpot(game, book, CONTENT)
      set({ modal: { kind: 'copy', view: spot ? 'write' : 'menu', last: null, resume: !!spot } })
    },
    copyType: (text, how = {}) => {
      const m = get().modal
      const game = get().game
      const book = game.copy.book
      if (m?.kind !== 'copy' || m.view !== 'write' || !book) return false
      const spot = copySpot(game, book, CONTENT)
      if (!spot) return false
      // 붙여넣기·끌어 놓기·자동완성(본문과 맞지 않는 뭉치)은 받지 않는다. 휴대폰 키보드가 몇 글자를 한꺼번에 확정해도 본문과 맞으면 받는다
      const accepted = acceptInput(spot.draft, text, { pasted: how.pasted, inputType: how.inputType, target: spot.verse.text })
      if (accepted !== text) return false
      if (how.composing) {
        // 한글 조합 중: 쓰다 만 입력만 남긴다 — 마지막 글자가 아직 바뀔 수 있으니 절을 마치지 않는다 (조합이 끝나면 화면이 다시 부른다)
        set({ game: saveCopyDraft(game, book, text, CONTENT) })
        return true
      }
      return commitVerse(game, book, text)
    },
    copyVoice: (transcript) => {
      const m = get().modal
      const game = get().game
      const book = game.copy.book
      if (m?.kind !== 'copy' || m.view !== 'write' || !book) return null
      const spot = copySpot(game, book, CONTENT)
      if (!spot) return null
      const check = checkVoice(transcript, spot.verse.text)
      // 기록하는 것은 언제나 본문 그대로 — 손으로 한 절을 다 맞게 쓴 것과 똑같은 길로
      if (check.ok) commitVerse(game, book, spot.verse.text)
      return check
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
        const prev = get().game
        afterShelved(prev, shelve(prev, m.mode.book, correct, m.missed), m.mode.book, m.missed)
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
    shelveNow: (book) => {
      const prev = get().game
      const next = shelveQuick(prev, book, CONTENT)
      if (next === prev) return
      afterShelved(prev, next, book, [])
    },
    openBook: (book, back) => {
      if (!isFinished(get().game, book)) return
      sfx('page')
      set({ modal: { kind: 'bookView', book, back } })
    },
    toggleHomeBook: (book) => {
      const prev = get().game
      const next = toggleHomeBook(prev, book)
      if (next === prev) return
      sfx('shelve')
      set({ game: persist(next) })
    },
    openBind: (book, back) => {
      const game = get().game
      const block = canBind(game, book, CONTENT)
      // 아직 다 마치지 않은 책은 열지 않는다. 제본한 책(꽂은 옛 책 포함)은 표지 꾸미기부터
      if (block === 'notDone') return
      sfx('scroll')
      const redo = block === 'bound'
      const choice = game.bound[book]?.special ?? DEFAULT_CHOICE
      set({ modal: { kind: 'bind', book, step: redo ? 'decorate' : 'choose', redo, choice, back } })
    },
    bindPlain: () => {
      const m = get().modal
      if (m?.kind !== 'bind' || m.redo) return
      const game = get().game
      const next = bindBook(game, m.book, CONTENT)
      if (next === game) return
      sfx('bind')
      set({ game: persist(next), modal: { ...m, step: 'made' } })
    },
    bindSpecial: (choice) => {
      const m = get().modal
      if (m?.kind !== 'bind') return
      const game = get().game
      const next = m.redo ? decorateBook(game, m.book, choice) : bindBook(game, m.book, CONTENT, choice)
      if (next === game) return
      sfx('bind')
      set({ game: persist(next), modal: { ...m, step: 'made', choice } })
    },
    closeBind: () => {
      const m = get().modal
      if (m?.kind !== 'bind') return
      set({ modal: bindBackModal(m.back) })
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
      // 집 단계가 바뀌는 곳은 잠뿐: goToSleep이 새 단계로 지도(모듈 전역)를 맞춘다
      const next = goToSleep(get().game, CONTENT, { read: pieceId !== null, pieceId: pieceId ?? undefined })
      set({ game: persist(next), modal: null })
      sayChildHelp(next, get().say)
    },
    saveMyLine: (lineKey, text) => set({ game: persist(setMyLine(get().game, lineKey, text)), modal: afterMyLine(get().modal) }),
    saveGuideLine: (lineKey, text) => set({ game: persist(setMyLine(get().game, lineKey, text)) }),
    skipMyLine: () => set({ modal: afterMyLine(get().modal) }),

    adopt: (animal, name) => {
      const next = adoptStray(get().game, animal, cleanName(name, animal))
      sfx(animal === 'dog' ? 'bark' : 'meow')
      set({ game: persist(next), modal: null })
    },
    startDecorate: (item) => set({ decorating: item, modal: null, decorSel: null, decorMoving: false }),
    stopDecorate: () => set({ decorating: null, decorSel: null, decorMoving: false, decorLook: null }),
    moveSelected: () => set({ decorMoving: !get().decorMoving, decorating: 'pick' }),
    showDecorRoom: (room) => {
      const { game } = get()
      const required = { workshop: 0, partner: 1, baby: 2, living: 3 }[room]
      if (!get().decorating || game.homeLevel < required) return
      // 기록자는 그대로 두고 화면만 그 방 가운데로 옮긴다
      const r = { workshop: WORKSHOP, partner: PARTNER_ROOM, baby: BABY_ROOM, living: LIVING_ROOM }[room]
      set({ decorLook: { x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2 } })
    },
    turnSelected: () => {
      const { game, decorSel } = get()
      const f = selectedPiece(game.room, decorSel)
      if (!f) return
      const next = rotateFurniture(game, f)
      if (!next) {
        get().say(T.ui.decorateTurnBlocked)
        return
      }
      sfx('place')
      set({ game: persist(next) })
    },
    removeSelected: () => {
      const { game, decorSel } = get()
      const f = selectedPiece(game.room, decorSel)
      if (!f) return
      // 이 가구가 맨 위에 있는 칸에서 치운다 (탁자 위 물건이 아니라 탁자를 고른 때)
      const at = footprint(f).find((t) => removal(game.room, t)[0] === f)
      if (!at) return
      const next = removeFurniture(game, at)
      if (next === game) get().say(T.ui.bagFull)
      else {
        set({ game: persist(next), decorSel: null, decorMoving: false })
        sfx('place')
      }
    },

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
      // 고른 말이 손일을 함께하는 것이면 장면을 닫자마자 그 놀이로 (계획 16 작업 4)
      const w = game.life?.storyWait
      if (w?.mini && id === `ev:${w.event}`) {
        set({ game, modal: { kind: 'mini', state: startMini(w.mini, get().rng), pending: { kind: 'story', event: w.event, npc: w.npc } }, afterScene: null })
        if (after) get().say(after)
        return
      }
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
