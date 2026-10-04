// 필사 책상 (계획 14 작업 1의 임시 화면 — 작업 2에서 조용한 집중 화면으로 바뀐다).
// 개역한글 본문 한 절을 보고 그대로 따라 적는다. 재료·조각 없이. 붙여넣기·자동완성은 받지 않는다.
import { BOOK_ABBR, CONTENT } from '../../content/catalog'
import { roomTitle, T } from '../../content/text'
import { chaptersOf, groupByRoom } from '../../engine/books'
import { checkCopy, copySpot, originalEnd } from '../../engine/copying'
import { BOOKS } from '../../engine/types'
import { useGame, type Modal } from '../../store/game-store'

const BOOK_NAME = T.quiz.books as Record<string, string>

/** 27권을 서고 방으로 묶어 고른다 (처음부터 모두) */
function CopyBookPick() {
  const progress = useGame((s) => s.game.progress)
  const current = useGame((s) => s.game.copy.book)
  const { copyBook, copyPicking, closeModal } = useGame.getState()
  return (
    <div className="dialog desk" role="dialog" aria-label="어느 책을 필사할까요?">
      <h2>어느 책을 필사할까요?</h2>
      {groupByRoom(BOOKS).map(({ room, books }) => (
        <details key={room.id} className="pick-room" open={current ? room.books.includes(current) : room.id === 'gospels'}>
          <summary>{roomTitle(room)}</summary>
          <div className="book-grid">
            {books.map((b) => {
              const status = `${progress[b].completed.length}/${chaptersOf(b, CONTENT).length}장`
              return (
                <button key={b} className={b === current ? 'primary' : ''} aria-label={`${BOOK_NAME[b]} · ${status}`} onClick={() => copyBook(b)}>
                  <span className="pick-name">{BOOK_NAME[b]}</span>
                  <span className="pick-status">{status}</span>
                </button>
              )
            })}
          </div>
        </details>
      ))}
      <div className="actions">
        <button onClick={current ? () => copyPicking(false) : closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}

export function CopyDesk({ modal }: { modal: Extract<Modal, { kind: 'copy' }> }) {
  const game = useGame((s) => s.game)
  const { copyType, copyPicking, closeModal } = useGame.getState()
  const book = game.copy.book
  if (!book || modal.picking) return <CopyBookPick />
  const spot = copySpot(game, book, CONTENT)
  const last = modal.last
  const name = BOOK_NAME[book]
  const note =
    last?.kind === 'chapter'
      ? `${name} ${last.chapter}장을 기록했습니다 · ${last.verses}절 · ${last.chars}자`
      : last?.kind === 'verse'
        ? `✓ ${BOOK_ABBR[book]} ${last.chapter}:${last.verse} 기록`
        : null
  if (!spot)
    return (
      <div className="dialog desk" role="dialog" aria-label="필사">
        <h2>{name}</h2>
        {note && <p role="status">{note}</p>}
        <p>이 책은 모두 기록했습니다.</p>
        <div className="actions">
          <button onClick={closeModal}>{T.ui.close}</button>
          <button onClick={() => copyPicking(true)}>다른 책</button>
        </div>
      </div>
    )
  const check = checkCopy(spot.draft, spot.verse.text)
  const cut = originalEnd(spot.verse.text, check.matched)
  return (
    <div className="dialog desk" role="dialog" aria-label="필사">
      <h2>
        {name} {spot.chapter}장 · {spot.index + 1}/{spot.count}절
      </h2>
      {note && <p role="status">{note}</p>}
      <p className="copy-verse" aria-label={`본문 ${BOOK_ABBR[book]} ${spot.chapter}:${spot.verse.verse}`}>
        <strong>{spot.verse.text.slice(0, cut)}</strong>
        {spot.verse.text.slice(cut)}
      </p>
      <textarea
        aria-label="따라 적기"
        value={spot.draft}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        onChange={(e) => copyType(e.target.value)}
        onPaste={(e) => {
          e.preventDefault()
          copyType(spot.draft, true)
        }}
        onDrop={(e) => e.preventDefault()}
      />
      {check.typo && <p className="hint">틀린 글자가 있어요.</p>}
      <div className="actions">
        <button onClick={closeModal}>{T.ui.close}</button>
        <button onClick={() => copyPicking(true)}>다른 책</button>
      </div>
    </div>
  )
}
