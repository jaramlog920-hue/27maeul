// 꾸민 성경 다시 펼치기 (assets/book-reopen, 2026-10-22 연결): 완성본을 열면 책장에서 꺼내 표지를 보고 펼치는 짧은 움직임을 한 번,
// 마지막엔 펼친 책에 멈춘다. 누르면 처음부터 다시. 움직임 줄이기를 켠 기기는 펼친 모습부터
import { useEffect, useState } from 'react'
import type { Binding } from '../../engine/binding'
import type { Grade } from '../../engine/library'
import type { Book } from '../../engine/types'
import { BOOK_REOPEN_DURATIONS, BOOK_REOPEN_STAGES, bookReopenRows } from '../../render/book-reopen-art'
import { libraryPalette } from '../../render/library-art'
import { prefersStill } from '../desk/copy-feel'
import { PixelArt } from './LibraryWork'

const LAST = BOOK_REOPEN_STAGES.length - 1

export function BookReopen({ book, binding, grade, sealed, label }: { book: Book; binding?: Binding; grade?: Grade; sealed: boolean; label: string }) {
  const [frame, setFrame] = useState(() => (prefersStill() ? LAST : 0))
  useEffect(() => {
    if (frame >= LAST) return
    const t = setTimeout(() => setFrame((f) => f + 1), BOOK_REOPEN_DURATIONS[frame])
    return () => clearTimeout(t)
  }, [frame])
  return (
    <button type="button" className="book-reopen" aria-label={label} onClick={() => setFrame(prefersStill() ? LAST : 0)}>
      <PixelArt rows={bookReopenRows(book, frame, binding, grade, sealed)} palette={libraryPalette(book, binding, grade)} />
    </button>
  )
}
