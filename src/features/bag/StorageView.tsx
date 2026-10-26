// 보관함 (2026-10-19 사용자: 수납 가구를 누르면 가방이 아니라 창고처럼) — 궤짝·이불장·찬장류를 누르면 열린다.
// 위는 보관함 안의 것(꺼내기), 아래는 가방의 것(넣기). 넣고 꺼내기는 집 안에서만, 도구는 가방에만 둔다
import { useState } from 'react'
import { ITEM_TEXT, itemName, T } from '../../content/text'
import { chestOf, playerTile } from '../../engine/game'
import { TOOLS } from '../../engine/items'
import type { ItemId } from '../../engine/types'
import { isHome } from '../../engine/world'
import { ItemIcon } from '../../shared/ItemIcon'
import { useGame } from '../../store/game-store'
import { ItemGrid, type Pick } from './Bag'
import { BlockedButton } from '../../shared/BlockedButton'

const E = T.easy

export function StorageView({ item }: { item: ItemId }) {
  const game = useGame((s) => s.game)
  const { closeModal, putChest, takeChest } = useGame.getState()
  const [picked, setPicked] = useState<Pick | null>(null)
  const box = chestOf(game) ?? {}
  const boxed = (Object.entries(box) as [ItemId, number][]).filter(([, n]) => n > 0)
  const carried = (Object.entries(game.inv) as [ItemId, number][]).filter(([id, n]) => n > 0 && !TOOLS.includes(id))
  const atHome = isHome(playerTile(game))
  const list = picked?.from === 'chest' ? boxed : carried
  const n = picked ? (list.find(([id]) => id === picked.id)?.[1] ?? 0) : 0
  const detail = (from: 'chest' | 'bag') =>
    picked?.from === from && n > 0 ? (
      <div className="bag-detail">
        <ItemIcon id={picked.id} size={32} />
        <div>
          <strong>{itemName(picked.id)} <b>{n}</b></strong>
          <p>{ITEM_TEXT[picked.id]?.desc}</p>
        </div>
        <div className="bag-actions">
          {from === 'chest' ? (
            <BlockedButton className="primary" why={atHome ? null : E.storageAway} onClick={() => takeChest(picked.id)}>{E.storageTake}</BlockedButton>
          ) : (
            <>
              <BlockedButton className="primary" why={atHome ? null : E.storageAway} onClick={() => putChest(picked.id, 1)}>{E.storagePut}</BlockedButton>
              {n > 1 && <BlockedButton why={atHome ? null : E.storageAway} onClick={() => putChest(picked.id, n)}>{E.storagePutAll}</BlockedButton>}
            </>
          )}
        </div>
      </div>
    ) : null
  return (
    <div className="dialog bag storage" role="dialog" aria-label={itemName(item)}>
      <h2>{itemName(item)}</h2>
      <p className="hint">{atHome ? E.storageLead : E.storageAway}</p>
      <h3>{E.storageBox}</h3>
      {boxed.length === 0 ? <p>{E.storageEmpty}</p> : <ItemGrid items={boxed} picked={picked} from="chest" onPick={setPicked} />}
      {detail('chest')}
      <h3>{E.storageBag}</h3>
      {carried.length === 0 ? <p>{E.storageBagEmpty}</p> : <ItemGrid items={carried} picked={picked} from="bag" onPick={setPicked} />}
      {detail('bag') ?? (!picked && <p className="bag-detail hint">{E.storageTapHint}</p>)}
      <div className="actions">
        <button data-close onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
