import { ITEM_TEXT, T } from '../../content/text'
import { chestOf, playerTile } from '../../engine/game'
import { isHome } from '../../engine/world'
import type { ItemId } from '../../engine/types'
import { ItemIcon } from '../../shared/ItemIcon'
import { useGame } from '../../store/game-store'
import { NeedsView } from '../menus/CareMenu'

export function Bag() {
  const game = useGame((s) => s.game)
  const closeModal = useGame((s) => s.closeModal)
  const takeChest = useGame((s) => s.takeChest)
  const inv = game.inv
  const items = (Object.entries(inv) as [ItemId, number][]).filter(([, n]) => n > 0)
  // 재료 궤짝 (계획 11): 가진 뒤에만 보인다. 꺼내기는 집 안에서만
  const chest = chestOf(game)
  const boxed = chest ? (Object.entries(chest) as [ItemId, number][]).filter(([, n]) => n > 0) : []
  const atHome = isHome(playerTile(game))
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
      {chest && (
        <>
          <h3>{T.easy.chest}</h3>
          {boxed.length === 0 ? (
            <p>{T.easy.chestEmpty}</p>
          ) : (
            <ul className="bag-list">
              {boxed.map(([id, n]) => (
                <li key={id}>
                  <ItemIcon id={id} />
                  <span className="bag-name">
                    {ITEM_TEXT[id].name} <b>{n}</b>
                  </span>
                  <button disabled={!atHome} onClick={() => takeChest(id)}>
                    {T.easy.chestTake}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="hint">{T.easy.chestHint}</p>
        </>
      )}
      <div className="actions">
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
