// 벤치에서 읽을 이야기 고르기 — 모은 이야기만, 서고 퀴즈에서 틀린 구절이 먼저 (성경 문장은 고른 뒤 본문 창으로만)
import { PIECES } from '../../content/catalog'
import { T } from '../../content/text'
import { useGame } from '../../store/game-store'

export function ReadPick() {
  const collected = useGame((s) => s.game.collected)
  const rereads = useGame((s) => s.game.rereads)
  const { readAt, closeModal } = useGame.getState()
  const again = PIECES.filter((p) => rereads.includes(p.id))
  const rest = PIECES.filter((p) => collected.includes(p.id) && !rereads.includes(p.id))
  return (
    <div className="dialog" role="dialog" aria-label={T.ui.readPickTitle}>
      <h2>{T.ui.readPickTitle}</h2>
      <ul className="dex-list read-list">
        {[...again, ...rest].map((p) => (
          <li key={p.id}>
            <button className="dex-item" onClick={() => readAt(p.id)}>
              {rereads.includes(p.id) && <span className="reread-tag">{T.ui.rereadLabel}</span>}
              <span className="piece-title">{p.title}</span>
              <span className="piece-ref">{p.ref}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="actions">
        <button data-close onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
