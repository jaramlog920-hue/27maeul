// 서고 방의 선반 (사도행전 방·로마서–빌레몬서 방·히브리서–유다서 방): 다 엮은(옮겨 적은) 책을 꽂는다 —
// 서고 복음서 방 선반과 같은 흐름(꽂기 → 서고 퀴즈 → 책등 등급). 책 목록은 방 표(shelf-rooms) 순서
import { CONTENT } from '../../content/catalog'
import { fill, T } from '../../content/text'
import { bookDone } from '../../engine/books'
import { has } from '../../engine/items'
import { RETRY_COST } from '../../engine/library'
import { shelfRoom, type ShelfRoomId } from '../../engine/shelf-rooms'
import { useGame } from '../../store/game-store'

const BOOK_NAME = T.quiz.books as Record<string, string>
const GRADES = T.library.grades as string[]

/** 방마다 선반 이름과 안내 */
const HEAD: Partial<Record<ShelfRoomId, { title: string; notice: string; notYet: string }>> = {
  acts: { title: T.acts.shelfTitle, notice: T.acts.shelfNotice, notYet: T.library.notYet },
  // 편지는 엮지 않고 옮겨 적는다
  romPhm: { title: T.letterRoom.shelfTitle, notice: T.letterRoom.shelfNotice, notYet: T.letterRoom.notYet },
  hebJud: { title: T.letterRoom.shelfTitle, notice: T.letterRoom.shelfNotice, notYet: T.letterRoom.notYet },
}

export function RoomShelf({ room }: { room: ShelfRoomId }) {
  const shelved = useGame((s) => s.game.shelved)
  const progress = useGame((s) => s.game.progress)
  const inv = useGame((s) => s.game.inv)
  const { startShelve, startRetry, closeModal } = useGame.getState()
  const head = HEAD[room] ?? { title: T.library.title, notice: T.library.notice, notYet: T.library.notYet }
  const books = shelfRoom(room).books
  const canPay = has(inv, RETRY_COST)
  const anyRetry = books.some((b) => shelved[b] !== undefined && shelved[b]! < 2)
  return (
    <div className="dialog library" role="dialog" aria-label={head.title}>
      <h2>{head.title}</h2>
      <p className="hint">{head.notice}</p>
      <ul className={`library-shelf${books.length > 4 ? ' many' : ''}`}>
        {books.map((b) => {
          const g = shelved[b]
          const done = bookDone({ progress }, b, CONTENT)
          const status = g !== undefined ? GRADES[g] : done ? T.library.ready : head.notYet
          return (
            <li key={b} className={`spine grade-${g ?? 'none'}`}>
              <span className="spine-name">{BOOK_NAME[b]}</span>
              <span className="spine-grade">{status}</span>
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
      {anyRetry && <p className="hint">{fill(T.library.retryCost, { gold: inv.goldLeaf ?? 0, oil: inv.oil ?? 0 })}</p>}
      <div className="actions">
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
