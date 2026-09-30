// 이웃 수첩 (일지 탭): 만난 이웃, 알게 된 좋아하는 것·싫어하는 것, 마주친 때와 자리, 들은 이야기, 생일.
// 좋아하는 것·싫어하는 것은 선물로 알게 되거나, 사이가 깊어지면 이웃이 먼저 털어놓는다(수첩의 ? 칸이 열린다).
import { SEASON_DAYS, seasonOf } from './clock'
import { stageOfPoints, type Activity } from './people'
import type { ItemId, NeighborDef, Season, Tile } from './types'
import { HALL_RECT, isHome, PAVILION_RECT, roomAt, TEA_RECT, zoneAt } from './world'

/** 하루를 넷으로 나눈 때 (수첩의 "하루 일과" 칸) */
export type Slot = 'morning' | 'noon' | 'evening' | 'night'
export const SLOTS: readonly Slot[] = ['morning', 'noon', 'evening', 'night']
export const SLOT_LABEL: Record<Slot, string> = { morning: '아침', noon: '낮', evening: '저녁', night: '밤' }

export function slotOf(minute: number): Slot {
  if (minute >= 6 * 60 && minute < 11 * 60) return 'morning'
  if (minute >= 11 * 60 && minute < 16 * 60) return 'noon'
  if (minute >= 16 * 60 && minute < 20 * 60) return 'evening'
  return 'night'
}

export interface Notebook {
  /** 말을 나눈 적이 있는 이웃 */
  met: string[]
  /** 선물로 알게 된 좋아하는 것·싫어하는 것 */
  likes: Record<string, ItemId[]>
  dislikes: Record<string, ItemId[]>
  /** 마주친 때(넷 중 하나)와 그때의 자리·하던 일 */
  seen: Record<string, Partial<Record<Slot, string>>>
  /** 이 이웃에게서 들은 이야기 조각 */
  heard: Record<string, string[]>
}

export const NO_NOTEBOOK: Notebook = { met: [], likes: {}, dislikes: {}, seen: {}, heard: {} }

export function sanitizeNotebook(raw: unknown): Notebook {
  if (!raw || typeof raw !== 'object') return NO_NOTEBOOK
  const o = raw as Partial<Notebook>
  const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])
  const lists = (v: unknown) =>
    v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, strs(x)])) : {}
  const seen = o.seen && typeof o.seen === 'object' && !Array.isArray(o.seen) ? o.seen : {}
  return {
    met: strs(o.met),
    likes: lists(o.likes) as Record<string, ItemId[]>,
    dislikes: lists(o.dislikes) as Record<string, ItemId[]>,
    seen: seen as Notebook['seen'],
    heard: lists(o.heard),
  }
}

const addTo = <T>(list: readonly T[] | undefined, x: T): T[] => (list?.includes(x) ? [...list] : [...(list ?? []), x])

export function noteMet(n: Notebook, id: string): Notebook {
  return n.met.includes(id) ? n : { ...n, met: [...n.met, id] }
}

export function noteSeen(n: Notebook, id: string, minute: number, where: string): Notebook {
  const slot = slotOf(minute)
  if (n.seen[id]?.[slot] === where) return n
  return { ...n, seen: { ...n.seen, [id]: { ...n.seen[id], [slot]: where } } }
}

export function noteHeard(n: Notebook, id: string, pieceIds: readonly string[]): Notebook {
  if (!pieceIds.length) return n
  let heard = n.heard[id] ?? []
  for (const p of pieceIds) heard = addTo(heard, p)
  return { ...n, heard: { ...n.heard, [id]: heard } }
}

export function noteGift(n: Notebook, id: string, item: ItemId, liked: boolean, disliked: boolean): Notebook {
  if (liked) return { ...n, likes: { ...n.likes, [id]: addTo(n.likes[id], item) } }
  if (disliked) return { ...n, dislikes: { ...n.dislikes, [id]: addTo(n.dislikes[id], item) } }
  return n
}

// ── 좋아하는 것·싫어하는 것: 수첩에 보이는 것 ──

/**
 * 사이가 깊어지면 이웃이 먼저 털어놓는다: 편한 사이(2) — 좋아하는 것 하나, 친구(3) — 싫어하는 것 하나,
 * 특별한 사람(4) — 모두. 선물로 알게 된 것은 그대로 보인다
 */
export function knownTastes(
  n: Notebook,
  def: Pick<NeighborDef, 'id' | 'likes'>,
  dislikes: readonly ItemId[],
  points: number,
): { likes: (ItemId | null)[]; dislikes: (ItemId | null)[] } {
  const stage = stageOfPoints(points)
  const show = (all: readonly ItemId[], found: readonly ItemId[] = [], free: number) =>
    all.map((it, i) => (found.includes(it) || i < free ? it : null))
  return {
    likes: show(def.likes, n.likes[def.id], stage >= 4 ? 99 : stage >= 2 ? 1 : 0),
    dislikes: show(dislikes, n.dislikes[def.id], stage >= 4 ? 99 : stage >= 3 ? 1 : 0),
  }
}

// ── 생일 ──

/** 이웃의 생일 (계절, 계절 안의 날 1~7). 잔치 날(여름 5·가을 6·겨울 4)은 피했다 */
export const BIRTHDAYS: Readonly<Record<string, readonly [Season, number]>> = {
  wendell: ['spring', 3],
  baker: ['spring', 10],
  basil: ['spring', 17],
  shepherd: ['spring', 24],
  weaver: ['spring', 31],
  juniper: ['spring', 38],
  tilly: ['summer', 3],
  child: ['summer', 10],
  cosmo: ['summer', 17],
  beekeeper: ['summer', 24],
  fisher: ['summer', 31],
  poppy: ['summer', 38],
  presser: ['autumn', 3],
  rudy: ['autumn', 10],
  grandpa: ['autumn', 17],
  postman: ['autumn', 24],
  marigold: ['autumn', 31],
  carpenter: ['autumn', 38],
  penelope: ['winter', 3],
  smith: ['winter', 10],
  apothecary: ['winter', 17],
  dexter: ['winter', 24],
  merchant: ['winter', 31],
}

const SEASON_ORDER: readonly Season[] = ['spring', 'summer', 'autumn', 'winter']
export const SEASON_LABEL: Record<Season, string> = { spring: '봄', summer: '여름', autumn: '가을', winter: '겨울' }

export function isBirthday(id: string, day: number): boolean {
  const b = BIRTHDAYS[id]
  return !!b && seasonOf(day) === b[0] && ((day - 1) % SEASON_DAYS) + 1 === b[1]
}

/** 오늘 이후(오늘 포함) 가장 가까운 생일 날 */
export function nextBirthday(id: string, day: number): number | null {
  const b = BIRTHDAYS[id]
  if (!b) return null
  const year = SEASON_DAYS * 4
  const inYear = SEASON_ORDER.indexOf(b[0]) * SEASON_DAYS + b[1]
  const start = day - ((day - 1) % year)
  const d = start + inYear - 1
  return d >= day ? d : d + year
}

export function birthdayLabel(id: string): string | null {
  const b = BIRTHDAYS[id]
  return b ? `${SEASON_LABEL[b[0]]} ${b[1]}일` : null
}

/** 생일에 건넨 선물은 마음이 두 배로 오른다 */
export const BIRTHDAY_MUL = 2

// ── 자리 이름 ──

const ROOM_NAME: Record<string, string> = {
  baker: '빵집',
  child: '배움터',
  grandpa: '포도원 할아버지 집',
  weaver: '베 짜는 집',
  beekeeper: '벌 치는 집',
  library: '서고',
  hall: '사랑방',
  teahouse: '찻집',
}
const ZONE_NAME: Record<string, string> = { vineyard: '포도원', dock: '나루', hives: '벌통 언덕' }
const inRect = (t: Tile, r: { x0: number; y0: number; x1: number; y1: number }) => t.x >= r.x0 && t.x <= r.x1 && t.y >= r.y0 && t.y <= r.y1

export const DOING_LABEL: Record<Activity, string> = {
  hammer: '망치질',
  net: '그물 손질',
  tea: '차 한 잔',
  book: '책 읽기',
  bread: '빵 굽기',
  sheep: '양 돌보기',
  herb: '약초 캐기',
  weave: '베 짜기',
  bee: '벌 돌보기',
  grape: '포도 가꾸기',
  music: '노래',
  rest: '쉬는 중',
  wait: '누군가를 기다림',
  wood: '나무 손질',
  cat: '고양이와 놀기',
}

export function spotName(t: Tile): string {
  const r = roomAt(t)
  if (r && ROOM_NAME[r.owner]) return ROOM_NAME[r.owner]
  if (isHome(t)) return '내 집'
  const z = zoneAt(t)
  if (z && ZONE_NAME[z.id]) return ZONE_NAME[z.id]
  if (inRect(t, PAVILION_RECT)) return '호숫가 정자'
  if (inRect(t, HALL_RECT)) return '사랑방 앞'
  if (inRect(t, TEA_RECT)) return '찻집 앞'
  return '마을 길'
}

export function seenLabel(t: Tile, doing?: Activity): string {
  const at = spotName(t)
  return doing ? `${at} · ${DOING_LABEL[doing]}` : at
}
