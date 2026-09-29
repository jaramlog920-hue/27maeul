// 엔진 상태 ↔ 화면 연결. 창(모달)이 열려 있으면 시간과 걸음이 멈춘다.
import { create } from 'zustand'
import { CONTENT, pieceById, pieceOfQuestion, piecesOf, quizSourceFor } from '../content/catalog'
import { buildLibraryQuiz, buildQuiz, isCorrect, type Question } from '../engine/quiz'
import { actsDoorGlows, canShelve, payRetry, poolFor, shelve } from '../engine/library'
import { ALBUM_IDS, fill, itemList, itemName, NEIGHBOR_LINES, SCENES, T } from '../content/text'
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
  submitChapter,
  tapTile,
  walkDirection,
  interactTile,
  teach,
  tick,
  trade as doTrade,
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
  readScripture,
  passTime,
  sell,
  SELL_PRICES,
  type GameState,
  type SubmitResult,
  type Trade,
} from '../engine/game'
import { isHome, LOCKED_DOORS, lockedTiles, lockedZones, roomAt, sameTile, zoneAt } from '../engine/world'
import { removal } from '../engine/room'
import { heartsOf } from '../engine/hearts'
import { add, RECIPES, type Inventory, type RecipeId } from '../engine/items'
import { work } from '../engine/needs'
import { plant, water, harvest, type CropId } from '../engine/garden'
import { isDone, startMini, stepMini, tapMini, type MiniState } from '../engine/minigame'
import { finishLetter, letterPay, letterWaiting } from '../engine/requests'
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
export type ShelfTab = 'dex' | 'gifts' | 'recipes' | 'album' | 'lines'

export type Modal =
  | { kind: 'settings' }
  | { kind: 'guide' }
  | { kind: 'schedule' }
  | { kind: 'talk'; neighborId: string; line: string }
  | { kind: 'passage'; pieceId: string; askLine: boolean; back?: boolean }
  /** lineKey: 조각 id 또는 'book:mk' 같은 책 키. back: 적거나 넘긴 뒤 돌아갈 창 */
  | { kind: 'myLine'; lineKey: string; back?: 'library' | 'shelf' }
  | { kind: 'desk'; result: SubmitResult | null; dark: boolean }
  | { kind: 'review'; pieceId: string | null }
  | { kind: 'journal' }
  | { kind: 'scene'; id: string }
  | { kind: 'mini'; state: MiniState; pending: Pending }
  | { kind: 'gift'; neighborId: string }
  | { kind: 'trade' }
  | { kind: 'menu'; place: 'hearth' | 'workbench' | 'press' | 'hill' | 'bench' }
  | { kind: 'readPick' }
  | { kind: 'quiz'; mode: QuizMode; questions: Question[]; index: number; wrong: string[]; solved: boolean; misses: number; missed: string[] }
  | { kind: 'care' }
  | { kind: 'bag' }
  | { kind: 'shelf'; tab?: ShelfTab }
  | { kind: 'companion'; animal: Animal }
  | { kind: 'library' }
  | { kind: 'letter' }
  | { kind: 'garden'; at: Tile }

/** 나의 한 줄 창을 닫은 뒤 돌아갈 곳 */
function afterMyLine(m: Modal | null): Modal | null {
  if (m?.kind !== 'myLine' || !m.back) return null
  return m.back === 'shelf' ? { kind: 'shelf', tab: 'lines' } : { kind: 'library' }
}

interface Store {
  game: GameState
  modal: Modal | null
  toast: { text: string; until: number } | null
  /** 방 꾸미기: 놓을 물건, 또는 치우기 */
  decorating: ItemId | 'pick' | null
  muted: boolean
  /** 터치 화면의 조이스틱 (설정에서 켜고 끈다) */
  joystick: boolean
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
  startTeach: () => void
  startLetter: () => void
  // 손일
  startCraft: (recipe: RecipeId) => void
  miniTap: (itemId?: number) => void
  quitMini: () => void
  warm: () => void
  eat: () => void
  rest: () => void
  sitHill: () => void
  requestAsk: (npc: string) => void
  requestGive: (npc: string) => void
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
  answerQuiz: (given: string | string[]) => void
  nextQuiz: () => void
  // 서고
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
  setMuted: (m: boolean) => void
  setJoystick: (on: boolean) => void
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
const MUTE_KEY = 'twenty-seven/muted'
const JOYSTICK_KEY = 'twenty-seven/joystick'
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
function loadJoystick(): boolean {
  try {
    return globalThis.localStorage?.getItem(JOYSTICK_KEY) !== 'off'
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

function lineFor(game: GameState, neighborId: string, rng: Rng): string {
  const l = NEIGHBOR_LINES[neighborId]
  if (!l) return ''
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

/** 집 안에 막 들어왔으면 누구 집인지 알린다 */
function announceRoom(before: GameState, after: GameState) {
  const room = roomAt(playerTile(after))
  if (!room || room === roomAt(playerTile(before))) return
  const who = CONTENT.neighbors.find((d) => d.id === room.owner)?.role
  useGame.getState().say(room.owner === 'library' ? T.ui.libraryRoom : fill(T.ui.roomOf, { who: who ?? '' }), 2200)
}

export const useGame = create<Store>((set, get) => {
  let warnedSaveFail = false
  const persist = (game: GameState) => {
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
  }
  const toastGainFrom = (before: Inventory, after: Inventory) => toastGain(before, after)
  const toastGain = (before: Inventory, after: Inventory) => {
    const g = gained(before, after)
    if (Object.keys(g).length) get().say(fill(T.ui.gotLine, { items: itemList(g) }))
  }

  function arrive(game: GameState, target: Target): { game: GameState; modal: Modal | null } {
    const rng = get().rng
    if (target.kind === 'neighbor') {
      let g = greetNeighbor(game, target.id)
      sfx('talk')
      // 아침에 들른 이웃은 들고 온 것을 건넨다
      const v = receiveVisit(g, target.id)
      if (v) {
        g = v.state
        get().say(fill(T.ui.visitGot, { items: itemList(v.gift) }))
        const l = NEIGHBOR_LINES[target.id]
        return { game: persist(g), modal: { kind: 'talk', neighborId: target.id, line: l?.visit.length ? pick(l.visit, rng).text : lineFor(g, target.id, rng) } }
      }
      return { game: persist(g), modal: { kind: 'talk', neighborId: target.id, line: lineFor(g, target.id, rng) } }
    }
    if (target.kind === 'stray') return { game, modal: { kind: 'companion', animal: target.animal } }
    if (target.kind === 'companion') {
      sfx(game.companion?.kind === 'dog' ? 'bark' : 'meow')
      get().say(T.ui.pet)
      // 쪼그려 앉아 쓰다듬는 자세가 잠시 보이도록 (renderer: idle.seconds % 12 > 8)
      return { game: { ...game, idle: { seconds: 9, action: null, cooldown: 3 } }, modal: null }
    }
    if (target.kind !== 'place') return { game, modal: null }
    switch (target.id) {
      case 'bed': {
        // 다시 읽을 목록에서는 여기서 빼지 않는다 — 읽고 자기(sleep)를 눌렀을 때만 뺀다
        return { game, modal: { kind: 'review', pieceId: reviewPick(game, rng) } }
      }
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
        return { game, modal: { kind: 'menu', place: target.id } }
      case 'shelf':
        return { game, modal: { kind: 'shelf' } }
      case 'library':
        return { game, modal: { kind: 'library' } }
      case 'basket':
        if (letterWaiting(game)) return { game, modal: { kind: 'letter' } }
        get().say(T.letters.none)
        return { game, modal: null }
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
          get().say(info.blocked === 'notRipe' ? T.ui.notRipe : info.blocked === 'tired' ? T.ui.tooTired : T.ui.bagFull)
          return { game, modal: null }
        }
        const kind = target.id === 'well' ? 'mash' : 'pick'
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
    decorating: null,
    muted: loadMuted(),
    joystick: loadJoystick(),
    zoom: loadZoom(),
    rng: Math.random,
    capture: null,
    clockMs: 0,

    load: (game) => set({ game, modal: null, decorating: null }),

    say: (text, ms = 2600) => set({ toast: { text, until: get().clockMs + ms } }),

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
      if (locked >= 0) {
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
        if (e.type === 'arrived') {
          const a = arrive(game, e.target)
          game = a.game
          modal = a.modal ?? modal
        }
      }
      if (!modal && game.scenes.length) modal = { kind: 'scene', id: game.scenes[0] }
      set({ game, modal, clockMs })
      expireToast()
      if (modal?.kind === 'scene') {
        // 앨범 사진: 앨범 장면이면 그 칸에, photoFor가 있으면 그 장면의 칸에 (잔치 아침 → 저녁 모닥불 그림으로 바꾼다)
        const sc = SCENES[modal.id]
        const photo = sc?.photoFor ?? (sc?.album ? modal.id : null)
        if (photo) storeAlbumImage(photo, get().capture?.() ?? null)
      }
    },

    open: (m) => set({ modal: m }),
    closeModal: () => set({ modal: null }),

    listenTo: (neighborId) => {
      const { state, pieceId } = listen(get().game, neighborId, CONTENT)
      if (!pieceId) return
      sfx('scroll')
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
      toastGain(get().game.inv, next.inv)
      set({ game: persist(next) })
    },

    sellItem: (item) => {
      const price = SELL_PRICES[item]
      const next = sell(get().game, item)
      if (!next) return
      sfx('gift')
      set({ game: persist(next) })
      get().say(fill(T.ui.soldLine, { item: itemName(item), n: price! }))
    },

    startTeach: () => set({ modal: { kind: 'mini', state: startMini('timing', get().rng), pending: { kind: 'teach' } } }),
    startLetter: () => set({ modal: { kind: 'mini', state: startMini('timing', get().rng), pending: { kind: 'letter' } } }),

    startCraft: (recipe) => {
      if (canCraft(get().game, recipe)) return
      set({ modal: { kind: 'mini', state: startMini(RECIPES[recipe].minigame, get().rng), pending: { kind: 'craft', recipe } } })
    },

    // 손일을 그만두면 아무것도 쓰지 않았으므로 그냥 닫는다
    quitMini: () => {
      if (get().modal?.kind === 'mini') set({ modal: null })
    },

    miniTap: (itemId) => {
      const m = get().modal
      if (m?.kind !== 'mini') return
      if (isDone(m.state)) {
        set({ game: finishPending(get().game, m.pending, m.state), modal: null })
        return
      }
      const state = tapMini(m.state, itemId)
      sfx(state.kind === 'timing' ? (state.flash === 'hit' ? 'hit' : 'miss') : 'tap')
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
    rest: () => set({ game: persist(restAt(get().game)), modal: null }),
    sitHill: () => set({ game: persist(stargaze(get().game)), modal: null }),
    requestAsk: (npc) => set({ game: persist(askRequest(get().game, npc)), modal: null }),
    requestGive: (npc) => {
      const next = fulfillRequest(get().game, npc)
      // 재료는 있는데 안 되면 보상이 가방에 안 들어가는 것
      if (!next) return get().say(T.ui.bagFull)
      sfx('gift')
      toastGainFrom(get().game.inv, next.inv)
      set({ game: persist(next), modal: null })
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
    answerQuiz: (given) => {
      const m = get().modal
      if (m?.kind !== 'quiz' || m.solved) return
      const q = m.questions[m.index]
      if (isCorrect(q, given)) {
        sfx('hit')
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
        get().say(fill(T.library.shelvedToast, { book: (T.quiz.gospels as Record<string, string>)[m.mode.book], grade: grades[next.shelved[m.mode.book]!] }) + (m.missed.length ? ' ' + T.library.rereadNote : ''), 4000)
        // 새로 열린 구역
        const opened = lockedZones(shelvedCount(get().game)).filter((z) => shelvedCount(next) >= z.books)
        if (opened.length) setTimeout(() => get().say(fill(T.ui.zoneOpened, { name: (T.ui.zones as Record<string, string>)[opened[0].id] }), 4000), 4200)
        // 처음 꽂은 책이면 그 책에 대한 나의 한 줄을 물어본다 (넘겨도 된다)
        set({ game: persist(next), modal: firstTime ? { kind: 'myLine', lineKey: bookLineKey(m.mode.book), back: 'library' } : { kind: 'library' } })
        return
      }
      const { state, result } = submitChapter(get().game, m.mode.book, m.mode.chapter, CONTENT)
      if (result.kind === 'done') sfx('done')
      set({ game: persist(state), modal: { kind: 'desk', result, dark: false } })
    },
    startShelve: (book) => {
      const game = get().game
      if (canShelve(game, book, CONTENT)) return
      const pool = poolFor(game.shelved, book)
      sfx('scroll')
      const questions = buildLibraryQuiz({ current: book, pool, piecesOf, rng: get().rng, src: quizSourceFor(pool) })
      set({ modal: { kind: 'quiz', mode: { kind: 'library', book, retry: false }, questions, index: 0, wrong: [], solved: false, misses: 0, missed: [] } })
    },
    startRetry: (book) => {
      const paid = payRetry(get().game, book)
      if (!paid) return
      // 재도전은 서고에 있는 모든 책에서 낸다 (설계 §3.5)
      const pool = poolFor(paid.shelved, book)
      sfx('scroll')
      const questions = buildLibraryQuiz({ current: book, pool, piecesOf, rng: get().rng, src: quizSourceFor(pool) })
      set({ game: persist(paid), modal: { kind: 'quiz', mode: { kind: 'library', book, retry: true }, questions, index: 0, wrong: [], solved: false, misses: 0, missed: [] } })
    },
    sleep: () => {
      sfx('sleep')
      const m = get().modal
      const pieceId = m?.kind === 'review' ? m.pieceId : null
      set({ game: persist(goToSleep(get().game, CONTENT, { read: pieceId !== null, pieceId: pieceId ?? undefined })), modal: null })
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

    nextScene: () => {
      const m = get().modal
      const id = m?.kind === 'scene' ? m.id : null
      if (!id) return
      const game = persist(sceneSeen(get().game, id, ALBUM_IDS))
      set({ game, modal: null })
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
  }
})

/** 가방에 물건을 넣는 테스트 도우미 */
export function giveItems(items: Partial<Record<ItemId, number>>) {
  useGame.setState((s) => ({ game: { ...s.game, inv: add(s.game.inv, items) } }))
}
