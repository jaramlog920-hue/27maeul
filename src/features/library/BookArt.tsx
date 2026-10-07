// 책 그림 (계획 14 작업 4): 서고 책등(책마다 다른 무늬, 특별 제본이면 고른 모습), 서고 선반 전경(빈 칸이 또렷이), 완성본 표지.
// 그림 규칙: 차분한 파스텔, 2픽셀 이상 선, 좌우 대칭 (parts.css의 .spine-art·.shelf-picture·.book-cover)
import type { CSSProperties } from 'react'
import { fill, T } from '../../content/text'
import { COVER_HEX, DECO_HEX, spineLook, type Binding, type Bindings, type SpecialChoice } from '../../engine/binding'
import type { Grade } from '../../engine/library'
import { SHELF_ROOMS } from '../../engine/shelf-rooms'
import { BOOKS, type Book } from '../../engine/types'
import { libraryBookRows, libraryPalette } from '../../render/library-art'
import { PixelArt } from './LibraryWork'
import { bookDetailPalette, decoratedBookRows } from '../../render/life-additions-prop-art'

/**
 * 덧장식 (2026-10-08, 다른 창 책 장식 도트 연결): 장식 그림(decoratedBookRows)이 기본 책 그림에서 바꾼 점만 이 책 그림 위에 얹는다.
 * 장식 색(M·T·E 등)은 bookDetailPalette에서 더한다
 */
function withDetail(rows: string[], palette: Record<string, string>, binding: Binding | undefined, cover: boolean): { rows: string[]; palette: Record<string, string> } {
  const sp = binding?.special
  if (!sp?.detail || sp.detail === 'none') return { rows, palette }
  const plain = libraryBookRows('mt', { day: 0, special: { color: sp.color, pattern: 'plain', deco: 'leather' } }, undefined, false, cover)
  const deco = decoratedBookRows(sp.detail, sp.color, cover)
  const out = rows.map((r, y) => [...r].map((c, x) => (deco[y]?.[x] !== plain[y]?.[x] ? deco[y][x] : c)).join(''))
  const dp = bookDetailPalette(sp.color) as Record<string, string>
  const extra = Object.fromEntries(['M', 'm', 'T', 't', 'E', 'e'].filter((k) => dp[k]).map((k) => [k, dp[k]]))
  return { rows: out, palette: { ...palette, ...extra } }
}

const BOOK_NAME = T.quiz.books as Record<string, string>

/** 책등 하나 */
export function Spine({ book, binding, grade }: { book: Book; binding?: Binding; grade?: Grade }) {
  const look = spineLook(book, binding)
  const style = { '--spine': look.color, '--accent': look.accent } as CSSProperties
  return <span className={`spine-art pixel-spine mark-${look.mark} spine-grade-${grade ?? 'none'}`} style={style} role="img" aria-label={BOOK_NAME[book]} data-book={book}><PixelArt {...withDetail(libraryBookRows(book, binding, grade), libraryPalette(book, binding, grade), binding, false)} /></span>
}

/** 서고 선반 전경: 방마다 한 줄, 꽂은 책은 책등, 아직 꽂지 않은 자리는 빈 칸 (처음엔 휑하고 권이 늘수록 찬다) */
export function ShelfPicture({ shelved, bound, caption }: { shelved: Partial<Record<Book, Grade>>; bound: Bindings; caption?: string }) {
  const n = BOOKS.filter((b) => shelved[b] !== undefined).length
  const label = caption ?? fill(T.library.picture, { n })
  return (
    <figure className="shelf-picture" aria-label={label}>
      {SHELF_ROOMS.map((room) => (
        <div key={room.id} className="shelf-picture-row">
          {room.books.map((b) =>
            shelved[b] !== undefined ? (
              <Spine key={b} book={b} binding={bound[b]} grade={shelved[b]} />
            ) : (
              <span key={b} className="spine-slot" role="img" aria-label={fill(T.library.emptySlot, { book: BOOK_NAME[b] })} />
            ),
          )}
        </div>
      ))}
      <figcaption>{label}</figcaption>
    </figure>
  )
}

/** 완성본 표지: 그대로 제본은 그 책의 책등 색, 특별 제본은 고른 표지 색·무늬·책등 장식 */
export function BookCover({ book, binding, choice }: { book: Book; binding?: Binding; choice?: SpecialChoice }) {
  const sp = choice ?? binding?.special
  const look = spineLook(book, binding)
  const style = {
    '--cover': sp ? COVER_HEX[sp.color] : look.color,
    '--deco': sp ? DECO_HEX[sp.deco] : look.accent,
  } as CSSProperties
  return (
    <div className={`book-cover pixel-cover pattern-${sp ? sp.pattern : 'plain'}`} style={style} role="img" aria-label={fill(T.binding.cover, { book: BOOK_NAME[book] })}>
      <PixelArt {...withDetail(libraryBookRows(book, choice ? { day: 0, special: choice } : binding, undefined, false, true), libraryPalette(book, choice ? { day: 0, special: choice } : binding), choice ? { day: 0, special: choice } : binding, true)} />
      <span className="book-cover-plate">{BOOK_NAME[book]}</span>
    </div>
  )
}
