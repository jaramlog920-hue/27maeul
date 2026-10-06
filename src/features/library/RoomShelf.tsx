// 서고 방의 선반 (사도행전 방·로마서–빌레몬서 방·히브리서–유다서 방·요한계시록 방): 제본한 완성본을 꽂는다 —
// 서고 복음서 방 선반과 같은 흐름(제본 → [바로 꽂기] 또는 [퀴즈 풀고 금박 책등]). 책 목록은 방 표(shelf-rooms) 순서
import { fill, T } from '../../content/text'
import { shelfRoom, type ShelfRoomId } from '../../engine/shelf-rooms'
import { useGame } from '../../store/game-store'
import { ShelfRow } from './ShelfRow'

/** 방마다 선반 이름과 안내 */
const HEAD: Partial<Record<ShelfRoomId, { title: string; notice: string; notYet: string }>> = {
  acts: { title: T.acts.shelfTitle, notice: T.acts.shelfNotice, notYet: T.library.notYet },
  // 편지는 엮지 않고 옮겨 적는다
  romPhm: { title: T.letterRoom.shelfTitle, notice: T.letterRoom.shelfNotice, notYet: T.letterRoom.notYet },
  hebJud: { title: T.letterRoom.shelfTitle, notice: T.letterRoom.shelfNotice, notYet: T.letterRoom.notYet },
  // 요한계시록은 한 권 — 편지처럼 옮겨 적는다
  rev: { title: T.revRoom.shelfTitle, notice: T.revRoom.shelfNotice, notYet: T.letterRoom.notYet },
}

export function RoomShelf({ room }: { room: ShelfRoomId }) {
  const shelved = useGame((s) => s.game.shelved)
  const inv = useGame((s) => s.game.inv)
  const { closeModal } = useGame.getState()
  const head = HEAD[room] ?? { title: T.library.title, notice: T.library.notice, notYet: T.library.notYet }
  const books = shelfRoom(room).books
  const anyRetry = books.some((b) => shelved[b] !== undefined && shelved[b]! < 2)
  return (
    <div className="dialog library" role="dialog" aria-label={head.title}>
      <h2>{head.title}</h2>
      <p className="hint">{head.notice}</p>
      <ul className={`library-shelf${books.length > 4 ? ' many' : ''}`}>
        {books.map((b) => (
          <ShelfRow key={b} book={b} back={`room:${room}`} notYet={head.notYet} />
        ))}
      </ul>
      {anyRetry && <p className="hint">{fill(T.library.retryCost, { gold: inv.goldLeaf ?? 0, oil: inv.oil ?? 0 })}</p>}
      <div className="actions">
        <button data-close onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
