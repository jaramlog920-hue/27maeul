// 업적 (도감·업적 — 모든 게 끝난 뒤, 사용자 요청): 게임 속에서 이룬 일을 모아 본다.
// 조건은 게임 상태에서 바로 읽는다 (따로 세지 않는다). 처음 이룬 날만 GameState.achieved에 남긴다.
// 물건 도감: 한 번이라도 가져 본 물건 (GameState.found).
import { totalChapters, type OtProgress, type Progress } from './books'
import { OT_BOOK_TABLE, OT_ROOMS } from './ot-books'
import { isOtPieceId, OT_PIECE_COUNT } from './ot-pieces'
import { NO_NOTEBOOK, type Notebook } from './notebook'
import { stageOfPoints } from './people'
import { NO_ROMANCE, type Romance } from './romance'
import { STAT_IDS, type Stats } from './stats'
import { BOOKS, GOSPELS, type Book, type ItemId } from './types'

export interface AchieveState {
  progress: Progress
  shelved: Partial<Record<Book, number>>
  sealed: string[]
  careful: Record<string, number[]>
  hearts: Record<string, number>
  romance: Romance
  child: unknown
  lettersDone: number
  coins: number
  flags: Record<string, number>
  homeLevel: number
  album: { id: string }[]
  companion: unknown
  stats: Stats
  notebook: Notebook
  found: ItemId[]
  otProgress?: OtProgress
  otCollected?: string[]
}

export interface Achievement {
  id: string
  name: string
  desc: string
  done: (s: AchieveState) => boolean
}

const shelvedN = (s: AchieveState, books: readonly Book[]) => books.filter((b) => s.shelved[b] !== undefined).length
const flagCount = (s: AchieveState, prefix: string) => Object.keys(s.flags).filter((k) => k.startsWith(prefix) && s.flags[k]).length
const otChapters = (s: AchieveState, book: typeof OT_BOOK_TABLE[number]) => new Set((s.otProgress?.[book.id]?.completed ?? []).filter(c => Number.isInteger(c) && c >= 1 && c <= book.chapters)).size
const otChapterCount = (s: AchieveState) => OT_BOOK_TABLE.reduce((n, book) => n + otChapters(s, book), 0)
const otFinished = (s: AchieveState) => OT_BOOK_TABLE.filter(book => otChapters(s, book) === book.chapters)
const otRoomDone = (s: AchieveState, id: string) => {
  const room = OT_ROOMS.find(room => room.id === id)!
  const finished = new Set(otFinished(s).map(book => book.id))
  return room.books.every(book => finished.has(book))
}
const otPieceCount = (s: AchieveState) => new Set((s.otCollected ?? []).filter(isOtPieceId)).size

export const ACHIEVEMENTS: readonly Achievement[] = [
  { id: 'firstChapter', name: '첫 장', desc: '처음으로 한 장을 엮었다.', done: (s) => totalChapters(s) >= 1 },
  { id: 'hundredChapters', name: '백 장', desc: '엮은 장이 백 장이 되었다.', done: (s) => totalChapters(s) >= 100 },
  { id: 'firstShelf', name: '첫 책', desc: '서고에 첫 책을 꽂았다.', done: (s) => shelvedN(s, BOOKS) >= 1 },
  { id: 'gospelRoom', name: '복음서 방', desc: '네 복음서를 모두 서고에 꽂았다.', done: (s) => shelvedN(s, GOSPELS) === GOSPELS.length },
  { id: 'allBooks', name: '스물일곱 권', desc: '서고의 스물일곱 칸을 모두 채웠다.', done: (s) => shelvedN(s, BOOKS) === BOOKS.length },
  { id: 'goldSpine', name: '금박 책등', desc: '서고 퀴즈로 금박 책등을 받았다.', done: (s) => Object.values(s.shelved).some((g) => g === 2) },
  { id: 'sealed', name: '붉은 봉인', desc: '다 엮은 책을 봉인용 밀랍으로 봉인했다.', done: (s) => s.sealed.length >= 1 },
  { id: 'letters10', name: '편지 대필 열 통', desc: '이웃의 편지를 열 통 대신 써 주었다.', done: (s) => s.lettersDone >= 10 },
  { id: 'met10', name: '열 사람과 인사', desc: '이웃 열 명과 말을 나눴다.', done: (s) => s.notebook.met.length >= 10 },
  { id: 'friend', name: '친구', desc: '이웃 한 사람과 친구가 되었다.', done: (s) => Object.values(s.hearts).some((p) => stageOfPoints(p) >= 3) },
  { id: 'fiveFriends', name: '다섯 친구', desc: '이웃 다섯 사람과 친구가 되었다.', done: (s) => Object.values(s.hearts).filter((p) => stageOfPoints(p) >= 3).length >= 5 },
  { id: 'dating', name: '마음을 전한 날', desc: '들꽃 다발을 건네고 연인이 되었다.', done: (s) => !!s.romance.stage },
  { id: 'married', name: '마을 잔치', desc: '광장 모닥불 곁에서 결혼했다.', done: (s) => s.romance.stage === 'married' },
  { id: 'child', name: '새 식구', desc: '아이가 태어났다.', done: (s) => !!s.child },
  { id: 'companion', name: '작은 식구', desc: '동물 친구를 들였다.', done: (s) => !!s.companion },
  { id: 'coins500', name: '닢 오백', desc: '닢을 오백 모았다.', done: (s) => s.coins >= 500 },
  { id: 'board10', name: '게시판 단골', desc: '의뢰 게시판의 부탁을 열 번 들어주었다.', done: (s) => flagCount(s, 'board:') + copyRequestsDone(s) >= 10 },
  { id: 'trip', name: '먼 길', desc: '이웃 마을로 여행을 다녀왔다.', done: (s) => flagCount(s, 'trip:') >= 1 },
  { id: 'allTrips', name: '두 마을', desc: '항구 마을과 언덕 너머 마을을 모두 다녀왔다.', done: (s) => flagCount(s, 'trip:') >= 2 },
  { id: 'attic', name: '넓어진 우리 집', desc: '배우자방과 아이방을 지나 생활방까지 지었다.', done: (s) => s.homeLevel >= 3 },
  { id: 'album10', name: '풍경 앨범', desc: '앨범에 열 장면을 모았다.', done: (s) => s.album.length >= 10 },
  { id: 'master', name: '손에 익은 솜씨', desc: '능력치 하나가 가장 높은 단계에 올랐다.', done: (s) => STAT_IDS.some((id) => (s.stats[id]?.level ?? 1) >= 5) },
  { id: 'found40', name: '물건 모으기', desc: '도감에 물건 마흔 가지가 모였다.', done: (s) => s.found.length >= 40 },
  { id: 'otFirstChapter', name: '구약의 첫 장', desc: '구약에서 처음으로 한 장을 필사했다.', done: s => otChapterCount(s) >= 1 },
  { id: 'otHundredChapters', name: '구약 백 장', desc: '구약을 백 장 필사했다.', done: s => otChapterCount(s) >= 100 },
  { id: 'otFirstBook', name: '구약의 첫 책', desc: '구약 한 권을 끝까지 필사했다.', done: s => otFinished(s).length >= 1 },
  { id: 'otTorah', name: '모세오경', desc: '창세기부터 신명기까지 다섯 권을 모두 필사했다.', done: s => otRoomDone(s, 'law') },
  { id: 'otWisdom', name: '시와 지혜', desc: '욥기·시편·잠언·전도서·아가를 모두 필사했다.', done: s => otRoomDone(s, 'poetry') },
  { id: 'otMinorProphets', name: '열두 예언서', desc: '호세아부터 말라기까지 열두 권을 모두 필사했다.', done: s => OT_BOOK_TABLE.slice(-12).every(book => otChapters(s, book) === book.chapters) },
  { id: 'otAllBooks', name: '서른아홉 권', desc: '구약 서른아홉 권, 929장을 모두 필사했다.', done: s => otFinished(s).length === OT_BOOK_TABLE.length },
  { id: 'otFirstPiece', name: '구약 조각의 시작', desc: '처음으로 구약 말씀 조각을 모았다.', done: s => otPieceCount(s) >= 1 },
  { id: 'otHundredPieces', name: '구약 조각 백 개', desc: '구약 말씀 조각을 백 개 모았다.', done: s => otPieceCount(s) >= 100 },
  { id: 'otAllPieces', name: '구약 조각 완성', desc: '구약 말씀 조각 929개를 모두 모았다.', done: s => otPieceCount(s) === OT_PIECE_COUNT },
]

/** 새로 이룬 업적 (이미 남긴 것은 빼고) */
export function newlyAchieved(s: AchieveState, achieved: readonly { id: string }[]): Achievement[] {
  return ACHIEVEMENTS.filter((a) => !achieved.some((x) => x.id === a.id) && a.done(s))
}

/** 가진 물건을 물건 도감에 더한다 (궤짝 포함) */
export function withFound(found: readonly ItemId[], ...invs: Partial<Record<ItemId, number>>[]): ItemId[] {
  let out: ItemId[] | null = null
  for (const inv of invs)
    for (const [id, n] of Object.entries(inv) as [ItemId, number][])
      if (n > 0 && !(out ?? found).includes(id)) (out ??= [...found]).push(id)
  return out ?? (found as ItemId[])
}

/** 가방 밖에 놓거나 보관한 것과 이미 받은 선물도 획득한 물건이다. */
export function foundItems(s: {
  found: ItemId[]; inv: Partial<Record<ItemId, number>>; chest?: Partial<Record<ItemId, number>>; pantry?: Partial<Record<ItemId, number>>
  room: readonly { item: ItemId }[]; rooms?: Record<string, readonly { item: ItemId }[]>; giftsGot?: ItemId[]
  cooking?: { made: Record<string, number> }
}): ItemId[] {
  const placed = [...s.room, ...Object.values(s.rooms ?? {}).flat()]
  const owned = Object.fromEntries([...placed.map(f => f.item), ...(s.giftsGot ?? [])].map(id => [id, 1]))
  return withFound(s.found ?? [], s.inv, s.chest ?? {}, s.pantry ?? {}, owned, s.cooking?.made ?? {})
}

export const NO_ACHIEVE_EXTRA = { notebook: NO_NOTEBOOK, romance: NO_ROMANCE }

/** 지금 게시판의 주민 부탁 필사를 끝낸 수 (req:<날>:<번> · req:gen:… — 이웃 부탁 req:<이웃>:<번>과 구분, 2026-10-08 버그 29-A) */
function copyRequestsDone(s: { flags: Record<string, number> }): number {
  return Object.keys(s.flags).filter((k) => /^req:(\d+:\d+|gen:)/.test(k) && s.flags[k]).length
}
