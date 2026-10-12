// 모은 신약 조각 고르기: 책 → 장 → 조각 순서로 들어간다 (2026-10-12 점검 4: 조각 전부를 한 줄 목록으로 보여 너무 길었다)
import { useState } from 'react'
import { pieceById } from '../../content/catalog'
import { copyBookName } from '../../content/text'
import { BOOKS, type Book } from '../../engine/types'

export function PiecePicker({ ids, onPick, onCancel }: { ids: readonly string[]; onPick: (id: string) => void; onCancel?: () => void }) {
  const [book, setBook] = useState<Book | null>(null)
  const [chapter, setChapter] = useState<number | null>(null)
  const pieces = ids.filter((id) => !id.startsWith('ot:')).map(pieceById)
  const back = (
    <div className="actions">
      <button onClick={() => (chapter !== null ? setChapter(null) : book ? setBook(null) : onCancel?.())}>{book ? '뒤로' : '그만두기'}</button>
    </div>
  )
  if (!book) {
    const books = BOOKS.filter((b) => pieces.some((p) => p.book === b))
    return (
      <>
        <p className="hint">어느 책에서 고를까요?</p>
        <ul className="rows">
          {books.map((b) => (
            <li key={b}>
              <button className="row" onClick={() => setBook(b)}>
                <span className="row-main"><b>{copyBookName(b)}</b><small>{pieces.filter((p) => p.book === b).length}조각</small></span>
              </button>
            </li>
          ))}
        </ul>
        {onCancel && back}
      </>
    )
  }
  if (chapter === null) {
    const chapters = [...new Set(pieces.filter((p) => p.book === book).map((p) => p.chapter))].sort((a, b) => a - b)
    return (
      <>
        <p className="hint">{copyBookName(book)} · 몇 장에서 고를까요?</p>
        <ul className="rows">
          {chapters.map((c) => (
            <li key={c}>
              <button className="row" onClick={() => setChapter(c)}>
                <span className="row-main"><b>{c}장</b><small>{pieces.filter((p) => p.book === book && p.chapter === c).length}조각</small></span>
              </button>
            </li>
          ))}
        </ul>
        {back}
      </>
    )
  }
  return (
    <>
      <p className="hint">{copyBookName(book)} {chapter}장</p>
      <ul className="rows">
        {pieces.filter((p) => p.book === book && p.chapter === chapter).map((p) => (
          <li key={p.id}>
            <button className="row" onClick={() => onPick(p.id)}>
              <span className="row-main"><b>{p.title}</b><small>{p.ref}</small></span>
            </button>
          </li>
        ))}
      </ul>
      {back}
    </>
  )
}
