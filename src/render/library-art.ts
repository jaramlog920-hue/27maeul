import { spineLook, type Binding } from '../engine/binding'
import type { Book } from '../engine/types'
import type { Grade } from '../engine/library'

export const LIBRARY_ACTIONS = ['bind', 'shelve', 'wax', 'paint', 'wrap', 'stamp'] as const
export type LibraryAction = typeof LIBRARY_ACTIONS[number]
export const LIBRARY_LABELS: Record<LibraryAction, string> = {
  bind: '종이 모아 제본하기', shelve: '책 꽂기', wax: '봉랍 찍기', paint: '표지 색칠하기', wrap: '책등 띠 감기', stamp: '책등 무늬 찍기',
}
export function libraryPalette(book: Book, binding?: Binding, grade?: Grade) {
  const look = spineLook(book, binding)
  return { k: '#594234', c: look.color, d: look.accent, h: '#f9efd6', p: '#e7d9bb', w: '#997451', W: '#735338', s: '#f8d8a8', S: '#aa8062', r: '#c55b43', R: '#883d32', g: grade === 2 ? '#e8c869' : '#d0d6e1' }
}
function board(w: number, h: number) {
  const pixels = Array.from({ length: h }, () => Array<string>(w).fill('.'))
  const rect = (x: number, y: number, width: number, height: number, c: string) => {
    for (let yy = y; yy < y + height; yy++) for (let xx = x; xx < x + width; xx++)
      if (pixels[yy]?.[xx] !== undefined) pixels[yy][xx] = c
  }
  return { rect, rows: () => pixels.map(row => row.join('')) }
}
/** 표지와 책등을 정수 좌표로 그린다. 기존에 고른 색·무늬를 같은 팔레트로 쓴다. */
export function libraryBookRows(book: Book, binding?: Binding, grade?: Grade, sealed = false, cover = false): string[] {
  const b = board(cover ? 24 : 8, cover ? 32 : 20), r = b.rect
  if (cover) {
    r(2, 1, 20, 30, 'k'); r(4, 2, 17, 27, 'c'); r(5, 29, 17, 2, 'p')
    r(2, 2, 3, 28, 'd'); r(5, 3, 1, 25, 'h')
    const pattern = binding?.special?.pattern
    for (let y = 5; y < 27; y += 6) for (let x = 8; x < 20; x += 6) {
      if (pattern === 'lines') r(7, y, 13, 1, 'd')
      if (pattern === 'dots') r(x, y, 2, 2, 'd')
      if (pattern === 'diamonds') { r(x + 1, y, 1, 3, 'd'); r(x, y + 1, 3, 1, 'd') }
    }
  } else {
    r(0, 0, 8, 20, 'k'); r(1, 1, 6, 18, 'c'); r(1, 2, 1, 16, 'h')
    const mark = spineLook(book, binding).mark
    if (mark === 'band') { r(1, 5, 6, 2, 'd'); r(1, 13, 6, 2, 'd') }
    if (mark === 'stripe') r(3, 3, 2, 14, 'd')
    if (mark === 'dot') r(3, 8, 3, 3, 'd')
    if (mark === 'diamond') { r(4, 7, 1, 5, 'd'); r(3, 8, 3, 3, 'd'); r(2, 9, 5, 1, 'd') }
    if (grade && grade > 0) { r(1, 1, 6, 2, 'g'); r(1, 17, 6, 2, 'g'); r(2, 1, 2, 1, 'h') }
    if (sealed) { r(3, 14, 3, 3, 'R'); r(3, 14, 2, 2, 'r'); r(4, 14, 1, 1, 'h') }
  }
  return b.rows()
}

/** 32×32 작업대. 손과 도구를 네 박자로 움직이고 마지막은 완성 상태로 남긴다. */
export function libraryWorkRows(book: Book, action: LibraryAction, frame: number, binding?: Binding, grade?: Grade): string[] {
  const f = Math.max(0, Math.min(3, Math.trunc(frame))), b = board(32, 32), r = b.rect
  r(1, 25, 30, 3, 'W'); r(2, 24, 28, 2, 'w'); r(4, 28, 2, 4, 'W'); r(26, 28, 2, 4, 'W')
  const paste = (rows: string[], ox: number, oy: number) => rows.forEach((row, y) => [...row].forEach((c, x) => { if (c !== '.') r(ox + x, oy + y, 1, 1, c) }))
  const hand = (x: number, y: number) => { r(x, y, 3, 2, 's'); r(x, y + 2, 3, 1, 'S'); r(x, y + 3, 3, 3, 'p') }
  if (action === 'shelve') {
    r(4, 2, 24, 2, 'W'); r(4, 22, 24, 2, 'W'); r(4, 4, 2, 18, 'w'); r(26, 4, 2, 18, 'w')
    r(7, 7, 5, 15, 'd'); r(13, 5, 4, 17, 'c')
    paste(libraryBookRows(book, binding, grade), 18, f < 2 ? 9 - f * 4 : 3)
    if (f < 3) hand(21, 20 - f * 3)
    return b.rows()
  }
  if (action === 'bind' && f < 3) {
    r(8, 21 - f, 16, 3 + f, 'k'); r(9, 21 - f, 14, 2 + f, 'p'); r(10, 21 - f, 12, 1, 'h')
    r(8, 19, f === 2 ? 16 : 3, 2, 'c'); r(10 + f * 3, 17, 1, 7, 'd'); r(11 + f * 3, 16, 3, 1, 'k')
    hand(6, 18); hand(20 - f * 2, 15)
    r(27, 18, 3, 5, 'd'); r(26, 17, 5, 1, 'w')
  } else {
    const sample = action === 'paint' && f < 3 ? undefined : action === 'stamp' && f < 2 ? { day: 0, special: { ...binding?.special, color: binding?.special?.color ?? 'cream', deco: binding?.special?.deco ?? 'leather', pattern: 'plain' as const } } : binding
    paste(libraryBookRows(book, sample, grade, action === 'wax' && f >= 2), 12, 3)
    if (action === 'paint' && f < 3) { r(13, 4, 5, 5 + f * 5, 'c'); r(7, 17, 3, 6, 'd'); r(6, 16, 5, 2, 'k'); r(16, 9 + f * 4, 2, 6, 'w'); r(15, 8 + f * 4, 4, 2, 'c'); hand(18, 12 + f * 3) }
    if (action === 'wrap' && f < 3) { r(8 + f * 2, 15, 12 - f * 2, 2, 'd'); hand(6 + f * 2, 17); hand(22 - f, 17) }
    if ((action === 'wax' || action === 'stamp') && f < 3) {
      const y = f === 1 ? 13 : 8
      r(15, y, 3, 5, 'w'); r(14, y + 5, 5, 2, action === 'wax' ? 'R' : 'd'); hand(18, y + 1)
      if (action === 'wax') { r(7, 19, 3, 5, 'r'); r(7, 18, 3, 1, 'h') }
    }
  }
  return b.rows()
}
