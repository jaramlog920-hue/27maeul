// 책상: 고른 책의 받은 이야기를 차례대로 잇는다 (편지 책이면 장째로 옮겨 적기 — LetterCopy)
import { useState } from 'react'
import { BOOKS_WITH_CONTENT, CONTENT, pieceById, piecesOf } from '../../content/catalog'
import { Passage } from '../passage/Passage'
import { fill, roomTitle, T } from '../../content/text'
import { bookDone, chaptersOf, groupByRoom, pickableBooks } from '../../engine/books'
import { modeOf, roomOf } from '../../engine/shelf-rooms'
import { LetterCopy } from './LetterCopy'
import { canNightCopy, NIGHT_COPY_OIL, stockOf, type SubmitResult } from '../../engine/game'
import { currentChapter } from '../../engine/offers'
import { useGame } from '../../store/game-store'

const BOOK_NAME = T.quiz.books as Record<string, string>

const GRADES = T.library.grades as string[]

/**
 * 책 고르기: 열린 방만 방 이름으로 묶어 보인다 (닫힌 방의 책은 자리 표시도 없다 — pickableBooks가 거른다).
 * 방 안은 오늘 성경 순서. 지금 책의 방은 펼쳐 두고 다른 방은 접는다
 */
function BookPick({ onDone }: { onDone?: () => void }) {
  const progress = useGame((s) => s.game.progress)
  const active = useGame((s) => s.game.activeBook)
  const flags = useGame((s) => s.game.flags)
  const shelved = useGame((s) => s.game.shelved)
  const { pickBook, closeModal } = useGame.getState()
  const groups = groupByRoom(pickableBooks(flags, BOOKS_WITH_CONTENT))
  const openRoom = active && groups.some((g) => g.books.includes(active)) ? roomOf(active).id : 'gospels'
  return (
    <div className="dialog desk" role="dialog" aria-label={T.ui.bookPickTitle}>
      <h2>{T.ui.bookPickTitle}</h2>
      <p className="hint">{T.ui.bookPickHint}</p>
      {groups.map(({ room, books }) => (
        <details key={room.id} className="pick-room" open={room.id === openRoom}>
          <summary>{roomTitle(room)}</summary>
          {/* 장이 오는 길은 방마다: 편지 나르는 이웃(낮) / 언덕 벤치 곁 편지함(맑은 밤, 요한계시록) */}
          {room.mode === 'letters' && <p className="hint">{room.arrives === 'stars' ? T.copy.pickHintStars : T.copy.pickHint}</p>}
          <div className="book-grid">
            {books.map((b) => {
              const ready = BOOKS_WITH_CONTENT.includes(b)
              const g = shelved[b]
              const all = chaptersOf(b, CONTENT).length
              const status =
                g !== undefined
                  ? GRADES[g]
                  : !ready
                    ? T.ui.bookNotYet
                    : bookDone({ progress }, b, CONTENT)
                      ? T.ui.bookBound
                      : fill(T.ui.bookProgress, { done: progress[b].completed.length, all })
              return (
                <button
                  key={b}
                  className={b === active ? 'primary' : ''}
                  disabled={!ready}
                  aria-label={`${BOOK_NAME[b]} · ${status}`}
                  onClick={() => {
                    pickBook(b)
                    onDone?.()
                  }}
                >
                  <span className="pick-name">{BOOK_NAME[b]}</span>
                  <span className="pick-status">{status}</span>
                </button>
              )
            })}
          </div>
        </details>
      ))}
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
  // 재료 궤짝의 것도 책상에서 쓴다 (계획 11)
  const game = useGame((s) => s.game)
  const { moveInDesk, submitDesk, closeModal } = useGame.getState()
  if (!book || picking) return <BookPick onDone={book ? () => setPicking(false) : undefined} />

  const pieces = piecesOf(book)
  const bp = progress[book]
  const chapter = currentChapter(pieces, bp.completed)
  // 편지 책은 빈칸 채워 옮겨 적기 (장이 바뀌면 열어 둔 보기를 닫는다)
  if (modeOf(book) === 'letters')
    return <LetterCopy key={`${book}:${chapter}`} book={book} result={result} dark={dark} onChangeBook={() => setPicking(true)} />

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
        <div className="actions"><button autoFocus onClick={() => setReading(null)}>{T.ui.deskBack}</button></div>
      </div>
    )
  }

  return (
    <div className="dialog desk" role="dialog" aria-label={T.ui.deskTitle}>
      <h2>
        {T.ui.deskTitle} <span className="desk-chapter">· {BOOK_NAME[book]}{chapter !== null && <> {fill(T.ui.chapterLabel, { chapter })}</>}</span>
      </h2>
      <p className="hint">
        {fill(T.ui.deskHave, { papyrus: stockOf(game, 'papyrus'), ink: stockOf(game, 'ink') })}
        {chapter !== null && <> · {fill(T.ui.deskCollected, { got: list.length, all })}</>}
      </p>
      <p className="hint">{T.ui.chapterNote}</p>
      <NightCopy />
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

/** 밤 필사: 밤에 등잔 기름 한 병으로 지금 책의 다음 이야기를 옮겨 적는다 (원할 때마다, 기름이 있는 만큼) */
function NightCopy() {
  const game = useGame((s) => s.game)
  const nightCopy = useGame((s) => s.nightCopy)
  const block = canNightCopy(game, CONTENT)
  if (block === 'notNight') return null
  const hint = block === 'noOil' ? '등잔 기름이 있어야 해요.' : block === 'noPiece' ? '지금 책에서 더 옮겨 적을 이야기가 없어요.' : `등잔 기름 ${NIGHT_COPY_OIL}병으로 다음 이야기를 옮겨 적어요.`
  return (
    <div className="night-copy">
      <button disabled={block !== null} onClick={nightCopy}>
        밤 필사
      </button>
      <span className="hint"> {hint}</span>
    </div>
  )
}
