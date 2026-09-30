// 마을 서고 안: 복음서 방 선반(책등 등급)과 잠긴 방들 (설계 §2.1.1)
import { BOOKS_WITH_CONTENT, CONTENT } from '../../content/catalog'
import { fill, T } from '../../content/text'
import { bookDone, openDoorsFor } from '../../engine/books'
import { has } from '../../engine/items'
import { RETRY_COST } from '../../engine/library'
import { canLibraryRead, LIBRARY_READ_PRICE } from '../../engine/game'
import { GOSPELS } from '../../engine/types'
import { SpineMarks } from './SpineMarks'
import { useGame } from '../../store/game-store'

const BOOK_NAME = T.quiz.books as Record<string, string>
const GRADES = T.library.grades as string[]

export function Library() {
  const shelved = useGame((s) => s.game.shelved)
  const progress = useGame((s) => s.game.progress)
  const inv = useGame((s) => s.game.inv)
  const flags = useGame((s) => s.game.flags)
  const open = openDoorsFor(flags)
  const { startShelve, startRetry, closeModal } = useGame.getState()
  const canPay = has(inv, RETRY_COST)
  return (
    <div className="dialog library" role="dialog" aria-label={T.library.title}>
      <h2>{T.library.title}</h2>
      <p className="hint">{T.library.notice}</p>
      <h3>{T.library.gospelRoom}</h3>
      <ul className="library-shelf">
        {/* 복음서 방 선반은 네 복음서만 — 사도행전은 자기 방에 꽂는다 (계획 5 작업 5) */}
        {GOSPELS.map((b) => {
          const g = shelved[b]
          const hasContent = BOOKS_WITH_CONTENT.includes(b)
          const done = bookDone({ progress }, b, CONTENT)
          const status = g !== undefined ? GRADES[g] : !hasContent ? T.library.later : done ? T.library.ready : T.library.notYet
          return (
            <li key={b} className={`spine grade-${g ?? 'none'}`}>
              <span className="spine-name">{BOOK_NAME[b]}</span>
              <span className="spine-grade">{status}</span>
              <SpineMarks book={b} />
              {g === undefined && done && (
                <button className="primary" onClick={() => startShelve(b)}>
                  {T.library.shelve}
                </button>
              )}
              {g !== undefined && g < 2 && (
                <button disabled={!canPay} onClick={() => startRetry(b)}>
                  {T.library.retry}
                </button>
              )}
            </li>
          )
        })}
      </ul>
      <p className="hint">{fill(T.library.retryCost, { gold: inv.goldLeaf ?? 0, oil: inv.oil ?? 0 })}</p>
      <ul className="library-locked">
        {(T.library.lockedRooms as string[]).map((r, i) =>
          // 열린 방(방 표로 판정 — 잔치 다음 날 사도행전 방, 사도행전을 꽂은 다음 날 로마서–빌레몬서 방 …)
          open.includes(i) ? <li key={r}>{fill(T.library.roomOpen, { room: r })}</li> : <li key={r}>🔒 {r}</li>,
        )}
      </ul>
      <ReadingSeat />
      <div className="actions">
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}

/** 서고 열람석: 닢을 내고 지금 책의 다음 이야기를 옮겨 적는다 (하루 두 번) */
function ReadingSeat() {
  const game = useGame((s) => s.game)
  const libraryRead = useGame((s) => s.libraryRead)
  const block = canLibraryRead(game, CONTENT)
  const hint = block === 'done' ? '오늘은 열람석을 두 번 다 썼어요.' : block === 'coins' ? '닢이 모자라요.' : block === 'noPiece' ? '지금 책에서 더 옮겨 적을 이야기가 없어요.' : '지금 책의 다음 이야기를 옮겨 적어요 (하루 두 번).'
  return (
    <div className="reading-seat">
      <h3>열람석</h3>
      <p className="hint">{hint}</p>
      <button disabled={block !== null} onClick={libraryRead}>
        옮겨 적기 · {LIBRARY_READ_PRICE}닢
      </button>
    </div>
  )
}
