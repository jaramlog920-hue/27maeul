// 서고의 방 표 (계획 7 작업 1, 설계 §7-2). 방 이름은 책 범위로 — 분류 이름("바울 서신" 등)을 쓰지 않는다.
// 책 고르기·서고 문·선반·방 열림 판정이 모두 이 표를 읽는다. 계획 8·9가 hebJud·rev 줄에 책을 넣었다.
// 노드 스크립트(build-bible-subset·verify-pieces)도 이 파일을 그대로 읽는다 — 그래서 값(런타임) import가 없다(타입만).
import type { Book } from './types'

export type ShelfRoomId = 'gospels' | 'acts' | 'romPhm' | 'hebJud' | 'rev'
export interface ShelfRoom {
  id: ShelfRoomId
  /** 오늘 성경 순서 */
  books: readonly Book[]
  /** 조각 엮기 / 장째로 옮겨 적기 (편지·요한계시록) */
  mode: 'pieces' | 'letters'
  /** 서고 잠긴 문 번호 (world.LOCKED_DOORS, life-text library.lockedRooms와 같은 순서). 복음서 방은 null */
  door: number | null
  /** 서고 퀴즈에 첫머리 문제를 내지 않는다 — letters.json에 줄이 없고 verify-letters도 이 방 책을 빼고 본다 (요한계시록) */
  noOpening?: true
}

/** 오늘 성경 순서 = 서고 문 순서 */
export const SHELF_ROOMS: readonly ShelfRoom[] = [
  { id: 'gospels', books: ['mt', 'mk', 'lk', 'jn'], mode: 'pieces', door: null },
  { id: 'acts', books: ['ac'], mode: 'pieces', door: 0 },
  {
    id: 'romPhm',
    books: ['rom', '1co', '2co', 'gal', 'eph', 'php', 'col', '1th', '2th', '1ti', '2ti', 'tit', 'phm'],
    mode: 'letters',
    door: 1,
  },
  { id: 'hebJud', books: ['heb', 'jas', '1pe', '2pe', '1jn', '2jn', '3jn', 'jud'], mode: 'letters', door: 2 },
  // 요한계시록 (계획 9): 방 id와 책 id가 같은 'rev'지만 쓰이는 표가 다르다 (ShelfRoomId / Book)
  { id: 'rev', books: ['rev'], mode: 'letters', door: 3, noOpening: true },
]

export function shelfRoom(id: ShelfRoomId): ShelfRoom {
  return SHELF_ROOMS.find((r) => r.id === id)!
}

/** 그 책이 꽂히는 방 */
export function roomOf(book: Book): ShelfRoom {
  const r = SHELF_ROOMS.find((x) => x.books.includes(book))
  if (!r) throw new Error(`no shelf room for ${book}`)
  return r
}

/** 그 책을 엮는 방식 */
export function modeOf(book: Book): ShelfRoom['mode'] {
  return roomOf(book).mode
}

/** 책 id → 본문(nt-krv.json·books.json)의 책 id. 편지는 books.json id를 그대로 책 id로 쓴다 */
const BIBLE_ID: Partial<Record<Book, string>> = { mt: 'mat', mk: 'mrk', lk: 'luk', jn: 'jhn', ac: 'act' }
export function bibleIdOf(book: Book): string {
  return BIBLE_ID[book] ?? book
}

/** 앱에 싣는 본문의 책 (bible-subset.json) — 방 표에 있는 책 전부 */
export const SUBSET_BOOKS: readonly string[] = SHELF_ROOMS.flatMap((r) => r.books).map(bibleIdOf)
