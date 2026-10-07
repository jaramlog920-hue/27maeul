// 서고·방 선반의 책 한 줄 (계획 14 작업 4): 다 필사한 책은 [제본하기], 가방의 완성본은 [바로 꽂기] [퀴즈 풀고 금박 책등],
// 꽂은 책은 책등과 등급, [다시 도전](금박 아닌 책) [표지 꾸미기]. 퀴즈를 풀지 않아도 불이익은 없다
import { CONTENT } from '../../content/catalog'
import { T } from '../../content/text'
import { bookDone } from '../../engine/books'
import { has } from '../../engine/items'
import { RETRY_COST } from '../../engine/library'
import type { Book } from '../../engine/types'
import { useGame, type BindBack } from '../../store/game-store'
import { Spine } from './BookArt'
import { SpineMarks } from './SpineMarks'
import { useState } from 'react'
import { LibraryWork } from './LibraryWork'

const BOOK_NAME = T.quiz.books as Record<string, string>
const GRADES = T.library.grades as string[]

export function ShelfRow({ book, back, notYet }: { book: Book; back: BindBack; notYet: string }) {
  const [justShelved, setJustShelved] = useState(false)
  const g = useGame((s) => s.game.shelved[book])
  const binding = useGame((s) => s.game.bound[book])
  const progress = useGame((s) => s.game.progress)
  const inv = useGame((s) => s.game.inv)
  const { startShelve, shelveNow, startRetry, openBind, openBook } = useGame.getState()
  const done = bookDone({ progress }, book, CONTENT)
  const status = g !== undefined ? GRADES[g] : !done ? notYet : binding === undefined ? T.library.notBound : T.library.bound
  return (
    <li className={`spine grade-${g ?? 'none'}`}>
      {g !== undefined && <Spine book={book} binding={binding} grade={g} />}
      <span className="spine-name">{BOOK_NAME[book]}</span>
      <span className="spine-grade">{status}</span>
      <SpineMarks book={book} />
      {g === undefined && done && binding === undefined && (
        <button className="primary" onClick={() => openBind(book, back)}>
          {T.library.bind}
        </button>
      )}
      {g === undefined && binding !== undefined && (
        <>
          <button className="primary" onClick={() => { shelveNow(book); setJustShelved(useGame.getState().game.shelved[book] !== undefined) }}>
            {T.library.shelveNow}
          </button>
          <button onClick={() => startShelve(book)}>{T.library.shelveGold}</button>
        </>
      )}
      {justShelved && g !== undefined && <LibraryWork book={book} action="shelve" binding={binding} grade={g} />}
      {g !== undefined && g < 2 && (
        <button disabled={!has(inv, RETRY_COST)} onClick={() => startRetry(book)}>
          {T.library.retry}
        </button>
      )}
      {g !== undefined && <button onClick={() => openBind(book, back)}>{T.library.decorate}</button>}
      {/* 다 쓴 책(제본했거나 꽂은 책)은 펼쳐 볼 수 있다 (계획 14 작업 8) */}
      {(g !== undefined || binding !== undefined) && (
        <button onClick={() => openBook(book, back === 'bag' ? undefined : back)} aria-label={`${BOOK_NAME[book]} · ${T.bookView.open}`}>
          {T.bookView.open}
        </button>
      )}
    </li>
  )
}
