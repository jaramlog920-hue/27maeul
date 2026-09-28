import { itemName, T } from '../../content/text'
import { FURNITURE } from '../../engine/room'
import { ItemIcon } from '../../shared/ItemIcon'
import { useGame } from '../../store/game-store'

/** 방 꾸미기: 가구를 고르고 집 바닥을 누른다 */
export function DecorateBar() {
  const decorating = useGame((s) => s.decorating)
  const inv = useGame((s) => s.game.inv)
  const { startDecorate, stopDecorate } = useGame.getState()
  if (!decorating) return null
  const items = FURNITURE.filter((f) => (inv[f] ?? 0) > 0)
  return (
    <div className="decorate-bar" role="toolbar" aria-label={T.ui.decorate}>
      <p className="hint">{T.ui.decorateHint}</p>
      <div className="decorate-items">
        {items.map((f) => (
          <button key={f} className={decorating === f ? 'on' : ''} aria-label={itemName(f)} aria-pressed={decorating === f} onClick={() => startDecorate(f)}>
            <ItemIcon id={f} /> {inv[f]}
          </button>
        ))}
        <button className="primary" onClick={stopDecorate}>
          {T.ui.decorateDone}
        </button>
      </div>
    </div>
  )
}
