// 마을 서고 안: 서고 선반 전경(신약 n/27 — 처음엔 휑하고 권이 늘수록 찬다), 복음서 방 선반과 잠긴 방들 (설계 §2.1.1, 계획 14 작업 4)
import { CONTENT } from '../../content/catalog'
import { fill, T } from '../../content/text'
import { openDoorsFor } from '../../engine/books'
import { canLibraryRead, LIBRARY_READ_PRICE } from '../../engine/game'
import { GOSPELS } from '../../engine/types'
import { useGame } from '../../store/game-store'
import { ShelfPicture } from './BookArt'
import { ShelfRow } from './ShelfRow'

export function Library() {
  const shelved = useGame((s) => s.game.shelved)
  const bound = useGame((s) => s.game.bound)
  const inv = useGame((s) => s.game.inv)
  const flags = useGame((s) => s.game.flags)
  const open = openDoorsFor(flags)
  const { closeModal } = useGame.getState()
  const n = Object.values(shelved).filter((g) => g !== undefined).length
  const anyRetry = GOSPELS.some((b) => shelved[b] !== undefined && shelved[b]! < 2)
  return (
    <div className="dialog library" role="dialog" aria-label={T.library.title}>
      <h2>
        {T.library.title} <span className="library-count">{fill(T.library.count, { n })}</span>
      </h2>
      <ShelfPicture shelved={shelved} bound={bound} />
      <p className="hint">{T.library.notice}</p>
      <p className="hint">{T.library.shelveChoice}</p>
      <h3>{T.library.gospelRoom}</h3>
      <ul className="library-shelf">
        {/* 복음서 방 선반은 네 복음서만 — 사도행전은 자기 방에 꽂는다 (계획 5 작업 5) */}
        {GOSPELS.map((b) => (
          <ShelfRow key={b} book={b} back="library" notYet={T.library.notYet} />
        ))}
      </ul>
      {anyRetry && <p className="hint">{fill(T.library.retryCost, { gold: inv.goldLeaf ?? 0, oil: inv.oil ?? 0 })}</p>}
      <ul className="library-locked">
        {(T.library.lockedRooms as string[]).map((r, i) =>
          // 열린 방(방 표로 판정 — 잔치 다음 날 사도행전 방, 사도행전을 꽂은 다음 날 로마서–빌레몬서 방, 그 방 책을 제본한 날 …)
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
  const hint = block === 'done' ? '오늘은 열람석을 두 번 다 썼어요.' : block === 'coins' ? '닢이 모자라요.' : block === 'noPiece' ? '지금 책에서 더 옮겨 적을 사본이 없어요.' : '서고에 모아 둔 사본에서 다음 대목을 옮겨 적어요 (하루 두 번).'
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
