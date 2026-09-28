// 잠들기 전 되새김 — 오늘 들은 이야기 하나를 다시 읽는다
import { pieceById } from '../../content/catalog'
import { T } from '../../content/text'
import { LATE } from '../../engine/clock'
import { useGame } from '../../store/game-store'
import { Passage } from '../passage/Passage'

export function Review({ pieceId }: { pieceId: string | null }) {
  const minute = useGame((s) => s.game.clock.minute)
  const { sleep, closeModal } = useGame.getState()
  const piece = pieceId ? pieceById(pieceId) : null
  return (
    <div className="dialog scroll-dialog review" role="dialog" aria-label={T.ui.reviewTitle}>
      <h2>{T.ui.reviewTitle}</h2>
      {piece ? (
        <>
          <p className="hint">{T.ui.reviewLead}</p>
          <h3>{piece.title}</h3>
          <Passage refText={piece.ref} />
        </>
      ) : (
        <p>{T.ui.reviewNone}</p>
      )}
      {minute >= LATE && <p className="hint">{T.ui.sleepLate}</p>}
      <div className="actions">
        <button onClick={closeModal}>{T.ui.stayUp}</button>
        <button className="primary" onClick={sleep}>
          {T.ui.sleep}
        </button>
      </div>
    </div>
  )
}
