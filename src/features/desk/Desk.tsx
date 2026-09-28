// 책상: 고른 책의 받은 이야기를 차례대로 잇는다
import { useState } from 'react'
import { BOOKS_WITH_CONTENT, CONTENT, pieceById, piecesOf } from '../../content/catalog'
import { Passage } from '../passage/Passage'
import { fill, T } from '../../content/text'
import { chaptersOf } from '../../engine/books'
import type { SubmitResult } from '../../engine/game'
import { currentChapter } from '../../engine/offers'
import { BOOKS } from '../../engine/types'
import { useGame } from '../../store/game-store'

const BOOK_NAME = T.quiz.gospels as Record<string, string>

function BookPick({ onDone }: { onDone?: () => void }) {
  const progress = useGame((s) => s.game.progress)
  const active = useGame((s) => s.game.activeBook)
  const { pickBook, closeModal } = useGame.getState()
  return (
    <div className="dialog desk" role="dialog" aria-label={T.ui.bookPickTitle}>
      <h2>{T.ui.bookPickTitle}</h2>
      <p className="hint">{T.ui.bookPickHint}</p>
      <div className="actions menu column">
        {BOOKS.map((b) => {
          const ready = BOOKS_WITH_CONTENT.includes(b)
          const all = chaptersOf(b, CONTENT).length
          return (
            <button key={b} className={b === active ? 'primary' : ''} disabled={!ready} onClick={() => { pickBook(b); onDone?.() }}>
              {BOOK_NAME[b]} · {ready ? fill(T.ui.bookProgress, { done: progress[b].completed.length, all }) : T.ui.bookNotYet}
            </button>
          )
        })}
      </div>
      <div className="actions">
        <button onClick={onDone ?? closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}

export function Desk({ result, dark }: { result: SubmitResult | null; dark: boolean }) {
  const [reading, setReading] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)
  const book = useGame((s) => s.game.activeBook)
  const progress = useGame((s) => s.game.progress)
  const inv = useGame((s) => s.game.inv)
  const { moveInDesk, submitDesk, closeModal } = useGame.getState()
  if (!book || picking) return <BookPick onDone={book ? () => setPicking(false) : undefined} />

  const pieces = piecesOf(book)
  const bp = progress[book]
  const chapter = currentChapter(pieces, bp.completed)
  const list = chapter === null ? [] : (bp.arrangement[chapter] ?? [])
  const all = chapter === null ? 0 : pieces.filter((p) => p.chapter === chapter).length

  let message: string | null = null
  if (result?.kind === 'missing') message = fill(T.ui.deskMissing, { n: result.missing })
  else if (result?.kind === 'wrong') message = T.ui.deskWrong
  else if (result?.kind === 'supplies') message = T.ui.deskSupplies
  else if (result?.kind === 'tired') message = T.ui.deskTired
  else if (result?.kind === 'done') message = fill(T.ui.chapterDone, { chapter: bp.completed.at(-1) ?? '' })

  if (reading) {
    const piece = pieceById(reading)
    return (
      <div className="dialog scroll-dialog" role="dialog" aria-label={piece.title}>
        <h2>{piece.title}</h2>
        <Passage refText={piece.ref} />
        <div className="actions"><button autoFocus onClick={() => setReading(null)}>이어붙이기로 돌아가기</button></div>
      </div>
    )
  }

  return (
    <div className="dialog desk" role="dialog" aria-label={T.ui.deskTitle}>
      <h2>
        {T.ui.deskTitle} <span className="desk-chapter">· {BOOK_NAME[book]}{chapter !== null && <> {fill(T.ui.chapterLabel, { chapter })}</>}</span>
      </h2>
      <p className="hint">
        {fill(T.ui.deskHave, { papyrus: inv.papyrus ?? 0, ink: inv.ink ?? 0 })}
        {chapter !== null && <> · {fill(T.ui.deskCollected, { got: list.length, all })}</>}
      </p>
      <p className="hint">{T.ui.chapterNote}</p>
      {message && (
        <p className={`desk-message ${result?.kind}`} role="status">
          {message}
        </p>
      )}
      {dark ? (
        <p className="desk-message wrong">{T.ui.deskDark}</p>
      ) : chapter === null ? (
        <p>{T.ui.allDone}</p>
      ) : list.length === 0 ? (
        <p>{T.ui.deskEmpty}</p>
      ) : (
        <>
          <p className="hint">{T.ui.deskHint}</p>
          <ol className="scroll-list">
            {list.map((id, i) => {
              const p = pieceById(id)
              return (
                <li key={id}>
                  <button className="piece-title desk-read" onClick={() => setReading(id)} aria-label={`${p.title} 본문 보기`}>{p.title}</button>
                  <span className="piece-ref">{p.ref}</span>
                  <span className="piece-move">
                    <button aria-label={`${p.title} ${T.ui.up}`} disabled={i === 0} onClick={() => moveInDesk(book, chapter, i, -1)}>▲</button>
                    <button aria-label={`${p.title} ${T.ui.down}`} disabled={i === list.length - 1} onClick={() => moveInDesk(book, chapter, i, 1)}>▼</button>
                  </span>
                </li>
              )
            })}
          </ol>
        </>
      )}
      <div className="actions">
        <button onClick={closeModal}>{T.ui.close}</button>
        <button onClick={() => setPicking(true)}>{T.ui.bookChange}</button>
        {!dark && chapter !== null && list.length > 0 && (
          <button className="primary" onClick={() => submitDesk(book, chapter)}>
            {T.ui.deskSubmit}
          </button>
        )}
      </div>
    </div>
  )
}
