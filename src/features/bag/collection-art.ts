import type { BookDesign } from '../../engine/binding'
import { bookCoverArt, bookSpineArt } from '../library/BookArt'

/** 책등의 장식·무늬는 서고 책등으로, 기본 디자인은 표지와 책등을 함께 보여 준다. */
export function collectionBookArt(design: BookDesign) {
  const binding = design.choice ? { day: 0, special: design.choice } : undefined
  if (design.kind === 'deco' || design.kind === 'pattern') return bookSpineArt(design.book, binding)
  const cover = bookCoverArt(design.book, binding)
  if (design.kind !== 'book') return cover
  const spine = bookSpineArt(design.book)
  const offset = cover.rows.length - spine.rows.length
  return {
    rows: cover.rows.map((row, y) => row + '....' + (spine.rows[y - offset] ?? '.'.repeat(spine.rows[0].length))),
    palette: cover.palette,
  }
}
