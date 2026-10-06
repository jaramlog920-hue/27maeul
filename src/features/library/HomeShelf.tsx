// 집 책장 (계획 14 작업 8): 집에 놓은 책장을 누르면 — 다 쓴 책(제본했거나 서고에 꽂은 책)을 몇 권 골라 꽂아 둔다.
// 서고의 책을 옮기는 것이 아니라 한 부 더 두는 것이라 서고 권수는 그대로다. 꽂아 둔 책을 누르면 펼쳐 보기
import { fill, T } from '../../content/text'
import { finishedBooks, HOME_SHELF_MAX } from '../../engine/finished-books'
import { useGame } from '../../store/game-store'
import { BookCover } from './BookArt'

const BOOK_NAME = T.quiz.books as Record<string, string>
const H = T.homeShelf

export function HomeShelf() {
  const game = useGame((s) => s.game)
  const { closeModal, openBook, toggleHomeBook } = useGame.getState()
  const mine = game.homeShelf
  const done = finishedBooks(game)
  const full = mine.length >= HOME_SHELF_MAX
  const slots = Array.from({ length: HOME_SHELF_MAX }, (_, i) => mine[i] ?? null)
  return (
    <div className="dialog home-shelf" role="dialog" aria-label={H.title}>
      <h2>
        {H.title} <span className="library-count">{fill(H.count, { n: mine.length, max: HOME_SHELF_MAX })}</span>
      </h2>
      <p className="hint">{fill(H.notice, { max: HOME_SHELF_MAX })}</p>
      {/* 책장 칸: 꽂아 둔 책은 표지째, 누르면 펼쳐 보기 */}
      <div className="home-shelf-row">
        {slots.map((b, i) =>
          b ? (
            <button key={b} className="home-shelf-book" onClick={() => openBook(b, 'homeShelf')} aria-label={`${BOOK_NAME[b]} · ${T.bookView.open}`}>
              <BookCover book={b} binding={game.bound[b]} />
            </button>
          ) : (
            <span key={`slot${i}`} className="home-shelf-slot" role="img" aria-label={H.slotEmpty} />
          ),
        )}
      </div>
      {done.length === 0 ? (
        <p>{H.empty}</p>
      ) : (
        <>
          <h3>{H.listTitle}</h3>
          <ul className="home-shelf-list">
            {done.map((b) => {
              const on = mine.includes(b)
              return (
                <li key={b} data-book={b}>
                  <span className="home-shelf-name">{BOOK_NAME[b]}</span>
                  <button onClick={() => openBook(b, 'homeShelf')}>{T.bookView.open}</button>
                  <button className={on ? '' : 'primary'} disabled={!on && full} onClick={() => toggleHomeBook(b)} aria-label={`${BOOK_NAME[b]} · ${on ? H.take : H.put}`}>
                    {on ? H.take : full ? H.full : H.put}
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}
      <div className="actions">
        <button data-close onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
