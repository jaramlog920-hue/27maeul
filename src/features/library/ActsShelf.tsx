// 사도행전 방의 선반: 다 엮은 사도행전을 꽂는다 — 서고 복음서 방 선반과 같은 흐름(꽂기 → 서고 퀴즈 → 책등 등급)
import { CONTENT } from '../../content/catalog'
import { fill, T } from '../../content/text'
import { bookDone } from '../../engine/books'
import { has } from '../../engine/items'
import { RETRY_COST } from '../../engine/library'
import { useGame } from '../../store/game-store'

const BOOK_NAME = T.quiz.books as Record<string, string>
const GRADES = T.library.grades as string[]

export function ActsShelf() {
  const shelved = useGame((s) => s.game.shelved)
  const progress = useGame((s) => s.game.progress)
  const inv = useGame((s) => s.game.inv)
  const { startShelve, startRetry, closeModal } = useGame.getState()
  const g = shelved.ac
  const done = bookDone({ progress }, 'ac', CONTENT)
  const status = g !== undefined ? GRADES[g] : done ? T.library.ready : T.library.notYet
  return (
    <div className="dialog library" role="dialog" aria-label={T.acts.shelfTitle}>
      <h2>{T.acts.shelfTitle}</h2>
      <p className="hint">{T.acts.shelfNotice}</p>
      <ul className="library-shelf">
        <li className={`spine grade-${g ?? 'none'}`}>
          <span className="spine-name">{BOOK_NAME.ac}</span>
          <span className="spine-grade">{status}</span>
          {g === undefined && done && (
            <button className="primary" onClick={() => startShelve('ac')}>
              {T.library.shelve}
            </button>
          )}
          {g !== undefined && g < 2 && (
            <button disabled={!has(inv, RETRY_COST)} onClick={() => startRetry('ac')}>
              {T.library.retry}
            </button>
          )}
        </li>
      </ul>
      {g !== undefined && g < 2 && <p className="hint">{fill(T.library.retryCost, { gold: inv.goldLeaf ?? 0, oil: inv.oil ?? 0 })}</p>}
      <div className="actions">
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
