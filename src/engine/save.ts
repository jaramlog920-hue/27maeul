// 브라우저 저장. 저장소가 없거나 막혀 있어도 게임은 돌아야 하므로 모든 접근을 try/catch로 감싼다.
import { sanitizeRomance } from './romance'
import { sanitizeStats } from './stats'
import { IDLE_RESET } from './autonomy'
import { bookDone, bookRoomOpen, emptyProgress, type Progress } from './books'
import { newGame, settle, type GameState } from './game'
import { cardsForChapters, placeNewCards } from './journey'
import { refitRoom } from './room'
import { arrivesOf, modeOf } from './shelf-rooms'
import { HOME_ENTRY, HOME_ROOM, isWalkable, OLD_HOME, sameTile, setHomeLevel } from './world'
import { BOOKS, type Book, type GameContent, type Tile } from './types'

export const SAVE_KEY = 'twenty-seven/save'
export const SAVE_VERSION = 1

function storage(): Storage | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

export function serialize(s: GameState): string {
  // 걷던 길·자율 동작·이웃 위치는 저장하지 않는다 (doze의 Infinity는 JSON이 못 담는다)
  return JSON.stringify({ ...s, player: { ...s.player, path: [] }, target: null, idle: IDLE_RESET, npcs: {} })
}

/**
 * 집 안이 지도 위(2~10열, 넓히면 13열까지, 2~7줄)에 있던 때의 좌표를 지도 아래 새 방(HOME_ROOM)으로 옮긴다.
 * 예전 집 밖이면 null. 예전 문 칸(지금은 문깔개)은 들어와 서는 칸으로
 */
export function fromOldHome(t: Tile, level: number): Tile | null {
  const x1 = level >= 1 ? OLD_HOME.x1Wide : OLD_HOME.x1
  if (t.x < OLD_HOME.x0 || t.x > x1 || t.y < OLD_HOME.y0 || t.y > OLD_HOME.y1) return null
  const to = { x: t.x + OLD_HOME.dx, y: t.y + OLD_HOME.dy }
  return sameTile(to, HOME_ROOM.exit) ? HOME_ENTRY : to
}

/** 집 안을 따로 된 방으로 옮기기 전 저장 (flags.homeRoom이 없다): 기록자·동반 동물·방 꾸미기 가구의 자리를 옮긴다 */
function moveOldHome(s: GameState, level: number): Pick<GameState, 'player' | 'companion' | 'room'> {
  const at = (x: number, y: number) => fromOldHome({ x: Math.round(x), y: Math.round(y) }, level)
  const p = at(s.player.x, s.player.y)
  const player = p ? { ...s.player, x: p.x, y: p.y, path: [], facing: 'down' as const } : s.player
  const c = s.companion && at(s.companion.x, s.companion.y)
  const companion = s.companion && c ? { ...s.companion, ...(isWalkable(c) ? c : HOME_ENTRY), path: [] } : s.companion
  const room = (s.room ?? []).map((f) => {
    const t = at(f.x, f.y)
    return t ? { ...f, x: t.x, y: t.y } : f
  })
  return { player, companion, room }
}

const isStrArray = (v: unknown) => Array.isArray(v) && v.every((x) => typeof x === 'string')
const isObj = (v: unknown) => !!v && typeof v === 'object' && !Array.isArray(v)

/**
 * 콘텐츠가 바뀐 뒤의 저장도 안전하게: 없는 조각 id를 걸러 내고, 책상 위 순서를 모은 조각과 맞춘다.
 * (없는 id가 남으면 도감·일지에서 오류가 나고, 책상 순서가 영원히 "틀림"이 될 수 있다)
 */
export function sanitize(s: GameState, content: GameContent): GameState {
  const known = new Map(content.pieces.map((p) => [p.id, p]))
  const progress: Progress = emptyProgress()
  const extra: string[] = []
  for (const b of BOOKS) {
    const chapters = new Set(content.pieces.filter((p) => p.book === b).map((p) => p.chapter))
    progress[b].completed = [...new Set(s.progress?.[b]?.completed ?? [])].filter((c) => chapters.has(c))
    // 이미 끝낸 장에 (콘텐츠가 바뀌어) 새 조각이 생겼다면 모은 것으로 친다
    extra.push(...content.pieces.filter((p) => p.book === b && progress[b].completed.includes(p.chapter)).map((p) => p.id))
  }
  const collected = [...new Set([...s.collected, ...extra])].filter((id) => known.has(id))
  for (const b of BOOKS) {
    const old = s.progress?.[b]?.arrangement ?? {}
    const mine = collected.filter((id) => known.get(id)!.book === b)
    const chapters = [...new Set(mine.map((id) => known.get(id)!.chapter))].filter((c) => !progress[b].completed.includes(c))
    for (const ch of chapters) {
      const kept = [...new Set((old[ch] ?? []).filter((id) => mine.includes(id) && known.get(id)!.chapter === ch))]
      const missing = mine.filter((id) => known.get(id)!.chapter === ch && !kept.includes(id)).sort()
      // 빠진 조각은 끝이 아니라 본문 순서의 자리에 끼운다 (id 순서 = 본문 순서)
      const list = [...kept]
      for (const m of missing) {
        const at = list.findIndex((id) => id > m)
        if (at < 0) list.push(m)
        else list.splice(at, 0, m)
      }
      progress[b].arrangement[ch] = list
    }
  }
  const offers = Object.fromEntries(Object.entries(s.offers).filter(([, id]) => known.has(id) && !collected.includes(id)))
  // 조각 키(옛 저장 그대로)와 책 키('book:mk')만 남긴다
  const bookKeys = new Set(BOOKS.map((b) => `book:${b}`))
  const myLines = Object.fromEntries(Object.entries(isObj(s.myLines) ? s.myLines : {}).filter(([id, t]) => (known.has(id) || bookKeys.has(id)) && typeof t === 'string'))
  // 집 단계 (옛 저장은 0 — 넓히기 전). 부탁해 둔 단계는 바로 다음 단계일 때만 남긴다
  const homeLevel = s.homeLevel === 1 || s.homeLevel === 2 ? s.homeLevel : 0
  // 지도(모듈 전역 집 단계)를 이 저장에 맞춘 뒤 가구를 맞춘다 — newGame이 0으로 되돌려 둔 상태라서
  setHomeLevel(homeLevel)
  const flags = { ...s.flags }
  // 집 안을 지도 아래 방으로 옮기기 전 저장이면 자리를 옮긴다 (집 단계·텃밭은 그대로)
  const moved = flags.homeRoom ? { player: s.player, companion: s.companion, room: s.room } : moveOldHome(s, homeLevel)
  flags.homeRoom = 1
  if (flags.homeOrder !== undefined && flags.homeOrder !== homeLevel + 1) delete flags.homeOrder
  // 가구 규칙이 바뀐 뒤의 저장: 지금 규칙으로 놓을 수 없는 것은 가방으로 (길이 막히지 않게)
  const { room, inv } = refitRoom(moved.room ?? [], s.inv)
  // 고른 책: 조각이 있어야 하고, 그 책의 서고 방이 열려 있어야 한다 (chooseBook과 같은 규칙 — 사도행전·편지)
  const activeBook =
    s.activeBook && (BOOKS as readonly string[]).includes(s.activeBook) && content.pieces.some((p) => p.book === s.activeBook) && bookRoomOpen(s.activeBook, flags)
      ? s.activeBook
      : null
  // 오늘 가져온 편지: 옛 저장(칸이 없던 때)은 빈 값. 지금 편지 책의 장 조각 중 아직 받지 않은 것만 남긴다
  const post =
    // 요한계시록(arrives 'stars')은 낮 편지로 오지 않는다 — 언덕 편지함에서 꺼낸다 (계획 9 작업 2)
    activeBook && modeOf(activeBook) === 'letters' && arrivesOf(activeBook) === 'post' && isStrArray(s.post)
      ? [...new Set(s.post)].filter((id) => known.get(id)?.book === activeBook && !collected.includes(id))
      : []
  // 여정 판: 옛 저장(판이 없던 때)은 빈 판에서, 엮은 사도행전 장의 카드만 남기고 빠진 카드는 채운다
  const board = Array.isArray(s.journey) ? s.journey.filter((n) => Number.isInteger(n)) : []
  const journey = placeNewCards(board, cardsForChapters(content.journey ?? [], progress.ac.completed))
  // 일곱 교회 판도 같게: 옛 저장(계획 7·8, 칸이 없던 때)은 빈 판, 옮겨 적은 요한계시록 장의 카드만 남기고 빠진 카드는 채운다
  const churchBoard = Array.isArray(s.churches) ? s.churches.filter((n) => Number.isInteger(n)) : []
  const churches = placeNewCards(churchBoard, cardsForChapters(content.churches ?? [], progress.rev.completed))
  return {
    ...s,
    player: moved.player,
    companion: moved.companion,
    homeLevel,
    flags,
    journey,
    churches,
    room,
    inv,
    // 재료 궤짝 (계획 11): 옛 저장(칸이 없던 때)은 빈 궤짝. 수가 아닌 값은 버린다
    chest: Object.fromEntries(Object.entries(isObj(s.chest) ? s.chest : {}).filter(([, n]) => Number.isInteger(n) && (n as number) > 0)),
    // 능력치 (계획 11 작업 4): 옛 저장(칸이 없던 때)은 모두 1단계, 타고난 값 0
    stats: sanitizeStats(s.stats),
    // 연애와 결혼 (계획 6): 옛 저장은 빈 연애
    romance: sanitizeRomance(s.romance),
    needs: { ...s.needs, heat: s.needs?.heat ?? 0 },
    collected,
    progress,
    activeBook,
    offers,
    post,
    myLines,
    todayHeard: s.todayHeard.filter((id) => known.has(id)),
    // 끝나지 않은 책의 서고 칸은 없앤다 (시험판 저장이 3장만 읽은 책을 꽂았을 수 있다)
    shelved: Object.fromEntries(
      Object.entries(isObj(s.shelved) ? s.shelved : {}).filter(
        ([b, g]) => (BOOKS as readonly string[]).includes(b) && (g === 0 || g === 1 || g === 2) && bookDone({ progress }, b as Book, content),
      ),
    ),
    // 텃밭은 집 앞(1~4, 8~9)에서 집 오른쪽 위(14~17, 3~5)로 옮겼다 — 옛 저장의 작물도 같은 자리 순서로 옮긴다
    garden: Object.fromEntries(
      Object.entries(s.garden ?? {}).map(([k, v]) => {
        const [x, y] = k.split(',').map(Number)
        return [x >= 1 && x <= 4 && (y === 8 || y === 9) ? `${x + 13},${y - 5}` : k, v]
      }),
    ),
    rereads: (s.rereads ?? []).filter((id) => known.has(id)),
    journal: s.journal.map((e) => ({ ...e, heard: (e.heard ?? []).filter((id) => known.has(id)) })),
  }
}

export function deserialize(raw: string | null, content: GameContent): GameState | null {
  if (!raw) return null
  try {
    // 주막이 약방으로 바뀌었다 (2026-09-30): 옛 저장의 이웃 id(마음·표식·장면·일지)를 함께 옮긴다
    const o = JSON.parse(raw.replace(/innkeeper/g, 'apothecary'))
    if (!isObj(o) || o.version !== SAVE_VERSION) return null
    const ok =
      typeof o.clock?.day === 'number' &&
      typeof o.clock?.minute === 'number' &&
      typeof o.player?.x === 'number' &&
      typeof o.player?.y === 'number' &&
      isStrArray(o.collected) &&
      isStrArray(o.todayHeard) &&
      Array.isArray(o.journal) &&
      isObj(o.offers) &&
      isObj(o.progress) &&
      isObj(o.inv) &&
      isObj(o.needs) &&
      isObj(o.hearts) &&
      isObj(o.flags) &&
      Array.isArray(o.scenes) &&
      Array.isArray(o.room)
    if (!ok) return null
    // 나중에 더한 칸이 빠진 저장도 받아 준다
    const fresh = newGame(content)
    return settle(sanitize({ ...fresh, ...o, version: SAVE_VERSION } as GameState, content), content)
  } catch {
    return null
  }
}

/** 초기화한 뒤 새로고침되는 사이에 창 닫힘 저장이 옛 기록을 되살리지 않게 막는다 */
let erased = false

export function saveGame(s: GameState, store: Storage | null | undefined = storage()): boolean {
  if (erased) return true
  try {
    if (!store) return false
    store.setItem(SAVE_KEY, serialize(s))
    return true
  } catch {
    return false
  }
}

export function loadGame(content: GameContent, store: Storage | null | undefined = storage()): GameState | null {
  try {
    return deserialize(store?.getItem(SAVE_KEY) ?? null, content)
  } catch {
    return null
  }
}

/** 기록 초기화: 저장된 날들과 일지 그림을 지운다 (소리·화면 크기 같은 설정은 남긴다) */
export function eraseSave(store: Storage | null | undefined = storage()): void {
  erased = true
  try {
    if (!store) return
    const keys: string[] = []
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i)
      if (k === SAVE_KEY || k?.startsWith('twenty-seven/album/')) keys.push(k)
    }
    for (const k of keys) store.removeItem(k)
  } catch {
    /* 저장소를 못 쓰는 환경 */
  }
}
