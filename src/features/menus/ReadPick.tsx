// 벤치에서 읽을 이야기 고르기 — 모은 이야기만 (성경 문장은 고른 뒤 본문 창으로만 나온다)
import { PIECES } from '../../content/catalog'
import { T } from '../../content/text'
import { useGame } from '../../store/game-store'

export function ReadPick() {
  const collected = useGame((s) => s.game.collected)
  const { readAt, closeModal } = useGame.getState()
  const list = PIECES.filter((p) => collected.includes(p.id))
  return (
    <div className="dialog" role="dialog" aria-label={T.ui.readPickTitle}>
      <h2>{T.ui.readPickTitle}</h2>
      <ul className="dex-list read-list">
        {list.map((p) => (
          <li key={p.id}>
            <button className="dex-item" onClick={() => readAt(p.id)}>
              <span className="piece-title">{p.title}</span>
              <span className="piece-ref">{p.ref}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="actions">
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
