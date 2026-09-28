import { ITEM_TEXT, T } from '../../content/text'
import type { ItemId } from '../../engine/types'
import { ItemIcon } from '../../shared/ItemIcon'
import { useGame } from '../../store/game-store'
import { NeedsView } from '../menus/CareMenu'

export function Bag() {
  const inv = useGame((s) => s.game.inv)
  const closeModal = useGame((s) => s.closeModal)
  const items = (Object.entries(inv) as [ItemId, number][]).filter(([, n]) => n > 0)
  return (
    <div className="dialog" role="dialog" aria-label={T.ui.bag}>
      <h2>{T.ui.bag}</h2>
      <NeedsView />
      {items.length === 0 ? (
        <p>{T.ui.bagEmpty}</p>
      ) : (
        <ul className="bag-list">
          {items.map(([id, n]) => (
            <li key={id}>
              <ItemIcon id={id} />
              <span className="bag-name">
                {ITEM_TEXT[id].name} <b>{n}</b>
              </span>
              <span className="bag-desc">{ITEM_TEXT[id].desc}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="actions">
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
