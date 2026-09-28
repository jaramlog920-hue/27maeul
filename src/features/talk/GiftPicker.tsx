import { neighborById } from '../../content/catalog'
import { itemName, T } from '../../content/text'
import { GIFTABLE } from '../../engine/game'
import { ItemIcon } from '../../shared/ItemIcon'
import { useGame } from '../../store/game-store'

export function GiftPicker({ neighborId }: { neighborId: string }) {
  const inv = useGame((s) => s.game.inv)
  const { gift, closeModal } = useGame.getState()
  const def = neighborById(neighborId)
  const items = GIFTABLE.filter((i) => (inv[i] ?? 0) > 0)
  return (
    <div className="dialog" role="dialog" aria-label={T.ui.giftPick}>
      <h2>{T.ui.giftPick}</h2>
      <p className="hint">{def?.role}</p>
      {items.length === 0 ? (
        <p>{T.ui.giftNone}</p>
      ) : (
        <div className="item-grid">
          {items.map((i) => (
            <button key={i} className="item-cell" onClick={() => gift(neighborId, i)}>
              <ItemIcon id={i} />
              <span>
                {itemName(i)} {inv[i]}
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="actions">
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
